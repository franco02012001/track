'use client';

import { useTheme } from '@/context/ThemeContext';

export default function FloatingThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleClick = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    // Apply to DOM immediately so theme changes right away
    applyTheme(next);
    toggleTheme();
  };

  function applyTheme(theme: 'light' | 'dark') {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.className = theme === 'dark' ? 'dark overflow-x-hidden' : 'overflow-x-hidden';
    try {
      localStorage.setItem('theme', theme);
    } catch (_) {}
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed z-[100] flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200/60 bg-white/40 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white/60 hover:border-slate-300/80 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/50 dark:border-dark-border dark:bg-dark-card-bg/60 dark:hover:bg-dark-hover dark:focus:ring-dark-border"
      style={{
        bottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        right: 'max(1.5rem, env(safe-area-inset-right))',
      }}
    >
      {theme === 'dark' ? (
        <svg className="h-5 w-5 dark:text-dark-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
