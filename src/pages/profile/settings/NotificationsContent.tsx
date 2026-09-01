import { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadPrefs, savePrefs, getPermission, isNotificationSupported } from '@/services/notification';
import { requestNotificationPermission, registerPushDevice, isOneSignalSupported } from '@/services/onesignal';

export default function NotificationsContent() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [desktopGranted, setDesktopGranted] = useState(getPermission() === 'granted');
  useEffect(() => { savePrefs(prefs); }, [prefs]);
  const toggle = (key: 'messages' | 'groups' | 'sound') => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleDesktopToggle = async () => {
    if (desktopGranted) return;
    // Prioritaskan OneSignal (membuat subscription push web yang dapat ditarget),
    // fallback ke requestPermission native bila OneSignal tidak tersedia.
    let permission = 'denied';
    if (isOneSignalSupported()) {
      const ok = await requestNotificationPermission();
      permission = ok ? 'granted' : 'denied';
      if (ok) {
        await registerPushDevice();
      }
    } else {
      const { requestPermission } = await import('@/services/notification');
      permission = await requestPermission();
    }
    setDesktopGranted(permission === 'granted');
  };

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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor size={18} className="text-muted-foreground" />
          <div>
            <span className="text-sm text-foreground">Desktop notifications</span>
            <p className="text-xs text-muted-foreground">
              {!isNotificationSupported()
                ? 'Not supported in this browser'
                : desktopGranted
                  ? 'Notifications are enabled'
                  : 'Receive notifications even when the tab is inactive'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDesktopToggle}
          disabled={desktopGranted || !isNotificationSupported()}
          className={cn(
            'relative h-5 w-9 rounded-full transition-colors',
            desktopGranted ? 'bg-accent' : 'bg-muted-foreground/30',
            !isNotificationSupported() && 'cursor-not-allowed opacity-50',
          )}
        >
          <span
            className={cn(
              'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
              desktopGranted && 'translate-x-4',
            )}
          />
        </button>
      </div>
    </div>
  );
}
