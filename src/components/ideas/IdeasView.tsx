'use client';

import React, { useState } from 'react';
import { Plus, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { cardPreview } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/theme';
import { CardEditor } from '@/components/roadmap/CardEditor';
import type { Card } from '@/lib/types';

// ----------------------------------------------------------------
// Single idea row
// ----------------------------------------------------------------
function IdeaRow({
  card,
  onEdit,
  onMoveToExploration,
}: {
  card: Card;
  onEdit: (card: Card) => void;
  onMoveToExploration: (cardId: number) => void;
}) {
  const preview = cardPreview(card);

  return (
    <div
      className="group flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:bg-accent/40 cursor-pointer"
      onClick={() => onEdit(card)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Title + preview */}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {card.title}
          </span>
          {preview && (
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {preview}
            </span>
          )}
        </div>

        {/* Move action — visible on hover */}
        <Button
          variant="outline"
          size="xs"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            if (card.id !== undefined) onMoveToExploration(card.id);
          }}
          title="Move to Exploration"
        >
          <ArrowRight className="size-3" />
          Exploration
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div
        className="flex size-14 items-center justify-center rounded-full"
        style={{ backgroundColor: `${STAGE_COLORS.ideas}1F` }}
      >
        <Lightbulb className="size-7" style={{ color: STAGE_COLORS.ideas }} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">No ideas yet</p>
        <p className="text-xs text-muted-foreground">
          Add your first idea to start building your backlog.
        </p>
      </div>
      <Button size="sm" onClick={onAdd}>
        <Plus className="size-3.5" />
        Add Idea
      </Button>
    </div>
  );
}

// ----------------------------------------------------------------
// IdeasView
// ----------------------------------------------------------------
export function IdeasView() {
  const cards = useRoadmapStore((s) => s.cards);
  const selectedProject = useRoadmapStore((s) => s.selectedProject);
  const moveCard = useRoadmapStore((s) => s.moveCard);

  // Editor state — managed locally so we can open for new cards too
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const ideas = cards
    .filter((c) => c.stage === 'ideas')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Open editor with a blank ideas card
  const handleAdd = () => {
    setEditingCard({
      stage: 'ideas',
      title: '',
      projectId: selectedProject?.id,
      sortOrder: 0,
    });
    setEditorOpen(true);
  };

  // Open editor for an existing card
  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingCard(null);
  };

  const handleMoveToExploration = (cardId: number) =>
    moveCard(cardId, 'exploration');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb
            className="size-5 shrink-0"
            style={{ color: STAGE_COLORS.ideas }}
          />
          <h2 className="text-lg font-semibold text-foreground">
            Ideas Backlog
          </h2>
          {ideas.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {ideas.length}
            </span>
          )}
        </div>

        <Button size="sm" onClick={handleAdd}>
          <Plus className="size-3.5" />
          Add Idea
        </Button>
      </div>

      {/* List / Empty state */}
      {ideas.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <div className="flex flex-col gap-2">
          {ideas.map((card) => (
            <IdeaRow
              key={card.id}
              card={card}
              onEdit={handleEdit}
              onMoveToExploration={handleMoveToExploration}
            />
          ))}
        </div>
      )}

      {/* Card editor sheet */}
      <CardEditor
        card={editingCard}
        isOpen={editorOpen}
        onClose={handleCloseEditor}
      />
    </div>
  );
}
