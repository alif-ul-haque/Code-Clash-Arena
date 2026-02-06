import { supabase } from "../../supabaseclient.js";
import getUserData from "./UserData.js";

export async function getPendingClanRequests() {
    const { data, error } = await getUserData();

    if (error) {
        console.error("Error getting user data:", error);
        return { requests: null, error };
    }
    const userId = data.id;
    const { data: requestsData, error: requestsError } = await supabase
        .from('clan_join_requests')
        .select(`
            id,
            user_id,
            clan_id,
            created_at,
            clans!inner(leader_id),
            users!user_id(cf_handle, email)
    `)
        .eq('status', 'pending')
        .eq('clans.leader_id', userId);
    if (requestsError) {
        console.error("Error fetching pending requests:", requestsError);
        return { requests: null, error: requestsError };
    }
    // console.log("Fetched pending requests:", requestsData);
    return { requests: requestsData, error: null };
}

export async function getPendingFriendRequest() {
    const { data, error } = await getUserData();

    if (error) {
        console.error("Error getting user data:", error);
        return { requests: null, error };
    }
    const userId = data.id;
    const { data: friendRequestData, error: friendRequestError } = await supabase
        .from('friend_request')
        .select(`
            from_user,
            created_at,
            users!friend_request_from_user_fkey (
              cf_handle
            )`)
        .eq('to_user', userId);
    if (friendRequestError) {
        console.error("Error fetching pending friend requests:", friendRequestError);
        return { requests: null, error: friendRequestError };
    }
    console.log("Fetched pending friend requests:", friendRequestData);
    return { requests: friendRequestData, error: null };
}

