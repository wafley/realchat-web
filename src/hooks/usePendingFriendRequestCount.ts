import { useQuery } from '@tanstack/react-query';
import { getPendingRequestCount } from '@/services/friends';

export function usePendingFriendRequestCount() {
  return useQuery({
    queryKey: ['pendingFriendRequestCount'],
    queryFn: getPendingRequestCount,
  });
}
