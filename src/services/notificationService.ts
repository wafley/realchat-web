import type { FriendRequest } from '@/types';
import api from '@/lib/api';
import { MOCK_NOTIFICATIONS } from '@/mocks/notifications';
import { delay } from '@/mocks/utils';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export interface AppNotification {
  id: string;
  type: 'follow_request' | 'follow_accepted' | 'unfollow' | 'message' | 'group';
  title: string;
  body?: string;
  read: boolean;
  followRequestId?: string;
  conversationId?: string;
  sender?: { id: string; username: string; avatarUrl?: string; fullName?: string };
  createdAt: Date;
}

export async function getNotifications(): Promise<AppNotification[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_NOTIFICATIONS];
  }
  const { data } = await api.get<FriendRequest[]>('/friends/requests');
  const list = Array.isArray(data) ? data : [];
  return list
    .filter((r) => r.status === 'PENDING')
    .map((r) => ({
      id: r.id,
      type: 'follow_request' as const,
      title: `${r.sender.username} wants to follow you`,
      body: '',
      read: false,
      followRequestId: r.id,
      sender: r.sender,
      createdAt: r.createdAt,
    }));
}

export async function markNotificationRead(id: string): Promise<void> {
  if (DEV_MODE) {
    await delay(100);
    return;
  }
  // No dedicated endpoint — mark locally via query invalidation
}

export async function markAllNotificationsRead(): Promise<void> {
  if (DEV_MODE) {
    await delay(100);
    return;
  }
  // No dedicated endpoint — mark locally via query invalidation
}
