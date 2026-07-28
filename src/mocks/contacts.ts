import type { Contact } from '@/types';
import { DEV_USER_ID, MOCK_USERS } from './users';

export const MOCK_CONTACTS: Contact[] = [
  {
    userId: 'aang',
    user: MOCK_USERS[0]!,
    customName: 'Si Gacor',
    addedAt: new Date('2026-07-05'),
  },
  {
    userId: 'bambang',
    user: MOCK_USERS[1]!,
    addedAt: new Date('2026-07-06'),
  },
  {
    userId: 'cici',
    user: MOCK_USERS[2]!,
    addedAt: new Date('2026-07-07'),
  },
];
