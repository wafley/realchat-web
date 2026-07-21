import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Monitor, Type, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore, ACCENT_COLORS, FONT_SIZES, type FontSize, type AccentColor } from '@/store/themeStore';

const modes = [
  { id: 'dark' as const, label: 'Dark', icon: Moon },
  { id: 'light' as const, label: 'Light', icon: Sun },
  { id: 'system' as const, label: 'System', icon: Monitor },
];

const fontSizes: { id: FontSize; label: string; preview: string }[] = [
  { id: 'small', label: 'Small', preview: 'Aa' },
  { id: 'default', label: 'Default', preview: 'Aa' },
  { id: 'large', label: 'Large', preview: 'Aa' },
];

export default function SettingsAppearance() {
  const navigate = useNavigate();
  const { mode, setMode, fontSize, setFontSize, accentColor, setAccentColor } = useThemeStore();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Appearance</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hidden text-muted-foreground transition-colors hover:text-accent md:flex">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">Appearance</h2>
              <p className="text-sm text-muted-foreground">Customize the look and feel</p>
            </div>
          </div>

          <div className="flex gap-2 rounded-xl bg-card p-2">
            {modes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  mode === id
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Type size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Font Size</h3>
            </div>
            <div className="flex gap-2 rounded-xl bg-card p-2">
              {fontSizes.map(({ id, label, preview }) => (
                <button
                  key={id}
                  onClick={() => setFontSize(id)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-lg px-4 py-3 transition-colors',
                    fontSize === id
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span
                    className="font-bold leading-none"
                    style={{ fontSize: `${FONT_SIZES[id] * 1.25}rem` }}
                  >
                    {preview}
                  </span>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Palette size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Accent Color</h3>
            </div>
            <div className="rounded-xl bg-card p-4">
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {(Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(([id, hex]) => (
                  <button
                    key={id}
                    onClick={() => setAccentColor(id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors',
                      accentColor === id
                        ? 'bg-accent/15 ring-2 ring-accent'
                        : 'hover:bg-accent/5',
                    )}
                    title={id.charAt(0).toUpperCase() + id.slice(1)}
                  >
                    <span
                      className="h-8 w-8 rounded-full shadow-inner transition-transform hover:scale-110"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-[10px] capitalize text-muted-foreground">{id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
