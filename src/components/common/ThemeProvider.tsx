import { useEffect, type ReactNode } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    if (mode === 'system') {
      const handler = () => {
        const resolved = mq.matches ? 'dark' : 'light';
        document.documentElement.classList.toggle('light', resolved === 'light');
      };
      handler();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [mode]);

  return children;
}
