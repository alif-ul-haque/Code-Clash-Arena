import { supabase } from "../../supabaseclient.js";
import getUserData from "./UserData.js";

export default async function get1v1History() {
    const { data: userData, error: userError } = await getUserData();
    if (userError) {
        console.error("Error fetching user data:", userError.message);
        return { data: null, error: userError };
    }
    const userId = userData.id;

    const { data: userBattles, error: battleError } = await supabase
        .from('onevone_participants')
        .select(`
            onevone_battle_id,
            problem_solved,
            time_taken,
            rating_change,
            onevonebattles (
                onevone_battle_id,
                start_time,
                end_time,
                status
            )
        `)
        .eq('player_id', userId)
        .order('onevone_battle_id', { ascending: false })
        .limit(10);

    if (battleError) {
        console.error("Error fetching user battles:", battleError.message);
        return { data: null, error: battleError };
    }

    if (!userBattles || userBattles.length === 0) {
        console.log("No battle history found");
        return { data: [], error: null };
    }

    const battlePromises = userBattles.map(async (userBattle) => {
        const battleId = userBattle.onevone_battle_id;

        const { data: opponentData, error: opponentError } = await supabase
            .from('onevone_participants')
            .select(`
                player_id,
                problem_solved,
                time_taken,
                users (
                    id,
                    cf_handle,
                    rating
                )
            `)
            .eq('onevone_battle_id', battleId)
            .neq('player_id', userId)
            .single();

        if (opponentError || !opponentData) {
            console.error(`Error fetching opponent for battle ${battleId}:`, opponentError);
            return null;
        }

        const userScore = userBattle.problem_solved || 0;
        const opponentScore = opponentData.problem_solved || 0;

        const battleInfo = userBattle.onevonebattles;
        const duration = battleInfo?.start_time && battleInfo?.end_time
            ? new Date(battleInfo.end_time) - new Date(battleInfo.start_time)
            : null;

        return {
            battle_id: battleId,
            opponent: {
                id: opponentData.users.id,
                cf_handle: opponentData.users.cf_handle,
                rating: opponentData.users.rating || 0,
                score: opponentScore,
            },
            currentUser: {
                id: userId,
                cf_handle: userData.cf_handle,
                rating: userData.rating || 0,
                score: userScore,
            },
            result: userScore > opponentScore ? 'WIN' : userScore < opponentScore ? 'LOSS' : 'DRAW',
            duration: duration,
            battle_date: battleInfo?.start_time || new Date(),
            time_taken: userBattle.time_taken,
            rating_change: userBattle.rating_change || 0,
        };
    });

    const battles = await Promise.all(battlePromises);
    const validBattles = battles.filter(battle => battle !== null);

    console.log("Fetched and transformed 1v1 battle history:", validBattles);
    return { data: validBattles, error: null };
}