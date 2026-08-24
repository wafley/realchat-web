import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (id: string) => void;
  markMentionsAsRead: (conversationId: string) => string[];
  markAllAsRead: () => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  setNotifications: (notifications) =>
    set({
      notifications: notifications.map((n) => ({ ...n, read: (n as any).isRead ?? n.read ?? false })),
    }),
  addNotification: (notification) =>
    set((state) => {
      const normalized = { ...notification, read: (notification as any).isRead ?? notification.read ?? false };
      return {
        notifications: [normalized, ...state.notifications],
        unreadCount: state.unreadCount + (normalized.read ? 0 : 1),
      };
    }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.read || notification.isRead) return state;
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),
  markMentionsAsRead: (conversationId) => {
    let ids: string[] = [];
    set((state) => {
      ids = state.notifications
        .filter((n) => n.type === 'mention' && n.conversationId === conversationId && !n.read && !n.isRead)
        .map((n) => n.id);
      if (ids.length === 0) return state;
      return {
        notifications: state.notifications.map((n) => ids.includes(n.id) ? { ...n, read: true, isRead: true } : n),
        unreadCount: Math.max(0, state.unreadCount - ids.length),
      };
    });
    return ids;
  },
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
}));
