import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';

export default function AppearanceContent() {
  const { mode, setMode, fontSize, setFontSize } = useThemeStore();
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
    </div>
  );
}
