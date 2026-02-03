import { supabase } from "../../supabaseclient";
import getUserData from "./UserData";

export async function viewNonFriends() {
    const { data: currentUserData, error: userError } = await getUserData();
    if (userError) {
        console.error("Error retrieving current user data:", userError.message);
        return { data: null, error: userError };
    }
    const currentUserId = currentUserData.id;
    const { data, error } = await supabase.rpc('get_non_friends', { current_user_id: currentUserId });
    if (error) {
        console.error("Error fetching non-friends:", error.message);
        return { data: null, error };
    }
    return { data, error: null };
}