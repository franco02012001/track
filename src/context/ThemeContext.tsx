'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const HTML_CLASS_LIGHT = 'overflow-x-hidden';
const HTML_CLASS_DARK = 'dark overflow-x-hidden';

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.className = theme === 'dark' ? HTML_CLASS_DARK : HTML_CLASS_LIGHT;
  try {
    localStorage.setItem('theme', theme);
  } catch (_) {}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // On mount: read saved theme (or system preference) and set state
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial: Theme = prefersDark ? 'dark' : 'light';
      setThemeState(initial);
      applyTheme(initial);
    }
    setMounted(true);
  }, []);

  // Apply theme to <html> and persist whenever theme state changes (sync before paint)
  useLayoutEffect(() => {
    applyTheme(theme);
    // Re-apply after a tick in case React hydration overwrote the class
    const t = setTimeout(() => applyTheme(theme), 0);
    return () => clearTimeout(t);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = { theme, toggleTheme, setTheme };

  // Always provide context so useTheme() works during SSR/prerender (e.g. settings page).
  // Before mount we use default 'light'; after mount we read from localStorage/system.
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
