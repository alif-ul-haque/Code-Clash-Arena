import { supabase } from "../../supabaseclient";
import getUserData from "./UserData.js";

export async function joinClan(clanId) {
    const { data, error } = await getUserData();
    if (error) {
        console.error("Error getting user data:", error);
        return { success: false, error };
    }

    const userId = data.id;
    const { error: joinClanError } = await supabase.from('clan_join_requests').insert([
        {
            clan_id: clanId,
            user_id: userId,
            status: 'pending'
        }
    ]);
    if (joinClanError) {
        console.error("Error joining clan:", error);
        return { success: false, error };
    }
    return { success: true, error: null };
}

export async function fetchStatus(clanId) {
    const { data, error } = await getUserData();
    if (error) {
        console.error("Error getting user data:", error);
        return { status: null, error };
    }
    const userId = data.id;
    const { data: requestData, error: requestError } = await supabase
        .from('clan_join_requests')
        .select('status')
        .eq('clan_id', clanId)
        .eq('user_id', userId)
        .maybeSingle();
    if (requestError) {
        console.error("Error checking join request status:", requestError);
        return { status: null, error: requestError };
    }
    if (!requestData) {
        return { status: null, error: null };
    }
    return { status: requestData.status, error: null };
}