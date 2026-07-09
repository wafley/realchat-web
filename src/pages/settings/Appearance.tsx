import { useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
] as const;

type Theme = (typeof themes)[number]['id'];

export default function SettingsAppearance() {
  const [theme, setTheme] = useState<Theme>('dark');

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4 md:hidden">
        <h1 className="text-xl font-bold text-foreground">Appearance</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <h2 className="mb-1 text-lg font-bold text-foreground">Appearance</h2>
          <p className="mb-6 text-sm text-muted-foreground">Customize the look and feel</p>

          <div className="flex gap-2 rounded-xl bg-card p-2">
            {themes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  theme === id
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
