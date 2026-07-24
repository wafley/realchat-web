import type { Notification } from '@/types';
import api from '@/lib/api';
import { MOCK_NOTIFICATIONS } from '@/mocks/notifications';
import { delay } from '@/mocks/utils';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export async function getNotifications(): Promise<Notification[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_NOTIFICATIONS];
  }
  const { data } = await api.get<any>('/notifications');
  let list: any[] = [];
  if (Array.isArray(data)) list = data;
  else if (data && Array.isArray(data.notifications)) list = data.notifications;
  else if (data && Array.isArray(data.items)) list = data.items;
  return list.map((n: any) => ({ ...n, read: n.isRead ?? n.read ?? false }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  if (DEV_MODE) {
    await delay(100);
    return MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  }
  const { data } = await api.get<any>('/notifications/unread-count');
  if (typeof data === 'number') return data;
  return data?.count ?? data?.unreadCount ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  if (DEV_MODE) {
    await delay(100);
    const notif = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (notif) notif.read = true;
    return;
  }
  await api.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  if (DEV_MODE) {
    await delay(100);
    MOCK_NOTIFICATIONS.forEach((n) => { n.read = true; });
    return;
  }
  await api.put('/notifications/read-all');
}
