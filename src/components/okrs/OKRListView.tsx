'use client';

import React, { useEffect, useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  Star,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Equal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import type { Objective, KeyResult, KeyResultStatus } from '@/lib/types';
import {
  objectiveOverallProgress,
  keyResultProgress,
  formatKeyResultValue,
} from '@/lib/types';
import { KR_STATUS_COLORS } from '@/lib/theme';
import { useOKRStore } from '@/lib/stores/okr-store';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { ObjectiveEditor } from './ObjectiveEditor';
import { KeyResultEditor } from './KeyResultEditor';

// --- helpers ----------------------------------------------------------------

const KR_STATUS_ICONS: Record<KeyResultStatus, React.ReactNode> = {
  on_track: <CheckCircle className="size-3.5" />,
  at_risk: <AlertTriangle className="size-3.5" />,
  behind: <XCircle className="size-3.5" />,
  achieved: <Star className="size-3.5" />,
};

const KR_PROGRESS_BAR_COLORS: Record<KeyResultStatus, string> = {
  on_track: 'bg-green-500',
  at_risk: 'bg-yellow-500',
  behind: 'bg-red-500',
  achieved: 'bg-blue-500',
};

const OBJECTIVE_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  achieved: { label: 'Achieved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  missed: { label: 'Missed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const MEASUREMENT_ICONS: Record<string, React.ReactNode> = {
  increase: <ArrowUp className="size-3" />,
  decrease: <ArrowDown className="size-3" />,
  maintain: <Equal className="size-3" />,
};

// --- sub-components ---------------------------------------------------------

function KeyResultRow({
  kr,
  onEdit,
  onDelete,
}: {
  kr: KeyResult;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = keyResultProgress(kr);
  const statusMeta = OBJECTIVE_STATUS_LABELS[kr.status] ?? OBJECTIVE_STATUS_LABELS.active;
  const barColor = KR_PROGRESS_BAR_COLORS[kr.status];
  const krStatusClass = KR_STATUS_COLORS[kr.status] ?? '';

  return (
    <div className="flex flex-col gap-2 px-4 py-3 border-t border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-muted-foreground shrink-0">
            {MEASUREMENT_ICONS[kr.measurementType]}
          </span>
          <span className="text-sm font-medium truncate">{kr.title}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={`text-xs px-1.5 py-0 flex items-center gap-1 ${krStatusClass}`}>
            {KR_STATUS_ICONS[kr.status]}
            {kr.status === 'on_track'
              ? 'On Track'
              : kr.status === 'at_risk'
              ? 'At Risk'
              : kr.status === 'behind'
              ? 'Behind'
              : 'Achieved'}
          </Badge>
          <Button variant="ghost" size="sm" className="size-7 p-0" onClick={onEdit}>
            <Edit className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-5">
        {/* Progress bar */}
        <div className="relative flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Value label */}
        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
          {formatKeyResultValue(kr.currentValue, kr.unitOfMeasure)}
          {' / '}
          {formatKeyResultValue(kr.targetValue, kr.unitOfMeasure)}
          {' '}
          <span className="font-medium text-foreground">{Math.round(progress)}%</span>
        </span>
      </div>
    </div>
  );
}

function ObjectiveRow({
  objective,
  onEditObjective,
  onDeleteObjective,
  onAddKeyResult,
  onEditKeyResult,
  onDeleteKeyResult,
}: {
  objective: Objective;
  onEditObjective: () => void;
  onDeleteObjective: () => void;
  onAddKeyResult: () => void;
  onEditKeyResult: (kr: KeyResult) => void;
  onDeleteKeyResult: (kr: KeyResult) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const progress = objectiveOverallProgress(objective);
  const statusMeta = OBJECTIVE_STATUS_LABELS[objective.status] ?? OBJECTIVE_STATUS_LABELS.active;

  return (
    <Card className="overflow-hidden py-0 gap-0">
      {/* Objective header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          type="button"
          className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm leading-snug">{objective.title}</span>
            {objective.timeFrame && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {objective.timeFrame}
              </span>
            )}
            <Badge className={`text-xs px-1.5 py-0 ${statusMeta.className}`}>
              {statusMeta.label}
            </Badge>
          </div>

          {objective.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {objective.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <Progress
              value={progress}
              className="h-1.5 flex-1"
            />
            <span className="text-xs text-muted-foreground shrink-0 w-10 text-right">
              {Math.round(progress)}%
            </span>
          </div>

          {objective.keyResults.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {objective.keyResults.length}{' '}
              {objective.keyResults.length === 1 ? 'key result' : 'key results'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            onClick={onEditObjective}
          >
            <Edit className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0 text-destructive hover:text-destructive"
            onClick={onDeleteObjective}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded: key results */}
      {expanded && (
        <>
          {objective.keyResults.map((kr) => (
            <KeyResultRow
              key={kr.id}
              kr={kr}
              onEdit={() => onEditKeyResult(kr)}
              onDelete={() => onDeleteKeyResult(kr)}
            />
          ))}

          <div className="px-4 py-2.5 border-t border-border/60 bg-muted/10">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={onAddKeyResult}
            >
              <Plus className="size-3.5" />
              Add Key Result
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

// --- main component ---------------------------------------------------------

export function OKRListView() {
  const { objectives, isLoading, loadObjectives, createObjective, updateObjective, deleteObjective, createKeyResult, updateKeyResult, deleteKeyResult } =
    useOKRStore();
  const selectedProject = useRoadmapStore((s) => s.selectedProject);

  // Editor state
  const [objectiveEditorOpen, setObjectiveEditorOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);

  const [krEditorOpen, setKrEditorOpen] = useState(false);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  const [krObjectiveId, setKrObjectiveId] = useState<number>(0);

  useEffect(() => {
    if (selectedProject?.id) {
      loadObjectives(selectedProject.id);
    }
  }, [selectedProject?.id, loadObjectives]);

  // --- objective handlers ---
  function openAddObjective() {
    setEditingObjective(null);
    setObjectiveEditorOpen(true);
  }

  function openEditObjective(obj: Objective) {
    setEditingObjective(obj);
    setObjectiveEditorOpen(true);
  }

  async function handleSaveObjective(data: Omit<Objective, 'id' | 'keyResults'>) {
    if (editingObjective?.id) {
      await updateObjective({ ...editingObjective, ...data });
    } else {
      await createObjective(data);
    }
  }

  async function handleDeleteObjective(obj: Objective) {
    if (!obj.id) return;
    if (!window.confirm(`Delete objective "${obj.title}"? This will also remove all its key results.`)) return;
    await deleteObjective(obj.id);
  }

  // --- key result handlers ---
  function openAddKR(objectiveId: number) {
    setEditingKR(null);
    setKrObjectiveId(objectiveId);
    setKrEditorOpen(true);
  }

  function openEditKR(kr: KeyResult) {
    setEditingKR(kr);
    setKrObjectiveId(kr.objectiveId);
    setKrEditorOpen(true);
  }

  async function handleSaveKR(data: Omit<KeyResult, 'id'>) {
    if (editingKR?.id) {
      await updateKeyResult({ ...editingKR, ...data });
    } else {
      await createKeyResult(data);
    }
  }

  async function handleDeleteKR(kr: KeyResult) {
    if (!kr.id) return;
    if (!window.confirm(`Delete key result "${kr.title}"?`)) return;
    await deleteKeyResult(kr.id, kr.objectiveId);
  }

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
        <Target className="size-8 opacity-40" />
        <p className="text-sm">No project selected</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">OKRs</h1>
          {objectives.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({objectives.length} {objectives.length === 1 ? 'objective' : 'objectives'})
            </span>
          )}
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAddObjective}>
          <Plus className="size-4" />
          Add Objective
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <p className="text-sm">Loading…</p>
        </div>
      ) : objectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3 border border-dashed rounded-xl">
          <Target className="size-10 opacity-30" />
          <div className="text-center">
            <p className="font-medium text-sm">No objectives yet</p>
            <p className="text-xs mt-1">Add an objective to get started tracking progress.</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={openAddObjective}>
            <Plus className="size-4" />
            Add First Objective
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {objectives.map((obj) => (
            <ObjectiveRow
              key={obj.id}
              objective={obj}
              onEditObjective={() => openEditObjective(obj)}
              onDeleteObjective={() => handleDeleteObjective(obj)}
              onAddKeyResult={() => openAddKR(obj.id!)}
              onEditKeyResult={openEditKR}
              onDeleteKeyResult={handleDeleteKR}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ObjectiveEditor
        objective={editingObjective}
        isOpen={objectiveEditorOpen}
        onClose={() => setObjectiveEditorOpen(false)}
        onSave={handleSaveObjective}
        projectId={selectedProject.id!}
      />

      <KeyResultEditor
        keyResult={editingKR}
        objectiveId={krObjectiveId}
        isOpen={krEditorOpen}
        onClose={() => setKrEditorOpen(false)}
        onSave={handleSaveKR}
      />
    </div>
  );
}
