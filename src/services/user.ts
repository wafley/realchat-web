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

export interface PrivacyApi {
  lastSeenVisibility: string;
  groupInvitePolicy: string;
}

export async function getPrivacy(): Promise<PrivacyApi> {
  if (DEV_MODE) {
    await delay(150);
    return { lastSeenVisibility: 'EVERYONE', groupInvitePolicy: 'EVERYONE' };
  }
  const { data } = await api.get<PrivacyApi>('/users/me/privacy');
  return data;
}

export async function updatePrivacy(payload: Partial<PrivacyApi>): Promise<PrivacyApi> {
  if (DEV_MODE) {
    await delay(200);
    return { lastSeenVisibility: 'EVERYONE', groupInvitePolicy: 'EVERYONE', ...payload };
  }
  const { data } = await api.put<PrivacyApi>('/users/me/privacy', payload);
  return data;
}

export interface NotificationPreferences {
  notifyNewMessages: boolean;
  notifyGroupInvites: boolean;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  if (DEV_MODE) {
    await delay(150);
    return { notifyNewMessages: true, notifyGroupInvites: true };
  }
  const { data } = await api.get<NotificationPreferences>('/users/me/notification-preferences');
  return data;
}

export async function updateNotificationPreferences(
  payload: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  if (DEV_MODE) {
    await delay(150);
    return { notifyNewMessages: true, notifyGroupInvites: true, ...payload };
  }
  const { data } = await api.put<NotificationPreferences>('/users/me/notification-preferences', payload);
  return data;
}

