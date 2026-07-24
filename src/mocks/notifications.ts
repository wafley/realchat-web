import type { Notification } from '@/types';
import { MOCK_USERS, DEV_USER_ID } from './users';

const partial = (user: typeof MOCK_USERS[number]) => ({ id: user.id, username: user.username, avatarUrl: user.avatarUrl });

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'follow_request',
    title: 'Frank Ocean wants to follow you',
    read: false,
    followRequestId: 'req1',
    sender: partial(MOCK_USERS[5]!),
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'notif-2',
    type: 'follow_request',
    title: 'Grace Hopper wants to follow you',
    read: false,
    followRequestId: 'req2',
    sender: partial(MOCK_USERS[6]!),
    createdAt: new Date(Date.now() - 172800000),
  },
  {
    id: 'notif-3',
    type: 'follow_accepted',
    title: 'Aang Gacor accepted your follow',
    read: true,
    sender: partial(MOCK_USERS[0]!),
    createdAt: new Date(Date.now() - 259200000),
  },
  {
    id: 'notif-4',
    type: 'message',
    title: 'Bambang sent you a message',
    read: true,
    conversationId: 'conv-1',
    sender: partial(MOCK_USERS[1]!),
    createdAt: new Date(Date.now() - 345600000),
  },
];
