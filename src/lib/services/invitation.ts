import type { Invitation, OrgRole, TeamRole } from '../types';
import { generateToken } from '../types';

export function createInvitation(
  organizationId: string,
  email: string,
  orgRole: OrgRole = 'member',
  teamId?: string,
  teamRole?: TeamRole,
  invitedBy?: string,
): Invitation {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  return {
    id: crypto.randomUUID(),
    organizationId,
    teamId,
    email,
    orgRole,
    teamRole,
    invitedBy,
    token: generateToken(),
    expiresAt,
    createdAt: now,
  };
}
