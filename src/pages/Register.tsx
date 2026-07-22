import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/authStore';
import { parseAuthError } from '@/services/auth';
import { InputField } from '@/components/auth/InputField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { registerSchema } from '@/lib/validations';
import type { z } from 'zod';

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

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
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Register failed:', err);
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col">
      {/* Inputs — top */}
      <div className="space-y-4">
        <InputField
          label="Username"
          id="username"
          type="text"
          placeholder="johndoe"
          autoComplete="username"
          error={errors.username?.message}
          {...registerField('username')}
        />

        <InputField
          label="Full Name"
          id="fullName"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          error={errors.fullName?.message}
          {...registerField('fullName')}
        />

        <InputField
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...registerField('email')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: '#9EA5B4' }}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              autoComplete="new-password"
              className="auth-input-field w-full px-4 py-3 pr-12 text-sm"
              {...registerField('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#9EA5B4' }}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs" style={{ color: '#ef4444' }}>{errors.password.message}</p>
          )}
        </div>

        <InputField
          label="Confirm Password"
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repeat your password"
          autoComplete="off"
          error={errors.confirmPassword?.message}
          {...registerField('confirmPassword')}
        />

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            {error}
          </div>
        )}
      </div>

      {/* Button — bottom */}
      <div className="pt-4">
        <PrimaryButton loading={loading} disabled={loading}>
          Create Account
        </PrimaryButton>
      </div>
    </form>
  );
}
