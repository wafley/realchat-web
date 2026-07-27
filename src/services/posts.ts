import type { Post } from '@/types';
import api from '@/lib/api';
import { MOCK_POSTS } from '@/mocks/posts';
import { MOCK_USERS } from '@/mocks/users';
import { delay } from '@/mocks/utils';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

function populateUser(posts: Post[]): Post[] {
  return posts.map((p) => ({
    ...p,
    user: MOCK_USERS.find((u) => u.id === p.userId),
  }));
}

export async function getFeed(): Promise<Post[]> {
  if (DEV_MODE) {
    await delay(300);
    return populateUser(
      [...MOCK_POSTS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }
  const { data } = await api.get<Post[]>('/feed');
  return data;
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  if (DEV_MODE) {
    await delay(200);
    return populateUser(MOCK_POSTS.filter((p) => p.userId === userId));
  }
  const { data } = await api.get<Post[]>(`/users/${userId}/posts`);
  return data;
}

export async function createPost(imageUrl: string, caption?: string): Promise<Post> {
  if (DEV_MODE) {
    await delay(500);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: 'dev-user-1',
      imageUrl,
      caption,
      likes: 0,
      createdAt: new Date(),
    };
    MOCK_POSTS.unshift(newPost);
    return populateUser([newPost])[0];
  }
  const { data } = await api.post<Post>('/posts', { imageUrl, caption });
  return data;
}

export async function deletePost(postId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    const idx = MOCK_POSTS.findIndex((p) => p.id === postId);
    if (idx !== -1) MOCK_POSTS.splice(idx, 1);
    return;
  }
  await api.delete(`/posts/${postId}`);
}
