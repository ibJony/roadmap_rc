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
  currentUrl = '';
}

/**
 * Sign out from Supabase and clear the local client instance.
 * Safe to call even if no client exists.
 */
export async function signOutAndClear(url: string, key: string): Promise<void> {
  if (url && key) {
    try {
      const client = getSupabaseClient(url, key);
      await client.auth.signOut();
    } catch {
      // Best-effort: clear local state even if network call fails
    }
  }
  clearSupabaseClient();
}

/**
 * Validate the current Supabase session.
 * Returns the user if session is valid, null otherwise.
 */
export async function validateSession(url: string, key: string) {
  if (!url || !key) return null;
  try {
    const client = getSupabaseClient(url, key);
    const { data: { session } } = await client.auth.getSession();
    return session?.user ?? null;
  } catch {
    return null;
  }
}
