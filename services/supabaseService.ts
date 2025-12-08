
// NOTE: This service relies on environment variables.
// Keys should be provided in .env

// @ts-ignore
const getEnv = (key) => (typeof process !== 'undefined' ? process.env[key] : undefined) || (typeof import.meta !== 'undefined' ? import.meta.env[key] : undefined);

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL') || '';
const SUPABASE_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY') || '';

export const supabaseConfig = {
    url: SUPABASE_URL,
    key: SUPABASE_KEY
};

export const getSupabaseConfig = () => {
    return {
        url: SUPABASE_URL,
        key: SUPABASE_KEY
    };
};