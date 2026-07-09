import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] p-4">
      <div className="w-full max-w-md rounded-lg bg-[#1E293B] p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-[#F8FAFC]">Hallo Wok</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">We're excited to have you back</p>
        </div>
        <Outlet />
        <p className="mt-6 text-center text-sm text-[#94A3B8]">
          Need an account?{' '}
          <Link to="/register" className="font-medium text-[#F59E0B] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
