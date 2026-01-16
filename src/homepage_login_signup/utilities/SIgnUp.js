import { supabase } from '../../supabaseclient.js';

export async function signUpUser({ email, password, cfhandle }) {
    const { user, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });
    if (error) {
        return { user: null, error };
    }

    // Store additional cfhandle to the 'users' table
    const { error: dbError } = await supabase
        .from('users')
        .insert([{ id: user.id, cfhandle: cfhandle, email: user.email }]);
    if (dbError) {
        return { user: null, error: dbError };
    }
    return { user, error: null };
}