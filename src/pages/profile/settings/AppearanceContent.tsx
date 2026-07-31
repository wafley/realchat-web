import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore, ACCENT_COLORS, type AccentColor } from '@/store/themeStore';

export default function AppearanceContent() {
  const { mode, setMode, fontSize, setFontSize, accentColor, setAccentColor } = useThemeStore();
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Theme</p>
        <div className="flex gap-1.5 rounded-lg bg-muted/50 p-1">
          {[{ id: 'dark' as const, label: 'Dark', icon: Moon }, { id: 'light' as const, label: 'Light', icon: Sun }, { id: 'system' as const, label: 'System', icon: Monitor }].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setMode(id)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors', mode === id ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Font Size</p>
        <div className="flex gap-1.5 rounded-lg bg-muted/50 p-1">
          {[{ id: 'small' as const, label: 'Small' }, { id: 'default' as const, label: 'Default' }, { id: 'large' as const, label: 'Large' }].map(({ id, label }) => (
            <button key={id} onClick={() => setFontSize(id)} className={cn('flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors', fontSize === id ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Palette size={16} className="text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">Accent Color</p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(([id, hex]) => (
            <button
              key={id}
              onClick={() => setAccentColor(id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md p-2 transition-colors',
                accentColor === id
                  ? 'bg-accent/15 ring-1 ring-accent'
                  : 'hover:bg-accent/5',
              )}
              title={id.charAt(0).toUpperCase() + id.slice(1)}
            >
              <span
                className="h-6 w-6 rounded-full shadow-inner"
                style={{ backgroundColor: hex }}
              />
              <span className="text-[10px] capitalize text-muted-foreground">{id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
