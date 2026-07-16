import type { AuthResponse, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from '@/types';
import api from '@/lib/api';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me');
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken');
  await api.post('/auth/logout', { refreshToken });
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token });
}

export function parseAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response: { data: Record<string, unknown> } }).response?.data;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (Array.isArray(data?.errors)) {
      return (data.errors as Array<{ field: string; message: string }>)
        .map((e) => e.message)
        .join(', ');
    }
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export function loginWithGoogle(): void {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
}

export function loginWithFacebook(): void {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/facebook`;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.put<User>('/users/me', payload);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

export async function deleteAccount(password: string): Promise<void> {
  await api.delete('/users/me', { data: { password } });
}
