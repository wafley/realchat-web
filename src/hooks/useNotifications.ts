import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/store/notificationStore';
import { socketClient } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notificationService';
import type { Notification } from '@/types';

export function useNotifications() {
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  useEffect(() => {
    if (query.data) {
      setNotifications(query.data);
      setUnreadCount(query.data.filter((n) => !n.read).length);
    }
  }, [query.data, setNotifications, setUnreadCount]);

  return query;
}

export function useUnreadNotificationCount() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const query = useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: false,
  });

  useEffect(() => {
    if (query.data != null) {
      setUnreadCount(query.data);
    }
  }, [query.data, setUnreadCount]);

  return query;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const markStoreRead = useNotificationStore((s) => s.markAsRead);

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_data, id) => {
      markStoreRead(id);
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const markAllStoreRead = useNotificationStore((s) => s.markAllAsRead);

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      markAllStoreRead();
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
}

export function useNotificationSocket() {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    function onNewNotification(data: { notification: Notification }) {
      if (data?.notification) {
        addNotification(data.notification);
      }
    }

    socketClient.on('notification:new', onNewNotification);
    return () => {
      socketClient.off('notification:new', onNewNotification);
    };
  }, [addNotification]);
}
