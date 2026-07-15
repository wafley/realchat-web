import api from '@/lib/api';
import type { User, Group } from '@/types';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const MOCK_USERS: User[] = [
  { id: 'aang', username: 'aang_gacor', fullName: 'Aang Gacor', email: 'aang@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'bambang', username: 'bambang', fullName: 'Bambang', email: 'bambang@example.com', status: 'online', lastSeen: new Date(Date.now() - 60000), createdAt: new Date('2026-07-01') },
  { id: 'cici', username: 'cici', fullName: 'Cici', email: 'cici@example.com', status: 'online', lastSeen: new Date(Date.now() - 300000), createdAt: new Date('2026-07-01') },
  { id: 'dewi', username: 'dewi', fullName: 'Dewi', email: 'dewi@example.com', status: 'offline', lastSeen: new Date(Date.now() - 3600000), createdAt: new Date('2026-07-01') },
  { id: 'eko', username: 'eko', fullName: 'Eko', email: 'eko@example.com', status: 'offline', lastSeen: new Date(Date.now() - 86400000), createdAt: new Date('2026-07-01') },
];

const MOCK_GROUPS: Group[] = [
  { id: '1', name: 'General', description: 'General discussion for everyone', members: [], creatorId: 'aang', isPrivate: false, createdAt: new Date('2026-07-01') },
  { id: '2', name: 'Random', description: 'Off-topic chat', members: [], creatorId: 'bambang', isPrivate: false, createdAt: new Date('2026-07-01') },
  { id: '3', name: 'Project Alpha', description: 'Project collaboration', members: [], creatorId: 'cici', isPrivate: true, createdAt: new Date('2026-07-01') },
  { id: '4', name: 'Design Team', description: 'Design discussions', members: [], creatorId: 'dewi', isPrivate: false, createdAt: new Date('2026-07-01') },
];

const MOCK_MESSAGES = [
  { id: 'm1', groupId: '1', senderId: 'aang', content: 'Hey everyone!', type: 'text' as const, createdAt: new Date('2026-07-10T10:30') },
  { id: 'm2', groupId: '1', senderId: 'dev-user-1', content: 'Halo Aang! Apa kabar?', type: 'text' as const, createdAt: new Date('2026-07-10T10:31') },
  { id: 'n1', groupId: '2', senderId: 'cici', content: 'Ada yang mau makan siang?', type: 'text' as const, createdAt: new Date('2026-07-10T12:00') },
  { id: 'p1', groupId: '3', senderId: 'deploy-bot', content: 'Deploy is done', type: 'text' as const, createdAt: new Date('2026-07-10T15:00') },
  { id: 'd1', groupId: '4', senderId: 'dewi', content: 'Mockup baru udah diupload', type: 'text' as const, createdAt: new Date('2026-07-09T14:00') },
  { id: 'da1', groupId: 'dm1', senderId: 'aang', content: 'Hey, bisa cek design terbaru?', type: 'text' as const, createdAt: new Date('2026-07-10T10:15') },
  { id: 'db1', groupId: 'dm2', senderId: 'bambang', content: 'Migrasi server udah selesai', type: 'text' as const, createdAt: new Date('2026-07-10T09:00') },
];

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function searchUsers(query: string): Promise<User[]> {
  if (DEV_MODE) {
    await delay(150);
    const q = query.toLowerCase();
    return MOCK_USERS.filter((u) => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }
  const { data } = await api.get<User[]>('/search/users', { params: { q: query } });
  return data;
}

export async function searchGroups(query: string): Promise<Group[]> {
  if (DEV_MODE) {
    await delay(150);
    const q = query.toLowerCase();
    return MOCK_GROUPS.filter((g) => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
  }
  const { data } = await api.get<Group[]>('/search/groups', { params: { q: query } });
  return data;
}

export async function searchMessages(query: string): Promise<(typeof MOCK_MESSAGES[number] & { senderName?: string })[]> {
  if (DEV_MODE) {
    await delay(150);
    const q = query.toLowerCase();
    const userMap = Object.fromEntries(MOCK_USERS.map((u) => [u.id, u.fullName]));
    return MOCK_MESSAGES
      .filter((m) => m.content.toLowerCase().includes(q))
      .map((m) => ({ ...m, senderName: userMap[m.senderId] ?? 'Unknown' }));
  }
  const { data } = await api.get('/search/messages', { params: { q: query } });
  return data;
}
