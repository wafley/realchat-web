import { Outlet, Link, useLocation } from 'react-router-dom';
import { HeroImage } from '@/components/auth/HeroImage';

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';
  const isForgot = pathname === '/forgot-password';
  const isReset = pathname === '/reset-password';
  const isCentered = isRegister || isForgot || isReset;

  return (
    <div
      className="relative flex min-h-screen items-end justify-center p-4 sm:items-center"
      style={{ backgroundImage: 'url(/bg1.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#56586A' }}
    >
      {/* Top-left branding */}
      <div className="absolute left-0 top-0 flex w-full justify-center sm:justify-start">
        <img src="/icon1.png" alt="Hallo Wok" className="h-48 w-auto rounded-xl object-contain sm:h-40" />
      </div>

      <div
        id="auth-content"
        className={`auth-glass-card flex overflow-hidden ${isCentered ? 'mx-auto w-full max-w-[650px]' : 'w-full max-w-[1100px]'}`}
        style={{ minHeight: 480, borderRadius: 28 }}
      >
        {/* LEFT: Form section */}
        <div className={`flex flex-col p-10 ${isCentered ? 'w-full' : 'w-full md:w-[55%]'}`}>
          {/* Top: Logo + heading + badge */}
          <div className="mb-8">
            <h1 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl" style={{ color: '#FFFFFF' }}>
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
        {!isCentered && (
          <div className="hidden md:block md:w-[45%]">
            <HeroImage />
          </div>
        )}
      </div>
    </div>
  );
}
