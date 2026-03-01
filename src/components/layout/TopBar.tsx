'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { applyTheme } from '@/hooks/use-theme';
import type { Project } from '@/lib/types';

// Map route segments to human-readable page titles
function getPageTitle(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean)[0] ?? '';
  const titles: Record<string, string> = {
    roadmap:    'Roadmap',
    ideas:      'Ideas',
    priorities: 'Priorities',
    okrs:       'OKRs',
    dashboard:  'Dashboard',
    teams:      'Teams',
    settings:   'Settings',
    compost:    'Compost',
    chat:       'AI Chat',
    projects:   'Projects',
    welcome:    'Welcome',
  };
  return titles[segment] ?? 'RMLAB Roadmap';
}

interface AppearanceOption {
  value: 'system' | 'light' | 'dark';
  label: string;
  icon: React.ElementType;
}

const APPEARANCE_OPTIONS: AppearanceOption[] = [
  { value: 'system', label: 'System',    icon: Monitor },
  { value: 'light',  label: 'Light',     icon: Sun },
  { value: 'dark',   label: 'Dark',      icon: Moon },
];

function AppearanceIcon({ appearance }: { appearance: 'system' | 'light' | 'dark' }) {
  switch (appearance) {
    case 'light':  return <Sun  className="size-4" />;
    case 'dark':   return <Moon className="size-4" />;
    default:       return <Monitor className="size-4" />;
  }
}

interface TopBarProps {
  onChatToggle?: () => void;
}

export function TopBar({ onChatToggle }: TopBarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  const projects        = useRoadmapStore((s) => s.projects);
  const selectedProject = useRoadmapStore((s) => s.selectedProject);
  const selectProject   = useRoadmapStore((s) => s.selectProject);

  const appearance    = useAuthStore((s) => s.appearance);
  const setAppearance = useAuthStore((s) => s.setAppearance);

  const handleSelectProject = async (project: Project) => {
    if (project.id !== selectedProject?.id) {
      await selectProject(project);
    }
  };

  const handleSetAppearance = (value: 'system' | 'light' | 'dark') => {
    setAppearance(value);
    applyTheme(value);
  };

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border bg-background px-4 gap-3">
      {/* Left: page title — push right of hamburger on mobile */}
      <h1 className="ml-10 md:ml-0 text-base font-semibold text-foreground flex-1 truncate">
        {pageTitle}
      </h1>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5">
        {/* Project selector */}
        {projects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 max-w-[180px]">
                {selectedProject && (
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: selectedProject.colorHex }}
                  />
                )}
                <span className="truncate text-xs">
                  {selectedProject?.name ?? 'Select project'}
                </span>
                <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className="gap-2"
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: project.colorHex }}
                  />
                  <span className="flex-1 truncate">{project.name}</span>
                  {project.id === selectedProject?.id && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* AI Chat toggle */}
        <Button variant="ghost" size="icon-sm" aria-label="Open AI Chat" onClick={onChatToggle}>
          <MessageSquare className="size-4" />
        </Button>

        {/* Light/dark/system appearance toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Toggle appearance">
              <AppearanceIcon appearance={appearance} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {APPEARANCE_OPTIONS.map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => handleSetAppearance(value)}
                className={cn('gap-2', appearance === value && 'text-primary font-medium')}
              >
                <Icon className="size-4" />
                {label}
                {appearance === value && <Check className="ml-auto size-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
