import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Bell, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  { to: '/settings/notifications', icon: Bell, label: 'Notifications', desc: 'Message, group, and sound preferences' },
  { to: '/settings/privacy', icon: Shield, label: 'Privacy', desc: 'Online status, read receipts' },
  { to: '/settings/appearance', icon: Sun, label: 'Appearance', desc: 'Theme preferences' },
  { to: '/settings/account', icon: AlertTriangle, label: 'Account', desc: 'Danger zone and account management' },
];

export default function SettingsGeneral() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hidden text-muted-foreground transition-colors hover:text-accent md:flex">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">General</h2>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>

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
