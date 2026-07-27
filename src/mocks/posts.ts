import type { Post } from '@/types';

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    userId: 'aang',
    imageUrl: 'https://picsum.photos/seed/post1/600/600',
    caption: 'Aang baru selesai latihan! 🔥',
    likes: 24,
    createdAt: new Date('2026-07-27T08:00:00Z'),
  },
  {
    id: 'post-2',
    userId: 'frank',
    imageUrl: 'https://picsum.photos/seed/post2/600/600',
    caption: 'Channel Orange out now 🍊',
    likes: 89,
    createdAt: new Date('2026-07-26T20:30:00Z'),
  },
  {
    id: 'post-3',
    userId: 'bambang',
    imageUrl: 'https://picsum.photos/seed/post3/600/600',
    caption: null,
    likes: 5,
    createdAt: new Date('2026-07-26T14:15:00Z'),
  },
  {
    id: 'post-4',
    userId: 'aang',
    imageUrl: 'https://picsum.photos/seed/post4/600/600',
    caption: 'Air Nomad style 🌪️',
    likes: 42,
    createdAt: new Date('2026-07-25T18:00:00Z'),
  },
  {
    id: 'post-5',
    userId: 'cici',
    imageUrl: 'https://picsum.photos/seed/post5/600/600',
    caption: 'Weekend vibes',
    likes: 15,
    createdAt: new Date('2026-07-25T10:00:00Z'),
  },
];
