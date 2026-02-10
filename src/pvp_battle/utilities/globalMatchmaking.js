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
 * UNIVERSAL PROBLEM SELECTION - Selects ONE problem for BOTH players
 * Same logic as before: based on average rating, filters unsolved problems
 * @param {string} cfHandle1 - First player's CF handle
 * @param {string} cfHandle2 - Second player's CF handle
 * @param {number} avgRating - Average rating of both players
 * @returns {Promise<Object>} Selected problem
 */
const selectProblemForBattle = async (cfHandle1, cfHandle2, avgRating) => {
    try {
        console.log(`🎯 UNIVERSAL SELECTION: Picking ONE problem for avg rating ${avgRating}`);
        
        // Calculate difficulty range based on average rating (SAME LOGIC AS BEFORE)
        const targetRating = Math.max(800, Math.min(2400, avgRating));
        const minRating = targetRating - 200;
        const maxRating = targetRating + 200;
        console.log(`📊 Difficulty range: ${minRating} - ${maxRating}`);
        
        // Fetch problems from Codeforces
        const response = await fetch('https://codeforces.com/api/problemset.problems');
        const data = await response.json();
        
        if (data.status !== 'OK') {
            throw new Error('Failed to fetch problems from Codeforces');
        }
        
        // Filter problems by rating range and type
        const validProblems = data.result.problems.filter(
            p => p.rating >= minRating && 
                 p.rating <= maxRating && 
                 p.contestId && 
                 p.index &&
                 p.type === 'PROGRAMMING'
        );
        
        if (validProblems.length === 0) {
            throw new Error('No problems found in rating range');
        }
        
        console.log(`📝 Found ${validProblems.length} problems in range ${minRating}-${maxRating}`);
        
        // Fetch submissions for BOTH players (SAME LOGIC AS BEFORE)
        const [player1Submissions, player2Submissions] = await Promise.all([
            fetch(`https://codeforces.com/api/user.status?handle=${cfHandle1}&from=1&count=10000`)
                .then(r => r.json())
                .catch(() => ({ status: 'FAILED', result: [] })),
            fetch(`https://codeforces.com/api/user.status?handle=${cfHandle2}&from=1&count=10000`)
                .then(r => r.json())
                .catch(() => ({ status: 'FAILED', result: [] }))
        ]);
        
        // Get solved problem IDs for both players
        const player1Solved = new Set();
        const player2Solved = new Set();
        
        if (player1Submissions.status === 'OK') {
            player1Submissions.result
                .filter(s => s.verdict === 'OK')
                .forEach(s => {
                    const key = `${s.problem.contestId}-${s.problem.index}`;
                    player1Solved.add(key);
                });
        }
        
        if (player2Submissions.status === 'OK') {
            player2Submissions.result
                .filter(s => s.verdict === 'OK')
                .forEach(s => {
                    const key = `${s.problem.contestId}-${s.problem.index}`;
                    player2Solved.add(key);
                });
        }
        
        console.log(`✓ ${cfHandle1} solved: ${player1Solved.size}, ${cfHandle2} solved: ${player2Solved.size}`);
        
        // Filter problems that NEITHER player has solved (SAME LOGIC AS BEFORE)
        const unsolvedProblems = validProblems.filter(p => {
            const key = `${p.contestId}-${p.index}`;
            return !player1Solved.has(key) && !player2Solved.has(key);
        });
        
        let selectedProblem;
        
        if (unsolvedProblems.length === 0) {
            console.log('⚠️ No unsolved problems, using any valid problem');
            selectedProblem = validProblems[Math.floor(Math.random() * validProblems.length)];
        } else {
            console.log(`✓ Found ${unsolvedProblems.length} unsolved problems`);
            // ONE RANDOM SELECTION for BOTH players
            selectedProblem = unsolvedProblems[Math.floor(Math.random() * unsolvedProblems.length)];
        }
        
        console.log(`🎲 SELECTED UNIVERSALLY: ${selectedProblem.name} (${selectedProblem.contestId}${selectedProblem.index}, rating: ${selectedProblem.rating})`);
        console.log(`✅ This SAME problem will be given to BOTH players`);
        
        return selectedProblem;
    } catch (error) {
        console.error('Error selecting problem:', error);
        throw error;
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

        // SELECT ONE PROBLEM UNIVERSALLY (before creating battle)
        console.log('🎲 Selecting ONE problem for BOTH players...');
        const avgRating = Math.round((player1.rating + player2.rating) / 2);
        const selectedProblem = await selectProblemForBattle(player1.cf_handle, player2.cf_handle, avgRating);
        
        // Create battle WITH THE SELECTED PROBLEM
        const { data: battle, error: battleError } = await supabase
            .from('onevonebattles')
            .insert({
                battlefield: 'global',
                battle_mode: 'real',
                problem_count: 1,
                status: 'active',
                trophy_reward: 10,
                start_time: new Date().toISOString(),
                // Store problem details so BOTH players get the SAME problem
                problem_name: selectedProblem.name,
                problem_contest_id: selectedProblem.contestId,
                problem_index: selectedProblem.index,
                problem_rating: selectedProblem.rating,
                problem_tags: JSON.stringify(selectedProblem.tags || [])
            })
            .select()
            .single();

        if (battleError) {
            console.error('Battle creation error:', battleError);
            throw battleError;
        }

        console.log('✓ Battle created:', battle.onevone_battle_id, 'with problem:', selectedProblem.name);

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
