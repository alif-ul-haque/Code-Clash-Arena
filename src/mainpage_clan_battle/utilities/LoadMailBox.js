import { getPendingClanRequests } from "./FetchRequest";

export async function loadMailBox() {
    let mails = [];
    const { requests: clanRequest, error: clanRequestError } = await getPendingClanRequests();
    if (clanRequestError) {
        console.error("Error loading mailbox:", clanRequestError);
        return { mails: null, clanRequestError };
    }
    else {
        return {
            mails: [...mails, {
                type: 'clan',
                from: clanRequest.users.cf_handle,
                message: `Has requested to join your clan.`,
                time: clanRequest.created_at
            }]
        }
    }
}