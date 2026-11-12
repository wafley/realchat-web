import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Link2Off, Loader2, XCircle } from 'lucide-react';
import { verifyEmail, parseAuthError } from '@/services/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const hasCalled = useRef(false);

  useEffect(() => {
    if (!token || hasCalled.current) return;
    hasCalled.current = true;

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setError(parseAuthError(err));
      });
  }, [token]);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)]">
          <Link2Off className="h-7 w-7 text-[var(--auth-error-text)]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[var(--auth-ink)]">Invalid verification link</h2>
          <p className="text-xs leading-relaxed text-[var(--auth-muted)]">
            This email verification link looks incomplete or expired.
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

  if (status === 'loading') {
    return (
      <div className="space-y-4 py-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/10">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--auth-link)]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[var(--auth-ink)]">Verifying your email…</h2>
          <p className="text-xs text-[var(--auth-muted)]">Hang tight, this will just take a second.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/12">
          <CheckCircle2 className="h-7 w-7 text-emerald-400 [.light_&]:text-emerald-600" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[var(--auth-ink)]">You&apos;re all verified!</h2>
          <p className="text-xs leading-relaxed text-[var(--auth-muted)]">
            Your email is confirmed. You&apos;re ready to sign in and start chatting.
          </p>
        </div>
        <Link
          to="/login"
          className="auth-btn-primary inline-flex w-full items-center justify-center gap-2 px-5"
        >
          <span>Continue to sign in</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)]">
        <XCircle className="h-7 w-7 text-[var(--auth-error-text)]" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-[var(--auth-ink)]">Verification failed</h2>
        <p className="text-xs leading-relaxed text-[var(--auth-muted)]">
          {error || "We couldn't verify this link. It may have expired."}
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
