import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import OAuthButtons from '@/components/common/OAuthButtons';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || !form.username || !form.fullName) {
      setError('All fields are required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email,
        username: form.username,
        fullName: form.fullName,
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(
        [
          { id: 'username', label: 'Username', type: 'text', placeholder: 'johndoe' },
          { id: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
          { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
          { id: 'password', label: 'Password', type: 'password', placeholder: 'Create a password' },
          { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat your password' },
        ] as const
      ).map(({ id, label, type, placeholder }) => (
        <div key={id} className="space-y-2">
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </label>
          <Input
            id={id}
            type={type}
            placeholder={placeholder}
            value={form[id as keyof typeof form]}
            onChange={update(id)}
            autoComplete={type === 'password' ? (id === 'password' ? 'new-password' : 'off') : id}
          />
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
      <OAuthButtons />
    </form>
  );
}
