'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ChevronDown, ChevronRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export function SupabaseConfigPanel() {
  const { supabaseUrl, supabaseKey, setSupabaseConfig } = useAuthStore();
  const isConfigured = Boolean(supabaseUrl && supabaseKey);

  const [expanded, setExpanded] = useState(!isConfigured);
  const [localUrl, setLocalUrl] = useState(supabaseUrl);
  const [localKey, setLocalKey] = useState(supabaseKey);
  const [showKey, setShowKey] = useState(false);

  // Sync local state when store hydrates or values change
  useEffect(() => { setLocalUrl(supabaseUrl); }, [supabaseUrl]);
  useEffect(() => { setLocalKey(supabaseKey); }, [supabaseKey]);
  useEffect(() => { setExpanded(!Boolean(supabaseUrl && supabaseKey)); }, [supabaseUrl, supabaseKey]);

  const isDirty = localUrl.trim() !== supabaseUrl || localKey.trim() !== supabaseKey;

  function handleSave() {
    setSupabaseConfig(localUrl.trim(), localKey.trim());
  }

  if (isConfigured && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-left text-sm dark:border-green-900 dark:bg-green-950"
      >
        <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0" />
        <span className="flex-1 text-green-700 dark:text-green-300 font-medium">Supabase connected</span>
        <ChevronRight className="size-4 text-green-600 dark:text-green-400 shrink-0" />
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <button
        type="button"
        onClick={() => isConfigured && setExpanded(false)}
        className="flex w-full items-center gap-2 text-left"
      >
        {isConfigured ? (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <div className="size-2 rounded-full bg-orange-500 shrink-0" />
        )}
        <span className="text-sm font-medium text-foreground">
          {isConfigured ? 'Supabase Configuration' : 'Connect to Supabase'}
        </span>
      </button>

      {!isConfigured && (
        <p className="text-xs text-muted-foreground">
          Enter your Supabase project URL and anon key to enable authentication.
        </p>
      )}

      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="sb-url" className="text-xs">Project URL</Label>
          <Input
            id="sb-url"
            type="url"
            placeholder="https://your-project.supabase.co"
            value={localUrl}
            onChange={e => setLocalUrl(e.target.value)}
            className="font-mono text-xs h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sb-key" className="text-xs">Anon Key</Label>
          <div className="relative">
            <Input
              id="sb-key"
              type={showKey ? 'text' : 'password'}
              placeholder="eyJhbGci…"
              value={localKey}
              onChange={e => setLocalKey(e.target.value)}
              className="font-mono text-xs h-8 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || !localUrl.trim() || !localKey.trim()}
          className="w-full"
        >
          {isConfigured ? 'Update' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
