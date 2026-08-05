import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPassword, parseAuthError } from '@/services/auth';
import { InputField } from '@/components/auth/InputField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { forgotPasswordSchema } from '@/lib/validations';
import type { z } from 'zod';

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
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
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3.5 text-left">
      <p className="text-xs text-neutral-400 text-center mb-1">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <InputField
        id="email"
        type="email"
        placeholder="Your email address"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      {error && (
        <div className="rounded-xl px-3.5 py-2.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 text-center">
          {error}
        </div>
      )}

      <div className="pt-2">
        <PrimaryButton loading={loading} disabled={loading}>
          Send Reset Link
        </PrimaryButton>
      </div>
    </form>
  );
}

