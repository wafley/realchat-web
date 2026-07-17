import type { FriendRequest } from '@/types';
import { DEV_USER_ID, MOCK_USERS } from './users';

export const MOCK_FRIENDS = [MOCK_USERS[0]!, MOCK_USERS[1]!, MOCK_USERS[2]!];

export const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  { id: 'req1', sender: MOCK_USERS[5]!, receiver: MOCK_USERS[7]!, status: 'pending', createdAt: new Date(Date.now() - 86400000) },
  { id: 'req2', sender: MOCK_USERS[6]!, receiver: MOCK_USERS[7]!, status: 'pending', createdAt: new Date(Date.now() - 172800000) },
];

export const MOCK_SENT_REQUESTS: FriendRequest[] = [];
