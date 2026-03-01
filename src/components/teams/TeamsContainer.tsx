'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  UserPlus,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useOrgStore } from '@/lib/stores/org-store';
import { useTeamStore } from '@/lib/stores/team-store';
import type { OrgRole, TeamRole } from '@/lib/types';
import { TEAM_ROLE_DISPLAY, ORG_ROLE_PERMISSIONS } from '@/lib/types';

// ── Helpers ─────────────────────────────────────────────────────────────────

function initials(email?: string, userId?: string): string {
  const src = email ?? userId ?? '?';
  return src.slice(0, 2).toUpperCase();
}

function orgRoleBadgeVariant(role: OrgRole): 'default' | 'secondary' | 'outline' {
  if (role === 'owner') return 'default';
  if (role === 'admin') return 'secondary';
  return 'outline';
}

function teamRoleBadgeVariant(role: TeamRole): 'default' | 'secondary' | 'outline' {
  if (role === 'product_owner') return 'default';
  if (role === 'product_manager') return 'secondary';
  return 'outline';
}

// ── Create Org Dialog ────────────────────────────────────────────────────────

function CreateOrgDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { createOrg } = useOrgStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await createOrg(name.trim(), description.trim() || undefined);
    setSaving(false);
    setName('');
    setDescription('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-desc">Description</Label>
            <Textarea
              id="org-desc"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Team Dialog ───────────────────────────────────────────────────────

function CreateTeamDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orgId: string;
}) {
  const { createTeam } = useTeamStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await createTeam(orgId, name.trim(), description.trim() || undefined);
    setSaving(false);
    setName('');
    setDescription('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Name</Label>
            <Input
              id="team-name"
              placeholder="Design Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="team-desc">Description</Label>
            <Textarea
              id="team-desc"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Member Dialog (team) ─────────────────────────────────────────────────

function AddTeamMemberDialog({
  open,
  onOpenChange,
  teamId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teamId: string;
}) {
  const { addMember } = useTeamStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('contributor');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    const userId = crypto.randomUUID();
    await addMember(teamId, userId, role, email.trim());
    setSaving(false);
    setEmail('');
    setRole('contributor');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              placeholder="person@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_owner">Product Owner</SelectItem>
                <SelectItem value="product_manager">Product Manager</SelectItem>
                <SelectItem value="contributor">Contributor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!email.trim() || saving}>
              {saving ? 'Adding…' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Member Dialog (org) ──────────────────────────────────────────────────

function AddOrgMemberDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orgId: string;
}) {
  const { addMember } = useOrgStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    const userId = crypto.randomUUID();
    await addMember(orgId, userId, role, email.trim());
    setSaving(false);
    setEmail('');
    setRole('member');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Organization Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="org-member-email">Email</Label>
            <Input
              id="org-member-email"
              type="email"
              placeholder="person@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!email.trim() || saving}>
              {saving ? 'Adding…' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function TeamsContainer() {
  const {
    organizations,
    selectedOrg,
    members: orgMembers,
    isLoading: orgsLoading,
    loadOrganizations,
    selectOrg,
    deleteOrg,
    removeMember: removeOrgMember,
    updateMemberRole: updateOrgMemberRole,
  } = useOrgStore();

  const {
    teams,
    selectedTeam,
    teamMembers,
    isLoading: teamsLoading,
    loadTeams,
    selectTeam,
    deleteTeam,
    removeMember: removeTeamMember,
    updateMemberRole: updateTeamMemberRole,
  } = useTeamStore();

  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddOrgMember, setShowAddOrgMember] = useState(false);
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (selectedOrg?.id) {
      loadTeams(selectedOrg.id);
    }
  }, [selectedOrg, loadTeams]);

  return (
    <div className="flex h-full">
      {/* ── Left panel: Organizations ───────────────────────────── */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            Organizations
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => setShowCreateOrg(true)}
            title="Create organization"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {orgsLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : organizations.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Building2 className="size-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">No organizations yet</p>
              <Button size="sm" className="mt-3" onClick={() => setShowCreateOrg(true)}>
                <Plus className="size-3 mr-1" /> Create one
              </Button>
            </div>
          ) : (
            <div className="py-2 px-2 space-y-0.5">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => selectOrg(org)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors group',
                    selectedOrg?.id === org.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                  )}
                >
                  <Building2 className="size-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{org.name}</div>
                    {org.description && (
                      <div
                        className={cn(
                          'text-xs truncate mt-0.5',
                          selectedOrg?.id === org.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        )}
                      >
                        {org.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      org.id && deleteOrg(org.id);
                    }}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 rounded p-0.5 transition-opacity',
                      selectedOrg?.id === org.id
                        ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10'
                        : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                    )}
                    title="Delete organization"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Right panel: Teams + Members ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedOrg ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Building2 className="size-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Select an organization to manage teams</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Teams list */}
            <div className="w-64 shrink-0 border-r border-border flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  Teams
                </h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setShowCreateTeam(true)}
                  title="Create team"
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                {teamsLoading ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</div>
                ) : teams.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <Users className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">No teams yet</p>
                    <Button size="sm" className="mt-3" onClick={() => setShowCreateTeam(true)}>
                      <Plus className="size-3 mr-1" /> Create team
                    </Button>
                  </div>
                ) : (
                  <div className="py-2 px-2 space-y-0.5">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => selectTeam(team)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors group',
                          selectedTeam?.id === team.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                        )}
                      >
                        <Users className="size-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{team.name}</div>
                          <div
                            className={cn(
                              'text-xs mt-0.5',
                              selectedTeam?.id === team.id
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            )}
                          >
                            {team.members?.length ?? 0} members
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            team.id && deleteTeam(team.id);
                          }}
                          className={cn(
                            'opacity-0 group-hover:opacity-100 rounded p-0.5 transition-opacity',
                            selectedTeam?.id === team.id
                              ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10'
                              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                          )}
                          title="Delete team"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Member detail */}
            <div className="flex-1 flex flex-col min-w-0">
              {!selectedTeam ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="size-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Select a team to manage members</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                      <h1 className="text-lg font-semibold text-foreground">{selectedTeam.name}</h1>
                      {selectedTeam.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{selectedTeam.description}</p>
                      )}
                    </div>
                    <Button onClick={() => setShowAddTeamMember(true)}>
                      <UserPlus className="size-4 mr-2" />
                      Add Member
                    </Button>
                  </div>

                  {/* Org members section */}
                  <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                      {/* Team members */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-foreground">
                            Team Members
                            <span className="ml-2 text-muted-foreground font-normal">({teamMembers.length})</span>
                          </h3>
                        </div>

                        {teamMembers.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border py-8 text-center">
                            <UserPlus className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">No members yet</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3"
                              onClick={() => setShowAddTeamMember(true)}
                            >
                              Add first member
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {teamMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                              >
                                <Avatar className="size-9">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                    {initials(member.email, member.userId)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground truncate">
                                    {member.email ?? member.userId}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <Select
                                  value={member.role}
                                  onValueChange={(v) =>
                                    updateTeamMemberRole({ ...member, role: v as TeamRole })
                                  }
                                >
                                  <SelectTrigger size="sm" className="w-44">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="product_owner">Product Owner</SelectItem>
                                    <SelectItem value="product_manager">Product Manager</SelectItem>
                                    <SelectItem value="contributor">Contributor</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Badge variant={teamRoleBadgeVariant(member.role)} className="text-xs shrink-0">
                                  {TEAM_ROLE_DISPLAY[member.role].short}
                                </Badge>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => removeTeamMember(member.id)}
                                  title="Remove member"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Org members */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-foreground">
                            Organization Members
                            <span className="ml-2 text-muted-foreground font-normal">({orgMembers.length})</span>
                          </h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddOrgMember(true)}
                          >
                            <UserPlus className="size-3.5 mr-1.5" />
                            Add to Org
                          </Button>
                        </div>

                        {orgMembers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No organization members.</p>
                        ) : (
                          <div className="space-y-2">
                            {orgMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                              >
                                <Avatar className="size-9">
                                  <AvatarFallback className="text-xs bg-muted font-semibold">
                                    {initials(member.email, member.userId)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground truncate">
                                    {member.email ?? member.userId}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <Select
                                  value={member.role}
                                  onValueChange={(v) =>
                                    updateOrgMemberRole({ ...member, role: v as OrgRole })
                                  }
                                >
                                  <SelectTrigger size="sm" className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Badge variant={orgRoleBadgeVariant(member.role)} className="text-xs capitalize shrink-0">
                                  {member.role}
                                </Badge>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => removeOrgMember(member.id, member.organizationId)}
                                  title="Remove member"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateOrgDialog open={showCreateOrg} onOpenChange={setShowCreateOrg} />
      {selectedOrg?.id && (
        <>
          <CreateTeamDialog
            open={showCreateTeam}
            onOpenChange={setShowCreateTeam}
            orgId={selectedOrg.id}
          />
          <AddOrgMemberDialog
            open={showAddOrgMember}
            onOpenChange={setShowAddOrgMember}
            orgId={selectedOrg.id}
          />
        </>
      )}
      {selectedTeam?.id && (
        <AddTeamMemberDialog
          open={showAddTeamMember}
          onOpenChange={setShowAddTeamMember}
          teamId={selectedTeam.id}
        />
      )}
    </div>
  );
}
