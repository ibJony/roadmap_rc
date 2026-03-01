'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Trash2, Link2, X, AlertCircle } from 'lucide-react';
import type { Card, CardStage, KeyResult, StrategicPriority, CardKeyResultLink, CardPriorityLink } from '@/lib/types';
import { CARD_STAGES, stageDisplayName, validateCard } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/theme';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { useOKRStore } from '@/lib/stores/okr-store';
import { DatabaseService } from '@/lib/db/database';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CardEditorProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function CardEditor({ card, isOpen, onClose }: CardEditorProps) {
  const { saveCard, deleteCard, selectedProject } = useRoadmapStore();
  const { objectives } = useOKRStore();

  const [draft, setDraft] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Linking state
  const [linkedKRLinks, setLinkedKRLinks] = useState<CardKeyResultLink[]>([]);
  const [linkedPriorityLinks, setLinkedPriorityLinks] = useState<CardPriorityLink[]>([]);
  const [priorities, setPriorities] = useState<StrategicPriority[]>([]);

  // Load links when card changes
  useEffect(() => {
    if (!card) {
      setDraft(null);
      setLinkedKRLinks([]);
      setLinkedPriorityLinks([]);
      setError(null);
      return;
    }
    setDraft({ ...card });
    setError(null);

    if (card.id) {
      DatabaseService.getCardKeyResultLinks(card.id).then(setLinkedKRLinks).catch(() => {});
      DatabaseService.getCardPriorityLinks(card.id).then(setLinkedPriorityLinks).catch(() => {});
    } else {
      setLinkedKRLinks([]);
      setLinkedPriorityLinks([]);
    }
  }, [card]);

  // Load priorities when project changes
  useEffect(() => {
    if (selectedProject?.id) {
      DatabaseService.getPriorities(selectedProject.id).then(setPriorities).catch(() => {});
    }
  }, [selectedProject?.id]);

  const update = useCallback(<K extends keyof Card>(key: K, value: Card[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setError(null);
  }, []);

  const handleSave = async () => {
    if (!draft) return;
    const validationError = validateCard(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSaving(true);
    try {
      await saveCard(draft);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft?.id) return;
    setIsDeleting(true);
    try {
      await deleteCard(draft.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStageChange = (stage: CardStage) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            stage,
            // Clear stage-specific fields that don't apply to new stage
            ideaDescription: stage === 'ideas' ? prev.ideaDescription : undefined,
            ideaContext: stage === 'ideas' ? prev.ideaContext : undefined,
            compostReason: stage === 'compost' ? prev.compostReason : undefined,
            lessonsLearned: stage === 'compost' ? prev.lessonsLearned : undefined,
            possibleSolutions: stage === 'prototyping' ? prev.possibleSolutions : undefined,
            solutionRequirements: stage === 'production' ? prev.solutionRequirements : undefined,
          }
        : prev
    );
    setError(null);
  };

  // Flatten all key results with their objective title for display
  const allKeyResults: (KeyResult & { objectiveTitle: string })[] = objectives.flatMap((obj) =>
    obj.keyResults.map((kr) => ({ ...kr, objectiveTitle: obj.title }))
  );

  const linkedKRIds = new Set(linkedKRLinks.map((l) => l.keyResultId));

  const handleToggleKR = async (kr: KeyResult & { objectiveTitle: string }) => {
    if (!draft?.id) return;
    if (linkedKRIds.has(kr.id!)) {
      await DatabaseService.unlinkCardFromKeyResult(draft.id, kr.id!);
      setLinkedKRLinks((prev) => prev.filter((l) => l.keyResultId !== kr.id));
    } else {
      await DatabaseService.linkCardToKeyResult({
        cardId: draft.id,
        keyResultId: kr.id!,
        contributionWeight: 1.0,
      });
      setLinkedKRLinks((prev) => [
        ...prev,
        { cardId: draft.id!, keyResultId: kr.id!, contributionWeight: 1.0 },
      ]);
    }
  };

  // Priority linking
  const linkedPriorityIds = new Set(linkedPriorityLinks.map((l) => l.priorityId));

  const handleTogglePriority = async (priority: StrategicPriority) => {
    if (!draft?.id) return;
    if (linkedPriorityIds.has(priority.id!)) {
      await DatabaseService.unlinkCardFromPriority(draft.id, priority.id!);
      setLinkedPriorityLinks((prev) => prev.filter((l) => l.priorityId !== priority.id));
    } else {
      await DatabaseService.linkCardToPriority(draft.id, priority.id!);
      setLinkedPriorityLinks((prev) => [...prev, { cardId: draft.id!, priorityId: priority.id! }]);
    }
  };

  if (!draft) return null;

  const stageColor = STAGE_COLORS[draft.stage];
  const isExistingCard = Boolean(draft.id);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="inline-block w-1 h-5 rounded-full flex-shrink-0"
                style={{ backgroundColor: stageColor }}
              />
              <SheetTitle className="text-base font-semibold truncate">
                {isExistingCard ? 'Edit Card' : 'New Card'}
              </SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-md flex-shrink-0"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-4 flex flex-col gap-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Stage selector */}
            <Field label="Stage" required>
              <Select
                value={draft.stage}
                onValueChange={(v) => handleStageChange(v as CardStage)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block size-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: STAGE_COLORS[s] }}
                        />
                        {stageDisplayName(s)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Title — always shown */}
            <Field label="Title" required>
              <Input
                placeholder="Card title..."
                value={draft.title}
                onChange={(e) => update('title', e.target.value)}
                className="text-sm"
                autoFocus
              />
            </Field>

            {/* Ideas-specific fields */}
            {draft.stage === 'ideas' && (
              <>
                <Field label="Idea Description">
                  <Textarea
                    placeholder="Describe the idea..."
                    value={draft.ideaDescription ?? ''}
                    onChange={(e) => update('ideaDescription', e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                  />
                </Field>
                <Field label="Context">
                  <Textarea
                    placeholder="What is the context or inspiration?"
                    value={draft.ideaContext ?? ''}
                    onChange={(e) => update('ideaContext', e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </Field>
              </>
            )}

            {/* Exploration fields */}
            {draft.stage === 'exploration' && (
              <>
                <Field label="Problem Definition" required>
                  <Textarea
                    placeholder="What problem are you solving?"
                    value={draft.problemDefinition ?? ''}
                    onChange={(e) => update('problemDefinition', e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                  />
                </Field>
                <Field label="Value Explanation">
                  <Textarea
                    placeholder="What value does solving this provide?"
                    value={draft.valueExplanation ?? ''}
                    onChange={(e) => update('valueExplanation', e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </Field>
              </>
            )}

            {/* Prototyping fields */}
            {draft.stage === 'prototyping' && (
              <>
                <Field label="Problem Definition" required>
                  <Textarea
                    placeholder="What problem are you solving?"
                    value={draft.problemDefinition ?? ''}
                    onChange={(e) => update('problemDefinition', e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                  />
                </Field>
                <Field label="Value Explanation">
                  <Textarea
                    placeholder="What value does solving this provide?"
                    value={draft.valueExplanation ?? ''}
                    onChange={(e) => update('valueExplanation', e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </Field>
                <Field label="Success Metrics" required>
                  <Textarea
                    placeholder="How will you measure success?"
                    value={draft.successMetrics ?? ''}
                    onChange={(e) => update('successMetrics', e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </Field>
                <Field label="Possible Solutions">
                  <Textarea
                    placeholder="What solutions are you exploring?"
                    value={draft.possibleSolutions ?? ''}
                    onChange={(e) => update('possibleSolutions', e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </Field>
              </>
            )}

            {/* Production fields */}
            {draft.stage === 'production' && (
              <>
                <Field label="Problem Definition" required>
                  <Textarea
                    placeholder="What problem are you solving?"
                    value={draft.problemDefinition ?? ''}
                    onChange={(e) => update('problemDefinition', e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                  />
                </Field>
                <Field label="Value Explanation">
                  <Textarea
                    placeholder="What value does solving this provide?"
                    value={draft.valueExplanation ?? ''}
                    onChange={(e) => update('valueExplanation', e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </Field>
                <Field label="Success Metrics" required>
                  <Textarea
                    placeholder="How will you measure success?"
                    value={draft.successMetrics ?? ''}
                    onChange={(e) => update('successMetrics', e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </Field>
                <Field label="Solution Requirements" required>
                  <Textarea
                    placeholder="What must the solution include?"
                    value={draft.solutionRequirements ?? ''}
                    onChange={(e) => update('solutionRequirements', e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </Field>
              </>
            )}

            {/* Compost fields */}
            {draft.stage === 'compost' && (
              <>
                <Field label="Compost Reason" required>
                  <Textarea
                    placeholder="Why is this being composted?"
                    value={draft.compostReason ?? ''}
                    onChange={(e) => update('compostReason', e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                  />
                </Field>
                <Field label="Lessons Learned">
                  <Textarea
                    placeholder="What did you learn from this initiative?"
                    value={draft.lessonsLearned ?? ''}
                    onChange={(e) => update('lessonsLearned', e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </Field>
              </>
            )}

            {/* OKR linking — only available after card is saved (has an id) */}
            {isExistingCard && allKeyResults.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Link2 className="size-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Key Results
                  </span>
                  {linkedKRLinks.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {linkedKRLinks.length}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                  {allKeyResults.map((kr) => {
                    const isLinked = linkedKRIds.has(kr.id!);
                    return (
                      <button
                        key={kr.id}
                        onClick={() => handleToggleKR(kr)}
                        className={[
                          'flex items-center gap-2 px-3 py-2 text-left transition-colors duration-100',
                          'border-b border-zinc-100 dark:border-zinc-800 last:border-b-0',
                          isLinked
                            ? 'bg-blue-50 dark:bg-blue-950/30'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'size-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors',
                            isLinked
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-zinc-300 dark:border-zinc-600',
                          ].join(' ')}
                        >
                          {isLinked && (
                            <svg
                              viewBox="0 0 12 12"
                              className="size-2.5 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                            {kr.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                            {kr.objectiveTitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Priority linking — only available after card is saved */}
            {isExistingCard && priorities.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-3 rounded-full bg-zinc-400 dark:bg-zinc-500 inline-block flex-shrink-0"
                  />
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Strategic Priorities
                  </span>
                  {linkedPriorityLinks.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {linkedPriorityLinks.length}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                  {priorities
                    .filter((p) => p.isActive)
                    .map((priority) => {
                      const isLinked = linkedPriorityIds.has(priority.id!);
                      return (
                        <button
                          key={priority.id}
                          onClick={() => handleTogglePriority(priority)}
                          className={[
                            'flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100',
                            'border-b border-zinc-100 dark:border-zinc-800 last:border-b-0',
                            isLinked
                              ? 'bg-zinc-50 dark:bg-zinc-800/50'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30',
                          ].join(' ')}
                        >
                          <span
                            className="size-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-zinc-900 transition-opacity"
                            style={{
                              backgroundColor: priority.colorHex,
                              opacity: isLinked ? 1 : 0.3,
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={[
                                'text-xs font-medium truncate',
                                isLinked
                                  ? 'text-zinc-800 dark:text-zinc-200'
                                  : 'text-zinc-500 dark:text-zinc-500',
                              ].join(' ')}
                            >
                              {priority.name}
                            </p>
                            {priority.description && (
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-600 truncate">
                                {priority.description}
                              </p>
                            )}
                          </div>
                          {isLinked && (
                            <svg
                              viewBox="0 0 12 12"
                              className="size-3 flex-shrink-0"
                              fill="none"
                              stroke={priority.colorHex}
                              strokeWidth="2.5"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Note for new cards: linking available after save */}
            {!isExistingCard && (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-1">
                OKR and priority linking available after saving the card.
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-zinc-200 dark:border-zinc-700 flex-shrink-0">
          {isExistingCard ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              <Trash2 className="size-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              style={{
                backgroundColor: stageColor,
                borderColor: stageColor,
                color: 'white',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              {isSaving ? 'Saving...' : isExistingCard ? 'Save Changes' : 'Create Card'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
