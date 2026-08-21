import type { AuthResponse, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from '@/types';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/utils/errors';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export interface AuthUserRaw {
  id: string;
  username?: string;
  email?: string;
  fullName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  statusText?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  isVerified?: boolean;
  createdAt?: string | null;
}

export function mapUser(raw: AuthUserRaw): User {
  return {
    id: raw.id,
    username: raw.username ?? '',
    email: raw.email ?? '',
    fullName: raw.fullName ?? '',
    bio: raw.bio ?? undefined,
    avatarUrl: raw.avatarUrl ?? undefined,
    status: raw.isOnline ? 'online' : 'offline',
    lastSeen: raw.lastSeenAt ? new Date(raw.lastSeenAt) : undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  };
}

export interface RegisteredAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return { ...data, user: mapUser(data.user as unknown as AuthUserRaw) };
}

export async function register(payload: RegisterPayload): Promise<RegisteredAccount> {
  const { data } = await api.post<RegisteredAccount>('/auth/register', {
    username: payload.username.trim().toLowerCase(),
    email: payload.email,
    password: payload.password,
    fullName: payload.fullName,
  });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<AuthUserRaw>('/users/me');
  return mapUser(data);
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  return data;
}

export function parseAuthError(err: unknown): string {
  return getApiErrorMessage(err, 'Something went wrong. Please try again.');
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.put<AuthUserRaw>('/users/me', payload);
  return mapUser(data);
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
  await api.put('/users/me/password', { oldPassword: currentPassword, newPassword });
}

export async function deleteAccount(password: string): Promise<void> {
  if (DEV_MODE) {
    if (password !== 'password123') throw new Error('Password is incorrect');
    localStorage.removeItem('accessToken');
    return;
  }
  await api.delete('/auth/me', { data: { password } });
}
