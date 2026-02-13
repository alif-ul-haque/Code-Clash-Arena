import { supabase } from "../../supabaseclient";

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

    return { data , error: null }
}