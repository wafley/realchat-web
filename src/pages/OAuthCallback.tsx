import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { HalloWokLogo } from '@/components/auth/AuthBrand';
import * as authService from '@/services/auth';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('accessToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

    authService
      .getMe()
      .then((user) => {
        useAuthStore.setState({ user, token, isAuthenticated: true, isLoading: false });
        navigate('/', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [navigate, params]);

  return (
    <div className="auth-page-bg flex min-h-[100dvh] items-center justify-center p-6">
      <div className="auth-surface-shadow flex flex-col items-center gap-3 rounded-3xl bg-[var(--auth-panel)] px-8 py-9 text-center">
        <HalloWokLogo className="h-12 w-12" showSparkle />
        <Loader2 className="mt-1 h-5 w-5 animate-spin text-[#2563EB]" />
        <div>
          <p className="text-sm font-semibold text-[var(--auth-ink)]">Signing you in…</p>
          <p className="mt-0.5 text-xs text-[var(--auth-muted)]">
            Just a moment while we get your chats ready.
          </p>
        </div>
      </div>
    </div>
  );
}
