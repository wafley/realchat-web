import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
      <div className="space-y-5 text-center">
        <div>
          <h2 className="text-xl font-bold text-white">Invalid Link</h2>
          <p className="mt-1.5 text-xs text-neutral-400">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="auth-btn-primary inline-flex items-center justify-center w-full"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, data.password);
      toast.success('Password reset successful! You can now sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3.5 text-left">
      <InputField
        id="password"
        type="password"
        placeholder="New password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <InputField
        id="confirmPassword"
        type="password"
        placeholder="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {error && (
        <div className="rounded-xl px-3.5 py-2.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 text-center">
          {error}
        </div>
      )}

      <div className="pt-2">
        <PrimaryButton loading={loading} disabled={loading}>
          Reset Password
        </PrimaryButton>
      </div>
    </form>
  );
}

