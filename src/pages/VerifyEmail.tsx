import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '@/services/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-full bg-green-500/10 p-3 mx-auto w-fit">
          <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">Email Verified!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your email has been verified. You can now sign in.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 w-full rounded-md bg-[#2a313b] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#2a313b]/80"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="rounded-full bg-destructive/10 p-3 mx-auto w-fit">
        <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Verification Failed</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This verification link is invalid or has expired.
        </p>
      </div>
      <Link
        to="/login"
        className="inline-flex items-center justify-center gap-2 w-full rounded-md bg-[#2a313b] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#2a313b]/80"
      >
        Back to Sign In
      </Link>
    </div>
  );
}
