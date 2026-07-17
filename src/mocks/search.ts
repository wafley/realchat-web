import type { Group } from '@/types';

export const MOCK_GROUPS: Group[] = [
  { id: '1', name: 'General', description: 'General discussion for everyone', members: [], creatorId: 'aang', isPrivate: false, createdAt: new Date('2026-07-01') },
  { id: '2', name: 'Random', description: 'Off-topic chat', members: [], creatorId: 'bambang', isPrivate: false, createdAt: new Date('2026-07-01') },
  { id: '3', name: 'Project Alpha', description: 'Project collaboration', members: [], creatorId: 'cici', isPrivate: true, createdAt: new Date('2026-07-01') },
  { id: '4', name: 'Design Team', description: 'Design discussions', members: [], creatorId: 'dewi', isPrivate: false, createdAt: new Date('2026-07-01') },
];

export const MOCK_MESSAGES = [
  { id: 'm1', groupId: '1', senderId: 'aang', content: 'Hey everyone!', type: 'text' as const, createdAt: new Date('2026-07-10T10:30') },
  { id: 'm2', groupId: '1', senderId: 'dev-user-1', content: 'Halo Aang! Apa kabar?', type: 'text' as const, createdAt: new Date('2026-07-10T10:31') },
  { id: 'n1', groupId: '2', senderId: 'cici', content: 'Ada yang mau makan siang?', type: 'text' as const, createdAt: new Date('2026-07-10T12:00') },
  { id: 'p1', groupId: '3', senderId: 'deploy-bot', content: 'Deploy is done', type: 'text' as const, createdAt: new Date('2026-07-10T15:00') },
  { id: 'd1', groupId: '4', senderId: 'dewi', content: 'Mockup baru udah diupload', type: 'text' as const, createdAt: new Date('2026-07-09T14:00') },
  { id: 'da1', groupId: 'dm1', senderId: 'aang', content: 'Hey, bisa cek design terbaru?', type: 'text' as const, createdAt: new Date('2026-07-10T10:15') },
  { id: 'db1', groupId: 'dm2', senderId: 'bambang', content: 'Migrasi server udah selesai', type: 'text' as const, createdAt: new Date('2026-07-10T09:00') },
];
