'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Card, CardStage } from '@/lib/types';
import { stageDisplayName } from '@/lib/types';
import { STAGE_COLORS, STAGE_BG_COLORS } from '@/lib/theme';
import { CardView } from './CardView';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StageColumnProps {
  stage: CardStage;
  cards: Card[];
  onAddCard: (stage: CardStage) => void;
  onEditCard: (card: Card) => void;
  linkedKRCounts?: Record<number, number>;
  linkedPriorityColors?: Record<number, string[]>;
}

export function StageColumn({
  stage,
  cards,
  onAddCard,
  onEditCard,
  linkedKRCounts = {},
  linkedPriorityColors = {},
}: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const stageColor = STAGE_COLORS[stage];
  const stageBg = STAGE_BG_COLORS[stage];
  const sortableIds = cards.map((c) => c.id ?? `new-${c.title}`);

  return (
    <div className="flex flex-col min-h-0 flex-1 min-w-0">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b-0"
        style={{ backgroundColor: stageBg }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Stage color bar */}
          <span
            className="inline-block w-1 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: stageColor }}
          />
          <span
            className="text-sm font-semibold truncate"
            style={{ color: stageColor }}
          >
            {stageDisplayName(stage)}
          </span>
          {/* Card count badge */}
          <span
            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: stageColor }}
          >
            {cards.length}
          </span>
        </div>

        {/* Add card button */}
        <Button
          variant="ghost"
          size="icon"
          className="size-6 rounded-md hover:bg-white/60 dark:hover:bg-zinc-800/60 flex-shrink-0"
          onClick={() => onAddCard(stage)}
          aria-label={`Add card to ${stageDisplayName(stage)}`}
        >
          <Plus className="size-3.5" style={{ color: stageColor }} />
        </Button>
      </div>

      {/* Drop zone / card list */}
      <div
        ref={setNodeRef}
        className={[
          'flex-1 min-h-[120px] rounded-b-xl border',
          'transition-colors duration-150',
          isOver
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
            : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700',
        ].join(' ')}
        style={{
          borderTopColor: stageColor,
          borderTopWidth: 2,
        }}
      >
        <ScrollArea className="h-full max-h-[calc(100vh-220px)]">
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2 p-2">
              {cards.map((card) => (
                <CardView
                  key={card.id ?? `draft-${card.title}`}
                  card={card}
                  onClick={onEditCard}
                  linkedKRCount={card.id ? (linkedKRCounts[card.id] ?? 0) : 0}
                  linkedPriorityColors={card.id ? (linkedPriorityColors[card.id] ?? []) : []}
                />
              ))}

              {cards.length === 0 && (
                <button
                  onClick={() => onAddCard(stage)}
                  className={[
                    'w-full py-6 flex flex-col items-center justify-center gap-1.5',
                    'border-2 border-dashed rounded-lg',
                    'text-zinc-400 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400',
                    'transition-colors duration-150 group',
                  ].join(' ')}
                  style={{
                    borderColor: isOver ? stageColor : undefined,
                  }}
                >
                  <Plus
                    className="size-4 transition-colors"
                    style={{ color: isOver ? stageColor : undefined }}
                  />
                  <span className="text-xs">Add card</span>
                </button>
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  );
}
