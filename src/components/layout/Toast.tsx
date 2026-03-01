'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/lib/stores/toast-store';
import type { ToastType } from '@/lib/types';

interface ToastStyleConfig {
  containerClass: string;
  iconClass: string;
  icon: React.ElementType;
}

const TOAST_CONFIGS: Record<ToastType, ToastStyleConfig> = {
  success: {
    containerClass: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
    iconClass:      'text-green-600 dark:text-green-400',
    icon:           CheckCircle,
  },
  error: {
    containerClass: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
    iconClass:      'text-red-600 dark:text-red-400',
    icon:           XCircle,
  },
  warning: {
    containerClass: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
    iconClass:      'text-orange-600 dark:text-orange-400',
    icon:           AlertTriangle,
  },
  info: {
    containerClass: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
    iconClass:      'text-blue-600 dark:text-blue-400',
    icon:           Info,
  },
};

export function Toast() {
  const currentToast = useToastStore((s) => s.currentToast);
  const dismiss      = useToastStore((s) => s.dismiss);

  // Track whether we've started showing this toast (for enter animation)
  const [visible, setVisible] = useState(false);
  // Track whether we're in the exit animation phase
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (currentToast) {
      setLeaving(false);
      // Let the element mount first, then trigger the enter animation
      const enterFrame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(enterFrame);
    } else {
      setVisible(false);
      setLeaving(false);
    }
  }, [currentToast?.id]); // Re-run when a new toast arrives

  const handleDismiss = () => {
    setLeaving(true);
    // Wait for exit animation then actually dismiss
    setTimeout(dismiss, 300);
  };

  if (!currentToast) return null;

  const config = TOAST_CONFIGS[currentToast.type];
  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 pointer-events-none"
    >
      <div
        className={cn(
          // Base styles
          'pointer-events-auto flex w-80 max-w-[calc(100vw-2.5rem)] items-start gap-3 rounded-lg border p-4 shadow-lg',
          // Animation: translate + opacity
          'transform transition-all duration-300 ease-in-out',
          visible && !leaving
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0',
          config.containerClass
        )}
      >
        {/* Icon */}
        <Icon className={cn('mt-0.5 size-5 shrink-0', config.iconClass)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {currentToast.title}
          </p>
          {currentToast.message && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
              {currentToast.message}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
