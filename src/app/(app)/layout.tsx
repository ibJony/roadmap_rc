'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Toast } from '@/components/layout/Toast';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const loadProjects = useRoadmapStore((s) => s.loadProjects);
  const { hasCompletedOnboarding, isOfflineMode, userId } = useAuthStore();
  useTheme(); // Sync light/dark/system theme on mount and changes
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand to hydrate
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // Auth guard: redirect if not onboarded or not authenticated
  useEffect(() => {
    if (!hydrated) return;

    if (!hasCompletedOnboarding) {
      router.replace('/');
      return;
    }

    if (!isOfflineMode && !userId) {
      router.replace('/auth/login');
      return;
    }

    // Authenticated — load data
    loadProjects();
  }, [hydrated, hasCompletedOnboarding, isOfflineMode, userId, router, loadProjects]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasCompletedOnboarding || (!isOfflineMode && !userId)) {
    return null; // Redirecting
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
}
