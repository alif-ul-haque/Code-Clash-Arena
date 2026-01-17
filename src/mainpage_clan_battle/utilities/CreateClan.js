import { supabase } from '../../supabaseclient.js'

export async function createClan({ clanName, type, location, warFrequency, minTrophy, maxTrophy }) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Auth error:", authError?.message || "No user found");
        throw new Error(authError?.message || "No user found");
    }
    const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
    
    if (userDataError || !userData) {
        console.error("Error fetching user data:", userDataError?.message || "No user data found");
        throw new Error(userDataError?.message || "No user data found");
    }

    const { data: clanData, error } = await supabase.from('clans').insert([
        {
            clan_name: clanName,
            type: type,
            location: location,
            war_frequency: warFrequency,
            min_trophy: minTrophy,
            max_trophy: maxTrophy,
            leader_id: userData.id
        }
    ]).select();

    if (error) {
        console.error("Error creating clan:", error.message);
        throw error;
    }

    // Update user's clan_id with the newly created clan
    const clanId = clanData[0].clan_id;
    const { error: updateError } = await supabase
        .from('users')
        .update({ clan_id: clanId })
        .eq('id', userData.id);

    if (updateError) {
        console.error("Error updating user clan_id:", updateError.message);
        throw updateError;
    }

    //update clan_members table
    const { error: memberError } = await supabase.from('clan_members').insert([
        {
            clan_id: clanId,
            user_id: userData.id,
            role: 'leader'
        }
    ]);
    if (memberError) {
        console.error("Error adding clan member:", memberError.message);
        throw memberError;
    }

    return { success: true, clanId };
}