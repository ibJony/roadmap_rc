import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isOfflineMode: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  anthropicKey: string;
  userId: string | null;
  userEmail: string | null;
  appearance: 'system' | 'light' | 'dark';
  hasCompletedOnboarding: boolean;
  setOfflineMode: (offline: boolean) => void;
  setSupabaseConfig: (url: string, key: string) => void;
  setAnthropicKey: (key: string) => void;
  setUser: (id: string | null, email: string | null) => void;
  setAppearance: (appearance: 'system' | 'light' | 'dark') => void;
  completeOnboarding: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isOfflineMode: true,
      supabaseUrl: '',
      supabaseKey: '',
      anthropicKey: '',
      userId: null,
      userEmail: null,
      appearance: 'system',
      hasCompletedOnboarding: false,
      setOfflineMode: (isOfflineMode) => set({ isOfflineMode }),
      setSupabaseConfig: (supabaseUrl, supabaseKey) => set({ supabaseUrl, supabaseKey }),
      setAnthropicKey: (anthropicKey) => set({ anthropicKey }),
      setUser: (userId, userEmail) => set({ userId, userEmail }),
      setAppearance: (appearance) => set({ appearance }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      logout: () => set({ userId: null, userEmail: null, isOfflineMode: false }),
    }),
    { name: 'rmlab-auth' }
  )
);
