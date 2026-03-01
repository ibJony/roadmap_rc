import { DatabaseService } from '../db/database';
import type { DashboardMetrics, TimePeriod, Achievement, PriorityMetric } from '../types';
import { getDateRange, keyResultProgress } from '../types';

export async function calculateDashboardMetrics(projectId: number, period: TimePeriod): Promise<DashboardMetrics> {
  const { start, end } = getDateRange(period);
  const cards = await DatabaseService.getCards(projectId);
  const objectives = await DatabaseService.getObjectives(projectId);
  const priorities = await DatabaseService.getPriorities(projectId);

  const ideasCount = cards.filter(c => c.stage === 'ideas').length;
  const explorationCount = cards.filter(c => c.stage === 'exploration').length;
  const prototypingCount = cards.filter(c => c.stage === 'prototyping').length;
  const productionCount = cards.filter(c => c.stage === 'production').length;
  const compostCount = cards.filter(c => c.stage === 'compost').length;

  const totalInitiatives = cards.length;
  const initiativesShipped = productionCount;
  const initiativesInProgress = explorationCount + prototypingCount;
  const initiativesComposted = compostCount;

  const totalObjectives = objectives.length;
  const objectivesAchieved = objectives.filter(o => o.status === 'achieved').length;
  const allKRs = objectives.flatMap(o => o.keyResults);
  const keyResultsTotal = allKRs.length;
  const keyResultsAchieved = allKRs.filter(k => k.status === 'achieved').length;
  const averageKRProgress = allKRs.length > 0
    ? allKRs.reduce((sum, k) => sum + keyResultProgress(k), 0) / allKRs.length
    : 0;

  const createdInPeriod = cards.filter(c => c.createdAt && c.createdAt >= start && c.createdAt <= end);

  const priorityDistribution: PriorityMetric[] = await Promise.all(
    priorities.map(async (p) => {
      const count = await DatabaseService.getPriorityCardCount(p.id!);
      return {
        id: p.id!, name: p.name, colorHex: p.colorHex,
        cardCount: count, inProgressCount: 0, shippedCount: 0, compostedCount: 0,
      };
    })
  );

  const allLinks = (await Promise.all(cards.map(c => DatabaseService.getCardPriorityLinks(c.id!)))).flat();
  const cardsWithPrioritySet = new Set(allLinks.map(l => l.cardId));

  return {
    period, startDate: start, endDate: end,
    totalInitiatives, initiativesShipped, initiativesInProgress, initiativesComposted,
    ideasCount, explorationCount, prototypingCount, productionCount, compostCount,
    stageTransitions: [], averageTimeInStage: {},
    totalObjectives, objectivesAchieved, keyResultsTotal, keyResultsAchieved, averageKRProgress,
    cardsCreatedThisPeriod: createdInPeriod.length, cardsMovedThisPeriod: 0,
    priorityDistribution,
    totalPriorities: priorities.length,
    cardsWithPriority: cardsWithPrioritySet.size,
    cardsWithoutPriority: cards.length - cardsWithPrioritySet.size,
  };
}

export async function getRecentAchievements(projectId: number): Promise<Achievement[]> {
  const cards = await DatabaseService.getCards(projectId);
  const objectives = await DatabaseService.getObjectives(projectId);
  const achievements: Achievement[] = [];

  const shippedCards = cards.filter(c => c.stage === 'production').slice(0, 5);
  for (const card of shippedCards) {
    achievements.push({
      id: `shipped-${card.id}`, title: card.title,
      subtitle: 'Shipped to Production', date: card.updatedAt ?? new Date(),
      type: 'shipped',
    });
  }

  const achievedObjectives = objectives.filter(o => o.status === 'achieved').slice(0, 5);
  for (const obj of achievedObjectives) {
    achievements.push({
      id: `obj-${obj.id}`, title: obj.title,
      subtitle: 'Objective completed', date: obj.updatedAt ?? new Date(),
      type: 'objectiveCompleted',
    });
  }

  return achievements.sort((a, b) => b.date.getTime() - a.date.getTime());
}
