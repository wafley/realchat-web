import { Outlet, Link, useLocation } from 'react-router-dom';
import { HeroImage } from '@/components/auth/HeroImage';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';
  const isForgot = pathname === '/forgot-password';
  const isReset = pathname === '/reset-password';

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundImage: 'url(/bg1.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#56586A' }}
    >
      <div
        id="auth-content"
        className="auth-glass-card flex w-full max-w-[1100px] overflow-hidden"
        style={{ minHeight: 480, borderRadius: 28 }}
      >
        {/* LEFT: Form section */}
        <div className="flex w-full flex-col p-10 md:w-[55%]">
          {/* Top: Logo + heading + badge */}
          <div className="mb-8">
            <h1 className="mb-3 text-3xl font-bold leading-tight" style={{ color: '#FFFFFF', fontSize: 32 }}>
              {isLogin
                ? 'Sign In to Hallo Wok'
                : isForgot
                  ? 'Forgot Password?'
                  : isReset
                    ? 'Reset Password'
                    : 'Create Account'}
            </h1>

            <div>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'rgba(47,140,255,0.12)', color: '#2F8CFF' }}>
                {isLogin ? 'Welcome Back' : isForgot ? 'Reset Access' : isReset ? 'New Password' : 'Get Started'}
              </span>
            </div>
          </div>

          {/* Form outlet */}
          <div className="flex min-h-0 flex-1 flex-col justify-center pt-4">
            <Outlet />
          </div>

          {/* Bottom: divider + register / sign-in link */}
          <div className="pt-2">
            <div className="mb-3 h-px w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <p className="text-center text-sm" style={{ color: '#9EA5B4' }}>
              {isLogin
                ? "Don't have an account? "
                : isForgot
                  ? "Remember your password? "
                  : isReset
                    ? ''
                    : 'Already have an account? '}
              {!isReset && (
                <Link to={isLogin ? '/register' : '/login'} className="font-medium" style={{ color: '#2F8CFF' }}>
                  {isLogin ? 'Register' : 'Sign In'}
                </Link>
              )}
            </p>
          </div>
        </div>

        {/* RIGHT: Hero section */}
        <div className="hidden md:block md:w-[45%]">
          <HeroImage />
        </div>
      </div>
    </div>
  );
}
