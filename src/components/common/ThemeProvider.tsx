import { type ReactNode } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function ThemeProvider({ children }: { children: ReactNode }) {
  useThemeStore();
  return <>{children}</>;
}