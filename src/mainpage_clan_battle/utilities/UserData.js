import { supabase } from "../../supabaseclient";

export default async function getUserData() {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("Auth error:", authError?.message || "No user found");
            return { data: null, error: authError || new Error("No user found") };
        }

        const { data, error } = await supabase
            .from('users')
            .select('level, cf_handle, xp, clan_id')
            .eq('email', user.email)
            .maybeSingle();

        if (error) {
            console.error("Error fetching user data:", error.message);
            return { data: null, error };
        }

        if (!data) {
            console.warn("No user data found in database for user:", user.id);
            return { data: null, error: new Error("User data not found in database") };
        }

        return { data, error: null };
    } catch (err) {
        console.error("Unexpected error in getUserData:", err);
        return { data: null, error: err };
    }
}

export async function getClanData(clanId) {
    try {
        const { data, error } = await supabase
            .from('clans')
            .select('*')
            .eq('clan_id', clanId)
            .maybeSingle();
        if (error) {
            console.error("Error fetching clan data:", error.message);
            return { data: null, error };
        }
        if (!data) {
            console.warn("No clan data found for clan ID:", clanId);
            return { data: null, error: new Error("Clan data not found") };
        }
        return { data, error: null };
    } catch (err) {
        console.error("Unexpected error in getclanData:", err);
        return { data: null, error: err };
    }
}

export async function countClanMembers(clanId) {
    const { data, error } = await supabase.rpc('count_users_by_clan', { p_clan_id: clanId });
    if (error) {
        console.error("Error counting clan members:", error.message);
        return { count: 0, error };
    }
    return { count: data, error: null };
}
