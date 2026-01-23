import { supabase } from "../../supabaseclient";

export default async function showAllClans() {
    const { data, error } = await supabase
        .from('clans')
        .select(`
            clan_name,
            clan_id,
            location,
            type,
            min_trophy,
            max_trophy,
            level,
            users!clan_id(count)
        `);

    if (error) {
        console.error("Error fetching clans:", error.message);
        return { clans: null, error };
    }

    const shuffled = data.sort(() => 0.5 - Math.random());
    const randomClans = shuffled.slice(0, 5);

    const clansWithMembers = randomClans.map(clan => ({
        name: clan.clan_name,
        clanId: clan.clan_id,
        location: clan.location,
        type: clan.type,
        minRating: clan.min_trophy,
        maxRating: clan.max_trophy,
        level: clan.level,
        totalMembers: clan.users?.[0]?.count || 0
    }));

    console.log("Fetched clans:", clansWithMembers);
    return { clans: clansWithMembers, error: null };
}