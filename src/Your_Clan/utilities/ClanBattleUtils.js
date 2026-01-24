import { supabase } from '../../supabaseclient';
import getUserData from '../../mainpage_clan_battle/utilities/UserData';

/**
 * Check if the current user is the leader of their clan
 * @returns {Promise<{isLeader: boolean, error: any}>}
 */
export async function isUserClanLeader() {
    try {
        const { data: user, error: userError } = await getUserData();
        if (userError || !user) {
            return { isLeader: false, error: userError };
        }

        if (!user.clan_id) {
            return { isLeader: false, error: null };
        }

        // Check if user is the leader in clans table
        const { data: clan, error: clanError } = await supabase
            .from('clans')
            .select('leader_id')
            .eq('clan_id', user.clan_id)
            .single();

        if (clanError) {
            return { isLeader: false, error: clanError };
        }

        return { isLeader: clan.leader_id === user.id, error: null };
    } catch (error) {
        console.error('Error checking clan leader status:', error);
        return { isLeader: false, error };
    }
}

/**
 * Check if there's an ongoing battle for the user's clan
 * @returns {Promise<{hasOngoingBattle: boolean, battleId: string|null, error: any}>}
 */
export async function hasOngoingClanBattle() {
    try {
        const { data: user, error: userError } = await getUserData();
        if (userError || !user) {
            return { hasOngoingBattle: false, battleId: null, error: userError };
        }

        if (!user.clan_id) {
            return { hasOngoingBattle: false, battleId: null, error: null };
        }

        // Check if there's an ongoing battle in clan_battles table
        // Battle is ongoing if status is 'in_progress' or 'preparing'
        const { data: battles, error: battleError } = await supabase
            .from('clan_battles')
            .select('battle_id, status')
            .or(`clan1_id.eq.${user.clan_id},clan2_id.eq.${user.clan_id}`)
            .in('status', ['in_progress', 'preparing'])
            .order('created_at', { ascending: false })
            .limit(1);

        if (battleError) {
            // Table doesn't exist yet - this is expected if the clan battle system hasn't been set up
            if (battleError.code === 'PGRST205') {
                console.warn('Clan battles table not found. Feature not yet available.');
                return { hasOngoingBattle: false, battleId: null, error: null };
            }
            console.error('Error fetching clan battles:', battleError);
            return { hasOngoingBattle: false, battleId: null, error: battleError };
        }

        if (battles && battles.length > 0) {
            return { hasOngoingBattle: true, battleId: battles[0].battle_id, error: null };
        }

        return { hasOngoingBattle: false, battleId: null, error: null };
    } catch (error) {
        console.error('Error checking ongoing clan battle:', error);
        return { hasOngoingBattle: false, battleId: null, error };
    }
}

/**
 * Subscribe to changes in clan battles for the user's clan
 * @param {string} clanId - The clan ID to monitor
 * @param {Function} callback - Callback function when battle status changes
 * @returns {Promise<{channel: any, error: any}>}
 */
export function subscribeToClanBattleChanges(clanId, callback) {
    const channel = supabase
        .channel(`clan_battle_changes_${clanId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'clan_battles',
                filter: `clan1_id=eq.${clanId},clan2_id=eq.${clanId}`
            },
            callback
        )
        .subscribe();

    return channel;
}
