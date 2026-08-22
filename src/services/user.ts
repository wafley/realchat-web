import type { User } from '@/types';
import api from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { mapUser, type AuthUserRaw } from '@/services/auth';
import { MOCK_USERS } from '@/mocks/users';
import { delay } from '@/mocks/utils';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export async function getUser(userId: string): Promise<User> {
  if (DEV_MODE) {
    await delay(200);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  }
  const { data } = await api.get<AuthUserRaw>(`/users/${userId}`);
  const mapped = mapUser(data);
  const cached = queryClient.getQueryData<User>(['user', userId]);
  if (cached && mapped.bio === undefined) mapped.bio = cached.bio;
  return mapped;
}

export async function uploadAvatar(file: File): Promise<string> {
  if (DEV_MODE) {
    await delay(300);
    return URL.createObjectURL(file);
  }
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.put<{ avatarUrl?: string | null }>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.avatarUrl ?? '';
}

export async function uploadBanner(file: File): Promise<string> {
  if (DEV_MODE) {
    await delay(300);
    return URL.createObjectURL(file);
  }
  const formData = new FormData();
  formData.append('banner', file);
  const { data } = await api.put<{ bannerUrl?: string | null }>('/users/me/banner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.bannerUrl ?? '';
}

