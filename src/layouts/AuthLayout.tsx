import { Outlet, Link, useLocation } from 'react-router-dom';

export default function AuthLayout() {
  const { pathname } = useLocation();

  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';
  const isForgot = pathname === '/forgot-password';

  return (
    <div className="auth-page-bg relative min-h-screen flex flex-col justify-between items-center p-6 sm:p-10 font-sans overflow-hidden">
      {/* Background Image (mica silver, grayscale) */}
      <img
        src="/wallpaper-auth.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.06] object-cover grayscale blur-[6px] brightness-[0.62] contrast-105"
      />

      {/* Silver Mica Tint Overlay */}
      <div className="auth-mica-tint pointer-events-none absolute inset-0" />

      {/* Background Ambient Glow Orbs (neutral silver, no hue) */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.05] blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-neutral-200/[0.04] blur-[150px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-[160px]" />

      {/* Full-screen Diagonal Light Sheen Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />

      {/* Main Content Area (Merged Directly into Mica Backdrop) */}
      <div className="relative z-10 my-auto w-full max-w-[410px] mx-auto flex flex-col items-center text-center py-8">
        {/* Dynamic Titles */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">
          {isLogin
            ? 'Yooo, welcome back!'
            : isRegister
              ? 'Create your account'
              : isForgot
                ? 'Forgot password?'
                : 'Reset password'}
        </h1>

        <p className="text-sm text-neutral-400 mb-8">
          {isLogin ? (
            <>
              First time here?{' '}
              <Link to="/register" className="text-white font-medium hover:underline">
                Sign up for free
              </Link>
            </>
          ) : isRegister ? (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-white font-medium hover:underline">
                Sign in
              </Link>
            </>
          ) : isForgot ? (
            <>
              Remember your password?{' '}
              <Link to="/login" className="text-white font-medium hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            'Enter your new credentials below'
          )}
        </p>

        {/* Outlet Form */}
        <div className="w-full">
          <Outlet />
        </div>
      </div>

      {/* Footer Legal Terms */}
      <div className="relative z-10 w-full text-center py-2">
        <p className="text-[11px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
          You acknowledge that you read, and agree, to our{' '}
          <a href="#" className="underline text-neutral-400 hover:text-white transition-colors">
            Terms of Service
          </a>{' '}
          and our{' '}
          <a href="#" className="underline text-neutral-400 hover:text-white transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}



