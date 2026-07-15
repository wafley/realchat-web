import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  settingsMobileHeader,
  settingsDesktopHeader,
  settingsBackButton,
} from '@/lib/styles';

interface SettingsHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SettingsHeader({ title, subtitle }: SettingsHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      <div className={settingsMobileHeader()}>
        <button
          onClick={() => navigate(-1)}
          className={settingsBackButton()}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="page-content mx-auto max-w-4xl p-6">
          <div className={settingsDesktopHeader()}>
            <button
              onClick={() => navigate(-1)}
              className="hidden text-muted-foreground transition-colors hover:text-accent md:flex"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
