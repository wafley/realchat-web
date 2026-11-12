import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AuthThemeToggle, HalloWokLogo, SparkleAccent } from '@/components/auth/AuthBrand';
import { AuthHero } from '@/components/auth/AuthHero';

interface AuthPageCopy {
  subtitle: string;
  heroTagline: string;
}

const DEFAULT_AUTH_COPY: AuthPageCopy = {
  subtitle: 'Welcome to HalloWok.',
  heroTagline: 'Chat effortlessly, anywhere, with anyone.',
};

const AUTH_PAGE_COPY: Record<string, AuthPageCopy> = {
  '/login': {
    subtitle: 'Good to see you again! Sign in to continue.',
    heroTagline: 'Chat effortlessly, anywhere, with anyone.',
  },
  '/register': {
    subtitle: 'Join HalloWok and start chatting in seconds.',
    heroTagline: 'Your new favorite place to hang out and chat.',
  },
  '/forgot-password': {
    subtitle: "Forgot your password? We've got you covered.",
    heroTagline: "Happens to the best of us—let's get you back in.",
  },
  '/reset-password': {
    subtitle: 'Pick a new password to keep your account safe.',
    heroTagline: 'Fresh password, same cozy space waiting for you.',
  },
  '/verify-email': {
    subtitle: 'Confirming your email so you can jump right in.',
    heroTagline: 'One quick tap and your chats are good to go.',
  },
};

/** Responsive editorial auth shell: split card on desktop, stacked overlap sheet on mobile. */
export default function AuthLayout() {
  const { pathname } = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Guard: already authenticated -> go home (prevents /login flash after login)
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const copy = AUTH_PAGE_COPY[pathname] ?? DEFAULT_AUTH_COPY;
  const isRegister = pathname === '/register';

  return (
    <div className="auth-page-bg relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden md:items-center md:justify-center md:p-6 lg:p-10">
      {/* Desktop outer canvas decorations */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 hidden overflow-hidden md:block"
      >
        <div className="absolute -right-28 -top-28 h-[420px] w-[420px] rounded-full border-[56px] border-[var(--auth-canvas-ring)]" />
        <div className="absolute -bottom-36 -left-24 h-[460px] w-[460px] rounded-full border-[64px] border-[var(--auth-canvas-ring)]" />
        <SparkleAccent className="absolute right-[8%] top-[10%] h-7 w-7 text-[var(--auth-link)]/75" />
        <SparkleAccent className="absolute bottom-[10%] left-[7%] h-7 w-7 text-[var(--auth-link)]/75" />
      </div>

      {/* Main auth container: full-bleed stack on mobile, centered split card on desktop */}
      <div className="auth-card-shell relative z-10 flex w-full flex-1 flex-col md:grid md:max-w-[920px] md:flex-none md:grid-cols-[1.14fr_0.96fr] md:overflow-hidden md:rounded-[26px]">
        <AuthHero tagline={copy.heroTagline} compactMobile={isRegister} />

        {/* Form sheet (overlaps hero on mobile so the cat peeks above it) */}
        <div className="relative z-10 -mt-4 flex flex-1 flex-col justify-between overflow-hidden rounded-t-[28px] border-t border-[var(--auth-card-border)] bg-[var(--auth-panel)] px-6 pt-5 pb-[max(calc(env(safe-area-inset-bottom,0px)+1rem),1.25rem)] transition-colors duration-200 md:mt-0 md:rounded-none md:border-t-0 md:px-9 md:py-9 lg:px-11">
          {/* Theme toggle button */}
          <AuthThemeToggle className="absolute right-5 top-4 z-20 md:right-6 md:top-6" />

          {/* Subtle organic background shapes inside the form panel */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-10 h-44 w-44 rounded-full bg-[var(--auth-blob)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[var(--auth-blob)]"
          />

          <div className="relative z-10 mx-auto my-auto flex w-full max-w-[330px] flex-col items-center text-center">
            <HalloWokLogo
              className={`h-11 w-11 md:h-14 md:w-14 ${isRegister ? 'hidden md:block' : ''}`}
              showSparkle
            />

            <h1
              className={`text-[21px] font-bold tracking-tight text-[var(--auth-ink)] md:mt-2.5 md:text-[23px] ${
                isRegister ? 'mt-0' : 'mt-2'
              }`}
            >
              {isRegister ? (
                <>
                  <span className="md:hidden">Create account</span>
                  <span className="hidden md:inline">HalloWok</span>
                </>
              ) : (
                'HalloWok'
              )}
            </h1>
            <p className="mt-0.5 text-[13px] leading-snug text-[var(--auth-muted)] md:mt-1">
              {copy.subtitle}
            </p>

            <div className={`w-full md:mt-6 ${isRegister ? 'mt-3.5' : 'mt-4'}`}>
              <Outlet />
            </div>
          </div>

          <p className="relative z-10 mx-auto mt-6 hidden max-w-[300px] text-center text-[11px] leading-relaxed text-[var(--auth-subtle)] md:block">
            By continuing, you agree to our{' '}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="underline decoration-[var(--auth-border)] underline-offset-2 transition-colors hover:text-[var(--auth-ink)]"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="underline decoration-[var(--auth-border)] underline-offset-2 transition-colors hover:text-[var(--auth-ink)]"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
