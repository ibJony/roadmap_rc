'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
}

export function MetricCard({ title, value, subtitle, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground leading-tight">{title}</p>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={color ? { backgroundColor: `${color}1a`, color } : undefined}
        >
          <Icon
            className={cn('size-4.5', !color && 'text-muted-foreground')}
            style={color ? { color } : undefined}
          />
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <p
          className="text-3xl font-bold tabular-nums leading-none tracking-tight"
          style={color ? { color } : undefined}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
