'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Objective, ObjectiveStatus } from '@/lib/types';
import { COMMON_TIME_FRAMES, OBJECTIVE_STATUSES } from '@/lib/types';

interface ObjectiveEditorProps {
  objective: Objective | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Objective, 'id' | 'keyResults'>) => void;
  projectId: number;
}

const DEFAULT_STATUS: ObjectiveStatus = 'active';

export function ObjectiveEditor({
  objective,
  isOpen,
  onClose,
  onSave,
  projectId,
}: ObjectiveEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeFrame, setTimeFrame] = useState<string>('');
  const [status, setStatus] = useState<ObjectiveStatus>(DEFAULT_STATUS);

  useEffect(() => {
    if (isOpen) {
      if (objective) {
        setTitle(objective.title);
        setDescription(objective.description ?? '');
        setTimeFrame(objective.timeFrame ?? '');
        setStatus(objective.status);
      } else {
        setTitle('');
        setDescription('');
        setTimeFrame('');
        setStatus(DEFAULT_STATUS);
      }
    }
  }, [isOpen, objective]);

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      projectId,
      title: trimmed,
      description: description.trim() || undefined,
      timeFrame: timeFrame || undefined,
      status,
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{objective ? 'Edit Objective' : 'Add Objective'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input
              placeholder="e.g. Grow user base by 50%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Description{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              placeholder="What does achieving this objective mean?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Time frame */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Time Frame</label>
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a time frame…" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIME_FRAMES.map((tf) => (
                  <SelectItem key={tf} value={tf}>
                    {tf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as ObjectiveStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status…" />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVE_STATUSES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {objective ? 'Save Changes' : 'Add Objective'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
