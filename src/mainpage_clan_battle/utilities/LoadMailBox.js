import { getPendingClanRequests } from "./FetchRequest";

export async function loadMailBox() {
    let mails = [];
    const { requests: clanRequest, error: clanRequestError } = await getPendingClanRequests();

    if (clanRequestError) {
        console.error("Error loading mailbox:", clanRequestError);
        return { mails: [], error: clanRequestError };
    }

    if (!clanRequest) {
        return { mails: [], error: null };
    }

    return {
        mails: [...mails, {
            id: clanRequest.id,
            type: 'clan',
            from: clanRequest.users.cf_handle,
            message: `Has requested to join your clan.`,
            time: clanRequest.created_at,
            userId: clanRequest.user_id,
            clanId: clanRequest.clan_id
        }],
        error: null
    };
}