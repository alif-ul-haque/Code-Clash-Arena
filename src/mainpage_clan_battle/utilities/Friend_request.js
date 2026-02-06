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

export async function hasFriendRequest(playerId) {
    const { data: currentUserData, error: userError } = await getUserData();
    if (userError) {
        console.error("Error retrieving current user data:", userError.message);
        return { data: null, error: userError };
    }
    const currentUserId = currentUserData.id;
    const { data : result, error } = await supabase.rpc('has_friend_request', {
        p_user_id: currentUserId,
        p_frnd_id : playerId
    })
    if (error) {
        console.error("Error checking friend request:", error.message);
        return { data: null, error };
    }
    console.log(result);
    return { result, error: null };
}

export async function sendFriendRequest(playerId) {
    const { data: currentUserData, error: userError } = await getUserData();
    if (userError) {
        console.error("Error retrieving current user data:", userError.message);
        return { data: null, error: userError };
    }
    const currentUserId = currentUserData.id;
    const { error } = await supabase
        .from('friend_request')
        .insert({ from_user: currentUserId, to_user: playerId });
    if (error) {
        console.error("Error sending friend request:", error.message);
        return { error };
    }
    return { error: null };
}

export async function cancelFriendRequest(playerId) {
    const { data: currentUserData, error: userError } = await getUserData();
    if (userError) {
        console.error("Error retrieving current user data:", userError.message);
        return { data: null, error: userError };
    }
    const currentUserId = currentUserData.id;
    const { error } = await supabase
        .from('friend_request')
        .delete()
        .eq('from_user', currentUserId)
        .eq('to_user', playerId);
    if (error) {
        console.error("Error canceling friend request:", error.message);
        return { error };
    }
    return { error: null };
}