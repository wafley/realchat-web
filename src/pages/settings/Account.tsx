import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, Trash2 } from 'lucide-react';

export default function SettingsAccount() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Account</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hidden text-muted-foreground transition-colors hover:text-accent md:flex">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">Account</h2>
              <p className="text-sm text-muted-foreground">Manage your account</p>
            </div>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-card p-4">
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
  );
}
