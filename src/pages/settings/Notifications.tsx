import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Monitor, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadPrefs, savePrefs, getPermission, requestPermission, isNotificationSupported } from '@/services/notification';
import type { NotificationPrefs } from '@/services/notification';
import { requestNotificationPermission, registerPushDevice, isOneSignalSupported } from '@/services/onesignal';

export default function SettingsNotifications() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [desktopGranted, setDesktopGranted] = useState(getPermission() === 'granted');

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleDesktopToggle = async () => {
    if (desktopGranted) return;
    let permission = 'denied';
    if (isOneSignalSupported()) {
      const ok = await requestNotificationPermission();
      permission = ok ? 'granted' : 'denied';
      if (ok) {
        await registerPushDevice();
      }
    } else {
      permission = await requestPermission();
    }
    setDesktopGranted(permission === 'granted');
  };

  const items: { label: string; key: keyof NotificationPrefs; icon: typeof Bell }[] = [
    { label: 'Message notifications', key: 'messages', icon: Bell },
    { label: 'Group notifications', key: 'groups', icon: Bell },
    { label: 'Sound', key: 'sound', icon: Volume2 },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Notifications</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="hidden text-muted-foreground transition-colors hover:text-accent md:flex"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">Notifications</h2>
              <p className="text-sm text-muted-foreground">Control how you get notified</p>
            </div>
          </div>

          <div className="mb-4 overflow-hidden rounded-xl bg-card">
            {items.map((item, i) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center justify-between px-4 py-3.5',
                  i < items.length - 1 && 'border-b border-border/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  className={cn(
                    'relative h-6 w-10 shrink-0 rounded-full transition-colors',
                    prefs[item.key] ? 'bg-accent' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                      prefs[item.key] && 'translate-x-4',
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl bg-card">
            <div className="flex items-center justify-between px-4 py-3.5">
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
                  'relative h-6 w-10 shrink-0 rounded-full transition-colors',
                  desktopGranted ? 'bg-accent' : 'bg-muted',
                  (!isNotificationSupported()) && 'cursor-not-allowed opacity-50',
                )}
              >
                <span
                  className={cn(
                    'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    desktopGranted && 'translate-x-4',
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
