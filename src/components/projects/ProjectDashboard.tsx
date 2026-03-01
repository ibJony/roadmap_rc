'use client';

import React, { useState } from 'react';
import { Plus, Archive, Trash2, FolderOpen, MoreHorizontal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import type { Project } from '@/lib/types';
import { PROJECT_COLORS } from '@/lib/types';

// ── Project form ─────────────────────────────────────────────────────────────

interface ProjectFormValues {
  name: string;
  description: string;
  colorHex: string;
}

function ProjectFormFields({
  values,
  onChange,
}: {
  values: ProjectFormValues;
  onChange: (v: ProjectFormValues) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pd-name">Name</Label>
        <Input
          id="pd-name"
          placeholder="My Roadmap"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pd-desc">Description</Label>
        <Textarea
          id="pd-desc"
          placeholder="What is this project about?"
          value={values.description}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => onChange({ ...values, colorHex: c.hex })}
              className={cn(
                'size-7 rounded-full transition-all border-2',
                values.colorHex === c.hex
                  ? 'border-foreground scale-110 shadow-sm'
                  : 'border-transparent hover:scale-105'
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Create dialog ────────────────────────────────────────────────────────────

function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { createProject } = useRoadmapStore();
  const [values, setValues] = useState<ProjectFormValues>({
    name: '',
    description: '',
    colorHex: PROJECT_COLORS[0].hex,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) return;
    setSaving(true);
    await createProject({
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      colorHex: values.colorHex,
      isArchived: false,
    });
    setSaving(false);
    setValues({ name: '', description: '', colorHex: PROJECT_COLORS[0].hex });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="pt-2 space-y-4">
          <ProjectFormFields values={values} onChange={setValues} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!values.name.trim() || saving}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit dialog ──────────────────────────────────────────────────────────────

function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { updateProject } = useRoadmapStore();
  const [values, setValues] = useState<ProjectFormValues>({
    name: project.name,
    description: project.description ?? '',
    colorHex: project.colorHex,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) return;
    setSaving(true);
    await updateProject({
      ...project,
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      colorHex: values.colorHex,
    });
    setSaving(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="pt-2 space-y-4">
          <ProjectFormFields values={values} onChange={setValues} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!values.name.trim() || saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const { updateProject, deleteProject, selectProject } = useRoadmapStore();
  const [showEdit, setShowEdit] = useState(false);

  const colorEntry = PROJECT_COLORS.find((c) => c.hex === project.colorHex);

  async function handleArchive() {
    await updateProject({ ...project, isArchived: !project.isArchived });
  }

  async function handleDelete() {
    if (!project.id) return;
    await deleteProject(project.id);
  }

  return (
    <>
      <div
        className={cn(
          'group relative rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md',
          project.isArchived && 'opacity-60'
        )}
      >
        {/* Color band */}
        <div className="h-1.5 w-full" style={{ backgroundColor: project.colorHex }} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: project.colorHex }}
              />
              <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => selectProject(project)}>
                  Select
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="size-3.5 mr-2" />
                  {project.isArchived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {project.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {colorEntry && (
              <Badge variant="secondary" className="text-xs font-normal">
                {colorEntry.name}
              </Badge>
            )}
            {project.isArchived && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                <Archive className="size-2.5 mr-1" />
                Archived
              </Badge>
            )}
            {project.createdAt && (
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <EditProjectDialog project={project} open={showEdit} onOpenChange={setShowEdit} />
    </>
  );
}

// ── Create card ──────────────────────────────────────────────────────────────

function CreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group rounded-xl border-2 border-dashed border-border bg-transparent',
        'flex flex-col items-center justify-center gap-2 p-8',
        'transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer min-h-[160px]'
      )}
    >
      <div className="size-10 rounded-full border-2 border-dashed border-muted-foreground/40 group-hover:border-primary/50 flex items-center justify-center transition-colors">
        <Plus className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
        Create Project
      </span>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ProjectDashboard() {
  const { projects } = useRoadmapStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const active = projects.filter((p) => !p.isArchived);
  const archived = projects.filter((p) => p.isArchived);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="size-6 text-muted-foreground" />
              Projects
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {active.length} active project{active.length !== 1 ? 's' : ''}
              {archived.length > 0 && `, ${archived.length} archived`}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Active projects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          <CreateCard onClick={() => setShowCreate(true)} />
        </div>

        {/* Archived section */}
        {archived.length > 0 && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Archive className="size-4" />
              {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
            </button>
            {showArchived && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archived.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateProjectDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
