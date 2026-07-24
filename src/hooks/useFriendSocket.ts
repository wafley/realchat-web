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
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    };

    const onReceived = () => invalidateRequests();
    const onAccepted = () => { invalidateFriends(); invalidateRequests(); };
    const onRejected = () => invalidateRequests();
    const onCancelled = () => invalidateRequests();
    const onUnfriended = () => invalidateFriends();

    socketClient.onFriendRequestReceived(onReceived);
    socketClient.onFriendRequestAccepted(onAccepted);
    socketClient.onFriendRequestRejected(onRejected);
    socketClient.onFriendRequestCancelled(onCancelled);
    socketClient.onFriendUnfriended(onUnfriended);

    return () => {
      socketClient.offFriendRequestReceived(onReceived);
      socketClient.offFriendRequestAccepted(onAccepted);
      socketClient.offFriendRequestRejected(onRejected);
      socketClient.offFriendRequestCancelled(onCancelled);
      socketClient.offFriendUnfriended(onUnfriended);
    };
  }, [queryClient]);
}
