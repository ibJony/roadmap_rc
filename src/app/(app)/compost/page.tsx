'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { CardEditor } from '@/components/roadmap/CardEditor';
import { STAGE_COLORS } from '@/lib/theme';
import type { Card } from '@/lib/types';

// ----------------------------------------------------------------
// Single compost card row
// ----------------------------------------------------------------
function CompostRow({
  card,
  onEdit,
}: {
  card: Card;
  onEdit: (card: Card) => void;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-4 py-3.5 shadow-sm transition-colors hover:bg-accent/40 cursor-pointer"
      onClick={() => onEdit(card)}
    >
      <span className="text-sm font-medium text-foreground">{card.title}</span>

      {card.compostReason && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Reason
          </span>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {card.compostReason}
          </p>
        </div>
      )}

      {card.lessonsLearned && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Lessons Learned
          </span>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {card.lessonsLearned}
          </p>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Compost page
// ----------------------------------------------------------------
export default function CompostPage() {
  const cards = useRoadmapStore((s) => s.cards);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const composted = cards
    .filter((c) => c.stage === 'compost')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingCard(null);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trash2
          className="size-5 shrink-0"
          style={{ color: STAGE_COLORS.compost }}
        />
        <h2 className="text-lg font-semibold text-foreground">Compost</h2>
        {composted.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {composted.length}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground -mt-1">
        Ideas and initiatives that were discontinued. Use them as learning
        opportunities for future work.
      </p>

      {/* List / Empty state */}
      {composted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div
            className="flex size-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `${STAGE_COLORS.compost}1F` }}
          >
            <Trash2
              className="size-7"
              style={{ color: STAGE_COLORS.compost }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">
              Nothing composted yet
            </p>
            <p className="text-xs text-muted-foreground">
              Items moved to compost will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {composted.map((card) => (
            <CompostRow key={card.id} card={card} onEdit={handleEdit} />
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
