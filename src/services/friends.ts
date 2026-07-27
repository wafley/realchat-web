import type { User } from '@/types';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { DEV_USER_ID, MOCK_USERS } from '@/mocks/users';
import { delay } from '@/mocks/utils';
import { MOCK_FOLLOWING, MOCK_FOLLOWERS } from '@/mocks/friends';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export async function searchPeople(query: string): Promise<User[]> {
  if (DEV_MODE) {
    await delay(300);
    const q = query.toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        u.id !== DEV_USER_ID &&
        !MOCK_FOLLOWING.some((f) => f.id === u.id) &&
        (u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)),
    );
  }
  try {
    const { data } = await api.get<User[]>('/users/search', { params: { q: query } });
    const currentUserId = useAuthStore.getState().user?.id;
    return data.filter((u) => u.id !== currentUserId);
  } catch {
    throw new Error('Failed to search users');
  }
}

export async function followUser(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    if (!MOCK_FOLLOWING.some((f) => f.id === userId)) {
      MOCK_FOLLOWING.push(user);
    }
    return;
  }
  await api.post(`/me/following/${userId}`);
}

export async function unfollowUser(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    const idx = MOCK_FOLLOWING.findIndex((f) => f.id === userId);
    if (idx !== -1) MOCK_FOLLOWING.splice(idx, 1);
    return;
  }
  await api.delete(`/me/following/${userId}`);
}

export async function getFollowing(): Promise<User[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_FOLLOWING];
  }
  const { data } = await api.get<User[]>('/me/following');
  return data;
}

export async function getFollowers(): Promise<User[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_FOLLOWERS];
  }
  const { data } = await api.get<User[]>('/me/followers');
  return data;
}

export async function getUserFollowing(userId: string): Promise<User[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_FOLLOWING];
  }
  const { data } = await api.get<User[]>(`/users/${userId}/following`);
  return data;
}

export async function getUserFollowers(userId: string): Promise<User[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_FOLLOWERS];
  }
  const { data } = await api.get<User[]>(`/users/${userId}/followers`);
  return data;
}

export async function getRelationship(userId: string): Promise<'none' | 'following' | 'follows_you' | 'mutual'> {
  if (DEV_MODE) {
    await delay(100);
    const isFollowing = MOCK_FOLLOWING.some((f) => f.id === userId);
    const isFollower = MOCK_FOLLOWERS.some((f) => f.id === userId);
    if (isFollowing && isFollower) return 'mutual';
    if (isFollowing) return 'following';
    if (isFollower) return 'follows_you';
    return 'none';
  }
  const { data } = await api.get<{ status: 'none' | 'following' | 'follows_you' | 'mutual' }>(`/users/${userId}/relationship`);
  return data.status;
}
