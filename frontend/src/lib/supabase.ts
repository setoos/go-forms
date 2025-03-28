import { createClient } from '@supabase/supabase-js';
import type { Database } from "../types/supabase.ts";

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}
if (!supabaseKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client with proper configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'vidoora-web',
      "Access-Control-Allow-Origin": "*",
       "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  }
});

// Export a function to check connection status
export async function checkSupabaseConnection() {
  try {
    // First check auth status as it's less expensive
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;

    // If not authenticated, try a simple query
    if (!session) {
      const { error: queryError } = await supabase
        .from('theme_presets')
        .select('id')
        .limit(1)
        .single();
        
      // PGRST116 means "no rows returned" which is fine for our check
      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }
    }

    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}