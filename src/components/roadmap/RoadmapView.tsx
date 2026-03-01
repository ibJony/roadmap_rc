'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent, UniqueIdentifier } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { Card, CardStage } from '@/lib/types';
import { ROADMAP_STAGES } from '@/lib/types';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { useOKRStore } from '@/lib/stores/okr-store';
import { DatabaseService } from '@/lib/db/database';
import { StageColumn } from './StageColumn';
import { CardEditor } from './CardEditor';
import { CardView } from './CardView';

// Lookup: cardId -> number of linked key results
type KRCountMap = Record<number, number>;
// Lookup: cardId -> array of priority color hex strings
type PriorityColorMap = Record<number, string[]>;

export function RoadmapView() {
  const {
    cards,
    selectedCard,
    isEditing,
    selectedProject,
    loadProjects,
    addCard,
    editCard,
    closeEditor,
    moveCard,
    reorderCard,
    cardsForStage,
  } = useRoadmapStore();

  const { objectives, loadObjectives } = useOKRStore();

  // Local optimistic card order while dragging
  const [localCards, setLocalCards] = useState<Card[]>([]);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Linking metadata for card badges
  const [krCounts, setKrCounts] = useState<KRCountMap>({});
  const [priorityColors, setPriorityColors] = useState<PriorityColorMap>({});

  // Sync local cards from store
  useEffect(() => {
    setLocalCards(cards);
  }, [cards]);

  // Load data on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProject?.id) {
      loadObjectives(selectedProject.id);
    }
  }, [selectedProject?.id, loadObjectives]);

  // Load badge metadata whenever cards or project change
  useEffect(() => {
    async function loadBadgeData() {
      if (!selectedProject?.id) return;

      const cardIds = cards.filter((c) => c.id).map((c) => c.id!);
      if (cardIds.length === 0) return;

      // Load KR link counts
      const krCountEntries = await Promise.all(
        cardIds.map(async (id) => {
          const links = await DatabaseService.getCardKeyResultLinks(id);
          return [id, links.length] as [number, number];
        })
      );
      setKrCounts(Object.fromEntries(krCountEntries));

      // Load priority color lists
      const allPriorities = await DatabaseService.getPriorities(selectedProject.id!);
      const priorityById = Object.fromEntries(allPriorities.map((p) => [p.id!, p]));

      const priorityColorEntries = await Promise.all(
        cardIds.map(async (id) => {
          const links = await DatabaseService.getCardPriorityLinks(id);
          const colors = links
            .map((l) => priorityById[l.priorityId]?.colorHex)
            .filter(Boolean) as string[];
          return [id, colors] as [number, string[]];
        })
      );
      setPriorityColors(Object.fromEntries(priorityColorEntries));
    }

    loadBadgeData();
  }, [cards, selectedProject?.id]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const card = localCards.find(
        (c) => (c.id ?? `new-${c.title}`) === active.id
      );
      setActiveCard(card ?? null);
    },
    [localCards]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const draggedCard = localCards.find(
        (c) => (c.id ?? `new-${c.title}`) === active.id
      );
      if (!draggedCard) return;

      // Check if dragging over a column (stage) drop zone vs another card
      const overIsStage = ROADMAP_STAGES.includes(over.id as CardStage);

      if (overIsStage) {
        const targetStage = over.id as CardStage;
        if (draggedCard.stage !== targetStage) {
          // Optimistically move card to new stage column
          setLocalCards((prev) =>
            prev.map((c) =>
              (c.id ?? `new-${c.title}`) === active.id
                ? { ...c, stage: targetStage }
                : c
            )
          );
        }
        return;
      }

      // Over another card — find that card's stage and reorder
      const overCard = localCards.find(
        (c) => (c.id ?? `new-${c.title}`) === over.id
      );
      if (!overCard) return;

      if (draggedCard.stage !== overCard.stage) {
        // Move to new stage, place at position of overCard
        setLocalCards((prev) => {
          const updated = prev.map((c) =>
            (c.id ?? `new-${c.title}`) === active.id
              ? { ...c, stage: overCard.stage }
              : c
          );
          // Reorder within the new stage
          const stageCards = updated.filter((c) => c.stage === overCard.stage);
          const activeIdx = stageCards.findIndex(
            (c) => (c.id ?? `new-${c.title}`) === active.id
          );
          const overIdx = stageCards.findIndex(
            (c) => (c.id ?? `new-${c.title}`) === over.id
          );
          if (activeIdx !== -1 && overIdx !== -1) {
            const reordered = arrayMove(stageCards, activeIdx, overIdx);
            const otherCards = updated.filter((c) => c.stage !== overCard.stage);
            return [...otherCards, ...reordered];
          }
          return updated;
        });
      } else {
        // Same stage reorder
        setLocalCards((prev) => {
          const stageCards = prev.filter((c) => c.stage === draggedCard.stage);
          const activeIdx = stageCards.findIndex(
            (c) => (c.id ?? `new-${c.title}`) === active.id
          );
          const overIdx = stageCards.findIndex(
            (c) => (c.id ?? `new-${c.title}`) === over.id
          );
          if (activeIdx === -1 || overIdx === -1 || activeIdx === overIdx) return prev;
          const reordered = arrayMove(stageCards, activeIdx, overIdx);
          const otherCards = prev.filter((c) => c.stage !== draggedCard.stage);
          return [...otherCards, ...reordered];
        });
      }
    },
    [localCards]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      if (!over) {
        // Dropped outside — reset to store state
        setLocalCards(cards);
        return;
      }

      const draggedCard = localCards.find(
        (c) => (c.id ?? `new-${c.title}`) === active.id
      );
      if (!draggedCard?.id) return;

      const originalCard = cards.find((c) => c.id === draggedCard.id);
      if (!originalCard) return;

      const targetStage = draggedCard.stage;

      // Persist stage change if needed
      if (originalCard.stage !== targetStage) {
        await moveCard(draggedCard.id, targetStage);
      }

      // Persist reorder within stage
      const stageCards = localCards
        .filter((c) => c.stage === targetStage)
        .sort((a, b) => {
          // Maintain the optimistic order we computed during drag
          return 0;
        });

      const newIdx = stageCards.findIndex((c) => c.id === draggedCard.id);
      if (newIdx !== -1) {
        await reorderCard(draggedCard.id, newIdx);
      }
    },
    [localCards, cards, moveCard, reorderCard]
  );

  const handleAddCard = useCallback(
    (stage: CardStage) => {
      addCard(stage);
    },
    [addCard]
  );

  const handleEditCard = useCallback(
    (card: Card) => {
      editCard(card);
    },
    [editCard]
  );

  // Derive per-stage card lists from local (optimistic) state, sorted by sortOrder
  const getStageCards = (stage: CardStage): Card[] =>
    localCards
      .filter((c) => c.stage === stage)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex flex-col h-full">
      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-x-auto">
          {ROADMAP_STAGES.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              cards={getStageCards(stage)}
              onAddCard={handleAddCard}
              onEditCard={handleEditCard}
              linkedKRCounts={krCounts}
              linkedPriorityColors={priorityColors}
            />
          ))}
        </div>

        {/* Drag overlay — ghost of the card being dragged */}
        <DragOverlay>
          {activeCard ? (
            <div className="rotate-1 scale-105 pointer-events-none">
              <CardView
                card={activeCard}
                onClick={() => {}}
                linkedKRCount={activeCard.id ? (krCounts[activeCard.id] ?? 0) : 0}
                linkedPriorityColors={activeCard.id ? (priorityColors[activeCard.id] ?? []) : []}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Card editor sheet */}
      <CardEditor
        card={selectedCard}
        isOpen={isEditing}
        onClose={closeEditor}
      />
    </div>
  );
}
