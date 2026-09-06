'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  // Read from localStorage on mount (client-only)
  useEffect(() => {
    const stored = localStorage.getItem('pragma-theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('pragma-theme', theme);
  }, [theme]);

  const toggle = () =>
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}
