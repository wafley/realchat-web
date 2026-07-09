import { Sun, Bell, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  { to: '/settings/notifications', icon: Bell, label: 'Notifications', desc: 'Message, group, and sound preferences' },
  { to: '/settings/privacy', icon: Shield, label: 'Privacy', desc: 'Online status, read receipts' },
  { to: '/settings/appearance', icon: Sun, label: 'Appearance', desc: 'Theme preferences' },
  { to: '/settings/account', icon: AlertTriangle, label: 'Account', desc: 'Danger zone and account management' },
];

export default function SettingsGeneral() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4 md:hidden">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <h2 className="mb-1 text-lg font-bold text-foreground">General</h2>
          <p className="mb-6 text-sm text-muted-foreground">Manage your account and preferences</p>

          <div className="space-y-2">
            {sections.map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-accent/5"
              >
                <Icon size={22} className="text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
