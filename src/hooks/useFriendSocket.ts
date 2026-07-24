import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient } from '@/lib/socket';

export function useFriendSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateFriends = () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    };

    const invalidateRequests = () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'incoming'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent'] });
    };

    const invalidateNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    };

    const onReceived = () => { invalidateRequests(); invalidateNotifications(); };
    const onAccepted = () => { invalidateFriends(); invalidateRequests(); invalidateNotifications(); };
    const onRejected = () => { invalidateRequests(); invalidateNotifications(); };
    const onCancelled = () => { invalidateRequests(); invalidateNotifications(); };
    const onRemoved = () => invalidateFriends();
    const onListUpdated = () => invalidateFriends();

    socketClient.onFriendRequestReceived(onReceived);
    socketClient.onFriendRequestAccepted(onAccepted);
    socketClient.onFriendRequestRejected(onRejected);
    socketClient.onFriendRequestCancelled(onCancelled);
    socketClient.onFriendRemoved(onRemoved);
    socketClient.onFriendListUpdated(onListUpdated);

    return () => {
      socketClient.offFriendRequestReceived(onReceived);
      socketClient.offFriendRequestAccepted(onAccepted);
      socketClient.offFriendRequestRejected(onRejected);
      socketClient.offFriendRequestCancelled(onCancelled);
      socketClient.offFriendRemoved(onRemoved);
      socketClient.offFriendListUpdated(onListUpdated);
    };
  }, [queryClient]);
}
