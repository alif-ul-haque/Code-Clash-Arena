import { supabase } from '../../supabaseclient.js';

export async function signUpUser({ email, password, cfhandle }) {

    // Check if email already exists in users table
    const { data: existingEmail, error: emailCheckError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        return { user: null, error: emailCheckError };
    }

    if (existingEmail) {
        return { user: null, error: { message: "Email already exists." } };
    }

    // Check if cfhandle already exists in users table
    const { data: existingHandle, error: handleCheckError } = await supabase
        .from('users')
        .select('cf_handle')
        .eq('cf_handle', cfhandle)
        .single();

    if (handleCheckError && handleCheckError.code !== 'PGRST116') {
        return { user: null, error: handleCheckError };
    }

    if (existingHandle) {
        return { user: null, error: { message: "Codeforces handle already exists." } };
    }

    //validating the cfhandle by calling codeforces api
    async function isValidCFHandle(handle) {
        try {
            const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
            if (!res.ok) return false;

            const data = await res.json();
            return data.status === "OK";
        } catch (_) {
            return false;
        }
    }

    const validHandle = await isValidCFHandle(cfhandle);
    if (!validHandle) {
        return { user: null, error: { message: "Invalid Codeforces handle." } };
    }

    // Sign up user in Supabase
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        return { user: null, error };
    }

    // Insert additional data into 'users' table
    const { error: dbError } = await supabase
        .from('users')
        .insert([{ id: data.user.id, cf_handle: cfhandle, email: data.user.email }]);

    if (dbError) {
        return { user: null, error: dbError };
    }

    return { user: data.user, error: null };
}
