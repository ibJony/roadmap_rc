import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

/**
 * Apply the theme class to <html>. Can be called outside React (e.g. from TopBar handler).
 */
export function applyTheme(appearance: 'system' | 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (appearance === 'dark') {
    root.classList.add('dark');
  } else if (appearance === 'light') {
    // light is the default — no class needed, but add it for explicit styling
  } else {
    // system — resolve from OS preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    }
  }
}

/**
 * React hook that syncs the theme class on mount and whenever appearance changes.
 * Also listens for OS preference changes when mode is "system".
 */
export function useTheme() {
  const appearance = useAuthStore(s => s.appearance);
  const setAppearance = useAuthStore(s => s.setAppearance);

  useEffect(() => {
    applyTheme(appearance);

    // Listen for OS theme changes when in "system" mode
    if (appearance === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [appearance]);

  return { appearance, setAppearance };
}
