'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Map,
  Lightbulb,
  Flag,
  Target,
  BarChart3,
  Users,
  Settings,
  Trash2,
  Menu,
  X,
  FolderOpen,
  LogOut,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useOrgStore } from '@/lib/stores/org-store';
import { useTeamStore } from '@/lib/stores/team-store';
import { signOutAndClear } from '@/lib/supabase';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Projects',   href: '/projects',   icon: FolderOpen },
  { label: 'Roadmap',    href: '/roadmap',    icon: Map },
  { label: 'Ideas',      href: '/ideas',      icon: Lightbulb },
  { label: 'Priorities', href: '/priorities', icon: Flag },
  { label: 'OKRs',       href: '/okrs',       icon: Target },
  { label: 'Dashboard',  href: '/dashboard',  icon: BarChart3 },
  { label: 'Teams',      href: '/teams',      icon: Users },
  { label: 'Settings',   href: '/settings',   icon: Settings },
];

function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const selectedProject = useRoadmapStore((s) => s.selectedProject);
  const { userEmail, isOfflineMode, supabaseUrl, supabaseKey, logout } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOutAndClear(supabaseUrl, supabaseKey);
    // Clear all stores to prevent data leaking between sessions
    useRoadmapStore.setState({ projects: [], selectedProject: null, cards: [], selectedCard: null, isEditing: false, editingStage: null, filterOrgId: null });
    useOrgStore.setState({ organizations: [], selectedOrg: null, members: [] });
    useTeamStore.setState({ teams: [], selectedTeam: null, teamMembers: [] });
    logout();
    onNavClick?.();
    router.replace('/auth/login');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Project indicator */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div
          className="size-3 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-sidebar ring-border/40"
          style={{ backgroundColor: selectedProject?.colorHex ?? '#6B4C9A' }}
        />
        <span className="text-sm font-semibold text-sidebar-foreground truncate">
          {selectedProject?.name ?? 'RMLAB Roadmap'}
        </span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Compost link */}
      <div className="px-2 border-t border-border pt-3">
        <Link
          href="/compost"
          onClick={onNavClick}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/compost' || pathname.startsWith('/compost/')
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Trash2 className="size-4 shrink-0" />
          Compost
        </Link>
      </div>

      {/* User section */}
      <div className="px-2 pb-3 border-t border-border pt-3">
        <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
          {isOfflineMode ? (
            <WifiOff className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Wifi className="size-3.5 shrink-0 text-green-500" />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {isOfflineMode ? 'Offline mode' : (userEmail ?? 'Signed in')}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col h-full bg-sidebar border-r border-sidebar-border">
        <SidebarNav />
      </aside>

      {/* Mobile hamburger button */}
      <button
        type="button"
        className="md:hidden fixed top-3 left-3 z-50 flex size-9 items-center justify-center rounded-md bg-background border border-border shadow-sm text-foreground"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          type="button"
          className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </button>

        <SidebarNav onNavClick={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
