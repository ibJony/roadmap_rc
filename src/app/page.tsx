'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { WelcomeView } from '@/components/welcome/WelcomeView';

export default function RootPage() {
  const router = useRouter();
  const { hasCompletedOnboarding, isOfflineMode, userId } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    // If already hydrated
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (hasCompletedOnboarding) {
      // User completed onboarding — check if authenticated or offline
      if (isOfflineMode || userId) {
        router.replace('/roadmap');
      } else {
        router.replace('/auth/login');
      }
    }
    // If not onboarded, WelcomeView renders below
  }, [hydrated, hasCompletedOnboarding, isOfflineMode, userId, router]);

  if (!hydrated) {
    // Prevent flash while localStorage is loading
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <WelcomeView />;
  }

  // Redirecting — show nothing
  return null;
}
