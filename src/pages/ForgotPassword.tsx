import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Mail, MailCheck } from 'lucide-react';
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
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/10">
          <MailCheck className="h-7 w-7 text-[var(--auth-link)]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[var(--auth-ink)]">Check your inbox!</h2>
          <p className="text-xs leading-relaxed text-[var(--auth-muted)]">
            If an account exists for that email, we&apos;ve sent over a password reset link. Check your spam folder if it doesn&apos;t arrive soon.
          </p>
        </div>
        <Link
          to="/login"
          className="auth-btn-primary inline-flex w-full items-center justify-center gap-2 px-5"
        >
          <span>Back to sign in</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3.5 text-left">
      <p className="text-center text-xs leading-relaxed text-[var(--auth-muted)]">
        Enter your email below and we&apos;ll send over a link to reset your password.
      </p>

      <InputField
        id="email"
        type="email"
        placeholder="Your email"
        autoComplete="email"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      {error && (
        <div className="rounded-2xl border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)] px-4 py-2.5 text-center text-xs font-medium text-[var(--auth-error-text)]">
          {error}
        </div>
      )}

      <div className="pt-0.5">
        <PrimaryButton loading={loading} disabled={loading}>
          <span>Send reset link</span>
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>

      <p className="pt-1 text-center text-xs text-[var(--auth-muted)]">
        Remembered your password?{' '}
        <Link
          to="/login"
          className="font-semibold text-[var(--auth-link)] transition-colors hover:text-[var(--auth-link-hover)]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
