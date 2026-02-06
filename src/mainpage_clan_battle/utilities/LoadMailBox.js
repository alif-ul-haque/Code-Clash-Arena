import { getPendingClanRequests, getPendingFriendRequest } from "./FetchRequest";

export async function loadMailBox() {
    let mails = [];
    const { requests: clanRequest, error: clanRequestError } = await getPendingClanRequests();
    const { requests: friendRequest, error: friendRequestError } = await getPendingFriendRequest();

    if (friendRequestError) {
        return { mails: [], error: friendRequestError };
    }

    if (!friendRequest && !clanRequest) {
        return { mails: [], error: null };
    }

    if (friendRequest && friendRequest.length > 0) {
        mails = friendRequest.map(fr => ({
            id: fr.from_user,
            type: 'friend',
            from: fr.users.cf_handle,
            message: 'Has sent you a friend request.',
            time: fr.created_at,
            userId: fr.from_user,
            clanId: null
        }));
    }

    if (clanRequestError) {
        console.error("Error loading mailbox:", clanRequestError);
        return { mails: [], error: clanRequestError };
    }

    if (clanRequest && clanRequest.length > 0) {
        mails = [
            ...mails,
            ...clanRequest.map(cr => ({
                id: cr.user_id,
                type: 'clan',
                from: cr.users.cf_handle,
                message: 'Has requested to join your clan.',
                time: cr.created_at,
                userId: cr.user_id,
                clanId: cr.clan_id
            }))
        ];
    }
    console.log("Loaded mails:", mails);
    return { mails, error: null };

}