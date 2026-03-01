import { create } from 'zustand';
import type { Card, CardStage, Project } from '../types';
import { DatabaseService } from '../db/database';
import { useToastStore } from './toast-store';

interface RoadmapState {
  projects: Project[];
  selectedProject: Project | null;
  cards: Card[];
  selectedCard: Card | null;
  isEditing: boolean;
  editingStage: CardStage | null;
  isLoading: boolean;
  filterOrgId: string | null;

  // Project operations
  loadProjects: (orgId?: string | null) => Promise<void>;
  setFilterOrgId: (orgId: string | null) => void;
  selectProject: (project: Project) => Promise<void>;
  createProject: (p: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  // Card operations
  loadCards: () => Promise<void>;
  createCard: (card: Omit<Card, 'id'>) => Promise<void>;
  updateCard: (card: Card) => Promise<void>;
  deleteCard: (id: number) => Promise<void>;
  moveCard: (cardId: number, toStage: CardStage) => Promise<void>;
  reorderCard: (cardId: number, newOrder: number) => Promise<void>;

  // Editor
  addCard: (stage: CardStage) => void;
  editCard: (card: Card) => void;
  closeEditor: () => void;
  saveCard: (card: Card) => Promise<void>;

  // Helpers
  cardsForStage: (stage: CardStage) => Card[];

  // Import/Export
  exportToJSON: () => Promise<string>;
  importFromJSON: (json: string) => Promise<void>;
}

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  projects: [],
  selectedProject: null,
  cards: [],
  selectedCard: null,
  isEditing: false,
  editingStage: null,
  isLoading: false,
  filterOrgId: null,

  setFilterOrgId: (orgId) => {
    set({ filterOrgId: orgId });
    get().loadProjects(orgId);
  },

  loadProjects: async (orgId) => {
    set({ isLoading: true });
    try {
      const filterOrg = orgId !== undefined ? orgId : get().filterOrgId;
      let projects: Project[];
      if (filterOrg) {
        projects = await DatabaseService.getProjectsByOrg(filterOrg);
      } else {
        const defaultProject = await DatabaseService.ensureDefaultProject();
        projects = await DatabaseService.getAllProjects();
        // If no filter, still need the default
        if (projects.length === 0) {
          projects = [defaultProject];
        }
      }
      const selected = get().selectedProject && projects.find(p => p.id === get().selectedProject?.id)
        ? get().selectedProject
        : projects[0] ?? null;
      set({ projects, selectedProject: selected });
      if (selected) {
        const cards = await DatabaseService.getCards(selected.id!);
        set({ cards });
      } else {
        set({ cards: [] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  selectProject: async (project) => {
    set({ selectedProject: project, isLoading: true });
    try {
      const cards = await DatabaseService.getCards(project.id!);
      set({ cards });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (p) => {
    try {
      const id = await DatabaseService.createProject(p);
      const project: Project = { ...p, id };
      set(s => ({ projects: [...s.projects, project] }));
      useToastStore.getState().showSuccess('Project created');
    } catch {
      useToastStore.getState().showError('Failed to create project');
    }
  },

  updateProject: async (p) => {
    try {
      await DatabaseService.updateProject(p);
      set(s => ({ projects: s.projects.map(pr => pr.id === p.id ? p : pr), selectedProject: s.selectedProject?.id === p.id ? p : s.selectedProject }));
      useToastStore.getState().showSuccess('Project updated');
    } catch {
      useToastStore.getState().showError('Failed to update project');
    }
  },

  deleteProject: async (id) => {
    const { projects } = get();
    if (projects.length <= 1) {
      useToastStore.getState().showWarning('Cannot delete last project');
      return;
    }
    try {
      await DatabaseService.deleteProject(id);
      const remaining = projects.filter(p => p.id !== id);
      set({ projects: remaining, selectedProject: remaining[0] });
      if (remaining[0]) {
        const cards = await DatabaseService.getCards(remaining[0].id!);
        set({ cards });
      }
      useToastStore.getState().showSuccess('Project deleted');
    } catch {
      useToastStore.getState().showError('Failed to delete project');
    }
  },

  loadCards: async () => {
    const project = get().selectedProject;
    if (!project?.id) return;
    const cards = await DatabaseService.getCards(project.id);
    set({ cards });
  },

  createCard: async (card) => {
    try {
      const id = await DatabaseService.createCard(card);
      const newCard: Card = { ...card, id };
      set(s => ({ cards: [...s.cards, newCard] }));
      // Record stage change
      await DatabaseService.recordStageChange({ cardId: id, toStage: card.stage, changedAt: new Date() });
    } catch {
      useToastStore.getState().showError('Failed to create card');
    }
  },

  updateCard: async (card) => {
    try {
      await DatabaseService.updateCard(card);
      set(s => ({ cards: s.cards.map(c => c.id === card.id ? card : c) }));
    } catch {
      useToastStore.getState().showError('Failed to update card');
    }
  },

  deleteCard: async (id) => {
    try {
      await DatabaseService.deleteCard(id);
      set(s => ({ cards: s.cards.filter(c => c.id !== id) }));
      useToastStore.getState().showSuccess('Card deleted');
    } catch {
      useToastStore.getState().showError('Failed to delete card');
    }
  },

  moveCard: async (cardId, toStage) => {
    const card = get().cards.find(c => c.id === cardId);
    if (!card) return;
    const fromStage = card.stage;
    const project = get().selectedProject;
    const sortOrder = project ? await DatabaseService.getMaxSortOrder(project.id!, toStage) : 0;
    const updated = { ...card, stage: toStage, sortOrder, updatedAt: new Date() };
    try {
      await DatabaseService.updateCard(updated);
      set(s => ({ cards: s.cards.map(c => c.id === cardId ? updated : c) }));
      await DatabaseService.recordStageChange({ cardId, fromStage, toStage, changedAt: new Date() });
      useToastStore.getState().showSuccess(`Moved to ${toStage}`);
    } catch {
      useToastStore.getState().showError('Failed to move card');
    }
  },

  reorderCard: async (cardId, newOrder) => {
    const card = get().cards.find(c => c.id === cardId);
    if (!card) return;
    const updated = { ...card, sortOrder: newOrder };
    await DatabaseService.updateCard(updated);
    set(s => ({ cards: s.cards.map(c => c.id === cardId ? updated : c) }));
  },

  addCard: (stage) => {
    const project = get().selectedProject;
    if (!project) return;
    set({
      selectedCard: { stage, title: '', projectId: project.id, sortOrder: 0 },
      isEditing: true,
      editingStage: stage,
    });
  },

  editCard: (card) => {
    set({ selectedCard: card, isEditing: true, editingStage: card.stage });
  },

  closeEditor: () => {
    set({ selectedCard: null, isEditing: false, editingStage: null });
  },

  saveCard: async (card) => {
    const project = get().selectedProject;
    if (!project?.id) return;
    if (card.id) {
      await get().updateCard(card);
    } else {
      const sortOrder = await DatabaseService.getMaxSortOrder(project.id, card.stage);
      await get().createCard({ ...card, projectId: project.id, sortOrder });
    }
    get().closeEditor();
    useToastStore.getState().showSuccess(card.id ? 'Card updated' : 'Card created');
  },

  cardsForStage: (stage) => {
    return get().cards.filter(c => c.stage === stage).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  exportToJSON: async () => {
    const project = get().selectedProject;
    if (!project?.id) return '{}';
    return DatabaseService.exportToJSON(project.id);
  },

  importFromJSON: async (json) => {
    const project = get().selectedProject;
    if (!project?.id) return;
    try {
      await DatabaseService.importFromJSON(json, project.id);
      await get().loadCards();
      useToastStore.getState().showSuccess('Import successful');
    } catch {
      useToastStore.getState().showError('Import failed');
    }
  },
}));
