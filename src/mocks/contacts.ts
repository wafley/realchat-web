import type { Contact } from '@/types';
import { MOCK_USERS } from './users';

export const MOCK_CONTACTS: Contact[] = [
  // 3 existing contacts
  { userId: 'aang', user: MOCK_USERS[0]!, addedAt: new Date('2026-07-05') },
  { userId: 'bambang', user: MOCK_USERS[1]!, addedAt: new Date('2026-07-06') },
  { userId: 'cici', user: MOCK_USERS[2]!, addedAt: new Date('2026-07-07') },
  // 27 new contacts from Genshin characters
  ...MOCK_USERS.slice(8, 35).map((user, i) => ({
    userId: user.id,
    user,
    addedAt: new Date(`2026-07-${String(i + 8).padStart(2, '0')}`),
  })),
];