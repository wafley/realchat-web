import type { FriendRequest, User } from '@/types';
import axios from 'axios';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const DEV_USER_ID = 'dev-user-1';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_USERS: User[] = [
  { id: 'aang', username: 'aang_gacor', fullName: 'Aang Gacor', email: 'aang@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'bambang', username: 'bambang', fullName: 'Bambang', email: 'bambang@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'cici', username: 'cici', fullName: 'Cici', email: 'cici@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'dewi', username: 'dewi', fullName: 'Dewi', email: 'dewi@example.com', status: 'offline', lastSeen: new Date(Date.now() - 3600000), createdAt: new Date('2026-07-01') },
  { id: 'eko', username: 'eko', fullName: 'Eko', email: 'eko@example.com', status: 'offline', lastSeen: new Date(Date.now() - 86400000), createdAt: new Date('2026-07-01') },
  { id: 'frank', username: 'franko', fullName: 'Frank Ocean', email: 'frank@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'grace', username: 'graceh', fullName: 'Grace Hopper', email: 'grace@example.com', status: 'offline', lastSeen: new Date(Date.now() - 7200000), createdAt: new Date('2026-07-01') },
  { id: DEV_USER_ID, username: 'devuser', fullName: 'Dev User', email: 'dev@hallowok.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-01-01') },
];

let mockFriends: User[] = [
  MOCK_USERS[0]!, MOCK_USERS[1]!, MOCK_USERS[2]!,
];

let mockRequests: FriendRequest[] = [
  { id: 'req1', sender: MOCK_USERS[5]!, receiver: MOCK_USERS[7]!, status: 'pending', createdAt: new Date(Date.now() - 86400000) },
  { id: 'req2', sender: MOCK_USERS[6]!, receiver: MOCK_USERS[7]!, status: 'pending', createdAt: new Date(Date.now() - 172800000) },
];

let mockSentRequests: FriendRequest[] = [];

export async function searchPeople(query: string): Promise<User[]> {
  if (DEV_MODE) {
    await delay(300);
    const q = query.toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        u.id !== DEV_USER_ID &&
        !mockFriends.some((f) => f.id === u.id) &&
        !mockRequests.some((r) => r.sender.id === u.id) &&
        (u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)),
    );
  }
  const { data } = await axios.get<User[]>(`${import.meta.env.VITE_API_URL}/users/search`, { params: { q: query } });
  return data;
}

export async function sendFriendRequest(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    mockSentRequests.push({ id: `sent-${Date.now()}`, sender: MOCK_USERS[7]!, receiver: user, status: 'pending', createdAt: new Date() });
    return;
  }
  await axios.post(`${import.meta.env.VITE_API_URL}/friends/request`, { userId });
}

export async function cancelFriendRequest(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    mockSentRequests = mockSentRequests.filter((r) => r.receiver.id !== userId);
    return;
  }
  await axios.delete(`${import.meta.env.VITE_API_URL}/friends/request/${userId}`);
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(300);
    const req = mockRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');
    mockRequests = mockRequests.filter((r) => r.id !== requestId);
    if (!mockFriends.some((f) => f.id === req.sender.id)) {
      mockFriends.push(req.sender);
    }
    return;
  }
  await axios.post(`${import.meta.env.VITE_API_URL}/friends/accept/${requestId}`);
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    mockRequests = mockRequests.filter((r) => r.id !== requestId);
    return;
  }
  await axios.post(`${import.meta.env.VITE_API_URL}/friends/reject/${requestId}`);
}

export async function getFriends(): Promise<User[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...mockFriends];
  }
  const { data } = await axios.get<User[]>(`${import.meta.env.VITE_API_URL}/friends`);
  return data;
}

export async function getPendingRequests(): Promise<FriendRequest[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...mockRequests];
  }
  const { data } = await axios.get<FriendRequest[]>(`${import.meta.env.VITE_API_URL}/friends/requests`);
  return data;
}

export async function getSentRequests(): Promise<FriendRequest[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...mockSentRequests];
  }
  const { data } = await axios.get<FriendRequest[]>(`${import.meta.env.VITE_API_URL}/friends/requests/sent`);
  return data;
}

export async function removeFriend(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    mockFriends = mockFriends.filter((f) => f.id !== userId);
    return;
  }
  await axios.delete(`${import.meta.env.VITE_API_URL}/friends/${userId}`);
}
