import { Moon, Sun } from 'lucide-react';
import { getApiUrl, isNativeApp } from '@/lib/url';
import { useThemeStore } from '@/store/themeStore';

interface LogoProps {
  className?: string;
  showSparkle?: boolean;
}

/** Brand cat-mascot mark with an optional sparkle accent. */
export function HalloWokLogo({ className = 'h-8 w-8', showSparkle = false }: LogoProps) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <img
        src="/logo1.png"
        alt="HalloWok"
        className={`select-none object-contain ${className}`}
        draggable={false}
      />
      {showSparkle && (
        <SparkleAccent className="absolute -right-1.5 -top-0.5 h-3.5 w-3.5 text-[var(--auth-link)]" />
      )}
    </span>
  );
}

interface SparkleAccentProps {
  className?: string;
}

/** Four-point sparkle accent used across auth canvas and headers. */
export function SparkleAccent({ className = 'h-4 w-4 text-[var(--auth-link)]' }: SparkleAccentProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 1.5C12.75 7.4 16.6 11.25 22.5 12C16.6 12.75 12.75 16.6 12 22.5C11.25 16.6 7.4 12.75 1.5 12C7.4 11.25 11.25 7.4 12 1.5Z" />
    </svg>
  );
}

/** Compact theme switcher synced with the global theme store. */
export function AuthThemeToggle({ className = '' }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const setMode = useThemeStore((s) => s.setMode);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--auth-border)] bg-[var(--auth-toggle-bg)] text-[var(--auth-muted)] transition-colors hover:border-[var(--auth-border-hover)] hover:text-[var(--auth-ink)] ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

/** Transparent-background horizontal divider with centered text label. */
export function AuthDivider({
  label = 'or',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-[var(--auth-border)]" />
      <span className="text-xs text-[var(--auth-subtle)]">{label}</span>
      <div className="h-px flex-1 bg-[var(--auth-border)]" />
    </div>
  );
}

interface GoogleAuthButtonProps {
  label?: string;
  className?: string;
}

/** Shared Google OAuth button supporting both web redirects and native Capacitor tabs. */
export function GoogleAuthButton({ label = 'Sign in with Google', className = '' }: GoogleAuthButtonProps) {
  const handleGoogleAuth = async () => {
    const base = getApiUrl().replace(/\/api\/?$/, '');
    const url = `${base}/api/auth/google${isNativeApp() ? '?native=1' : ''}`;
    if (isNativeApp()) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    } else {
      window.location.href = url;
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      className={`auth-btn-secondary mx-auto flex w-full max-w-[250px] items-center justify-center gap-2.5 px-5 ${className}`}
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
