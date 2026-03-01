'use client';

import React, { useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  Recycle,
  Target,
  CheckCircle,
  Star,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import type { TimePeriod, AchievementType } from '@/lib/types';
import { TIME_PERIODS, shippingRate, compostRate, stageDisplayName } from '@/lib/types';
import { STAGE_COLORS_HEX } from '@/lib/theme';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { MetricCard } from './MetricCard';

// --- helpers ----------------------------------------------------------------

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

const ACHIEVEMENT_TYPE_ICONS: Record<AchievementType, React.ReactNode> = {
  shipped: <Package className="size-4 text-green-500" />,
  keyResultAchieved: <Target className="size-4 text-blue-500" />,
  objectiveCompleted: <Star className="size-4 text-yellow-500" />,
};

const ACHIEVEMENT_TYPE_LABEL: Record<AchievementType, string> = {
  shipped: 'Shipped',
  keyResultAchieved: 'Key Result Achieved',
  objectiveCompleted: 'Objective Completed',
};

// --- main component ---------------------------------------------------------

export function LeadershipDashboard() {
  const { metrics, achievements, selectedPeriod, isLoading, loadDashboard, changePeriod } =
    useDashboardStore();
  const selectedProject = useRoadmapStore((s) => s.selectedProject);

  useEffect(() => {
    if (selectedProject?.id) {
      loadDashboard(selectedProject.id);
    }
  }, [selectedProject?.id, loadDashboard]);

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
        <BarChart3 className="size-8 opacity-40" />
        <p className="text-sm">No project selected</p>
      </div>
    );
  }

  // --- stage distribution data ---
  const stageData = metrics
    ? [
        { stage: 'ideas', label: 'Ideas', count: metrics.ideasCount, color: STAGE_COLORS_HEX.ideas },
        { stage: 'exploration', label: 'Exploration', count: metrics.explorationCount, color: STAGE_COLORS_HEX.exploration },
        { stage: 'prototyping', label: 'Prototyping', count: metrics.prototypingCount, color: STAGE_COLORS_HEX.prototyping },
        { stage: 'production', label: 'Production', count: metrics.productionCount, color: STAGE_COLORS_HEX.production },
        { stage: 'compost', label: 'Compost', count: metrics.compostCount, color: STAGE_COLORS_HEX.compost },
      ]
    : [];

  const shipRate = metrics ? shippingRate(metrics) : 0;
  const compRate = metrics ? compostRate(metrics) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Leadership Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">{selectedProject.name}</p>
      </div>

      {/* Period selector */}
      <Tabs
        value={selectedPeriod}
        onValueChange={(v) =>
          selectedProject.id && changePeriod(v as TimePeriod, selectedProject.id)
        }
      >
        <TabsList>
          {TIME_PERIODS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading || !metrics ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <p className="text-sm">Loading metrics…</p>
        </div>
      ) : (
        <>
          {/* Top metric cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard
              title="Total Initiatives"
              value={metrics.totalInitiatives}
              subtitle={`${metrics.cardsCreatedThisPeriod} created this period`}
              icon={BarChart3}
              color="#6366F1"
            />
            <MetricCard
              title="Shipped"
              value={metrics.initiativesShipped}
              subtitle={`${formatPercent(shipRate)} shipping rate`}
              icon={Package}
              color="#22C55E"
            />
            <MetricCard
              title="In Progress"
              value={metrics.initiativesInProgress}
              subtitle="Exploration + Prototyping"
              icon={TrendingUp}
              color="#F59E0B"
            />
            <MetricCard
              title="Composted"
              value={metrics.initiativesComposted}
              subtitle={`${formatPercent(compRate)} compost rate`}
              icon={Recycle}
              color="#8E8E93"
            />
          </div>

          {/* Stage distribution chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {stageData.every((d) => d.count === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No initiatives yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={stageData}
                    margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'hsl(var(--foreground))',
                      }}
                      formatter={(value: number | undefined) => [value ?? 0, 'Initiatives']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stageData.map((entry) => (
                        <Cell key={entry.stage} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* OKR summary + Strategic priorities side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* OKR Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="size-4 text-muted-foreground" />
                  OKR Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.totalObjectives === 0 ? (
                  <p className="text-sm text-muted-foreground">No objectives defined</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Objectives</span>
                      <span className="font-semibold">{metrics.totalObjectives}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Achieved</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {metrics.objectivesAchieved}
                        <span className="text-muted-foreground font-normal ml-1">
                          ({metrics.totalObjectives > 0
                            ? Math.round((metrics.objectivesAchieved / metrics.totalObjectives) * 100)
                            : 0}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Key Results</span>
                      <span className="font-semibold">{metrics.keyResultsTotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">KRs Achieved</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {metrics.keyResultsAchieved}
                        {metrics.keyResultsTotal > 0 && (
                          <span className="text-muted-foreground font-normal ml-1">
                            ({Math.round((metrics.keyResultsAchieved / metrics.keyResultsTotal) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avg KR Progress</span>
                      <span className="font-semibold">{Math.round(metrics.averageKRProgress)}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min(100, metrics.averageKRProgress)}%` }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Strategic priorities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  Strategic Priorities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.priorityDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No priorities defined</p>
                ) : (
                  <>
                    {metrics.priorityDistribution.map((p) => {
                      const pct = metrics.totalInitiatives > 0
                        ? Math.round((p.cardCount / metrics.totalInitiatives) * 100)
                        : 0;
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="size-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: p.colorHex }}
                              />
                              <span className="truncate text-foreground">{p.name}</span>
                            </div>
                            <span className="text-muted-foreground shrink-0 ml-2">
                              {p.cardCount}
                              <span className="text-xs ml-1">({pct}%)</span>
                            </span>
                          </div>
                          <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: p.colorHex }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                      <span>Untagged</span>
                      <span>{metrics.cardsWithoutPriority}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="size-4 text-muted-foreground" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No achievements yet</p>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-0">
                  {achievements.slice(0, 10).map((a) => (
                    <li key={a.id} className="pl-5 pb-4 last:pb-0">
                      {/* dot */}
                      <span className="absolute -left-[5px] mt-1.5 flex size-2.5 rounded-full bg-border" />

                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">
                          {ACHIEVEMENT_TYPE_ICONS[a.type]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ACHIEVEMENT_TYPE_LABEL[a.type]}
                            {' · '}
                            {a.date.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
