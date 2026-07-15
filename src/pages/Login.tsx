import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { parseAuthError } from '@/services/auth';
import OAuthButtons from '@/components/common/OAuthButtons';
import { loginSchema, type loginSchema as LoginSchema } from '@/lib/validations';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setError('');
    setLoading(true);
    try {
      await login({ email: data.email, password: data.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
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
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="flex items-center justify-end">
        <Link to="/forgot-password" className="text-sm text-accent hover:underline">
          Forgot Password?
        </Link>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        className="w-full bg-[#2a313b] text-white hover:bg-[#2a313b]/80"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
      <OAuthButtons />
    </form>
  );
}

const EyeIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeOffIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);
