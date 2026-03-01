'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Toast } from '@/components/layout/Toast';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useOrgStore } from '@/lib/stores/org-store';
import { useTheme } from '@/hooks/use-theme';
import { validateSession } from '@/lib/supabase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const loadProjects = useRoadmapStore((s) => s.loadProjects);
  const loadOrganizations = useOrgStore((s) => s.loadOrganizations);
  const selectOrg = useOrgStore((s) => s.selectOrg);
  const { hasCompletedOnboarding, isOfflineMode, userId, supabaseUrl, supabaseKey, setUser, logout } = useAuthStore();
  useTheme(); // Sync light/dark/system theme on mount and changes
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Wait for Zustand to hydrate
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // Validate Supabase session on mount (catch stale/expired tokens)
  useEffect(() => {
    if (!hydrated || isOfflineMode || !userId || !supabaseUrl || !supabaseKey) return;

    validateSession(supabaseUrl, supabaseKey).then((user) => {
      if (user) {
        // Refresh user info from the actual session
        setUser(user.id, user.email ?? null);
      } else {
        // Session expired or invalid — force re-login
        logout();
        router.replace('/auth/login');
      }
    });
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

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
    loadOrganizations().then(() => {
      const { organizations: orgs, selectedOrg: sel } = useOrgStore.getState();
      if (!sel && orgs.length > 0) {
        selectOrg(orgs[0]);
      }
    });
  }, [hydrated, hasCompletedOnboarding, isOfflineMode, userId, router, loadProjects, loadOrganizations, selectOrg]);

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
        <TopBar onChatToggle={() => setIsChatOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toast />
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
