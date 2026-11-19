import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, AtSign, Lock, Mail, MailCheck, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { parseAuthError } from '@/services/auth';
import { InputField } from '@/components/auth/InputField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AuthDivider, GoogleAuthButton } from '@/components/auth/AuthBrand';
import { registerSchema } from '@/lib/validations';
import type { z } from 'zod';

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
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
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/10">
          <MailCheck className="h-7 w-7 text-[var(--auth-link)]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[var(--auth-ink)]">Check your inbox!</h2>
          <p className="text-xs leading-relaxed text-[var(--auth-muted)]">
            We&apos;ve sent a verification link to your email. Click it to activate your account and start chatting.
          </p>
          <p className="text-[11px] text-[var(--auth-subtle)]">
            Don&apos;t see it? Take a quick look in your{' '}
            <span className="font-medium text-[var(--auth-muted)]">spam or junk folder</span>.
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
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-2 text-left md:space-y-2.5">
      <InputField
        id="username"
        type="text"
        placeholder="Username"
        autoComplete="username"
        maxLength={30}
        leftIcon={<AtSign className="h-4 w-4" />}
        error={errors.username?.message}
        {...registerField('username')}
      />

      <InputField
        id="fullName"
        type="text"
        placeholder="Full name"
        autoComplete="name"
        maxLength={50}
        leftIcon={<User className="h-4 w-4" />}
        error={errors.fullName?.message}
        {...registerField('fullName')}
      />

      <InputField
        id="email"
        type="email"
        placeholder="Email address"
        autoComplete="email"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...registerField('email')}
      />

      <InputField
        id="password"
        type="password"
        placeholder="Password"
        autoComplete="new-password"
        leftIcon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        {...registerField('password')}
      />

      <InputField
        id="confirmPassword"
        type="password"
        placeholder="Confirm password"
        autoComplete="off"
        leftIcon={<Lock className="h-4 w-4" />}
        error={errors.confirmPassword?.message}
        {...registerField('confirmPassword')}
      />

      {error && (
        <div className="rounded-2xl border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)] px-4 py-2.5 text-center text-xs font-medium text-[var(--auth-error-text)]">
          {error}
        </div>
      )}

      <div className="pt-1">
        <PrimaryButton loading={loading} disabled={loading}>
          <span>Create account</span>
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>

      <AuthDivider className="py-1" />

      <GoogleAuthButton label="Sign up with Google" />

      <p className="pt-1 text-center text-xs text-[var(--auth-muted)]">
        Already have an account?{' '}
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
