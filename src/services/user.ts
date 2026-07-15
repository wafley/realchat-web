import type { User } from '@/types';
import api from '@/lib/api';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const DEV_USER_ID = 'dev-user-1';

const MOCK_USERS: User[] = [
  { id: 'aang', username: 'aang_gacor', fullName: 'Aang Gacor', email: 'aang@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'bambang', username: 'bambang', fullName: 'Bambang', email: 'bambang@example.com', status: 'online', lastSeen: new Date(Date.now() - 60000), createdAt: new Date('2026-07-01') },
  { id: 'cici', username: 'cici', fullName: 'Cici', email: 'cici@example.com', status: 'online', lastSeen: new Date(Date.now() - 300000), createdAt: new Date('2026-07-01') },
  { id: 'dewi', username: 'dewi', fullName: 'Dewi', email: 'dewi@example.com', status: 'offline', lastSeen: new Date(Date.now() - 3600000), createdAt: new Date('2026-07-01') },
  { id: 'eko', username: 'eko', fullName: 'Eko', email: 'eko@example.com', status: 'offline', lastSeen: new Date(Date.now() - 86400000), createdAt: new Date('2026-07-01') },
  { id: DEV_USER_ID, username: 'devuser', fullName: 'Dev User', email: 'dev@hallowok.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-01-01') },
];

export async function getUser(userId: string): Promise<User> {
  if (DEV_MODE) {
    await new Promise((r) => setTimeout(r, 200));
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  }
  const { data } = await api.get<User>(`/users/${userId}`);
  return data;
}

export async function uploadAvatar(file: File): Promise<string> {
  if (DEV_MODE) {
    await new Promise((r) => setTimeout(r, 300));
    return URL.createObjectURL(file);
  }
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.post<{ url: string }>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
