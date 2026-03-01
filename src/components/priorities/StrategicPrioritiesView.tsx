'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Flag, Edit, Trash2, Sparkles, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { useToastStore } from '@/lib/stores/toast-store';
import { DatabaseService } from '@/lib/db/database';
import { PRIORITY_COLORS, suggestedPriorities } from '@/lib/types';
import type { StrategicPriority } from '@/lib/types';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface PriorityFormState {
  name: string;
  description: string;
  colorHex: string;
  isActive: boolean;
}

// Declared at module scope so it can be referenced by both PriorityForm and
// StrategicPrioritiesView without hoisting issues.
const DEFAULT_FORM: PriorityFormState = {
  name: '',
  description: '',
  colorHex: PRIORITY_COLORS[0],
  isActive: true,
};

// ----------------------------------------------------------------
// Color picker
// ----------------------------------------------------------------
function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRIORITY_COLORS.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => onChange(hex)}
          className="size-6 rounded-full border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          style={{
            backgroundColor: hex,
            borderColor: value === hex ? 'white' : hex,
            boxShadow: value === hex ? `0 0 0 2px ${hex}` : 'none',
          }}
          title={hex}
          aria-label={`Select color ${hex}`}
        />
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// Priority form dialog
// ----------------------------------------------------------------
function PriorityForm({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: PriorityFormState;
  onClose: () => void;
  onSave: (form: PriorityFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<PriorityFormState>(initial);
  const [saving, setSaving] = useState(false);

  // Reset whenever the dialog opens with new initial data
  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const patch = (update: Partial<PriorityFormState>) =>
    setForm((prev) => ({ ...prev, ...update }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial.name ? 'Edit Priority' : 'New Priority'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Name<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. User Growth"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="What does this priority represent?"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <Label>Color</Label>
            <ColorPicker
              value={form.colorHex}
              onChange={(hex) => patch({ colorHex: hex })}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Active</span>
              <span className="text-xs text-muted-foreground">
                Active priorities appear in card tagging
              </span>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => patch({ isActive: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="size-3.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            <Save className="size-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// Priority row
// ----------------------------------------------------------------
function PriorityRow({
  priority,
  cardCount,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  priority: StrategicPriority;
  cardCount: number;
  onEdit: (priority: StrategicPriority) => void;
  onDelete: (id: number) => void;
  onToggleActive: (priority: StrategicPriority) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (priority.id !== undefined) onDelete(priority.id);
  };

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:bg-accent/30">
      {/* Colored dot */}
      <span
        className="mt-0.5 size-3 shrink-0 rounded-full"
        style={{ backgroundColor: priority.colorHex }}
      />

      {/* Name + description */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {priority.name}
          </span>

          {/* Card count badge */}
          {cardCount > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {cardCount} {cardCount === 1 ? 'card' : 'cards'}
            </Badge>
          )}

          {/* Inactive badge */}
          {!priority.isActive && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
              Inactive
            </Badge>
          )}
        </div>

        {priority.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {priority.description}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Active toggle */}
        <Switch
          checked={priority.isActive}
          onCheckedChange={() => onToggleActive(priority)}
          size="sm"
        />

        {/* Edit */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onEdit(priority)}
          title="Edit priority"
        >
          <Edit className="size-3.5" />
        </Button>

        {/* Delete */}
        <Button
          variant={confirmDelete ? 'destructive' : 'ghost'}
          size={confirmDelete ? 'xs' : 'icon-xs'}
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
          title="Delete priority"
        >
          <Trash2 className="size-3.5" />
          {confirmDelete && 'Confirm'}
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------
function EmptyState({
  onAdd,
  onAddSuggested,
}: {
  onAdd: () => void;
  onAddSuggested: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Flag className="size-7 text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">
          No priorities yet
        </p>
        <p className="text-xs text-muted-foreground">
          Define strategic priorities to tag and organise your initiatives.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onAdd}>
          <Plus className="size-3.5" />
          Add Priority
        </Button>
        <Button variant="outline" size="sm" onClick={onAddSuggested}>
          <Sparkles className="size-3.5" />
          Add Suggested
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// StrategicPrioritiesView
// ----------------------------------------------------------------
export function StrategicPrioritiesView() {
  const selectedProject = useRoadmapStore((s) => s.selectedProject);
  const showSuccess = useToastStore((s) => s.showSuccess);
  const showError = useToastStore((s) => s.showError);

  const [priorities, setPriorities] = useState<StrategicPriority[]>([]);
  const [cardCounts, setCardCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<StrategicPriority | null>(null);

  // ---- Load priorities ----
  const loadPriorities = useCallback(async () => {
    if (!selectedProject?.id) return;
    setLoading(true);
    try {
      const loaded = await DatabaseService.getPriorities(selectedProject.id);
      setPriorities(loaded);

      // Fetch card counts in parallel
      const counts: Record<number, number> = {};
      await Promise.all(
        loaded.map(async (p) => {
          if (p.id !== undefined) {
            counts[p.id] = await DatabaseService.getPriorityCardCount(p.id);
          }
        })
      );
      setCardCounts(counts);
    } catch {
      showError('Failed to load priorities');
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id, showError]);

  useEffect(() => {
    loadPriorities();
  }, [loadPriorities]);

  // ---- Open form for new priority ----
  const handleOpenNew = () => {
    setEditingPriority(null);
    setDialogOpen(true);
  };

  // ---- Open form to edit existing priority ----
  const handleOpenEdit = (priority: StrategicPriority) => {
    setEditingPriority(priority);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPriority(null);
  };

  // ---- Save (create or update) ----
  const handleSave = async (form: PriorityFormState) => {
    if (!selectedProject?.id) return;

    try {
      if (editingPriority?.id !== undefined) {
        const updated: StrategicPriority = {
          ...editingPriority,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          colorHex: form.colorHex,
          isActive: form.isActive,
        };
        await DatabaseService.updatePriority(updated);
        showSuccess('Priority updated');
      } else {
        await DatabaseService.createPriority({
          projectId: selectedProject.id,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          colorHex: form.colorHex,
          sortOrder: priorities.length,
          isActive: form.isActive,
        });
        showSuccess('Priority created');
      }
      await loadPriorities();
    } catch {
      showError('Failed to save priority');
      throw new Error('save failed');
    }
  };

  // ---- Delete ----
  const handleDelete = async (id: number) => {
    try {
      await DatabaseService.deletePriority(id);
      showSuccess('Priority deleted');
      await loadPriorities();
    } catch {
      showError('Failed to delete priority');
    }
  };

  // ---- Toggle active ----
  const handleToggleActive = async (priority: StrategicPriority) => {
    if (priority.id === undefined) return;
    try {
      await DatabaseService.updatePriority({
        ...priority,
        isActive: !priority.isActive,
      });
      await loadPriorities();
    } catch {
      showError('Failed to update priority');
    }
  };

  // ---- Add suggested priorities ----
  const handleAddSuggested = async () => {
    if (!selectedProject?.id) return;
    try {
      const suggestions = suggestedPriorities(selectedProject.id);
      await Promise.all(suggestions.map((s) => DatabaseService.createPriority(s)));
      showSuccess('Suggested priorities added');
      await loadPriorities();
    } catch {
      showError('Failed to add suggested priorities');
    }
  };

  // ---- Build initial form state for dialog ----
  const initialForm: PriorityFormState = editingPriority
    ? {
        name: editingPriority.name,
        description: editingPriority.description ?? '',
        colorHex: editingPriority.colorHex,
        isActive: editingPriority.isActive,
      }
    : DEFAULT_FORM;

  const sorted = [...priorities].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flag className="size-5 shrink-0 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Strategic Priorities
          </h2>
          {sorted.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {sorted.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {sorted.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleAddSuggested}>
              <Sparkles className="size-3.5" />
              Add Suggested
            </Button>
          )}
          <Button size="sm" onClick={handleOpenNew}>
            <Plus className="size-3.5" />
            Add Priority
          </Button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground -mt-1">
        Define the strategic themes that guide which initiatives to prioritise.
        Tag cards with priorities to see how work aligns with your strategy.
      </p>

      {/* Content */}
      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState onAdd={handleOpenNew} onAddSuggested={handleAddSuggested} />
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((priority) => (
            <PriorityRow
              key={priority.id}
              priority={priority}
              cardCount={priority.id !== undefined ? (cardCounts[priority.id] ?? 0) : 0}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Priority form dialog */}
      <PriorityForm
        open={dialogOpen}
        initial={initialForm}
        onClose={handleCloseDialog}
        onSave={handleSave}
      />
    </div>
  );
}
