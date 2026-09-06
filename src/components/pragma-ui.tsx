'use client';

import { Moon, Sun } from 'lucide-react';
import type { Theme } from '@/hooks/use-theme';

/* ─── Logo ───────────────────────────────────────────────────── */
export function Logo() {
  return (
    <span className="brand" data-testid="brand-pragma">
      <span className="brand-mark">P</span>
      <span className="brand-word">PRAGMA.</span>
      <span className="brand-tag">AUTONOMOUS TRADING</span>
    </span>
  );
}

/* ─── Theme toggle button ────────────────────────────────────── */
export function ThemeButton({
  theme,
  toggle,
}: {
  theme: Theme;
  toggle: () => void;
}) {
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label="Toggle theme"
      data-testid="button-toggle-theme"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
