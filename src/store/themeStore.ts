import { create } from 'zustand';

type ThemeMode = 'dark' | 'light' | 'system';
export type FontSize = 'small' | 'default' | 'large';
export type AccentColor =
  | 'blue'
  | 'green'
  | 'teal'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'indigo';

export const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: '#3b82f6',
  green: '#10b981',
  teal: '#14b8a6',
  purple: '#a855f7',
  pink: '#ec4899',
  red: '#ef4444',
  orange: '#f97316',
  indigo: '#6366f1',
};

export const FONT_SIZES: Record<FontSize, number> = {
  small: 0.875,
  default: 1,
  large: 1.125,
};

interface ThemeState {
  mode: ThemeMode;
  theme: 'dark' | 'light';
  fontSize: FontSize;
  accentColor: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSize) => void;
  setAccentColor: (color: AccentColor) => void;
}

const THEME_KEY = 'hallo-wok-theme';
const FONT_SIZE_KEY = 'hallo-wok-font-size';
const ACCENT_KEY = 'hallo-wok-accent';

let currentMode: ThemeMode = 'dark';

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  return 'dark';
}

function getInitialFontSize(): FontSize {
  const stored = localStorage.getItem(FONT_SIZE_KEY);
  if (stored === 'small' || stored === 'default' || stored === 'large') return stored;
  return 'default';
}

function getInitialAccentColor(): AccentColor {
  const stored = localStorage.getItem(ACCENT_KEY) as AccentColor | null;
  if (stored && stored in ACCENT_COLORS) return stored;
  return 'blue';
}

function applyTheme(mode: ThemeMode) {
  currentMode = mode;
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.classList.toggle('light', resolved === 'light');
  localStorage.setItem(THEME_KEY, mode);
}

function applyFontSize(size: FontSize) {
  const scale = FONT_SIZES[size];
  document.documentElement.style.setProperty('--font-scale', String(scale));
  localStorage.setItem(FONT_SIZE_KEY, size);
}

function applyAccentColor(color: AccentColor) {
  const hex = ACCENT_COLORS[color];
  const root = document.documentElement;
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--ring', hex);
  root.style.setProperty('--chat-outgoing-bg', hex);
  localStorage.setItem(ACCENT_KEY, color);
}

export function initTheme() {
  applyTheme(getInitialMode());
  applyFontSize(getInitialFontSize());
  applyAccentColor(getInitialAccentColor());
}

function watchSystemTheme() {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (currentMode === 'system') {
      applyTheme('system');
    }
  };
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
  } else {
    mql.addListener(onChange);
  }
}

export const useThemeStore = create<ThemeState>((set) => {
  const initialMode = getInitialMode();
  const initialFontSize = getInitialFontSize();
  const initialAccent = getInitialAccentColor();

  initTheme();
  watchSystemTheme();

  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === THEME_KEY || e.key === FONT_SIZE_KEY || e.key === ACCENT_KEY) {
      const nextMode = getInitialMode();
      initTheme();
      set({
        mode: nextMode,
        theme: nextMode === 'system' ? getSystemTheme() : nextMode,
        fontSize: getInitialFontSize(),
        accentColor: getInitialAccentColor(),
      });
    }
  });

  return {
    mode: initialMode,
    theme: initialMode === 'system' ? getSystemTheme() : initialMode,
    fontSize: initialFontSize,
    accentColor: initialAccent,
    setMode: (mode) => {
      applyTheme(mode);
      set({ mode, theme: mode === 'system' ? getSystemTheme() : mode });
    },
    setFontSize: (size) => {
      applyFontSize(size);
      set({ fontSize: size });
    },
    setAccentColor: (color) => {
      applyAccentColor(color);
      set({ accentColor: color });
    },
  };
});
