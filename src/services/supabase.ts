/**
 * Supabase Client Initialization
 *
 * This file initializes and exports the Supabase client, making it a singleton
 * that can be imported throughout the application. It uses environment variables
 * defined by the esbuild `define` config.
 */
import { createClient } from '@supabase/supabase-js';
// These variables are replaced at build time by the `define` config in `scripts/build.mjs`.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Throw a runtime error if the environment variables are missing.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.');
}

// Create and export the Supabase client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
