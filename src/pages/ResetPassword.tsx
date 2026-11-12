import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Link2Off, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { resetPassword, parseAuthError } from '@/services/auth';
import { InputField } from '@/components/auth/InputField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { resetPasswordSchema } from '@/lib/validations';
import type { z } from 'zod';

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)]">
          <Link2Off className="h-7 w-7 text-[var(--auth-error-text)]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[var(--auth-ink)]">This link has expired</h2>
          <p className="text-xs leading-relaxed text-[var(--auth-muted)]">
            This password reset link is invalid or no longer active. Request a fresh link to continue.
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="auth-btn-primary inline-flex w-full items-center justify-center gap-2 px-5"
        >
          <span>Request a new link</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, data.password);
      toast.success('Password updated! You can sign in with your new password now.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3 text-left">
      <InputField
        id="password"
        type="password"
        placeholder="New password"
        autoComplete="new-password"
        leftIcon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        {...register('password')}
      />

      <InputField
        id="confirmPassword"
        type="password"
        placeholder="Confirm new password"
        autoComplete="new-password"
        leftIcon={<Lock className="h-4 w-4" />}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {error && (
        <div className="rounded-2xl border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)] px-4 py-2.5 text-center text-xs font-medium text-[var(--auth-error-text)]">
          {error}
        </div>
      )}

      <div className="pt-1">
        <PrimaryButton loading={loading} disabled={loading}>
          <span>Save new password</span>
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>

      <p className="pt-1 text-center text-xs text-[var(--auth-muted)]">
        Back to{' '}
        <Link
          to="/login"
          className="font-semibold text-[var(--auth-link)] transition-colors hover:text-[var(--auth-link-hover)]"
        >
          sign in
        </Link>
      </p>
    </form>
  );
}
