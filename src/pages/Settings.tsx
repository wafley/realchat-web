import { useState } from 'react';
import { Moon, Sun, Monitor, Bell, Shield, Ban, Trash2 } from 'lucide-react';
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
    icon: Bell,
    items: [
      { label: 'Message notifications', enabled: true },
      { label: 'Group notifications', enabled: true },
      { label: 'Sound', enabled: false },
    ],
  },
  {
    title: 'Privacy',
    icon: Shield,
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
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <div className="px-6 pb-2 pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Appearance
            </h2>
          </div>
          <div className="mx-6 mb-6 flex gap-2 rounded-xl bg-card p-2">
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

          {sections.map((section) => (
            <div key={section.title} className="mb-6">
              <div className="px-6 pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h2>
              </div>
              <div className="mx-6 overflow-hidden rounded-xl bg-card">
                {section.items.map((item, i) => (
                  <div
                    key={item.label}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5',
                      i < section.items.length - 1 && 'border-b border-border/50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <section.icon size={18} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                    <button
                      onClick={() => toggle(item.label)}
                      className={cn(
                        'relative h-6 w-10 shrink-0 rounded-full transition-colors',
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

          <div className="mb-8 px-6">
            <div className="rounded-xl bg-card p-4">
              <div className="flex items-center gap-3">
                <Ban size={18} className="text-destructive" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">
                    Irreversible actions for your account
                  </p>
                </div>
              </div>
              <button className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
