import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let currentUrl: string = '';

export function getSupabaseClient(url: string, key: string): SupabaseClient {
  if (!supabaseInstance || currentUrl !== url) {
    currentUrl = url;
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

export function clearSupabaseClient(): void {
  supabaseInstance = null;
}
