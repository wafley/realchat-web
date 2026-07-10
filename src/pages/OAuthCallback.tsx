import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import * as authService from '@/services/auth';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = params.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('token', token);

    try {
      const userRaw = params.get('user');
      if (userRaw) {
        const user = JSON.parse(decodeURIComponent(userRaw));
        useAuthStore.setState({ user, token, isAuthenticated: true, isLoading: false });
        navigate('/', { replace: true });
        return;
      }
    } catch {}

    authService
      .getMe()
      .then((user) => {
        useAuthStore.setState({ user, token, isAuthenticated: true, isLoading: false });
        navigate('/', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      });
  }, [navigate, params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
