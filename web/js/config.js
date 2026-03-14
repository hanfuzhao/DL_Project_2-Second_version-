/**
 * Supabase configuration — credentials are baked in.
 */
const SUPABASE_URL = 'https://igqisvxkzkirtmkuyfrq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlncWlzdnhremtpcnRta3V5ZnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MjcxMDcsImV4cCI6MjA4OTEwMzEwN30.mpevDA23RBKSf4tgszIdnZKFSJrEwyCG_IGbr9I2sC8';

const SafeTypeConfig = {
    getSupabaseClient() {
        return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    },

    getSupabaseUrl() {
        return SUPABASE_URL;
    },

    getAnonKey() {
        return SUPABASE_ANON_KEY;
    }
};
