/**
 * Global Matchmaking System
 * Handles real-time matchmaking for global 1v1 battles
 */

import { supabase } from '../../supabaseclient';

/**
 * Add player to matchmaking queue
 * @param {string} userId - Player's user ID
 * @param {string} cfHandle - Player's Codeforces handle
 * @param {number} rating - Player's current rating
 * @returns {Promise<Object>} Queue entry
 */
export const joinMatchmakingQueue = async (userId, cfHandle, rating) => {
    try {
        console.log('joinMatchmakingQueue called with:', { userId, cfHandle, rating });
        
        // First, clean up ANY old entries for this user (to avoid UNIQUE constraint violation)
        console.log('Cleaning up old queue entries...');
        const { error: deleteError } = await supabase
            .from('matchmaking_queue')
            .delete()
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Error cleaning up old entries:', deleteError);
            // Don't throw - we can still try to insert
        }

        console.log('Inserting into matchmaking_queue...');
        
        // Add to queue (fresh entry)
        const { data, error } = await supabase
            .from('matchmaking_queue')
            .insert({
                user_id: userId,
                cf_handle: cfHandle,
                rating: rating,
                status: 'searching',
                joined_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Insert error:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('✓ Successfully joined matchmaking queue:', data);
        return data;
    } catch (error) {
        console.error('❌ Error joining queue:', error);
        throw error;
    }
};

/**
 * Find best match for a player
 * @param {string} userId - Player's user ID
 * @param {number} playerRating - Player's rating
 * @returns {Promise<Object|null>} Matched opponent or null
 */
export const findBestMatch = async (userId, playerRating) => {
    try {
        // Find all searching players except current user
        const { data: candidates, error } = await supabase
            .from('matchmaking_queue')
            .select('*')
            .eq('status', 'searching')
            .neq('user_id', userId);

        if (error) throw error;
        if (!candidates || candidates.length === 0) return null;

        // Filter candidates with rating diff ≤ 100
        const validMatches = candidates.filter(
            candidate => Math.abs(candidate.rating - playerRating) <= 100
        );

        if (validMatches.length === 0) return null;

        // Find minimum rating difference
        let bestMatch = validMatches[0];
        let minDiff = Math.abs(bestMatch.rating - playerRating);

        for (const candidate of validMatches) {
            const diff = Math.abs(candidate.rating - playerRating);
            if (diff < minDiff) {
                minDiff = diff;
                bestMatch = candidate;
            }
        }

        console.log(`✓ Found match! Rating diff: ${minDiff}`);
        return bestMatch;
    } catch (error) {
        console.error('Error finding match:', error);
        return null;
    }
};

/**
 * Create global battle between two players
 * @param {Object} player1 - First player data
 * @param {Object} player2 - Second player data
 * @returns {Promise<Object>} Battle data
 */
export const createGlobalBattle = async (player1, player2) => {
    try {
        console.log('🔨 Creating battle between:', player1.cf_handle, 'vs', player2.cf_handle);
        
        // First, atomically update both players to 'creating' status to prevent race condition
        const { error: lockError } = await supabase
            .from('matchmaking_queue')
            .update({ status: 'creating' })
            .in('user_id', [player1.user_id, player2.user_id])
            .eq('status', 'searching');

        if (lockError) {
            console.error('Failed to lock players:', lockError);
            throw lockError;
        }

        // Check if a battle already exists for these players
        const { data: existingQueue } = await supabase
            .from('matchmaking_queue')
            .select('battle_id, status')
            .in('user_id', [player1.user_id, player2.user_id])
            .not('battle_id', 'is', null)
            .limit(1)
            .maybeSingle();

        if (existingQueue?.battle_id) {
            console.log('⚠️ Battle already exists:', existingQueue.battle_id);
            const { data: existingBattle } = await supabase
                .from('onevonebattles')
                .select('*')
                .eq('onevone_battle_id', existingQueue.battle_id)
                .single();
            return existingBattle;
        }

        // Create battle
        const { data: battle, error: battleError } = await supabase
            .from('onevonebattles')
            .insert({
                battlefield: 'global',
                battle_mode: 'real',
                problem_count: 1,
                status: 'active',
                trophy_reward: 10,
                start_time: new Date().toISOString()
            })
            .select()
            .single();

        if (battleError) {
            console.error('Battle creation error:', battleError);
            throw battleError;
        }

        console.log('✓ Battle created:', battle.onevone_battle_id);

        // Add participants
        const { error: participantsError } = await supabase
            .from('onevone_participants')
            .insert([
                {
                    onevone_battle_id: battle.onevone_battle_id,
                    player_id: player1.user_id,
                    problem_solved: 0,
                    time_taken: 0
                },
                {
                    onevone_battle_id: battle.onevone_battle_id,
                    player_id: player2.user_id,
                    problem_solved: 0,
                    time_taken: 0
                }
            ]);

        if (participantsError) {
            console.error('Participants error:', participantsError);
            throw participantsError;
        }

        console.log('✓ Participants added');

        // Update both players' queue status to 'matched' with opponent info
        const { error: updateError } = await supabase
            .from('matchmaking_queue')
            .update({ 
                status: 'matched',
                battle_id: battle.onevone_battle_id,
                matched_at: new Date().toISOString()
            })
            .in('user_id', [player1.user_id, player2.user_id]);

        if (updateError) {
            console.error('Queue update error:', updateError);
            throw updateError;
        }

        console.log('✅ Global battle fully created:', battle.onevone_battle_id);
        
        // Small delay to ensure database update propagates to both clients
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return battle;
    } catch (error) {
        console.error('❌ Error creating battle:', error);
        throw error;
    }
};

/**
 * Leave matchmaking queue
 * @param {string} userId - Player's user ID
 */
export const leaveMatchmakingQueue = async (userId) => {
    try {
        // Delete the queue entry completely (better than updating status due to UNIQUE constraint)
        const { error } = await supabase
            .from('matchmaking_queue')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Error leaving queue:', error);
        } else {
            console.log('✓ Left matchmaking queue');
        }
    } catch (error) {
        console.error('Error leaving queue:', error);
    }
};

/**
 * Subscribe to matchmaking updates
 * @param {string} userId - Player's user ID
 * @param {Function} onMatchFound - Callback when match is found
 * @returns {Object} Subscription channel
 */
export const subscribeToMatchmaking = (userId, onMatchFound) => {
    // Use unique channel name per user to avoid conflicts
    const channelName = `matchmaking-${userId}`;
    
    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'matchmaking_queue',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                console.log('📡 Matchmaking update received:', payload.new.status);
                if (payload.new.status === 'matched' || payload.new.status === 'creating') {
                    console.log('🎮 Match found via subscription!');
                    onMatchFound(payload.new);
                }
            }
        )
        .subscribe();

    console.log('✓ Subscribed to channel:', channelName);
    return channel;
};
