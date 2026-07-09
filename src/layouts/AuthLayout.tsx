import { Outlet, Link, useLocation } from 'react-router-dom';
import MagicRings from '@/components/common/MagicRings';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <>
      <MagicRings />
      <div className="relative z-10 flex min-h-screen items-center justify-center bg-transparent p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-sm">
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
