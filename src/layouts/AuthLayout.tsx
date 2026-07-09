import { Outlet, Link, useLocation } from 'react-router-dom';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-2xl">
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
              <Link to="/register" className="font-medium text-primary hover:underline">
                Register
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign In
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
