import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPasswordSchema, type forgotPasswordSchema as ForgotPasswordSchema } from '@/lib/validations';
import { forgotPassword, parseAuthError } from '@/services/auth';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setError('');
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-full bg-accent/10 p-3 mx-auto w-fit">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">Check Your Email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve sent a password reset link. Please check your inbox.
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="rounded-full bg-accent/10 p-3 mx-auto w-fit">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-card-foreground">Forgot Password?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          className="w-full bg-[#2a313b] text-white hover:bg-[#2a313b]/80"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
      <Link
        to="/login"
        className="inline-flex items-center justify-center w-full text-sm text-muted-foreground hover:text-foreground"
      >
        Back to Sign In
      </Link>
    </div>
  );
}
