import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/authStore';
import { parseAuthError } from '@/services/auth';
import { InputField } from '@/components/auth/InputField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { getSocketUrl } from '@/lib/url';
import { registerSchema } from '@/lib/validations';
import type { z } from 'zod';

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setLoading(true);
    try {
      await register({
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        password: data.password,
      });
      if (DEV_MODE) {
        navigate('/', { replace: true });
      } else {
        setRegistered(true);
      }
    } catch (err) {
      console.error('Register failed:', err);
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mx-auto w-fit">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Check Your Email</h2>
          <p className="mt-1.5 text-xs text-neutral-400">
            We've sent a verification link to your email address. Please check your inbox and verify your account.
          </p>
          <p className="mt-2 text-[11px] text-neutral-500">
            Didn't see the email? Check your <span className="text-neutral-400 font-medium">spam / junk folder</span>.
          </p>
        </div>
        <Link
          to="/login"
          className="auth-btn-primary inline-flex items-center justify-center w-full"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3 text-left">
      <InputField
        id="username"
        type="text"
        placeholder="Username"
        autoComplete="username"
        maxLength={30}
        error={errors.username?.message}
        {...registerField('username')}
      />

      <InputField
        id="fullName"
        type="text"
        placeholder="Full name"
        autoComplete="name"
        maxLength={50}
        error={errors.fullName?.message}
        {...registerField('fullName')}
      />

      <InputField
        id="email"
        type="email"
        placeholder="Email address"
        autoComplete="email"
        error={errors.email?.message}
        {...registerField('email')}
      />

      <div className="relative">
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          autoComplete="new-password"
          className="auth-input-field w-full px-4 py-3 pr-10 text-sm"
          {...registerField('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          )}
        </button>
        {errors.password && (
          <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
        )}
      </div>

      <InputField
        id="confirmPassword"
        type={showPassword ? 'text' : 'password'}
        placeholder="Confirm password"
        autoComplete="off"
        error={errors.confirmPassword?.message}
        {...registerField('confirmPassword')}
      />

      {error && (
        <div className="rounded-xl px-3.5 py-2.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 text-center">
          {error}
        </div>
      )}

      <div className="pt-2">
        <PrimaryButton loading={loading} disabled={loading}>
          Sign up
        </PrimaryButton>
      </div>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-transparent px-3 text-neutral-500">or</span>
        </div>
      </div>

      {/* Google Register */}
      <button
        type="button"
        onClick={() => {
          window.location.href = `${getSocketUrl()}/api/auth/google`;
        }}
        className="auth-btn-secondary w-full flex items-center justify-center gap-2.5"
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign up with Google
      </button>
    </form>
  );
}

