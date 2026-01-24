import { supabase } from '../../supabaseclient';
import getUserData from '../../mainpage_clan_battle/utilities/UserData';

/**
 * Join the clan battle queue
 * @param {Array} selectedMemberIds - Array of selected member user IDs
 * @returns {Promise<{success: boolean, queueId: string|null, error: any}>}
 */
export async function joinBattleQueue(selectedMemberIds) {
    try {
        const { data: user, error: userError } = await getUserData();
        if (userError || !user) {
            return { success: false, queueId: null, error: userError };
        }

        if (!user.clan_id) {
            return { success: false, queueId: null, error: 'User not in a clan' };
        }

        // Check if already in queue
        const { data: existing } = await supabase
            .from('clan_battle_queue')
            .select('queue_id')
            .eq('clan_id', user.clan_id)
            .eq('status', 'searching')
            .maybeSingle();

        if (existing) {
            return { success: true, queueId: existing.queue_id, error: null };
        }

        // Add to queue
        const { data: queue, error: queueError } = await supabase
            .from('clan_battle_queue')
            .insert({
                clan_id: user.clan_id,
                leader_id: user.id,
                selected_members: selectedMemberIds,
                status: 'searching'
            })
            .select()
            .single();

        if (queueError) {
            console.error('Error joining queue:', queueError);
            return { success: false, queueId: null, error: queueError };
        }

        return { success: true, queueId: queue.queue_id, error: null };
    } catch (error) {
        console.error('Error in joinBattleQueue:', error);
        return { success: false, queueId: null, error };
    }
}

/**
 * Find a match in the queue
 * @returns {Promise<{matched: boolean, opponentClanId: string|null, queueId: string|null, error: any}>}
 */
export async function findMatch() {
    try {
        const { data: user, error: userError } = await getUserData();
        if (userError || !user) {
            return { matched: false, opponentClanId: null, queueId: null, error: userError };
        }

        if (!user.clan_id) {
            return { matched: false, opponentClanId: null, queueId: null, error: 'User not in a clan' };
        }

        // Check if we're matched
        const { data: myQueue, error: myQueueError } = await supabase
            .from('clan_battle_queue')
            .select('*')
            .eq('clan_id', user.clan_id)
            .eq('status', 'matched')
            .maybeSingle();

        if (myQueueError && myQueueError.code !== 'PGRST116') {
            console.error('Error checking queue status:', myQueueError);
            return { matched: false, opponentClanId: null, queueId: null, error: myQueueError };
        }

        if (myQueue && myQueue.matched_with_clan_id) {
            return { 
                matched: true, 
                opponentClanId: myQueue.matched_with_clan_id, 
                queueId: myQueue.queue_id,
                error: null 
            };
        }

        // Try to find an opponent
        const { data: opponents, error: opponentError } = await supabase
            .from('clan_battle_queue')
            .select('*')
            .eq('status', 'searching')
            .neq('clan_id', user.clan_id)
            .order('queue_time', { ascending: true })
            .limit(1);

        if (opponentError) {
            console.error('Error finding opponents:', opponentError);
            return { matched: false, opponentClanId: null, queueId: null, error: opponentError };
        }

        if (opponents && opponents.length > 0) {
            const opponent = opponents[0];
            
            // Mark both as matched
            await supabase
                .from('clan_battle_queue')
                .update({ 
                    status: 'matched',
                    matched_with_clan_id: opponent.clan_id
                })
                .eq('clan_id', user.clan_id);

            await supabase
                .from('clan_battle_queue')
                .update({ 
                    status: 'matched',
                    matched_with_clan_id: user.clan_id
                })
                .eq('clan_id', opponent.clan_id);

            return { 
                matched: true, 
                opponentClanId: opponent.clan_id,
                queueId: opponent.queue_id,
                error: null 
            };
        }

        return { matched: false, opponentClanId: null, queueId: null, error: null };
    } catch (error) {
        console.error('Error in findMatch:', error);
        return { matched: false, opponentClanId: null, queueId: null, error };
    }
}

/**
 * Leave the battle queue
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function leaveBattleQueue() {
    try {
        const { data: user, error: userError } = await getUserData();
        if (userError || !user) {
            return { success: false, error: userError };
        }

        if (!user.clan_id) {
            return { success: true, error: null };
        }

        const { error: deleteError } = await supabase
            .from('clan_battle_queue')
            .delete()
            .eq('clan_id', user.clan_id);

        if (deleteError) {
            console.error('Error leaving queue:', deleteError);
            return { success: false, error: deleteError };
        }

        // Also clear the user's searching flag
        await supabase
            .from('users')
            .update({ is_searching_for_battle: false })
            .eq('id', user.id);

        return { success: true, error: null };
    } catch (error) {
        console.error('Error in leaveBattleQueue:', error);
        return { success: false, error };
    }
}

/**
 * Get current queue status
 * @returns {Promise<{inQueue: boolean, status: string|null, queueData: any, error: any}>}
 */
export async function getQueueStatus() {
    try {
        const { data: user, error: userError } = await getUserData();
        if (userError || !user) {
            return { inQueue: false, status: null, queueData: null, error: userError };
        }

        if (!user.clan_id) {
            return { inQueue: false, status: null, queueData: null, error: null };
        }

        const { data: queue, error: queueError } = await supabase
            .from('clan_battle_queue')
            .select('*')
            .eq('clan_id', user.clan_id)
            .maybeSingle();

        if (queueError && queueError.code !== 'PGRST116') {
            console.error('Error getting queue status:', queueError);
            return { inQueue: false, status: null, queueData: null, error: queueError };
        }

        if (queue) {
            return { inQueue: true, status: queue.status, queueData: queue, error: null };
        }

        return { inQueue: false, status: null, queueData: null, error: null };
    } catch (error) {
        console.error('Error in getQueueStatus:', error);
        return { inQueue: false, status: null, queueData: null, error };
    }
}

/**
 * Subscribe to matchmaking changes
 * @param {Function} callback - Callback when match is found
 * @returns {Object} Supabase channel
 */
export function subscribeToMatchmaking(callback) {
    const channel = supabase
        .channel('matchmaking_updates')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'clan_battle_queue'
            },
            callback
        )
        .subscribe();

    return channel;
}
