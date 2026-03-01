import { create } from 'zustand';
import type { Objective, KeyResult, CardKeyResultLink } from '../types';
import { keyResultProgress, autoKeyResultStatus } from '../types';
import { DatabaseService } from '../db/database';
import { useToastStore } from './toast-store';

interface OKRState {
  objectives: Objective[];
  selectedObjective: Objective | null;
  isLoading: boolean;

  loadObjectives: (projectId: number) => Promise<void>;
  createObjective: (o: Omit<Objective, 'id' | 'keyResults'>) => Promise<void>;
  updateObjective: (o: Objective) => Promise<void>;
  deleteObjective: (id: number) => Promise<void>;

  createKeyResult: (kr: Omit<KeyResult, 'id'>) => Promise<void>;
  updateKeyResult: (kr: KeyResult) => Promise<void>;
  deleteKeyResult: (id: number, objectiveId: number) => Promise<void>;
  updateKeyResultProgress: (kr: KeyResult, newValue: number) => Promise<void>;

  linkCard: (cardId: number, keyResultId: number, weight?: number) => Promise<void>;
  unlinkCard: (cardId: number, keyResultId: number) => Promise<void>;
  getLinkedKeyResults: (cardId: number) => Promise<CardKeyResultLink[]>;
}

export const useOKRStore = create<OKRState>((set, get) => ({
  objectives: [],
  selectedObjective: null,
  isLoading: false,

  loadObjectives: async (projectId) => {
    set({ isLoading: true });
    try {
      const objectives = await DatabaseService.getObjectives(projectId);
      set({ objectives });
    } finally {
      set({ isLoading: false });
    }
  },

  createObjective: async (o) => {
    try {
      const id = await DatabaseService.createObjective(o);
      const objective: Objective = { ...o, id, keyResults: [] };
      set(s => ({ objectives: [...s.objectives, objective] }));
      useToastStore.getState().showSuccess('Objective created');
    } catch {
      useToastStore.getState().showError('Failed to create objective');
    }
  },

  updateObjective: async (o) => {
    try {
      await DatabaseService.updateObjective(o);
      set(s => ({ objectives: s.objectives.map(obj => obj.id === o.id ? o : obj) }));
      useToastStore.getState().showSuccess('Objective updated');
    } catch {
      useToastStore.getState().showError('Failed to update objective');
    }
  },

  deleteObjective: async (id) => {
    try {
      await DatabaseService.deleteObjective(id);
      set(s => ({ objectives: s.objectives.filter(o => o.id !== id) }));
      useToastStore.getState().showSuccess('Objective deleted');
    } catch {
      useToastStore.getState().showError('Failed to delete objective');
    }
  },

  createKeyResult: async (kr) => {
    try {
      const id = await DatabaseService.createKeyResult(kr);
      const newKR: KeyResult = { ...kr, id };
      set(s => ({
        objectives: s.objectives.map(o =>
          o.id === kr.objectiveId ? { ...o, keyResults: [...o.keyResults, newKR] } : o
        ),
      }));
      useToastStore.getState().showSuccess('Key Result created');
    } catch {
      useToastStore.getState().showError('Failed to create key result');
    }
  },

  updateKeyResult: async (kr) => {
    try {
      await DatabaseService.updateKeyResult(kr);
      set(s => ({
        objectives: s.objectives.map(o =>
          o.id === kr.objectiveId
            ? { ...o, keyResults: o.keyResults.map(k => k.id === kr.id ? kr : k) }
            : o
        ),
      }));
    } catch {
      useToastStore.getState().showError('Failed to update key result');
    }
  },

  deleteKeyResult: async (id, objectiveId) => {
    try {
      await DatabaseService.deleteKeyResult(id);
      set(s => ({
        objectives: s.objectives.map(o =>
          o.id === objectiveId ? { ...o, keyResults: o.keyResults.filter(k => k.id !== id) } : o
        ),
      }));
      useToastStore.getState().showSuccess('Key Result deleted');
    } catch {
      useToastStore.getState().showError('Failed to delete key result');
    }
  },

  updateKeyResultProgress: async (kr, newValue) => {
    const progress = keyResultProgress({ ...kr, currentValue: newValue });
    const status = autoKeyResultStatus(progress);
    const updated: KeyResult = { ...kr, currentValue: newValue, status };
    await get().updateKeyResult(updated);
    // Record progress history
    await DatabaseService.recordKRProgress({
      keyResultId: kr.id!, value: newValue, recordedAt: new Date(),
    });
  },

  linkCard: async (cardId, keyResultId, weight = 1.0) => {
    await DatabaseService.linkCardToKeyResult({ cardId, keyResultId, contributionWeight: weight });
  },

  unlinkCard: async (cardId, keyResultId) => {
    await DatabaseService.unlinkCardFromKeyResult(cardId, keyResultId);
  },

  getLinkedKeyResults: async (cardId) => {
    return DatabaseService.getCardKeyResultLinks(cardId);
  },
}));
