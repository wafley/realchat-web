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

    const accessToken = params.get('accessToken') || params.get('token');
    const refreshToken = params.get('refreshToken');
    if (!accessToken) {
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

    try {
      const userRaw = params.get('user');
      if (userRaw) {
        const user = JSON.parse(decodeURIComponent(userRaw));
        useAuthStore.setState({ user, accessToken, isAuthenticated: true, isLoading: false });
        navigate('/', { replace: true });
        return;
      }
    } catch {}

    authService
      .getMe()
      .then((user) => {
        useAuthStore.setState({ user, accessToken, isAuthenticated: true, isLoading: false });
        navigate('/', { replace: true });
      })
      .catch(() => {
        localStorage.clear();
        navigate('/login', { replace: true });
      });
  }, [navigate, params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
}
