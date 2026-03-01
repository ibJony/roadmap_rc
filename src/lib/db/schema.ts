import Dexie, { type Table } from 'dexie';

export interface DBCard {
  id?: number;
  projectId?: number;
  stage: string;
  title: string;
  ideaDescription?: string;
  ideaContext?: string;
  problemDefinition?: string;
  valueExplanation?: string;
  successMetrics?: string;
  possibleSolutions?: string;
  solutionRequirements?: string;
  compostReason?: string;
  lessonsLearned?: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
}

export interface DBProject {
  id?: number;
  name: string;
  description?: string;
  colorHex: string;
  isArchived: number; // 0 or 1
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string;
  teamId?: string;
  syncUUID?: string;
}

export interface DBObjective {
  id?: number;
  projectId: number;
  title: string;
  description?: string;
  timeFrame?: string;
  startDate?: Date;
  endDate?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBKeyResult {
  id?: number;
  objectiveId: number;
  title: string;
  targetValue: number;
  currentValue: number;
  unitOfMeasure?: string;
  measurementType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBCardKeyResult {
  id?: number;
  cardId: number;
  keyResultId: number;
  contributionWeight: number;
}

export interface DBStageCriteria {
  id?: number;
  projectId?: number;
  fromStage: string;
  toStage: string;
  criteriaTitle: string;
  criteriaDescription?: string;
  isRequired: number; // 0 or 1
  sortOrder: number;
}

export interface DBStageHistory {
  id?: number;
  cardId: number;
  fromStage?: string;
  toStage: string;
  changedAt: Date;
  changedBy?: string;
  notes?: string;
  criteriaMet?: string; // JSON array
}

export interface DBKRProgressHistory {
  id?: number;
  keyResultId: number;
  value: number;
  recordedAt: Date;
  notes?: string;
}

export interface DBStrategicPriority {
  id?: number;
  projectId: number;
  name: string;
  description?: string;
  colorHex: string;
  sortOrder: number;
  isActive: number; // 0 or 1
  createdAt: Date;
  updatedAt: Date;
}

export interface DBCardPriority {
  id?: number;
  cardId: number;
  priorityId: number;
}

export interface DBLocalOrganization {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  logoURL?: string;
  anthropicKey?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBLocalTeam {
  id?: string;
  organizationId: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBLocalOrgMember {
  id?: string;
  organizationId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  email?: string;
}

export interface DBLocalTeamMember {
  id?: string;
  teamId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  email?: string;
}

export class RoadmapDB extends Dexie {
  projects!: Table<DBProject, number>;
  cards!: Table<DBCard, number>;
  objectives!: Table<DBObjective, number>;
  keyResults!: Table<DBKeyResult, number>;
  cardKeyResults!: Table<DBCardKeyResult, number>;
  stageCriteria!: Table<DBStageCriteria, number>;
  stageHistory!: Table<DBStageHistory, number>;
  krProgressHistory!: Table<DBKRProgressHistory, number>;
  strategicPriorities!: Table<DBStrategicPriority, number>;
  cardPriorities!: Table<DBCardPriority, number>;
  localOrganizations!: Table<DBLocalOrganization, string>;
  localTeams!: Table<DBLocalTeam, string>;
  localOrgMembers!: Table<DBLocalOrgMember, string>;
  localTeamMembers!: Table<DBLocalTeamMember, string>;

  constructor() {
    super('RoadmapDB');

    // Version 7 - Full schema matching native app
    this.version(7).stores({
      projects: '++id, name, organizationId, teamId',
      cards: '++id, projectId, stage, sortOrder, createdAt',
      objectives: '++id, projectId, status',
      keyResults: '++id, objectiveId, status',
      cardKeyResults: '++id, cardId, keyResultId, [cardId+keyResultId]',
      stageCriteria: '++id, projectId, fromStage, toStage',
      stageHistory: '++id, cardId, changedAt',
      krProgressHistory: '++id, keyResultId, recordedAt',
      strategicPriorities: '++id, projectId, sortOrder',
      cardPriorities: '++id, cardId, priorityId, [cardId+priorityId]',
      localOrganizations: 'id, name',
      localTeams: 'id, organizationId',
      localOrgMembers: 'id, organizationId, userId',
      localTeamMembers: 'id, teamId, userId',
    });

    // Version 8 - Add anthropicKey to organizations (non-indexed field, schema unchanged)
    this.version(8).stores({});
  }
}

export const db = new RoadmapDB();
