
// NOTE: This service is initialized with your provided keys.
// Ready for future migration to Supabase Edge Functions for PDF processing.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hqlgdiawafasfckumxhp.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxbGdkaWF3YWZhc2Zja3VteGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MzU1NzgsImV4cCI6MjA3NzMxMTU3OH0.8jqq9gBvS4P7RmPusCnOUfQa6SHlEEoReSIfzY_wPL4';

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
