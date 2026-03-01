import { create } from 'zustand';
import type { Team, TeamMember, TeamRole } from '../types';
import { DatabaseService } from '../db/database';
import { useToastStore } from './toast-store';

interface TeamState {
  teams: Team[];
  selectedTeam: Team | null;
  teamMembers: TeamMember[];
  isLoading: boolean;

  loadTeams: (organizationId: string) => Promise<void>;
  selectTeam: (team: Team) => Promise<void>;
  createTeam: (orgId: string, name: string, description?: string) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addMember: (teamId: string, userId: string, role: TeamRole, email?: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (member: TeamMember) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  selectedTeam: null,
  teamMembers: [],
  isLoading: false,

  loadTeams: async (organizationId) => {
    set({ isLoading: true });
    try {
      const teams = await DatabaseService.getLocalTeams(organizationId);
      set({ teams });
    } finally {
      set({ isLoading: false });
    }
  },

  selectTeam: async (team) => {
    set({ selectedTeam: team });
    if (team.id) {
      const teamMembers = await DatabaseService.getLocalTeamMembers(team.id);
      set({ teamMembers });
    }
  },

  createTeam: async (orgId, name, description) => {
    try {
      const team: Team = {
        id: crypto.randomUUID(), organizationId: orgId,
        name, description, createdAt: new Date(), updatedAt: new Date(),
      };
      await DatabaseService.saveLocalTeam(team);
      set(s => ({ teams: [...s.teams, team] }));
      useToastStore.getState().showSuccess('Team created');
    } catch {
      useToastStore.getState().showError('Failed to create team');
    }
  },

  updateTeam: async (team) => {
    try {
      await DatabaseService.saveLocalTeam(team);
      set(s => ({
        teams: s.teams.map(t => t.id === team.id ? team : t),
        selectedTeam: s.selectedTeam?.id === team.id ? team : s.selectedTeam,
      }));
      useToastStore.getState().showSuccess('Team updated');
    } catch {
      useToastStore.getState().showError('Failed to update team');
    }
  },

  deleteTeam: async (id) => {
    try {
      await DatabaseService.deleteLocalTeam(id);
      set(s => ({
        teams: s.teams.filter(t => t.id !== id),
        selectedTeam: s.selectedTeam?.id === id ? null : s.selectedTeam,
        teamMembers: s.selectedTeam?.id === id ? [] : s.teamMembers,
      }));
      useToastStore.getState().showSuccess('Team deleted');
    } catch {
      useToastStore.getState().showError('Failed to delete team');
    }
  },

  addMember: async (teamId, userId, role, email) => {
    try {
      const member: TeamMember = {
        id: crypto.randomUUID(), teamId, userId,
        role, joinedAt: new Date(), email,
      };
      await DatabaseService.saveLocalTeamMember(member);
      set(s => ({ teamMembers: [...s.teamMembers, member] }));
      useToastStore.getState().showSuccess('Member added');
    } catch {
      useToastStore.getState().showError('Failed to add member');
    }
  },

  removeMember: async (memberId) => {
    try {
      const { db } = await import('../db/schema');
      await db.localTeamMembers.delete(memberId);
      set(s => ({ teamMembers: s.teamMembers.filter(m => m.id !== memberId) }));
      useToastStore.getState().showSuccess('Member removed');
    } catch {
      useToastStore.getState().showError('Failed to remove member');
    }
  },

  updateMemberRole: async (member) => {
    try {
      await DatabaseService.saveLocalTeamMember(member);
      set(s => ({ teamMembers: s.teamMembers.map(m => m.id === member.id ? member : m) }));
    } catch {
      useToastStore.getState().showError('Failed to update member role');
    }
  },
}));
