import { supabase } from "../../supabaseclient";
import getUserData from "./UserData";

export async function searchClan(queryItem) {
    if (!queryItem) return { data: [], error: null };
    const isClanId = queryItem.startsWith('#');
    if (isClanId && queryItem.length != 8) {
        return { data: null, error: "Invalid clan Id format" };
    }
    let query = supabase.from('clans').select('*')

    if (isClanId) {
        query = query.ilike('id', queryItem)
    } else {
        query = query.ilike('clan_name', `%${queryItem}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Search error:', error)
        return []
    }

    return { data, error: null }
}

export async function searchFriend(queryItem) {
    if (!queryItem) return { data: [], error: null };

    // Get current user data
    const { data: currentUserData, error: userError } = await getUserData();
    if (userError) {
        console.error("Error retrieving current user data:", userError.message);
        return { data: null, error: userError };
    }
    const currentUserId = currentUserData.id;

    const isUserId = queryItem.startsWith('#');
    if (isUserId && queryItem.length != 9) {
        return { data: null, error: "Invalid user ID format" };
    }

    let query = supabase.from('users').select(`
        *,
        clans:clan_id (
            clan_name
        )
    `);

    if (isUserId) {
        query = query.ilike('user_id', queryItem);
    } else {
        query = query.ilike('cf_handle', `%${queryItem}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Search error:', error);
        return { data: null, error };
    }

    const filteredData = data.filter(user => user.id !== currentUserId);

    const enrichedData = await Promise.all(
        filteredData.map(async (user) => {
            const { data: hasFriendReq, error: reqError } = await supabase.rpc('has_friend_request', {
                p_user_id: currentUserId,
                p_frnd_id: user.id
            });

            const { data: isFriend, error: friendError } = await supabase.rpc('is_already_friend', {
                p_user_id: currentUserId,
                p_frnd_id: user.id
            });

            if (reqError) {
                console.error('Error checking friend request:', reqError);
            }

            if (friendError) {
                console.error('Error checking friendship:', friendError);
            }

            return {
                ...user,
                clan_name: user.clans?.clan_name || null,
                hasFriendRequest: hasFriendReq || false,
                isAlreadyFriend: isFriend || false
            };
        })
    );

    return { data: enrichedData, error: null };
}