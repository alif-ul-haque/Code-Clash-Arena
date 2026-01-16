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
            .select('level, cf_handle, xp')
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
