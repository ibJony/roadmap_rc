import { db } from './schema';
import type {
  Card, Project, Objective, KeyResult, CardKeyResultLink,
  StrategicPriority, CardPriorityLink, StageCriteria, StageChangeRecord,
  KRProgressHistory, Organization, Team, OrganizationMember, TeamMember,
  CardStage,
} from '../types';

// Helper: convert booleans for IndexedDB storage
const toBool = (v: number | boolean) => v === 1 || v === true;
const toInt = (v: boolean) => v ? 1 : 0;

// ============================================================
// Database Service - Full CRUD matching native app
// ============================================================
export const DatabaseService = {
  // ---- Projects ----
  async getAllProjects(): Promise<Project[]> {
    const rows = await db.projects.toArray();
    return rows.map(r => ({
      id: r.id, name: r.name, description: r.description,
      colorHex: r.colorHex, isArchived: toBool(r.isArchived),
      createdAt: r.createdAt, updatedAt: r.updatedAt,
      organizationId: r.organizationId, teamId: r.teamId, syncUUID: r.syncUUID,
    }));
  },

  async createProject(p: Omit<Project, 'id'>): Promise<number> {
    const now = new Date();
    return db.projects.add({
      name: p.name, description: p.description, colorHex: p.colorHex,
      isArchived: toInt(p.isArchived), createdAt: now, updatedAt: now,
      organizationId: p.organizationId, teamId: p.teamId, syncUUID: p.syncUUID,
    });
  },

  async updateProject(p: Project): Promise<void> {
    if (!p.id) return;
    await db.projects.update(p.id, {
      name: p.name, description: p.description, colorHex: p.colorHex,
      isArchived: toInt(p.isArchived), updatedAt: new Date(),
      organizationId: p.organizationId, teamId: p.teamId, syncUUID: p.syncUUID,
    });
  },

  async deleteProject(id: number): Promise<void> {
    await db.transaction('rw', [db.projects, db.cards, db.objectives, db.keyResults, db.cardKeyResults, db.strategicPriorities, db.cardPriorities, db.stageCriteria, db.stageHistory], async () => {
      // Cascade delete
      const cards = await db.cards.where('projectId').equals(id).toArray();
      const cardIds = cards.map(c => c.id!);
      await db.cardKeyResults.where('cardId').anyOf(cardIds).delete();
      await db.cardPriorities.where('cardId').anyOf(cardIds).delete();
      await db.stageHistory.where('cardId').anyOf(cardIds).delete();
      await db.cards.where('projectId').equals(id).delete();

      const objectives = await db.objectives.where('projectId').equals(id).toArray();
      const objIds = objectives.map(o => o.id!);
      const krs = await db.keyResults.where('objectiveId').anyOf(objIds).toArray();
      const krIds = krs.map(k => k.id!);
      await db.cardKeyResults.where('keyResultId').anyOf(krIds).delete();
      await db.krProgressHistory.where('keyResultId').anyOf(krIds).delete();
      await db.keyResults.where('objectiveId').anyOf(objIds).delete();
      await db.objectives.where('projectId').equals(id).delete();

      await db.strategicPriorities.where('projectId').equals(id).delete();
      await db.stageCriteria.where('projectId').equals(id).delete();
      await db.projects.delete(id);
    });
  },

  async ensureDefaultProject(): Promise<Project> {
    const projects = await this.getAllProjects();
    if (projects.length > 0) return projects[0];
    const id = await this.createProject({
      name: 'My Roadmap', description: 'Default project', colorHex: '#6B4C9A', isArchived: false,
    });
    return { id, name: 'My Roadmap', description: 'Default project', colorHex: '#6B4C9A', isArchived: false };
  },

  // ---- Cards ----
  async getCards(projectId: number): Promise<Card[]> {
    const rows = await db.cards.where('projectId').equals(projectId).toArray();
    return rows.map(r => ({
      id: r.id, projectId: r.projectId, stage: r.stage as CardStage, title: r.title,
      ideaDescription: r.ideaDescription, ideaContext: r.ideaContext,
      problemDefinition: r.problemDefinition, valueExplanation: r.valueExplanation,
      successMetrics: r.successMetrics, possibleSolutions: r.possibleSolutions,
      solutionRequirements: r.solutionRequirements, compostReason: r.compostReason,
      lessonsLearned: r.lessonsLearned, createdAt: r.createdAt, updatedAt: r.updatedAt,
      sortOrder: r.sortOrder,
    }));
  },

  async createCard(c: Omit<Card, 'id'>): Promise<number> {
    const now = new Date();
    return db.cards.add({
      projectId: c.projectId, stage: c.stage, title: c.title,
      ideaDescription: c.ideaDescription, ideaContext: c.ideaContext,
      problemDefinition: c.problemDefinition, valueExplanation: c.valueExplanation,
      successMetrics: c.successMetrics, possibleSolutions: c.possibleSolutions,
      solutionRequirements: c.solutionRequirements, compostReason: c.compostReason,
      lessonsLearned: c.lessonsLearned, createdAt: now, updatedAt: now,
      sortOrder: c.sortOrder,
    });
  },

  async updateCard(c: Card): Promise<void> {
    if (!c.id) return;
    await db.cards.update(c.id, {
      projectId: c.projectId, stage: c.stage, title: c.title,
      ideaDescription: c.ideaDescription, ideaContext: c.ideaContext,
      problemDefinition: c.problemDefinition, valueExplanation: c.valueExplanation,
      successMetrics: c.successMetrics, possibleSolutions: c.possibleSolutions,
      solutionRequirements: c.solutionRequirements, compostReason: c.compostReason,
      lessonsLearned: c.lessonsLearned, updatedAt: new Date(), sortOrder: c.sortOrder,
    });
  },

  async deleteCard(id: number): Promise<void> {
    await db.transaction('rw', [db.cards, db.cardKeyResults, db.cardPriorities, db.stageHistory], async () => {
      await db.cardKeyResults.where('cardId').equals(id).delete();
      await db.cardPriorities.where('cardId').equals(id).delete();
      await db.stageHistory.where('cardId').equals(id).delete();
      await db.cards.delete(id);
    });
  },

  async getMaxSortOrder(projectId: number, stage: CardStage): Promise<number> {
    const cards = await db.cards.where('projectId').equals(projectId).filter(c => c.stage === stage).toArray();
    return cards.length > 0 ? Math.max(...cards.map(c => c.sortOrder)) + 1 : 0;
  },

  // ---- Objectives ----
  async getObjectives(projectId: number): Promise<Objective[]> {
    const rows = await db.objectives.where('projectId').equals(projectId).toArray();
    const objectives: Objective[] = [];
    for (const r of rows) {
      const krs = await this.getKeyResults(r.id!);
      objectives.push({
        id: r.id, projectId: r.projectId, title: r.title, description: r.description,
        timeFrame: r.timeFrame, startDate: r.startDate, endDate: r.endDate,
        status: r.status as Objective['status'], createdAt: r.createdAt, updatedAt: r.updatedAt,
        keyResults: krs,
      });
    }
    return objectives;
  },

  async createObjective(o: Omit<Objective, 'id' | 'keyResults'>): Promise<number> {
    const now = new Date();
    return db.objectives.add({
      projectId: o.projectId, title: o.title, description: o.description,
      timeFrame: o.timeFrame, startDate: o.startDate, endDate: o.endDate,
      status: o.status, createdAt: now, updatedAt: now,
    });
  },

  async updateObjective(o: Objective): Promise<void> {
    if (!o.id) return;
    await db.objectives.update(o.id, {
      title: o.title, description: o.description, timeFrame: o.timeFrame,
      startDate: o.startDate, endDate: o.endDate, status: o.status,
      updatedAt: new Date(),
    });
  },

  async deleteObjective(id: number): Promise<void> {
    await db.transaction('rw', [db.objectives, db.keyResults, db.cardKeyResults, db.krProgressHistory], async () => {
      const krs = await db.keyResults.where('objectiveId').equals(id).toArray();
      const krIds = krs.map(k => k.id!);
      await db.cardKeyResults.where('keyResultId').anyOf(krIds).delete();
      await db.krProgressHistory.where('keyResultId').anyOf(krIds).delete();
      await db.keyResults.where('objectiveId').equals(id).delete();
      await db.objectives.delete(id);
    });
  },

  // ---- Key Results ----
  async getKeyResults(objectiveId: number): Promise<KeyResult[]> {
    const rows = await db.keyResults.where('objectiveId').equals(objectiveId).toArray();
    return rows.map(r => ({
      id: r.id, objectiveId: r.objectiveId, title: r.title,
      targetValue: r.targetValue, currentValue: r.currentValue,
      unitOfMeasure: r.unitOfMeasure, measurementType: r.measurementType as KeyResult['measurementType'],
      status: r.status as KeyResult['status'], createdAt: r.createdAt, updatedAt: r.updatedAt,
    }));
  },

  async createKeyResult(kr: Omit<KeyResult, 'id'>): Promise<number> {
    const now = new Date();
    return db.keyResults.add({
      objectiveId: kr.objectiveId, title: kr.title, targetValue: kr.targetValue,
      currentValue: kr.currentValue, unitOfMeasure: kr.unitOfMeasure,
      measurementType: kr.measurementType, status: kr.status,
      createdAt: now, updatedAt: now,
    });
  },

  async updateKeyResult(kr: KeyResult): Promise<void> {
    if (!kr.id) return;
    await db.keyResults.update(kr.id, {
      title: kr.title, targetValue: kr.targetValue, currentValue: kr.currentValue,
      unitOfMeasure: kr.unitOfMeasure, measurementType: kr.measurementType,
      status: kr.status, updatedAt: new Date(),
    });
  },

  async deleteKeyResult(id: number): Promise<void> {
    await db.transaction('rw', [db.keyResults, db.cardKeyResults, db.krProgressHistory], async () => {
      await db.cardKeyResults.where('keyResultId').equals(id).delete();
      await db.krProgressHistory.where('keyResultId').equals(id).delete();
      await db.keyResults.delete(id);
    });
  },

  // ---- Card-KeyResult Links ----
  async getCardKeyResultLinks(cardId: number): Promise<CardKeyResultLink[]> {
    const rows = await db.cardKeyResults.where('cardId').equals(cardId).toArray();
    return rows.map(r => ({ cardId: r.cardId, keyResultId: r.keyResultId, contributionWeight: r.contributionWeight }));
  },

  async linkCardToKeyResult(link: CardKeyResultLink): Promise<void> {
    const existing = await db.cardKeyResults.where({ cardId: link.cardId, keyResultId: link.keyResultId }).first();
    if (!existing) {
      await db.cardKeyResults.add({ cardId: link.cardId, keyResultId: link.keyResultId, contributionWeight: link.contributionWeight });
    }
  },

  async unlinkCardFromKeyResult(cardId: number, keyResultId: number): Promise<void> {
    await db.cardKeyResults.where({ cardId, keyResultId }).delete();
  },

  // ---- Strategic Priorities ----
  async getPriorities(projectId: number): Promise<StrategicPriority[]> {
    const rows = await db.strategicPriorities.where('projectId').equals(projectId).sortBy('sortOrder');
    return rows.map(r => ({
      id: r.id, projectId: r.projectId, name: r.name, description: r.description,
      colorHex: r.colorHex, sortOrder: r.sortOrder, isActive: toBool(r.isActive),
      createdAt: r.createdAt, updatedAt: r.updatedAt,
    }));
  },

  async createPriority(p: Omit<StrategicPriority, 'id'>): Promise<number> {
    const now = new Date();
    return db.strategicPriorities.add({
      projectId: p.projectId, name: p.name, description: p.description,
      colorHex: p.colorHex, sortOrder: p.sortOrder, isActive: toInt(p.isActive),
      createdAt: now, updatedAt: now,
    });
  },

  async updatePriority(p: StrategicPriority): Promise<void> {
    if (!p.id) return;
    await db.strategicPriorities.update(p.id, {
      name: p.name, description: p.description, colorHex: p.colorHex,
      sortOrder: p.sortOrder, isActive: toInt(p.isActive), updatedAt: new Date(),
    });
  },

  async deletePriority(id: number): Promise<void> {
    await db.transaction('rw', [db.strategicPriorities, db.cardPriorities], async () => {
      await db.cardPriorities.where('priorityId').equals(id).delete();
      await db.strategicPriorities.delete(id);
    });
  },

  // ---- Card-Priority Links ----
  async getCardPriorityLinks(cardId: number): Promise<CardPriorityLink[]> {
    const rows = await db.cardPriorities.where('cardId').equals(cardId).toArray();
    return rows.map(r => ({ cardId: r.cardId, priorityId: r.priorityId }));
  },

  async getPriorityCardCount(priorityId: number): Promise<number> {
    return db.cardPriorities.where('priorityId').equals(priorityId).count();
  },

  async linkCardToPriority(cardId: number, priorityId: number): Promise<void> {
    const existing = await db.cardPriorities.where({ cardId, priorityId }).first();
    if (!existing) {
      await db.cardPriorities.add({ cardId, priorityId });
    }
  },

  async unlinkCardFromPriority(cardId: number, priorityId: number): Promise<void> {
    await db.cardPriorities.where({ cardId, priorityId }).delete();
  },

  // ---- Stage Criteria ----
  async getStageCriteria(projectId?: number): Promise<StageCriteria[]> {
    let rows;
    if (projectId) {
      rows = await db.stageCriteria.where('projectId').equals(projectId).toArray();
    } else {
      rows = await db.stageCriteria.toArray();
    }
    return rows.map(r => ({
      id: r.id, projectId: r.projectId, fromStage: r.fromStage as CardStage,
      toStage: r.toStage as CardStage, criteriaTitle: r.criteriaTitle,
      criteriaDescription: r.criteriaDescription, isRequired: toBool(r.isRequired),
      sortOrder: r.sortOrder,
    }));
  },

  async saveStageCriteria(criteria: StageCriteria): Promise<number> {
    if (criteria.id) {
      await db.stageCriteria.update(criteria.id, {
        projectId: criteria.projectId, fromStage: criteria.fromStage, toStage: criteria.toStage,
        criteriaTitle: criteria.criteriaTitle, criteriaDescription: criteria.criteriaDescription,
        isRequired: toInt(criteria.isRequired), sortOrder: criteria.sortOrder,
      });
      return criteria.id;
    }
    return db.stageCriteria.add({
      projectId: criteria.projectId, fromStage: criteria.fromStage, toStage: criteria.toStage,
      criteriaTitle: criteria.criteriaTitle, criteriaDescription: criteria.criteriaDescription,
      isRequired: toInt(criteria.isRequired), sortOrder: criteria.sortOrder,
    });
  },

  // ---- Stage History ----
  async recordStageChange(record: Omit<StageChangeRecord, 'id'>): Promise<void> {
    await db.stageHistory.add({
      cardId: record.cardId, fromStage: record.fromStage, toStage: record.toStage,
      changedAt: record.changedAt, changedBy: record.changedBy, notes: record.notes,
      criteriaMet: record.criteriaMet ? JSON.stringify(record.criteriaMet) : undefined,
    });
  },

  async getStageHistory(cardId: number): Promise<StageChangeRecord[]> {
    const rows = await db.stageHistory.where('cardId').equals(cardId).sortBy('changedAt');
    return rows.map(r => ({
      id: r.id, cardId: r.cardId, fromStage: r.fromStage as CardStage | undefined,
      toStage: r.toStage as CardStage, changedAt: r.changedAt,
      changedBy: r.changedBy, notes: r.notes,
      criteriaMet: r.criteriaMet ? JSON.parse(r.criteriaMet) : undefined,
    }));
  },

  // ---- KR Progress History ----
  async recordKRProgress(record: Omit<KRProgressHistory, 'id'>): Promise<void> {
    await db.krProgressHistory.add({
      keyResultId: record.keyResultId, value: record.value,
      recordedAt: record.recordedAt, notes: record.notes,
    });
  },

  // ---- Local Organizations (offline) ----
  async getLocalOrganizations(): Promise<Organization[]> {
    const rows = await db.localOrganizations.toArray();
    return rows.map(r => ({
      id: r.id, name: r.name, slug: r.slug, description: r.description,
      logoURL: r.logoURL, createdBy: r.createdBy, createdAt: r.createdAt, updatedAt: r.updatedAt,
    }));
  },

  async saveLocalOrganization(org: Organization): Promise<void> {
    const now = new Date();
    const id = org.id ?? crypto.randomUUID();
    await db.localOrganizations.put({
      id, name: org.name, slug: org.slug, description: org.description,
      logoURL: org.logoURL, createdBy: org.createdBy,
      createdAt: org.createdAt ?? now, updatedAt: now,
    });
  },

  async deleteLocalOrganization(id: string): Promise<void> {
    await db.transaction('rw', [db.localOrganizations, db.localTeams, db.localOrgMembers, db.localTeamMembers], async () => {
      const teams = await db.localTeams.where('organizationId').equals(id).toArray();
      for (const t of teams) {
        if (t.id) await db.localTeamMembers.where('teamId').equals(t.id).delete();
      }
      await db.localTeams.where('organizationId').equals(id).delete();
      await db.localOrgMembers.where('organizationId').equals(id).delete();
      await db.localOrganizations.delete(id);
    });
  },

  async getLocalTeams(organizationId: string): Promise<Team[]> {
    const rows = await db.localTeams.where('organizationId').equals(organizationId).toArray();
    return rows.map(r => ({
      id: r.id, organizationId: r.organizationId, name: r.name,
      description: r.description, createdBy: r.createdBy,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
    }));
  },

  async saveLocalTeam(team: Team): Promise<void> {
    const now = new Date();
    const id = team.id ?? crypto.randomUUID();
    await db.localTeams.put({
      id, organizationId: team.organizationId, name: team.name,
      description: team.description, createdBy: team.createdBy,
      createdAt: team.createdAt ?? now, updatedAt: now,
    });
  },

  async deleteLocalTeam(id: string): Promise<void> {
    await db.transaction('rw', [db.localTeams, db.localTeamMembers], async () => {
      await db.localTeamMembers.where('teamId').equals(id).delete();
      await db.localTeams.delete(id);
    });
  },

  async getLocalOrgMembers(organizationId: string): Promise<OrganizationMember[]> {
    const rows = await db.localOrgMembers.where('organizationId').equals(organizationId).toArray();
    return rows.map(r => ({
      id: r.id!, organizationId: r.organizationId, userId: r.userId,
      role: r.role as OrganizationMember['role'], joinedAt: r.joinedAt, email: r.email,
    }));
  },

  async saveLocalOrgMember(m: OrganizationMember): Promise<void> {
    await db.localOrgMembers.put({
      id: m.id, organizationId: m.organizationId, userId: m.userId,
      role: m.role, joinedAt: m.joinedAt, email: m.email,
    });
  },

  async getLocalTeamMembers(teamId: string): Promise<TeamMember[]> {
    const rows = await db.localTeamMembers.where('teamId').equals(teamId).toArray();
    return rows.map(r => ({
      id: r.id!, teamId: r.teamId, userId: r.userId,
      role: r.role as TeamMember['role'], joinedAt: r.joinedAt, email: r.email,
    }));
  },

  async saveLocalTeamMember(m: TeamMember): Promise<void> {
    await db.localTeamMembers.put({
      id: m.id, teamId: m.teamId, userId: m.userId,
      role: m.role, joinedAt: m.joinedAt, email: m.email,
    });
  },

  // ---- Import / Export ----
  async exportToJSON(projectId: number): Promise<string> {
    const cards = await this.getCards(projectId);
    const objectives = await this.getObjectives(projectId);
    const priorities = await this.getPriorities(projectId);
    const projects = await this.getAllProjects();
    const project = projects.find(p => p.id === projectId);
    return JSON.stringify({ project, cards, objectives, priorities }, null, 2);
  },

  async importFromJSON(json: string, projectId: number): Promise<void> {
    const data = JSON.parse(json);
    if (data.cards) {
      for (const card of data.cards) {
        await this.createCard({ ...card, id: undefined, projectId, sortOrder: card.sortOrder ?? 0 });
      }
    }
    if (data.objectives) {
      for (const obj of data.objectives) {
        const krs = obj.keyResults || [];
        const objId = await this.createObjective({ ...obj, id: undefined, projectId, keyResults: undefined });
        for (const kr of krs) {
          await this.createKeyResult({ ...kr, id: undefined, objectiveId: objId });
        }
      }
    }
  },

  // ---- Analytics helpers ----
  async getAllCards(): Promise<Card[]> {
    const rows = await db.cards.toArray();
    return rows.map(r => ({
      id: r.id, projectId: r.projectId, stage: r.stage as CardStage, title: r.title,
      ideaDescription: r.ideaDescription, ideaContext: r.ideaContext,
      problemDefinition: r.problemDefinition, valueExplanation: r.valueExplanation,
      successMetrics: r.successMetrics, possibleSolutions: r.possibleSolutions,
      solutionRequirements: r.solutionRequirements, compostReason: r.compostReason,
      lessonsLearned: r.lessonsLearned, createdAt: r.createdAt, updatedAt: r.updatedAt,
      sortOrder: r.sortOrder,
    }));
  },
};
