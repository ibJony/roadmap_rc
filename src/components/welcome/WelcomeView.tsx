'use client';

import React, { useState } from 'react';
import { Map, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { DEFAULT_PROJECT } from '@/lib/types';

// ── Feature card data ────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Map,
    title: 'Kanban Board',
    description:
      'Move ideas from exploration through prototyping to production with a visual, stage-gated board designed for modern product teams.',
    gradient: 'from-purple-500/10 to-purple-600/5',
    iconColor: 'text-purple-500',
    border: 'border-purple-200 dark:border-purple-900',
  },
  {
    icon: Target,
    title: 'OKR Tracking',
    description:
      'Link every initiative to measurable objectives and key results. Track progress at a glance and keep the team aligned on outcomes.',
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconColor: 'text-blue-500',
    border: 'border-blue-200 dark:border-blue-900',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Organise members into organisations and teams, assign roles, and build a shared understanding of your product strategy.',
    gradient: 'from-green-500/10 to-green-600/5',
    iconColor: 'text-green-500',
    border: 'border-green-200 dark:border-green-900',
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export function WelcomeView() {
  const { completeOnboarding } = useAuthStore();
  const { createProject, loadProjects } = useRoadmapStore();
  const [loading, setLoading] = useState(false);

  async function handleGetStarted() {
    setLoading(true);
    try {
      await createProject(DEFAULT_PROJECT);
      await loadProjects();
      completeOnboarding();
    } catch {
      // completeOnboarding regardless so the user can proceed
      completeOnboarding();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 size-[600px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[600px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 py-16 text-center max-w-4xl w-full">
        {/* Logo / wordmark */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          RMLAB Roadmap
        </div>

        {/* Title */}
        <h1 className="mt-4 text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
          RMLAB{' '}
          <span className="bg-gradient-to-br from-purple-500 via-blue-500 to-teal-400 bg-clip-text text-transparent">
            Roadmap
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
          A modern product roadmap tool built on the RMLAB framework — stage-gated, outcome-driven,
          and built for teams who ship.
        </p>

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
          {FEATURES.map(({ icon: Icon, title, description, gradient, iconColor, border }) => (
            <div
              key={title}
              className={`rounded-xl border ${border} bg-gradient-to-br ${gradient} backdrop-blur p-6 text-left shadow-sm`}
            >
              <div className={`mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-background/60 shadow-sm ${iconColor}`}>
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="mt-12 px-10 text-base shadow-lg"
          onClick={handleGetStarted}
          disabled={loading}
        >
          {loading ? 'Setting up…' : 'Get Started'}
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Your data is stored locally — no account required.
        </p>
      </div>
    </div>
  );
}
