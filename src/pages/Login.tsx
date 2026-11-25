import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { parseAuthError } from '@/services/auth';
import { InputField } from '@/components/auth/InputField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AuthDivider, GoogleAuthButton } from '@/components/auth/AuthBrand';
import { loginSchema } from '@/lib/validations';
import type { z } from 'zod';

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setLoading(true);
    try {
      await login({ email: data.email, password: data.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3 text-left">
      <InputField
        id="email"
        type="email"
        placeholder="Your email"
        autoComplete="email"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="space-y-1.5">
        <InputField
          id="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end pr-2">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-[var(--auth-muted)] transition-colors hover:text-[var(--auth-link)]"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)] px-4 py-2.5 text-center text-xs font-medium text-[var(--auth-error-text)]">
          {error}
        </div>
      )}

      <div className="pt-0.5">
        <PrimaryButton loading={loading} disabled={loading}>
          <span>Sign in</span>
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>

      <AuthDivider className="py-1.5" />

      <GoogleAuthButton label="Sign in with Google" />

      <p className="pt-1 text-center text-xs text-[var(--auth-muted)]">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-[var(--auth-link)] transition-colors hover:text-[var(--auth-link-hover)]"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
