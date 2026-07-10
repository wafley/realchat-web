import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
] as const;

type Theme = (typeof themes)[number]['id'];

export default function SettingsAppearance() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>('dark');

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
