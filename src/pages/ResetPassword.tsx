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
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>Invalid Link</h2>
        <p className="mt-2 text-sm" style={{ color: '#9EA5B4' }}>
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="auth-btn-primary mt-6 inline-flex w-full items-center justify-center"
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col">
      <div className="space-y-4">
        <p className="text-sm" style={{ color: '#9EA5B4' }}>
          Enter your new password below.
        </p>

        <InputField
          label="New Password"
          id="password"
          type="password"
          placeholder="Enter new password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <InputField
          label="Confirm Password"
          id="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            {error}
          </div>
        )}
      </div>

      <div className="pt-4">
        <PrimaryButton loading={loading} disabled={loading}>
          Reset Password
        </PrimaryButton>
      </div>
    </form>
  );
}
