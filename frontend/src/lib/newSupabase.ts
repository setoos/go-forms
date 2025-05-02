import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_NEW;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_NEW;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

try {
  // Test that the URL is valid
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL:', error);
  throw new Error('Invalid Supabase URL. Please check your .env file.');
}

// Create the Supabase client with additional options for better error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'forms-app'
    }
  }
});

// Test the connection using a count query that will always return a single row
supabase.from('forms').select('count', { count: 'exact' }).single()
  .then(() => {
    console.log('Successfully connected to Supabase');
  })
  .catch((error) => {
    console.error('Failed to connect to Supabase:', error.message);
    // Don't throw here as we want the app to still initialize
    // The error will be visible in the console for debugging
  });