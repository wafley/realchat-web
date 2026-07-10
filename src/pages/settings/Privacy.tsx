import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Show online status', enabled: true },
  { label: 'Read receipts', enabled: true },
];

export default function SettingsPrivacy() {
  const navigate = useNavigate();
  const [toggles, setToggles] = useState(
    Object.fromEntries(items.map((i) => [i.label, i.enabled])),
  );
  const toggle = (label: string) => setToggles((p) => ({ ...p, [label]: !p[label] }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Privacy</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hidden text-muted-foreground transition-colors hover:text-accent md:flex">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">Privacy</h2>
              <p className="text-sm text-muted-foreground">Control your privacy settings</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-card">
            {items.map((item, i) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center justify-between px-4 py-3.5',
                  i < items.length - 1 && 'border-b border-border/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-muted-foreground" />
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
      </div>
    </div>
  );
}
