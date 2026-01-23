import { supabase } from "../../supabaseclient";

export async function acceptRequest(request) {
    const { error } = await supabase
        .from('clan_join_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);
    if (error) {
        console.error("Error accepting clan join request:", error);
        return { success: false, error };
    }
    
    const { error: memberError } = await supabase
        .from('clan_members')
        .insert([
            {
                clan_id: request.clanId,
                user_id: request.userId,
                role: 'member'
            }
        ]);
    if (memberError) {
        console.error("Error adding user to clan members:", memberError);
        return { success: false, error: memberError };
    }

    const { error: profileError } = await supabase
        .from('users')
        .update({ clan_id: request.clanId })
        .eq('id', request.userId);
    if (profileError) {
        console.error("Error updating user's profile with clan ID:", profileError);
        return { success: false, error: profileError };
    }

    return { success: true, error: null };
}

export async function rejectRequest(requestId) {
    const { error } = await supabase
        .from('clan_join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
    if (error) {
        console.error("Error rejecting clan join request:", error);
        return { success: false, error };
    }
    return { success: true, error: null };
}