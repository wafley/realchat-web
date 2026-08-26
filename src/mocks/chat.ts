import type { Message } from '@/types';
import { DEV_USER_ID, MOCK_USERS } from './users';
import { MOCK_CONTACTS } from './contacts';

export interface ChatConversation {
  id: string;
  name: string;
  type: 'group' | 'dm';
  avatarUrl?: string;
  lastMessage?: string;
  lastSenderName?: string;
  lastTime?: string;
  unread?: number;
  online?: boolean;
  lastSeen?: Date;
  members?: number;
  muted?: boolean;
  userId?: string;
}

const GROUP_CONVERSATIONS: ChatConversation[] = [
  { id: '1', name: 'General', type: 'group', lastMessage: 'Hey everyone!', lastTime: '2m', unread: 3, online: true, members: 12, muted: false },
  { id: '2', name: 'Random', type: 'group', lastMessage: 'Anyone free for lunch?', lastTime: '1h', online: true, members: 10, muted: false },
  { id: '3', name: 'Project Alpha', type: 'group', lastMessage: 'Deploy is done ✅', lastTime: '3h', unread: 1, online: true, members: 6, muted: false },
  { id: '4', name: 'Design Team', type: 'group', lastMessage: 'New mockups uploaded', lastTime: 'Yesterday', online: false, lastSeen: new Date(Date.now() - 86400000), members: 5, muted: false },
];

const FIRST_FIVE_OVERRIDES: Record<string, { lastMessage: string; lastTime: string; unread?: number }> = {
  aang: { lastMessage: 'Hey, can you check the latest design?', lastTime: '10:15', unread: 2 },
  bambang: { lastMessage: 'The server migration is complete', lastTime: '09:00' },
  cici: { lastMessage: "I'll be out tomorrow", lastTime: '16:00' },
  dewi: { lastMessage: 'The deadline has been extended', lastTime: '14:00' },
  eko: { lastMessage: 'Can you review my PR?', lastTime: '11:06' },
};

const TIME_LABELS = ['1m', '5m', '12m', '30m', '1h', '2h', '5h', '8h', '12h', '1d', '2d', '3d'];

const DM_CONVERSATIONS: ChatConversation[] = MOCK_CONTACTS.map((contact, i) => {
  const o = FIRST_FIVE_OVERRIDES[contact.userId];
  return {
    id: `dm-${contact.userId}`,
    name: contact.customName || contact.user.fullName,
    type: 'dm' as const,
    lastMessage: o?.lastMessage ?? '',
    lastTime: o?.lastTime ?? TIME_LABELS[Math.min(i, TIME_LABELS.length - 1)] ?? 'Now',
    ...(o?.unread ? { unread: o.unread } : {}),
    online: contact.user.status === 'online',
    lastSeen: contact.user.lastSeen,
    muted: false,
  };
});

const MOCK_CONVERSATIONS: ChatConversation[] = [...GROUP_CONVERSATIONS, ...DM_CONVERSATIONS];

const MOCK_GROUP_OVERRIDES = new Map<string, { name?: string; description?: string; avatarUrl?: string }>();

const EXISTING_DM_MESSAGES: Record<string, Message[]> = {
  'dm-aang': [
    { id: 'da1', groupId: 'dm-aang', senderId: 'aang', content: 'Hey, bisa cek design terbaru?', type: 'text', createdAt: new Date('2026-07-10T10:15') },
    { id: 'da2', groupId: 'dm-aang', senderId: DEV_USER_ID, content: 'Siap, gw cek dulu', type: 'text', createdAt: new Date('2026-07-10T10:17') },
    { id: 'da3', groupId: 'dm-aang', senderId: 'aang', content: 'Thanks! Filenya di shared folder', type: 'text', createdAt: new Date('2026-07-10T10:18') },
    { id: 'da4', groupId: 'dm-aang', senderId: 'aang', content: 'Desain terbaru.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang1/200/200', fileName: 'desain-terbaru.png', fileSize: 245760, createdAt: new Date('2026-07-10T10:19') },
    { id: 'da5', groupId: 'dm-aang', senderId: 'aang', content: 'Mockup mobile.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang2/200/200', fileName: 'mockup-mobile.png', fileSize: 312000, createdAt: new Date('2026-07-10T10:20') },
    { id: 'da6', groupId: 'dm-aang', senderId: DEV_USER_ID, content: 'Screencast_review.mp4', type: 'video', fileUrl: 'https://picsum.photos/seed/aang3/200/200', fileName: 'screencast_review.mp4', fileSize: 5242880, duration: 32, createdAt: new Date('2026-07-10T10:22') },
    { id: 'da7', groupId: 'dm-aang', senderId: 'aang', content: 'landing-page.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang4/200/200', fileName: 'landing-page.png', fileSize: 198000, createdAt: new Date('2026-07-10T10:25') },
    { id: 'da8', groupId: 'dm-aang', senderId: 'aang', content: 'logo-v2.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang5/200/200', fileName: 'logo-v2.png', fileSize: 85000, createdAt: new Date('2026-07-10T10:26') },
    { id: 'da9', groupId: 'dm-aang', senderId: 'aang', content: 'icon-set.svg', type: 'image', fileUrl: 'https://picsum.photos/seed/aang6/200/200', fileName: 'icon-set.svg', fileSize: 120000, createdAt: new Date('2026-07-10T10:27') },
    { id: 'da10', groupId: 'dm-aang', senderId: DEV_USER_ID, content: 'revisi-1.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang7/200/200', fileName: 'revisi-1.png', fileSize: 210000, createdAt: new Date('2026-07-10T10:30') },
    { id: 'da11', groupId: 'dm-aang', senderId: DEV_USER_ID, content: 'revisi-2.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang8/200/200', fileName: 'revisi-2.png', fileSize: 225000, createdAt: new Date('2026-07-10T10:31') },
    { id: 'da12', groupId: 'dm-aang', senderId: 'aang', content: 'final-design.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang9/200/200', fileName: 'final-design.png', fileSize: 280000, createdAt: new Date('2026-07-10T10:35') },
    { id: 'da14', groupId: 'dm-aang', senderId: 'aang', content: 'Cek referensi desain di https://dribbble.com/search/purple-gradient', type: 'text', createdAt: new Date('2026-07-10T10:45') },
    { id: 'da15', groupId: 'dm-aang', senderId: 'aang', content: 'Ini inspirasinya https://www.behance.net/gallery/123456', type: 'text', createdAt: new Date('2026-07-10T10:46') },
    { id: 'da16', groupId: 'dm-aang', senderId: 'aang', content: 'Font pake dari https://fonts.google.com/ aja', type: 'text', createdAt: new Date('2026-07-10T10:47') },
    { id: 'da17', groupId: 'dm-aang', senderId: DEV_USER_ID, content: 'Siap, nanti gw cek tutorialnya di https://youtu.be/abc123', type: 'text', createdAt: new Date('2026-07-10T10:50') },
    { id: 'da18', groupId: 'dm-aang', senderId: 'aang', content: 'banner-utama.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang10/200/200', fileName: 'banner-utama.png', fileSize: 195000, createdAt: new Date('2026-07-10T11:00') },
    { id: 'da19', groupId: 'dm-aang', senderId: 'aang', content: 'hero-section.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang11/200/200', fileName: 'hero-section.png', fileSize: 310000, createdAt: new Date('2026-07-10T11:02') },
    { id: 'da20', groupId: 'dm-aang', senderId: DEV_USER_ID, content: 'hasil-edit-1.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang12/200/200', fileName: 'hasil-edit-1.png', fileSize: 178000, createdAt: new Date('2026-07-10T11:05') },
    { id: 'da21', groupId: 'dm-aang', senderId: 'aang', content: 'revisi-font.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang13/200/200', fileName: 'revisi-font.png', fileSize: 220000, createdAt: new Date('2026-07-10T11:10') },
    { id: 'da22', groupId: 'dm-aang', senderId: 'aang', content: 'mockup-desktop.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang14/200/200', fileName: 'mockup-desktop.png', fileSize: 340000, createdAt: new Date('2026-07-10T11:15') },
    { id: 'da23', groupId: 'dm-aang', senderId: DEV_USER_ID, content: 'perbaikan-warna.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang15/200/200', fileName: 'perbaikan-warna.png', fileSize: 205000, createdAt: new Date('2026-07-10T11:20') },
    { id: 'da24', groupId: 'dm-aang', senderId: 'aang', content: 'thumb-card.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang16/200/200', fileName: 'thumb-card.png', fileSize: 165000, createdAt: new Date('2026-07-10T11:25') },
    { id: 'da25', groupId: 'dm-aang', senderId: 'aang', content: 'ilustrasi-baru.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang17/200/200', fileName: 'ilustrasi-baru.png', fileSize: 290000, createdAt: new Date('2026-07-10T11:30') },
    { id: 'da26', groupId: 'dm-aang', senderId: DEV_USER_ID, content: 'kompresi-aset.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang18/200/200', fileName: 'kompresi-aset.png', fileSize: 140000, createdAt: new Date('2026-07-10T11:35') },
    { id: 'da27', groupId: 'dm-aang', senderId: 'aang', content: 'dark-mode-ui.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang19/200/200', fileName: 'dark-mode-ui.png', fileSize: 265000, createdAt: new Date('2026-07-10T11:40') },
    { id: 'da28', groupId: 'dm-aang', senderId: 'aang', content: 'light-mode-ui.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang20/200/200', fileName: 'light-mode-ui.png', fileSize: 255000, createdAt: new Date('2026-07-10T11:42') },
    { id: 'da29', groupId: 'dm-aang', senderId: DEV_USER_ID, content: 'approved-vercel.png', type: 'image', fileUrl: 'https://picsum.photos/seed/aang21/200/200', fileName: 'approved-vercel.png', fileSize: 185000, createdAt: new Date('2026-07-10T11:45') },
  ],
  'dm-bambang': [
    { id: 'db1', groupId: 'dm-bambang', senderId: 'bambang', content: 'Migrasi server udah selesai', type: 'text', createdAt: new Date('2026-07-10T09:00') },
    { id: 'db2', groupId: 'dm-bambang', senderId: DEV_USER_ID, content: 'Kerja bagus! Ada downtime?', type: 'text', createdAt: new Date('2026-07-10T09:05') },
    { id: 'db3', groupId: 'dm-bambang', senderId: 'bambang', content: 'Sama sekali nggak, lancar jaya', type: 'text', createdAt: new Date('2026-07-10T09:06') },
    { id: 'db4', groupId: 'dm-bambang', senderId: DEV_USER_ID, content: 'Thanks infonya!', type: 'text', createdAt: new Date('2026-07-10T09:10') },
    { id: 'db5', groupId: 'dm-bambang', senderId: 'bambang', content: 'infra-diagram.png', type: 'image', fileUrl: 'https://picsum.photos/seed/bambang1/600/400', fileName: 'infra-diagram.png', fileSize: 198000, createdAt: new Date('2026-07-10T09:15') },
    { id: 'db6', groupId: 'dm-bambang', senderId: DEV_USER_ID, content: 'Screenshot_hasil.png', type: 'image', fileUrl: 'https://picsum.photos/seed/bambang2/200/200', fileName: 'screenshot-hasil.png', fileSize: 180000, createdAt: new Date('2026-07-10T09:20') },
  ],
  'dm-cici': [
    { id: 'dc1', groupId: 'dm-cici', senderId: 'cici', content: 'Gw cuti besok', type: 'text', createdAt: new Date('2026-07-10T16:00') },
    { id: 'dc2', groupId: 'dm-cici', senderId: DEV_USER_ID, content: 'Ok siap, noted', type: 'text', createdAt: new Date('2026-07-10T16:05') },
    { id: 'dc3', groupId: 'dm-cici', senderId: 'cici', content: 'Sampai ketemu besok ya', type: 'text', createdAt: new Date('2026-07-10T16:06') },
    { id: 'dc4', groupId: 'dm-cici', senderId: 'cici', content: 'foto-liburan.jpg', type: 'image', fileUrl: 'https://picsum.photos/seed/cici1/200/200', fileName: 'foto-liburan.jpg', fileSize: 420000, createdAt: new Date('2026-07-10T16:10') },
    { id: 'dc5', groupId: 'dm-cici', senderId: 'cici', content: 'foto-sunset.jpg', type: 'image', fileUrl: 'https://picsum.photos/seed/cici2/400/300', fileName: 'foto-sunset.jpg', fileSize: 350000, createdAt: new Date('2026-07-10T16:11') },
  ],
  'dm-dewi': [
    { id: 'dd1', groupId: 'dm-dewi', senderId: 'dewi', content: 'Deadline-nya diundur', type: 'text', createdAt: new Date('2026-07-10T14:00') },
    { id: 'dd2', groupId: 'dm-dewi', senderId: DEV_USER_ID, content: 'Perfect, jadi kita lebih santai', type: 'text', createdAt: new Date('2026-07-10T14:05') },
    { id: 'dd3', groupId: 'dm-dewi', senderId: 'dewi', content: 'Sip 👍', type: 'text', createdAt: new Date('2026-07-10T14:06') },
    { id: 'dd4', groupId: 'dm-dewi', senderId: 'dewi', content: 'mockup-v2.png', type: 'image', fileUrl: 'https://picsum.photos/seed/dewi1/200/200', fileName: 'mockup-v2.png', fileSize: 275000, createdAt: new Date('2026-07-10T14:10') },
    { id: 'dd5', groupId: 'dm-dewi', senderId: 'dewi', content: 'wireframe-baru.png', type: 'image', fileUrl: 'https://picsum.photos/seed/dewi2/200/200', fileName: 'wireframe-baru.png', fileSize: 310000, createdAt: new Date('2026-07-10T14:12') },
    { id: 'dd6', groupId: 'dm-dewi', senderId: DEV_USER_ID, content: 'feedback-design.png', type: 'image', fileUrl: 'https://picsum.photos/seed/dewi3/200/200', fileName: 'feedback-design.png', fileSize: 195000, createdAt: new Date('2026-07-10T14:15') },
  ],
  'dm-eko': [
    { id: 'de1', groupId: 'dm-eko', senderId: 'eko', content: 'Gw submit PR buat review', type: 'text', createdAt: new Date('2026-07-10T11:00') },
    { id: 'de2', groupId: 'dm-eko', senderId: DEV_USER_ID, content: 'Nanti gw cek abis standup', type: 'text', createdAt: new Date('2026-07-10T11:05') },
    { id: 'de3', groupId: 'dm-eko', senderId: 'eko', content: 'PR-nya direview dong', type: 'text', createdAt: new Date('2026-07-10T11:06') },
  ],
};

const SEED_MESSAGES: Record<string, Message[]> = {};
for (const contact of MOCK_CONTACTS) {
  if (FIRST_FIVE_OVERRIDES[contact.userId]) continue;
  const dmId = `dm-${contact.userId}`;
  SEED_MESSAGES[dmId] = [
    {
      id: `s-${contact.userId}`,
      groupId: dmId,
      senderId: contact.userId,
      content: 'Hi! 👋',
      type: 'text',
      createdAt: new Date(Date.now() - (MOCK_CONTACTS.indexOf(contact) + 1) * 7200000),
    },
  ];
}

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', groupId: '1', senderId: 'aang', content: 'Hey everyone!', type: 'text', isPinned: true, createdAt: new Date('2026-07-10T10:30') },
    { id: 'm2', groupId: '1', senderId: DEV_USER_ID, content: 'Halo Aang! Apa kabar?', type: 'text', createdAt: new Date('2026-07-10T10:31') },
    { id: 'm3', groupId: '1', senderId: 'bambang', content: 'Selamat pagi teman-teman 👋', type: 'text', createdAt: new Date('2026-07-10T10:32') },
    { id: 'm4', groupId: '1', senderId: DEV_USER_ID, content: 'Ada yang lihat update baru?', type: 'text', createdAt: new Date('2026-07-10T10:33') },
    { id: 'm5', groupId: '1', senderId: 'aang', content: 'Iya! UI-nya jauh lebih bersih sekarang', type: 'text', createdAt: new Date('2026-07-10T10:34') },
    { id: 'm6', groupId: '1', senderId: 'bambang', content: 'Gw baru deploy fix bug login', type: 'text', createdAt: new Date('2026-07-10T10:35') },
    { id: 'm7', groupId: '1', senderId: DEV_USER_ID, content: 'Mantap, thanks Bang! Gw review dulu', type: 'text', createdAt: new Date('2026-07-10T10:36') },
    { id: 'm8', groupId: '1', senderId: 'aang', content: 'Kita standup bentar yuk?', type: 'text', createdAt: new Date('2026-07-10T10:37') },
  ],
  '2': [
    { id: 'n1', groupId: '2', senderId: 'cici', content: 'Ada yang mau makan siang?', type: 'text', createdAt: new Date('2026-07-10T12:00') },
    { id: 'n2', groupId: '2', senderId: DEV_USER_ID, content: 'Gw ikut! Makan dimana?', type: 'text', createdAt: new Date('2026-07-10T12:05') },
  ],
  '3': [
    { id: 'p1', groupId: '3', senderId: 'deploy-bot', content: 'Deploy is done ✅', type: 'system', createdAt: new Date('2026-07-10T15:00') },
    { id: 'p2', groupId: '3', senderId: DEV_USER_ID, content: 'Mantul! Ada error?', type: 'text', createdAt: new Date('2026-07-10T15:02') },
    { id: 'p3', groupId: '3', senderId: 'deploy-bot', content: 'All green, no errors', type: 'system', createdAt: new Date('2026-07-10T15:03') },
  ],
  '4': [
    { id: 'd1', groupId: '4', senderId: 'dewi', content: 'Mockup baru udah diupload', type: 'text', createdAt: new Date('2026-07-09T14:00') },
    { id: 'd2', groupId: '4', senderId: DEV_USER_ID, content: 'Keren! Skema warnanya keren banget', type: 'text', createdAt: new Date('2026-07-09T14:05') },
  ],
  ...EXISTING_DM_MESSAGES,
  ...SEED_MESSAGES,
};

const MOCK_SENDER_MAP: Record<string, string> = {
  [DEV_USER_ID]: 'You',
  'deploy-bot': 'Deploy Bot',
  ...Object.fromEntries(MOCK_USERS.map((u) => [u.id, u.fullName])),
};

const GROUP_MEMBER_IDS = MOCK_USERS.filter((u) => u.id !== DEV_USER_ID).map((u) => u.id);

const DM_USER_MAP: Record<string, string> = Object.fromEntries(
  MOCK_CONTACTS.map((c) => [`dm-${c.userId}`, c.userId]),
);

function populateReadBy(msg: Message): string[] | undefined {
  if (msg.type === 'system') return undefined;
  if (msg.senderId === DEV_USER_ID) return undefined;
  return [DEV_USER_ID];
}

function updateConversationName(userId: string, name: string): void {
  const conv = MOCK_CONVERSATIONS.find((c) => c.id === `dm-${userId}`);
  if (conv) conv.name = name;
}

export {
  MOCK_CONVERSATIONS,
  MOCK_GROUP_OVERRIDES,
  MOCK_MESSAGES,
  MOCK_SENDER_MAP,
  GROUP_MEMBER_IDS,
  DM_USER_MAP,
  populateReadBy,
  updateConversationName,
};
