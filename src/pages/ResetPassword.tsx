import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPassword, parseAuthError } from '@/services/auth';
import { EyeIcon, EyeOffIcon } from '@/components/ui/eye-icon';
import { resetPasswordSchema, type resetPasswordSchema as ResetPasswordSchema } from '@/lib/validations';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">Invalid Link</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="inline-flex items-center justify-center gap-2 w-full rounded-md bg-[#2a313b] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#2a313b]/80"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordSchema) => {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          New Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            autoComplete="new-password"
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? EyeOffIcon : EyeIcon}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm new password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        className="w-full bg-[#2a313b] text-white hover:bg-[#2a313b]/80"
        disabled={loading}
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </Button>
      <Link
        to="/login"
        className="inline-flex items-center justify-center w-full text-sm text-muted-foreground hover:text-foreground"
      >
        Back to Sign In
      </Link>
    </form>
  );
}
