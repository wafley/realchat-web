import { useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
] as const;

type Theme = (typeof themes)[number]['id'];

const sections = [
  {
    title: 'Notifications',
    items: [
      { label: 'Message notifications', enabled: true },
      { label: 'Group notifications', enabled: true },
      { label: 'Sound', enabled: false },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { label: 'Show online status', enabled: true },
      { label: 'Read receipts', enabled: true },
    ],
  },
];

export default function Settings() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [toggles, setToggles] = useState(
    Object.fromEntries(sections.flatMap((s) => s.items.map((i) => [i.label, i.enabled]))),
  );

  const toggle = (label: string) => setToggles((p) => ({ ...p, [label]: !p[label] }));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-md space-y-8">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Appearance</h2>
            <div className="flex gap-2">
              {themes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                    theme === id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted-foreground hover:border-accent/50',
                  )}
                >
                  <Icon size={24} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <span className="text-sm text-foreground">{item.label}</span>
                    <button
                      onClick={() => toggle(item.label)}
                      className={cn(
                        'relative h-6 w-10 rounded-full transition-colors',
                        toggles[item.label] ? 'bg-accent' : 'bg-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                          toggles[item.label] && 'translate-x-4',
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Irreversible actions for your account
            </p>
            <button className="mt-3 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
