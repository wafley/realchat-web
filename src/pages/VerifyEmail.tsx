import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmail, parseAuthError } from '@/services/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid verification link');
      return;
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setError(parseAuthError(err));
      });
  }, [token]);

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <XCircle size={48} className="mx-auto text-destructive" />
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">Invalid Link</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This email verification link is invalid or missing a token.
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

  if (status === 'loading') {
    return (
      <div className="space-y-6 text-center">
        <Loader2 size={48} className="mx-auto animate-spin text-accent" />
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">Verifying your email...</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 size={48} className="mx-auto text-green-500" />
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">Email Verified!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your email has been verified. You can now sign in to your account.
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
      <XCircle size={48} className="mx-auto text-destructive" />
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Verification Failed</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
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
