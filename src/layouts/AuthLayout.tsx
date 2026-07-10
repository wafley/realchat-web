import { Outlet, Link, useLocation } from 'react-router-dom';
import MagicRings from '@/components/common/MagicRings';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <>
      <a href="#auth-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground">
        Skip to content
      </a>
      <MagicRings />
      <div id="auth-content" className="relative z-10 flex min-h-screen flex-col items-center bg-transparent px-4 pt-20">
        <img src="/logo1.png" alt="Hallo Wok" className="h-48 -mb-8 animate-[fade-in-up_0.6s_ease-out]" />
        <div className="w-full max-w-md animate-[scale-in_0.5s_ease-out] rounded-lg border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-card-foreground">Hallo Wok</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? "We're excited to have you back" : 'Create your account'}
            </p>
          </div>
          <Outlet />
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                Need an account?{' '}
                <Link to="/register" className="font-medium text-accent hover:underline">
                  Register
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-accent hover:underline">
                  Sign In
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
