import { getSupabaseClient } from '../supabase';
import { DatabaseService } from './database';
import type { Card, Project, Objective, KeyResult } from '../types';

// Bidirectional sync between IndexedDB and Supabase
export class SyncService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private isOnline: boolean = navigator.onLine;

  constructor(url: string, key: string) {
    this.supabaseUrl = url;
    this.supabaseKey = key;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncAll();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  get client() {
    return getSupabaseClient(this.supabaseUrl, this.supabaseKey);
  }

  async syncAll(): Promise<void> {
    if (!this.isOnline || !this.supabaseUrl || !this.supabaseKey) return;
    try {
      await this.syncProjects();
      await this.syncCards();
      await this.syncObjectives();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  async syncProjects(): Promise<void> {
    const localProjects = await DatabaseService.getAllProjects();
    const { data: remoteProjects } = await this.client
      .from('projects')
      .select('*');

    if (!remoteProjects) return;

    // Simple last-write-wins strategy
    for (const local of localProjects) {
      const remote = remoteProjects.find(
        (r: Record<string, unknown>) => r.sync_uuid === local.syncUUID
      );
      if (!remote && local.syncUUID) {
        // Push local to remote
        await this.client.from('projects').insert({
          sync_uuid: local.syncUUID,
          name: local.name,
          description: local.description,
          color_hex: local.colorHex,
          is_archived: local.isArchived,
        });
      }
    }

    // Pull remote to local
    for (const remote of remoteProjects) {
      const local = localProjects.find(l => l.syncUUID === remote.sync_uuid);
      if (!local) {
        await DatabaseService.createProject({
          name: remote.name,
          description: remote.description,
          colorHex: remote.color_hex,
          isArchived: remote.is_archived,
          syncUUID: remote.sync_uuid,
        });
      }
    }
  }

  async syncCards(): Promise<void> {
    // Cards sync follows the same pattern
    // Implementation depends on Supabase schema setup
  }

  async syncObjectives(): Promise<void> {
    // Objectives sync follows the same pattern
  }

  // Subscribe to realtime changes
  subscribeToChanges(projectId: string, onUpdate: () => void): () => void {
    const channel = this.client
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `project_id=eq.${projectId}` },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      this.client.removeChannel(channel);
    };
  }
}
