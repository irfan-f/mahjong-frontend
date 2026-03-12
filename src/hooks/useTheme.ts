import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme';

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system')
    return stored;
  const legacy = localStorage.getItem('darkMode');
  if (legacy === 'true') {
    localStorage.removeItem('darkMode');
    localStorage.setItem(THEME_KEY, 'dark');
    return 'dark';
  }
  if (legacy === 'false') {
    localStorage.removeItem('darkMode');
    localStorage.setItem(THEME_KEY, 'light');
    return 'light';
  }
  return 'system';
}

function applyTheme(theme: Theme): void {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme('system');
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    if (next === 'light') {
      localStorage.setItem(THEME_KEY, 'light');
    } else if (next === 'dark') {
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      localStorage.removeItem(THEME_KEY);
    }
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
