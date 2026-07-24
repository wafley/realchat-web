import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/store/notificationStore';
import { socketClient } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '@/services/notificationService';

export function useNotifications() {
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  useEffect(() => {
    if (query.data) {
      const list = Array.isArray(query.data) ? query.data : [];
      setNotifications(list);
      setUnreadCount(list.filter((n: AppNotification) => !n.read).length);
    }
  }, [query.data, setNotifications, setUnreadCount]);

  return query;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const markStoreRead = useNotificationStore((s) => s.markAsRead);

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_data, id) => {
      markStoreRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useNotificationSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const onFriendEvent = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socketClient.on('friend:request-received', onFriendEvent);
    socketClient.on('friend:request-accepted', onFriendEvent);
    socketClient.on('friend:request-cancelled', onFriendEvent);
    socketClient.on('friend:request-rejected', onFriendEvent);

    return () => {
      socketClient.off('friend:request-received', onFriendEvent);
      socketClient.off('friend:request-accepted', onFriendEvent);
      socketClient.off('friend:request-cancelled', onFriendEvent);
      socketClient.off('friend:request-rejected', onFriendEvent);
    };
  }, [queryClient]);
}
