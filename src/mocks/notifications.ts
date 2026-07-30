import type { Notification } from '@/types';
import { MOCK_USERS } from './users';

const partial = (user: typeof MOCK_USERS[number]) => ({ id: user.id, username: user.username, avatarUrl: user.avatarUrl });

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'contact_added',
    title: 'Frank Ocean added you as contact',
    read: false,
    sender: partial(MOCK_USERS[5]!),
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'notif-2',
    type: 'contact_added',
    title: 'Grace Hopper added you as contact',
    read: false,
    sender: partial(MOCK_USERS[6]!),
    createdAt: new Date(Date.now() - 172800000),
  },
  {
    id: 'notif-3',
    type: 'contact_added',
    title: 'Aang Gacor added you as contact',
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
