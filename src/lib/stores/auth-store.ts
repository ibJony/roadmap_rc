import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const DEFAULT_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

interface AuthState {
  isOfflineMode: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  userId: string | null;
  userEmail: string | null;
  appearance: 'system' | 'light' | 'dark';
  hasCompletedOnboarding: boolean;
  setOfflineMode: (offline: boolean) => void;
  setSupabaseConfig: (url: string, key: string) => void;
  setUser: (id: string | null, email: string | null) => void;
  setAppearance: (appearance: 'system' | 'light' | 'dark') => void;
  completeOnboarding: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isOfflineMode: !DEFAULT_SUPABASE_URL,
      supabaseUrl: DEFAULT_SUPABASE_URL,
      supabaseKey: DEFAULT_SUPABASE_ANON_KEY,
      userId: null,
      userEmail: null,
      appearance: 'system',
      hasCompletedOnboarding: false,
      setOfflineMode: (isOfflineMode) => set({ isOfflineMode }),
      setSupabaseConfig: (supabaseUrl, supabaseKey) => set({ supabaseUrl, supabaseKey }),
      setUser: (userId, userEmail) => set({ userId, userEmail }),
      setAppearance: (appearance) => set({ appearance }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      logout: () => set({ userId: null, userEmail: null, isOfflineMode: false }),
    }),
    { name: 'rmlab-auth' }
  )
);
