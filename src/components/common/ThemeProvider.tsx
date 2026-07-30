import { useEffect, type ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Theme is managed by themeStore.applyTheme() on init and setMode().
    // Font size and accent color are managed by themeStore on init and setters.
    // This provider ensures children render after DOM is ready.
  }, []);

  return <>{children}</>;
}
