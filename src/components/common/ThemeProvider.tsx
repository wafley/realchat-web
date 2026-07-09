import { useEffect, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const theme = (localStorage.getItem('theme') as Theme) || 'system';
    const root = document.documentElement;

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      root.classList.toggle('dark', mq.matches);
      const handler = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }

    root.classList.toggle('dark', theme === 'dark');
  }, []);

  return children;
}
