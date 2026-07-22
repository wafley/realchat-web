import type { AuthResponse, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from '@/types';
import api from '@/lib/api';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', {
    username: payload.username,
    email: payload.email,
    password: payload.password,
  });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me');
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  return data;
}

export function parseAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response: { data: Record<string, unknown> } }).response?.data;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (Array.isArray(data?.message)) return (data.message as string[]).join(', ');
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.put<User>('/users/me', payload);
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  if (DEV_MODE) {
    await new Promise((r) => setTimeout(r, 1000));
    return;
  }
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  if (DEV_MODE) {
    await new Promise((r) => setTimeout(r, 1000));
    return;
  }
  await api.post('/auth/reset-password', { token, password });
}

export async function verifyEmail(token: string): Promise<void> {
  if (DEV_MODE) {
    await new Promise((r) => setTimeout(r, 1000));
    return;
  }
  await api.post('/auth/verify-email', { token });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (DEV_MODE) {
    if (currentPassword !== 'password123') throw new Error('Current password is incorrect');
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters');
    return;
  }
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

export async function deleteAccount(password: string): Promise<void> {
  if (DEV_MODE) {
    if (password !== 'password123') throw new Error('Password is incorrect');
    localStorage.removeItem('accessToken');
    return;
  }
  await api.delete('/auth/me', { data: { password } });
}
