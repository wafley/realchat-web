import type { FriendRequest, User } from '@/types';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { DEV_USER_ID, MOCK_USERS } from '@/mocks/users';
import { delay } from '@/mocks/utils';
import {
  MOCK_FRIENDS,
  MOCK_FRIEND_REQUESTS,
  MOCK_SENT_REQUESTS,
} from '@/mocks/friends';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export async function searchPeople(query: string): Promise<User[]> {
  if (DEV_MODE) {
    await delay(300);
    const q = query.toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        u.id !== DEV_USER_ID &&
        !MOCK_FRIENDS.some((f) => f.id === u.id) &&
        !MOCK_FRIEND_REQUESTS.some((r) => r.sender.id === u.id) &&
        (u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)),
    );
  }
  const { data } = await api.get<User[]>('/users/search', { params: { q: query } });
  const currentUserId = useAuthStore.getState().user?.id;
  return data.filter((u) => u.id !== currentUserId);
}

export async function sendFriendRequest(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    MOCK_SENT_REQUESTS.push({ id: `sent-${Date.now()}`, sender: MOCK_USERS[7]!, receiver: user, status: 'pending', createdAt: new Date() });
    return;
  }
  await api.post('/friends/request', { userId });
}

export async function cancelFriendRequest(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    const idx = MOCK_SENT_REQUESTS.findIndex((r) => r.receiver.id === userId);
    if (idx !== -1) MOCK_SENT_REQUESTS.splice(idx, 1);
    return;
  }
  await api.delete(`/friends/request/${userId}`);
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(300);
    const req = MOCK_FRIEND_REQUESTS.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');
    const idx = MOCK_FRIEND_REQUESTS.findIndex((r) => r.id === requestId);
    if (idx !== -1) MOCK_FRIEND_REQUESTS.splice(idx, 1);
    if (!MOCK_FRIENDS.some((f) => f.id === req.sender.id)) {
      MOCK_FRIENDS.push(req.sender);
    }
    return;
  }
  await api.post('/friends/accept', { requestId });
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    const idx = MOCK_FRIEND_REQUESTS.findIndex((r) => r.id === requestId);
    if (idx !== -1) MOCK_FRIEND_REQUESTS.splice(idx, 1);
    return;
  }
  await api.post('/friends/reject', { requestId });
}

export async function getFriends(): Promise<User[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_FRIENDS];
  }
  const { data } = await api.get<User[]>('/friends');
  return data;
}

export async function getPendingRequests(): Promise<FriendRequest[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_FRIEND_REQUESTS];
  }
  const { data } = await api.get<FriendRequest[]>('/friends/requests');
  return data;
}

export async function getSentRequests(): Promise<FriendRequest[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_SENT_REQUESTS];
  }
  const { data } = await api.get<FriendRequest[]>('/friends/requests/sent');
  return data;
}

export async function getPendingRequestCount(): Promise<number> {
  if (DEV_MODE) {
    await delay(100);
    return MOCK_FRIEND_REQUESTS.length;
  }
  const { data } = await api.get<FriendRequest[]>('/friends/requests');
  return data.length;
}

export async function removeFriend(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    const idx = MOCK_FRIENDS.findIndex((f) => f.id === userId);
    if (idx !== -1) MOCK_FRIENDS.splice(idx, 1);
    return;
  }
  await api.delete(`/friends/${userId}`);
}
