import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient } from '@/lib/socket';

export function useFriendSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateFollow = () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['relationship'] });
    };

    const invalidateNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    };

    const onFollowed = () => { invalidateFollow(); invalidateNotifications(); };
    const onUnfollowed = () => invalidateFollow();

    socketClient.onFollowed(onFollowed);
    socketClient.onUnfollowed(onUnfollowed);

    return () => {
      socketClient.offFollowed(onFollowed);
      socketClient.offUnfollowed(onUnfollowed);
    };
  }, [queryClient]);
}
