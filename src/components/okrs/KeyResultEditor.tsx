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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { KeyResult, MeasurementType } from '@/lib/types';
import { MEASUREMENT_TYPES } from '@/lib/types';
import { ArrowUp, ArrowDown, Equal } from 'lucide-react';

interface KeyResultEditorProps {
  keyResult: KeyResult | null;
  objectiveId: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<KeyResult, 'id'>) => void;
}

const MEASUREMENT_ICONS: Record<MeasurementType, React.ReactNode> = {
  increase: <ArrowUp className="size-3.5" />,
  decrease: <ArrowDown className="size-3.5" />,
  maintain: <Equal className="size-3.5" />,
};

const DEFAULT_MEASUREMENT: MeasurementType = 'increase';

export function KeyResultEditor({
  keyResult,
  objectiveId,
  isOpen,
  onClose,
  onSave,
}: KeyResultEditorProps) {
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('');
  const [measurementType, setMeasurementType] = useState<MeasurementType>(DEFAULT_MEASUREMENT);

  useEffect(() => {
    if (isOpen) {
      if (keyResult) {
        setTitle(keyResult.title);
        setTargetValue(String(keyResult.targetValue));
        setCurrentValue(String(keyResult.currentValue));
        setUnitOfMeasure(keyResult.unitOfMeasure ?? '');
        setMeasurementType(keyResult.measurementType);
      } else {
        setTitle('');
        setTargetValue('');
        setCurrentValue('0');
        setUnitOfMeasure('');
        setMeasurementType(DEFAULT_MEASUREMENT);
      }
    }
  }, [isOpen, keyResult]);

  const parsedTarget = parseFloat(targetValue);
  const parsedCurrent = parseFloat(currentValue);
  const canSave =
    title.trim().length > 0 &&
    !Number.isNaN(parsedTarget) &&
    !Number.isNaN(parsedCurrent);

  function handleSave() {
    if (!canSave) return;
    onSave({
      objectiveId,
      title: title.trim(),
      targetValue: parsedTarget,
      currentValue: parsedCurrent,
      unitOfMeasure: unitOfMeasure.trim() || undefined,
      measurementType,
      status: keyResult?.status ?? 'on_track',
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{keyResult ? 'Edit Key Result' : 'Add Key Result'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input
              placeholder="e.g. Monthly active users"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Measurement type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Measurement Type</label>
            <Select
              value={measurementType}
              onValueChange={(v) => setMeasurementType(v as MeasurementType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {MEASUREMENT_TYPES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      {MEASUREMENT_ICONS[value]}
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target / Current values + unit in a row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Target</label>
              <Input
                type="number"
                placeholder="100"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Current</label>
              <Input
                type="number"
                placeholder="0"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Unit</label>
              <Input
                placeholder="%"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Unit examples: <span className="font-mono">%</span>,{' '}
            <span className="font-mono">users</span>,{' '}
            <span className="font-mono">$</span>,{' '}
            <span className="font-mono">NPS</span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {keyResult ? 'Save Changes' : 'Add Key Result'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
