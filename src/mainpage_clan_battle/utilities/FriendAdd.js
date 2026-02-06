import { supabase } from "../../supabaseclient";


export async function acceptFriendRequest(request) {
    const { error } = await supabase
        .from('friends')
        .insert({
            u_id: request.userId,
            f_id: request.id
        })
    if (error) {
        console.error("Error accepting friend request:", error);
        return { success: false, error };
    }
    const { error: deleteError } = await supabase
        .from('friend_request')
        .delete()
        .eq('from_user', request.id)
        .eq('to_user', request.userId);
    if (deleteError) {
        console.error("Error deleting friend request:", deleteError);
        return { success: false, error: deleteError };
    }
    return { success: true, error: null };
}

export async function cancelFriendRequest(request) {
    const { error } = await supabase
        .from('friend_request')
        .delete()
        .eq('from_user', request.id)
        .eq('to_user', request.userId);
    if (error) {
        console.error("Error canceling friend request:", error);
        return { success: false, error };
    }
    return { success: true, error: null };
}