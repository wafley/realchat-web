import type { User } from '@/types';

export const DEV_USER_ID = 'dev-user-1';

export const MOCK_USERS: User[] = [
  { id: 'aang', username: 'aang_gacor', fullName: 'Aang Gacor', email: 'aang@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'bambang', username: 'bambang', fullName: 'Bambang', email: 'bambang@example.com', status: 'online', lastSeen: new Date(Date.now() - 60000), createdAt: new Date('2026-07-01') },
  { id: 'cici', username: 'cici', fullName: 'Cici', email: 'cici@example.com', status: 'online', lastSeen: new Date(Date.now() - 300000), createdAt: new Date('2026-07-01') },
  { id: 'dewi', username: 'dewi', fullName: 'Dewi', email: 'dewi@example.com', status: 'offline', lastSeen: new Date(Date.now() - 3600000), createdAt: new Date('2026-07-01') },
  { id: 'eko', username: 'eko', fullName: 'Eko', email: 'eko@example.com', status: 'offline', lastSeen: new Date(Date.now() - 86400000), createdAt: new Date('2026-07-01') },
  { id: 'frank', username: 'franko', fullName: 'Frank Ocean', email: 'frank@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'grace', username: 'graceh', fullName: 'Grace Hopper', email: 'grace@example.com', status: 'offline', lastSeen: new Date(Date.now() - 7200000), createdAt: new Date('2026-07-01') },
  { id: DEV_USER_ID, username: 'Dev-Account', fullName: 'Alxyzz', email: 'mafzq6750@gmail.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-01-01') },
];
