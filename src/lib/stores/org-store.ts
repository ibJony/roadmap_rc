import { create } from 'zustand';
import type { Organization, OrganizationMember, OrgRole } from '../types';
import { generateSlug } from '../types';
import { DatabaseService } from '../db/database';
import { useToastStore } from './toast-store';

interface OrgState {
  organizations: Organization[];
  selectedOrg: Organization | null;
  members: OrganizationMember[];
  isLoading: boolean;

  loadOrganizations: () => Promise<void>;
  selectOrg: (org: Organization) => Promise<void>;
  createOrg: (name: string, description?: string) => Promise<void>;
  updateOrg: (org: Organization) => Promise<void>;
  deleteOrg: (id: string) => Promise<void>;
  addMember: (orgId: string, userId: string, role: OrgRole, email?: string) => Promise<void>;
  removeMember: (memberId: string, orgId: string) => Promise<void>;
  updateMemberRole: (member: OrganizationMember) => Promise<void>;
}

export const useOrgStore = create<OrgState>((set, get) => ({
  organizations: [],
  selectedOrg: null,
  members: [],
  isLoading: false,

  loadOrganizations: async () => {
    set({ isLoading: true });
    try {
      const organizations = await DatabaseService.getLocalOrganizations();
      set({ organizations });
    } finally {
      set({ isLoading: false });
    }
  },

  selectOrg: async (org) => {
    set({ selectedOrg: org });
    if (org.id) {
      const members = await DatabaseService.getLocalOrgMembers(org.id);
      set({ members });
    }
  },

  createOrg: async (name, description) => {
    try {
      const org: Organization = {
        id: crypto.randomUUID(), name, slug: generateSlug(name),
        description, createdAt: new Date(), updatedAt: new Date(),
      };
      await DatabaseService.saveLocalOrganization(org);
      set(s => ({ organizations: [...s.organizations, org] }));
      useToastStore.getState().showSuccess('Organization created');
    } catch {
      useToastStore.getState().showError('Failed to create organization');
    }
  },

  updateOrg: async (org) => {
    try {
      await DatabaseService.saveLocalOrganization(org);
      set(s => ({
        organizations: s.organizations.map(o => o.id === org.id ? org : o),
        selectedOrg: s.selectedOrg?.id === org.id ? org : s.selectedOrg,
      }));
      useToastStore.getState().showSuccess('Organization updated');
    } catch {
      useToastStore.getState().showError('Failed to update organization');
    }
  },

  deleteOrg: async (id) => {
    try {
      await DatabaseService.deleteLocalOrganization(id);
      set(s => ({
        organizations: s.organizations.filter(o => o.id !== id),
        selectedOrg: s.selectedOrg?.id === id ? null : s.selectedOrg,
        members: s.selectedOrg?.id === id ? [] : s.members,
      }));
      useToastStore.getState().showSuccess('Organization deleted');
    } catch {
      useToastStore.getState().showError('Failed to delete organization');
    }
  },

  addMember: async (orgId, userId, role, email) => {
    try {
      const member: OrganizationMember = {
        id: crypto.randomUUID(), organizationId: orgId, userId,
        role, joinedAt: new Date(), email,
      };
      await DatabaseService.saveLocalOrgMember(member);
      set(s => ({ members: [...s.members, member] }));
      useToastStore.getState().showSuccess('Member added');
    } catch {
      useToastStore.getState().showError('Failed to add member');
    }
  },

  removeMember: async (memberId, orgId) => {
    try {
      // Remove from DB
      const { db } = await import('../db/schema');
      await db.localOrgMembers.delete(memberId);
      set(s => ({ members: s.members.filter(m => m.id !== memberId) }));
      useToastStore.getState().showSuccess('Member removed');
    } catch {
      useToastStore.getState().showError('Failed to remove member');
    }
  },

  updateMemberRole: async (member) => {
    try {
      await DatabaseService.saveLocalOrgMember(member);
      set(s => ({ members: s.members.map(m => m.id === member.id ? member : m) }));
    } catch {
      useToastStore.getState().showError('Failed to update member role');
    }
  },
}));
