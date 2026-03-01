// ============================================================
// RMLAB Product Roadmap - Type System
// Exact parity with native macOS SwiftUI app
// ============================================================

// MARK: - Card Stage Enum
export type CardStage = 'ideas' | 'exploration' | 'prototyping' | 'production' | 'compost';

export const CARD_STAGES: CardStage[] = ['ideas', 'exploration', 'prototyping', 'production', 'compost'];
export const ROADMAP_STAGES: CardStage[] = ['exploration', 'prototyping', 'production'];

export function stageDisplayName(stage: CardStage): string {
  const names: Record<CardStage, string> = {
    ideas: 'Ideas',
    exploration: 'Exploration',
    prototyping: 'Prototyping',
    production: 'Production',
    compost: 'Compost',
  };
  return names[stage];
}

export function isRoadmapStage(stage: CardStage): boolean {
  return stage === 'exploration' || stage === 'prototyping' || stage === 'production';
}

// MARK: - Card
export interface Card {
  id?: number;
  projectId?: number;
  stage: CardStage;
  title: string;
  // Ideas-specific
  ideaDescription?: string;
  ideaContext?: string;
  // Initiative fields (Exploration, Prototyping, Production)
  problemDefinition?: string;
  valueExplanation?: string;
  // Prototyping and Production
  successMetrics?: string;
  // Prototyping only
  possibleSolutions?: string;
  // Production only
  solutionRequirements?: string;
  // Compost-specific
  compostReason?: string;
  lessonsLearned?: string;
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  // Ordering
  sortOrder: number;
}

export function cardPreview(card: Card): string {
  switch (card.stage) {
    case 'ideas':
      return card.ideaDescription ?? '';
    case 'exploration':
    case 'prototyping':
    case 'production':
      return card.problemDefinition ?? card.valueExplanation ?? '';
    case 'compost':
      return card.compostReason ?? card.lessonsLearned ?? '';
  }
}

export function validateCard(card: Card): string | null {
  if (!card.title.trim()) return 'Title is required';
  switch (card.stage) {
    case 'ideas':
      return null;
    case 'exploration':
      if (!card.problemDefinition?.trim()) return 'Problem Definition is required for Exploration';
      return null;
    case 'prototyping':
      if (!card.problemDefinition?.trim()) return 'Problem Definition is required for Prototyping';
      if (!card.successMetrics?.trim()) return 'Success Metrics are required for Prototyping';
      return null;
    case 'production':
      if (!card.problemDefinition?.trim()) return 'Problem Definition is required for Production';
      if (!card.successMetrics?.trim()) return 'Success Metrics are required for Production';
      if (!card.solutionRequirements?.trim()) return 'Solution Requirements are required for Production';
      return null;
    case 'compost':
      if (!card.compostReason?.trim()) return 'Compost Reason is required';
      return null;
  }
}

// MARK: - Project
export interface Project {
  id?: number;
  name: string;
  description?: string;
  colorHex: string;
  createdAt?: Date;
  updatedAt?: Date;
  isArchived: boolean;
  // Cloud sync
  organizationId?: string;
  teamId?: string;
  syncUUID?: string;
}

export const PROJECT_COLORS: { name: string; hex: string }[] = [
  { name: 'Plum', hex: '#6B4C9A' },
  { name: 'Ocean', hex: '#2E7D9B' },
  { name: 'Forest', hex: '#4A7C59' },
  { name: 'Sunset', hex: '#D4763B' },
  { name: 'Berry', hex: '#9B4C6B' },
  { name: 'Slate', hex: '#5A6B7A' },
  { name: 'Coral', hex: '#E07A5F' },
  { name: 'Teal', hex: '#3D9B8F' },
];

export const DEFAULT_PROJECT: Omit<Project, 'id'> = {
  name: 'My Roadmap',
  description: 'Default project',
  colorHex: '#6B4C9A',
  isArchived: false,
};

// MARK: - OKR Status Enums
export type ObjectiveStatus = 'active' | 'achieved' | 'missed' | 'cancelled';

export const OBJECTIVE_STATUSES: { value: ObjectiveStatus; label: string; icon: string }[] = [
  { value: 'active', label: 'Active', icon: 'Target' },
  { value: 'achieved', label: 'Achieved', icon: 'CheckCircle2' },
  { value: 'missed', label: 'Missed', icon: 'XCircle' },
  { value: 'cancelled', label: 'Cancelled', icon: 'MinusCircle' },
];

export type MeasurementType = 'increase' | 'decrease' | 'maintain';

export const MEASUREMENT_TYPES: { value: MeasurementType; label: string; icon: string }[] = [
  { value: 'increase', label: 'Increase to', icon: 'ArrowUp' },
  { value: 'decrease', label: 'Decrease to', icon: 'ArrowDown' },
  { value: 'maintain', label: 'Maintain at', icon: 'Equal' },
];

export type KeyResultStatus = 'on_track' | 'at_risk' | 'behind' | 'achieved';

export const KEY_RESULT_STATUSES: { value: KeyResultStatus; label: string; icon: string }[] = [
  { value: 'on_track', label: 'On Track', icon: 'CheckCircle' },
  { value: 'at_risk', label: 'At Risk', icon: 'AlertTriangle' },
  { value: 'behind', label: 'Behind', icon: 'XCircle' },
  { value: 'achieved', label: 'Achieved', icon: 'Star' },
];

// MARK: - Objective
export interface Objective {
  id?: number;
  projectId: number;
  title: string;
  description?: string;
  timeFrame?: string;
  startDate?: Date;
  endDate?: Date;
  status: ObjectiveStatus;
  createdAt?: Date;
  updatedAt?: Date;
  // Loaded separately
  keyResults: KeyResult[];
}

export const COMMON_TIME_FRAMES: string[] = [
  'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025',
  'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026',
  'H1 2025', 'H2 2025',
  'H1 2026', 'H2 2026',
  'FY 2025', 'FY 2026',
];

export function objectiveOverallProgress(obj: Objective): number {
  if (!obj.keyResults.length) return 0;
  const total = obj.keyResults.reduce((sum, kr) => sum + keyResultProgress(kr), 0);
  return total / obj.keyResults.length;
}

export function objectiveIsOnTrack(obj: Objective): boolean {
  return obj.keyResults.every(kr => kr.status === 'on_track' || kr.status === 'achieved');
}

// MARK: - Key Result
export interface KeyResult {
  id?: number;
  objectiveId: number;
  title: string;
  targetValue: number;
  currentValue: number;
  unitOfMeasure?: string;
  measurementType: MeasurementType;
  status: KeyResultStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export function keyResultProgress(kr: KeyResult): number {
  if (kr.targetValue === 0) return 0;
  switch (kr.measurementType) {
    case 'increase':
      return Math.min(100, (kr.currentValue / kr.targetValue) * 100);
    case 'decrease':
      if (kr.currentValue <= kr.targetValue) return 100;
      const startValue = kr.currentValue * 2 - kr.targetValue;
      return Math.max(0, (1 - (kr.currentValue - kr.targetValue) / (startValue - kr.targetValue)) * 100);
    case 'maintain':
      const variance = Math.abs(kr.currentValue - kr.targetValue) / kr.targetValue;
      return Math.max(0, (1 - variance) * 100);
  }
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value === Math.floor(value)) return value.toFixed(0);
  return value.toFixed(1);
}

export function formatKeyResultValue(value: number, unit?: string): string {
  if (unit) {
    if (unit === '%') return `${Math.round(value)}%`;
    if (unit === '$') return `$${formatNumber(value)}`;
    return `${formatNumber(value)} ${unit}`;
  }
  return formatNumber(value);
}

export function autoKeyResultStatus(progress: number): KeyResultStatus {
  if (progress >= 100) return 'achieved';
  if (progress >= 70) return 'on_track';
  if (progress >= 40) return 'at_risk';
  return 'behind';
}

// MARK: - Card-KeyResult Link
export interface CardKeyResultLink {
  cardId: number;
  keyResultId: number;
  contributionWeight: number;
}

// MARK: - Strategic Priority
export interface StrategicPriority {
  id?: number;
  projectId: number;
  name: string;
  description?: string;
  colorHex: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PRIORITY_COLORS: string[] = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#0EA5E9', '#6B7280',
];

export function suggestedPriorities(projectId: number): Omit<StrategicPriority, 'id'>[] {
  return [
    { projectId, name: 'User Growth', description: 'Initiatives focused on acquiring and retaining users', colorHex: '#22C55E', sortOrder: 0, isActive: true },
    { projectId, name: 'Revenue', description: 'Initiatives that drive revenue and monetization', colorHex: '#EAB308', sortOrder: 1, isActive: true },
    { projectId, name: 'Platform Quality', description: 'Performance, reliability, and technical debt', colorHex: '#0EA5E9', sortOrder: 2, isActive: true },
    { projectId, name: 'Innovation', description: 'New capabilities and experimental features', colorHex: '#8B5CF6', sortOrder: 3, isActive: true },
  ];
}

// MARK: - Card-Priority Link
export interface CardPriorityLink {
  cardId: number;
  priorityId: number;
}

// MARK: - Stage Criteria
export interface StageCriteria {
  id?: number;
  projectId?: number;
  fromStage: CardStage;
  toStage: CardStage;
  criteriaTitle: string;
  criteriaDescription?: string;
  isRequired: boolean;
  sortOrder: number;
}

export const DEFAULT_STAGE_CRITERIA: Omit<StageCriteria, 'id'>[] = [
  // Ideas -> Exploration
  { fromStage: 'ideas', toStage: 'exploration', criteriaTitle: 'Problem statement drafted', criteriaDescription: 'A clear description of the user problem being addressed', isRequired: true, sortOrder: 0 },
  { fromStage: 'ideas', toStage: 'exploration', criteriaTitle: 'Initial user research planned', criteriaDescription: 'Plan for validating the problem with users', isRequired: false, sortOrder: 1 },
  // Exploration -> Prototyping
  { fromStage: 'exploration', toStage: 'prototyping', criteriaTitle: 'Problem validated with users', criteriaDescription: 'User interviews or surveys confirming the problem exists', isRequired: true, sortOrder: 0 },
  { fromStage: 'exploration', toStage: 'prototyping', criteriaTitle: 'Value proposition defined', criteriaDescription: 'Clear articulation of the value this will provide to users', isRequired: true, sortOrder: 1 },
  { fromStage: 'exploration', toStage: 'prototyping', criteriaTitle: 'Success metrics identified', criteriaDescription: 'Measurable criteria for success', isRequired: true, sortOrder: 2 },
  { fromStage: 'exploration', toStage: 'prototyping', criteriaTitle: 'Stakeholder buy-in obtained', criteriaDescription: 'Key stakeholders have approved moving forward', isRequired: false, sortOrder: 3 },
  // Prototyping -> Production
  { fromStage: 'prototyping', toStage: 'production', criteriaTitle: 'Prototype tested with users', criteriaDescription: 'User testing completed with positive feedback', isRequired: true, sortOrder: 0 },
  { fromStage: 'prototyping', toStage: 'production', criteriaTitle: 'Solution requirements documented', criteriaDescription: 'Clear specification of what needs to be built', isRequired: true, sortOrder: 1 },
  { fromStage: 'prototyping', toStage: 'production', criteriaTitle: 'Success metrics baselined', criteriaDescription: 'Current baseline measured for success metrics', isRequired: false, sortOrder: 2 },
  { fromStage: 'prototyping', toStage: 'production', criteriaTitle: 'Technical feasibility confirmed', criteriaDescription: 'Engineering has validated the approach is buildable', isRequired: true, sortOrder: 3 },
  { fromStage: 'prototyping', toStage: 'production', criteriaTitle: 'Resource allocation confirmed', criteriaDescription: 'Team capacity and timeline agreed upon', isRequired: false, sortOrder: 4 },
];

export function getCriteriaForTransition(from: CardStage, to: CardStage): Omit<StageCriteria, 'id'>[] {
  return DEFAULT_STAGE_CRITERIA.filter(c => c.fromStage === from && c.toStage === to).sort((a, b) => a.sortOrder - b.sortOrder);
}

// MARK: - Organization
export type OrgRole = 'owner' | 'admin' | 'member';

export const ORG_ROLE_PERMISSIONS: Record<OrgRole, { canManageOrg: boolean; canCreateTeams: boolean; canInviteToOrg: boolean; canDeleteOrg: boolean; canRemoveMembers: boolean }> = {
  owner: { canManageOrg: true, canCreateTeams: true, canInviteToOrg: true, canDeleteOrg: true, canRemoveMembers: true },
  admin: { canManageOrg: true, canCreateTeams: true, canInviteToOrg: true, canDeleteOrg: false, canRemoveMembers: true },
  member: { canManageOrg: false, canCreateTeams: false, canInviteToOrg: false, canDeleteOrg: false, canRemoveMembers: false },
};

export interface Organization {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  logoURL?: string;
  anthropicKey?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  teams?: Team[];
  members?: OrganizationMember[];
}

export function generateSlug(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
  return slug || crypto.randomUUID().slice(0, 8);
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  joinedAt: Date;
  email?: string;
}

// MARK: - Team
export type TeamRole = 'product_owner' | 'product_manager' | 'contributor';

export const TEAM_ROLE_DISPLAY: Record<TeamRole, { name: string; short: string }> = {
  product_owner: { name: 'Product Owner', short: 'PO' },
  product_manager: { name: 'Product Manager', short: 'PM' },
  contributor: { name: 'Contributor', short: 'Contrib' },
};

export const TEAM_ROLE_PERMISSIONS: Record<TeamRole, { canManageTeam: boolean; canInviteMembers: boolean; canManageProjects: boolean; canEditCards: boolean }> = {
  product_owner: { canManageTeam: true, canInviteMembers: true, canManageProjects: true, canEditCards: true },
  product_manager: { canManageTeam: false, canInviteMembers: true, canManageProjects: true, canEditCards: true },
  contributor: { canManageTeam: false, canInviteMembers: false, canManageProjects: false, canEditCards: true },
};

export interface Team {
  id?: string;
  organizationId: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  email?: string;
}

// MARK: - Invitation
export interface Invitation {
  id: string;
  organizationId: string;
  teamId?: string;
  email: string;
  orgRole: OrgRole;
  teamRole?: TeamRole;
  invitedBy?: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export function isInvitationExpired(inv: Invitation): boolean {
  return new Date() > inv.expiresAt;
}

export function isInvitationPending(inv: Invitation): boolean {
  return !inv.acceptedAt && !isInvitationExpired(inv);
}

export function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// MARK: - Dashboard Types
export type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'allTime';

export const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'allTime', label: 'All Time' },
];

export function getDateRange(period: TimePeriod): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  switch (period) {
    case 'week': start.setDate(now.getDate() - 7); break;
    case 'month': start.setMonth(now.getMonth() - 1); break;
    case 'quarter': start.setMonth(now.getMonth() - 3); break;
    case 'year': start.setFullYear(now.getFullYear() - 1); break;
    case 'allTime': start.setFullYear(now.getFullYear() - 10); break;
  }
  return { start, end: now };
}

export interface DashboardMetrics {
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  totalInitiatives: number;
  initiativesShipped: number;
  initiativesInProgress: number;
  initiativesComposted: number;
  ideasCount: number;
  explorationCount: number;
  prototypingCount: number;
  productionCount: number;
  compostCount: number;
  stageTransitions: StageTransitionData[];
  averageTimeInStage: Record<string, number>;
  totalObjectives: number;
  objectivesAchieved: number;
  keyResultsTotal: number;
  keyResultsAchieved: number;
  averageKRProgress: number;
  cardsCreatedThisPeriod: number;
  cardsMovedThisPeriod: number;
  priorityDistribution: PriorityMetric[];
  totalPriorities: number;
  cardsWithPriority: number;
  cardsWithoutPriority: number;
}

export function shippingRate(m: DashboardMetrics): number {
  return m.totalInitiatives > 0 ? (m.initiativesShipped / m.totalInitiatives) * 100 : 0;
}

export function compostRate(m: DashboardMetrics): number {
  return m.totalInitiatives > 0 ? (m.initiativesComposted / m.totalInitiatives) * 100 : 0;
}

export interface StageTransitionData {
  id: string;
  fromStage?: CardStage;
  toStage: CardStage;
  count: number;
  averageDays: number;
}

export interface StageChangeRecord {
  id?: number;
  cardId: number;
  fromStage?: CardStage;
  toStage: CardStage;
  changedAt: Date;
  changedBy?: string;
  notes?: string;
  criteriaMet?: number[];
}

export interface KRProgressHistory {
  id?: number;
  keyResultId: number;
  value: number;
  recordedAt: Date;
  notes?: string;
}

export type AchievementType = 'shipped' | 'keyResultAchieved' | 'objectiveCompleted';

export interface Achievement {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  type: AchievementType;
}

export interface PriorityMetric {
  id: number;
  name: string;
  colorHex: string;
  cardCount: number;
  inProgressCount: number;
  shippedCount: number;
  compostedCount: number;
}

// MARK: - Toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

// MARK: - App Error
export type AppErrorType = 'database' | 'validation' | 'import' | 'export' | 'network' | 'auth' | 'unknown';

export interface AppError {
  type: AppErrorType;
  message: string;
}
