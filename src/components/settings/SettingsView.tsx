'use client';

import React, { useRef, useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRoadmapStore } from '@/lib/stores/roadmap-store';
import { useToastStore } from '@/lib/stores/toast-store';

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Appearance radio button ──────────────────────────────────────────────────

function AppearanceOption({
  value,
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all w-28 cursor-pointer',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-border/80 hover:bg-accent/50'
      )}
    >
      <Icon className={cn('size-5', selected ? 'text-primary' : 'text-muted-foreground')} />
      <span className={cn('text-xs font-medium', selected ? 'text-primary' : 'text-foreground')}>
        {label}
      </span>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function SettingsView() {
  const {
    appearance,
    setAppearance,
    anthropicKey,
    setAnthropicKey,
    supabaseUrl,
    supabaseKey,
    setSupabaseConfig,
    isOfflineMode,
    setOfflineMode,
  } = useAuthStore();

  const { exportToJSON, importFromJSON } = useRoadmapStore();
  const { showSuccess, showError } = useToastStore();

  // Local form state
  const [localAnthropicKey, setLocalAnthropicKey] = useState(anthropicKey);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [localSupabaseUrl, setLocalSupabaseUrl] = useState(supabaseUrl);
  const [localSupabaseKey, setLocalSupabaseKey] = useState(supabaseKey);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSaveAnthropicKey() {
    setAnthropicKey(localAnthropicKey.trim());
    showSuccess('Anthropic API key saved');
  }

  function handleSaveSupabase() {
    setSupabaseConfig(localSupabaseUrl.trim(), localSupabaseKey.trim());
    showSuccess('Supabase configuration saved');
  }

  async function handleExport() {
    setExporting(true);
    try {
      const json = await exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rmlab-roadmap-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Exported successfully');
    } catch {
      showError('Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      await importFromJSON(text);
      showSuccess('Imported successfully');
    } catch {
      showError('Import failed – invalid file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your RMLAB Roadmap experience.</p>
        </div>

        <Separator />

        {/* ── Appearance ────────────────────────────────────────────── */}
        <Section
          title="Appearance"
          description="Choose how RMLAB Roadmap looks on your device."
        >
          <div className="flex gap-3">
            <AppearanceOption
              value="system"
              label="System"
              icon={Monitor}
              selected={appearance === 'system'}
              onClick={() => setAppearance('system')}
            />
            <AppearanceOption
              value="light"
              label="Light"
              icon={Sun}
              selected={appearance === 'light'}
              onClick={() => setAppearance('light')}
            />
            <AppearanceOption
              value="dark"
              label="Dark"
              icon={Moon}
              selected={appearance === 'dark'}
              onClick={() => setAppearance('dark')}
            />
          </div>

          {/* Preview swatch */}
          <div className="flex gap-3 mt-2">
            <div className="h-6 w-6 rounded-full bg-white border border-border shadow-sm" title="Light" />
            <div className="h-6 w-6 rounded-full bg-zinc-900 border border-border shadow-sm" title="Dark" />
            <div
              className="h-6 w-6 rounded-full border border-border shadow-sm"
              style={{ background: 'linear-gradient(135deg, #fff 50%, #18181b 50%)' }}
              title="System"
            />
          </div>
        </Section>

        <Separator />

        {/* ── API Keys ──────────────────────────────────────────────── */}
        <Section
          title="API Keys"
          description="Your Anthropic API key enables the AI assistant. It is stored locally only."
        >
          <div className="space-y-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="anthropic-key"
                  type={showAnthropicKey ? 'text' : 'password'}
                  placeholder="sk-ant-…"
                  value={localAnthropicKey}
                  onChange={(e) => setLocalAnthropicKey(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showAnthropicKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button
                onClick={handleSaveAnthropicKey}
                disabled={localAnthropicKey === anthropicKey}
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your key at{' '}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                console.anthropic.com
              </a>
            </p>
          </div>
        </Section>

        <Separator />

        {/* ── Supabase ──────────────────────────────────────────────── */}
        <Section
          title="Cloud Sync (Supabase)"
          description="Connect a Supabase project to sync your roadmap across devices."
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="supabase-url">Project URL</Label>
              <Input
                id="supabase-url"
                type="url"
                placeholder="https://your-project.supabase.co"
                value={localSupabaseUrl}
                onChange={(e) => setLocalSupabaseUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supabase-key">Anon / Service Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="supabase-key"
                    type={showSupabaseKey ? 'text' : 'password'}
                    placeholder="eyJhbGci…"
                    value={localSupabaseKey}
                    onChange={(e) => setLocalSupabaseKey(e.target.value)}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSupabaseKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showSupabaseKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Button
                  onClick={handleSaveSupabase}
                  disabled={
                    localSupabaseUrl === supabaseUrl && localSupabaseKey === supabaseKey
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── Offline Mode ──────────────────────────────────────────── */}
        <Section
          title="Offline Mode"
          description="When enabled, all data stays local and no network requests are made."
        >
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Work offline</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isOfflineMode
                  ? 'All data is stored locally on this device.'
                  : 'Cloud sync is enabled when Supabase is configured.'}
              </p>
            </div>
            <Switch
              checked={isOfflineMode}
              onCheckedChange={setOfflineMode}
            />
          </div>
        </Section>

        <Separator />

        {/* ── Import / Export ───────────────────────────────────────── */}
        <Section
          title="Import & Export"
          description="Back up your roadmap data or restore from a previous export."
        >
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="size-4" />
              {exporting ? 'Exporting…' : 'Export JSON'}
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="gap-2"
            >
              <Upload className="size-4" />
              {importing ? 'Importing…' : 'Import JSON'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Exports include all cards, objectives, and key results for the currently selected project.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
        </Section>
      </div>
    </div>
  );
}
