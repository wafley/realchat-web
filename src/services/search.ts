import api from '@/lib/api';
import type { User, Group } from '@/types';
import { MOCK_USERS } from '@/mocks/users';
import { MOCK_GROUPS, MOCK_MESSAGES } from '@/mocks/search';
import { delay } from '@/mocks/utils';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

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
