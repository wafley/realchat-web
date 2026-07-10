import { create } from 'zustand';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  mode: ThemeMode;
  theme: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'hallo-wok-theme';

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  return 'dark';
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.classList.toggle('light', resolved === 'light');
  localStorage.setItem(STORAGE_KEY, mode);
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialMode();
  applyTheme(initial);

  if (initial === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      applyTheme('system');
    });
  }

  return {
    mode: initial,
    theme: initial === 'system' ? getSystemTheme() : initial,
    setMode: (mode) => {
      applyTheme(mode);
      set({ mode, theme: mode === 'system' ? getSystemTheme() : mode });
    },
  };
});
