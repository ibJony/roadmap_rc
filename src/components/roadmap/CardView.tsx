'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Link2 } from 'lucide-react';
import type { Card } from '@/lib/types';
import { cardPreview } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface CardViewProps {
  card: Card;
  onClick: (card: Card) => void;
  linkedKRCount?: number;
  linkedPriorityColors?: string[];
}

export function CardView({ card, onClick, linkedKRCount = 0, linkedPriorityColors = [] }: CardViewProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id ?? `new-${card.title}`,
    data: { card },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const preview = cardPreview(card);
  const hasOKRLink = linkedKRCount > 0;
  const hasPriorityLink = linkedPriorityColors.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group relative bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700',
        'shadow-sm hover:shadow-md transition-shadow duration-150 cursor-pointer select-none',
        isDragging ? 'ring-2 ring-blue-400' : '',
      ].join(' ')}
      onClick={() => onClick(card)}
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        className={[
          'absolute left-1 top-1/2 -translate-y-1/2',
          'p-1 rounded text-zinc-300 dark:text-zinc-600',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-100',
          'hover:text-zinc-500 dark:hover:text-zinc-400 cursor-grab active:cursor-grabbing',
        ].join(' ')}
        aria-label="Drag card"
      >
        <GripVertical className="size-3.5" />
      </button>

      <div className="px-3 py-3 pl-6">
        {/* Title */}
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
          {card.title || <span className="italic text-zinc-400">Untitled</span>}
        </p>

        {/* Preview text */}
        {preview && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {preview}
          </p>
        )}

        {/* Badges row */}
        {(hasOKRLink || hasPriorityLink) && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {hasOKRLink && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40"
              >
                <Link2 className="size-2.5" />
                {linkedKRCount} KR{linkedKRCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {hasPriorityLink && (
              <div className="flex items-center gap-0.5">
                {linkedPriorityColors.map((color, i) => (
                  <span
                    key={i}
                    className="size-2.5 rounded-full ring-1 ring-white dark:ring-zinc-800 inline-block"
                    style={{ backgroundColor: color }}
                    title="Priority"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
