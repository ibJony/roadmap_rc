'use client';

import React, { useState } from 'react';
import { Plus, FolderOpen, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { PROJECT_COLORS } from '@/lib/types';

// ── Create project dialog ────────────────────────────────────────────────────

function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { createProject } = useRoadmapStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colorHex, setColorHex] = useState(PROJECT_COLORS[0].hex);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await createProject({ name: name.trim(), description: description.trim() || undefined, colorHex, isArchived: false });
    setSaving(false);
    setName('');
    setDescription('');
    setColorHex(PROJECT_COLORS[0].hex);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ps-name">Name</Label>
            <Input
              id="ps-name"
              placeholder="My Roadmap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ps-desc">Description</Label>
            <Textarea
              id="ps-desc"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  onClick={() => setColorHex(c.hex)}
                  className={cn(
                    'size-7 rounded-full transition-all border-2',
                    colorHex === c.hex
                      ? 'border-foreground scale-110 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ProjectSelector() {
  const { projects, selectedProject, selectProject } = useRoadmapStore();
  const [showCreate, setShowCreate] = useState(false);

  const activeProjects = projects.filter((p) => !p.isArchived);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 max-w-52 h-8 px-2"
          >
            {/* Color dot */}
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedProject?.colorHex ?? '#6B4C9A' }}
            />
            <span className="truncate text-sm font-medium text-foreground">
              {selectedProject?.name ?? 'Select project'}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground ml-auto" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          {activeProjects.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              No projects yet
            </div>
          ) : (
            activeProjects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => selectProject(project)}
                className={cn(
                  'flex items-center gap-2.5 cursor-pointer',
                  selectedProject?.id === project.id && 'bg-accent'
                )}
              >
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: project.colorHex }}
                />
                <span className="truncate">{project.name}</span>
                {selectedProject?.id === project.id && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2.5 cursor-pointer text-muted-foreground"
          >
            <Plus className="size-3.5" />
            Create Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectDialog open={showCreate} onOpenChange={setShowCreate} />
    </>
  );
}
