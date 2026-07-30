import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { loadPrefs, savePrefs } from '@/services/notification';

export default function NotificationsContent() {
  const [prefs, setPrefs] = useState(loadPrefs);
  useEffect(() => { savePrefs(prefs); }, [prefs]);
  const toggle = (key: 'messages' | 'groups' | 'sound') => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  return (
    <div className="space-y-3">
      {[
        { key: 'messages' as const, label: 'Message notifications' },
        { key: 'groups' as const, label: 'Group notifications' },
        { key: 'sound' as const, label: 'Sound' },
      ].map(({ key, label }) => (
        <label key={key} className="flex items-center justify-between">
          <span className="text-sm text-foreground">{label}</span>
          <button
            onClick={() => toggle(key)}
            className={cn(
              'relative h-5 w-9 rounded-full transition-colors',
              prefs[key] ? 'bg-accent' : 'bg-muted-foreground/30',
            )}
          >
            <span className={cn(
              'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
              prefs[key] && 'translate-x-4',
            )} />
          </button>
        </label>
      ))}
    </div>
  );
}
