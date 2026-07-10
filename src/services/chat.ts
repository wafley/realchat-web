import type { Message, PaginatedResponse } from '@/types';

interface ChatConversation {
  id: string;
  name: string;
  type: 'group' | 'dm';
  avatarUrl?: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  online?: boolean;
  members?: number;
}

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const DEV_USER_ID = 'dev-user-1';

const MOCK_CONVERSATIONS: ChatConversation[] = [
  { id: '1', name: 'General', type: 'group', lastMessage: 'Hey everyone!', lastTime: '2m', unread: 3, online: true, members: 12 },
  { id: '2', name: 'Random', type: 'group', lastMessage: 'Anyone free for lunch?', lastTime: '1h', online: true, members: 10 },
  { id: '3', name: 'Project Alpha', type: 'group', lastMessage: 'Deploy is done ✅', lastTime: '3h', unread: 1, online: true, members: 6 },
  { id: '4', name: 'Design Team', type: 'group', lastMessage: 'New mockups uploaded', lastTime: 'Yesterday', online: false, members: 5 },
  { id: 'dm1', name: 'Aang Gacor', type: 'dm', lastMessage: 'Hey, can you check the latest design?', lastTime: '10:15', unread: 2, online: true },
  { id: 'dm2', name: 'Bambang', type: 'dm', lastMessage: 'The server migration is complete', lastTime: '09:00', online: true },
  { id: 'dm3', name: 'Cici', type: 'dm', lastMessage: "I'll be out tomorrow", lastTime: '16:00', online: false },
  { id: 'dm4', name: 'Dewi', type: 'dm', lastMessage: 'The deadline has been extended', lastTime: '14:00', online: true },
  { id: 'dm5', name: 'Eko', type: 'dm', lastMessage: 'Can you review my PR?', lastTime: '11:06', online: false },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', groupId: '1', senderId: 'aang', content: 'Hey everyone!', type: 'text', createdAt: new Date('2026-07-10T10:30') },
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
  'dm1': [
    { id: 'da1', groupId: 'dm1', senderId: 'aang', content: 'Hey, bisa cek design terbaru?', type: 'text', createdAt: new Date('2026-07-10T10:15') },
    { id: 'da2', groupId: 'dm1', senderId: DEV_USER_ID, content: 'Siap, gw cek dulu', type: 'text', createdAt: new Date('2026-07-10T10:17') },
    { id: 'da3', groupId: 'dm1', senderId: 'aang', content: 'Thanks! Filenya di shared folder', type: 'text', createdAt: new Date('2026-07-10T10:18') },
  ],
  'dm2': [
    { id: 'db1', groupId: 'dm2', senderId: 'bambang', content: 'Migrasi server udah selesai', type: 'text', createdAt: new Date('2026-07-10T09:00') },
    { id: 'db2', groupId: 'dm2', senderId: DEV_USER_ID, content: 'Kerja bagus! Ada downtime?', type: 'text', createdAt: new Date('2026-07-10T09:05') },
    { id: 'db3', groupId: 'dm2', senderId: 'bambang', content: 'Sama sekali nggak, lancar jaya', type: 'text', createdAt: new Date('2026-07-10T09:06') },
    { id: 'db4', groupId: 'dm2', senderId: DEV_USER_ID, content: 'Thanks infonya!', type: 'text', createdAt: new Date('2026-07-10T09:10') },
  ],
  'dm3': [
    { id: 'dc1', groupId: 'dm3', senderId: 'cici', content: 'Gw cuti besok', type: 'text', createdAt: new Date('2026-07-10T16:00') },
    { id: 'dc2', groupId: 'dm3', senderId: DEV_USER_ID, content: 'Ok siap, noted', type: 'text', createdAt: new Date('2026-07-10T16:05') },
    { id: 'dc3', groupId: 'dm3', senderId: 'cici', content: 'Sampai ketemu besok ya', type: 'text', createdAt: new Date('2026-07-10T16:06') },
  ],
  'dm4': [
    { id: 'dd1', groupId: 'dm4', senderId: 'dewi', content: 'Deadline-nya diundur', type: 'text', createdAt: new Date('2026-07-10T14:00') },
    { id: 'dd2', groupId: 'dm4', senderId: DEV_USER_ID, content: 'Perfect, jadi kita lebih santai', type: 'text', createdAt: new Date('2026-07-10T14:05') },
    { id: 'dd3', groupId: 'dm4', senderId: 'dewi', content: 'Sip 👍', type: 'text', createdAt: new Date('2026-07-10T14:06') },
  ],
  'dm5': [
    { id: 'de1', groupId: 'dm5', senderId: 'eko', content: 'Gw submit PR buat review', type: 'text', createdAt: new Date('2026-07-10T11:00') },
    { id: 'de2', groupId: 'dm5', senderId: DEV_USER_ID, content: 'Nanti gw cek abis standup', type: 'text', createdAt: new Date('2026-07-10T11:05') },
    { id: 'de3', groupId: 'dm5', senderId: 'eko', content: 'PR-nya direview dong', type: 'text', createdAt: new Date('2026-07-10T11:06') },
  ],
};

function senderName(senderId: string): string {
  const map: Record<string, string> = {
    [DEV_USER_ID]: 'You',
    'aang': 'Aang Gacor',
    'bambang': 'Bambang',
    'cici': 'Cici',
    'dewi': 'Dewi',
    'eko': 'Eko',
    'deploy-bot': 'Deploy Bot',
  };
  return map[senderId] ?? 'Unknown';
}

let msgCounter = 100;

export async function getMessages(chatId: string, isDM: boolean, page: number = 1, limit: number = 30): Promise<PaginatedResponse<Message>> {
  if (DEV_MODE) {
    await delay(300);
    const all = MOCK_MESSAGES[chatId] ?? [];
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = Math.max(0, total - page * limit);
    const end = total - (page - 1) * limit;
    const data = all.slice(start, end).map((m) => ({
      ...m,
      status: m.status ?? (m.senderId === DEV_USER_ID ? 'read' as const : undefined),
      sender: { id: m.senderId, username: '', fullName: senderName(m.senderId), email: '', status: 'online' as const, createdAt: new Date() },
    }));
    return { data, total, page, limit, totalPages };
  }
  const { default: axios } = await import('axios');
  const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
  const { data } = await axios.get<PaginatedResponse<Message>>(`${import.meta.env.VITE_API_URL}${endpoint}`, {
    params: { page, limit },
  });
  return data;
}

export async function sendMessage(chatId: string, content: string, isDM: boolean): Promise<Message> {
  if (DEV_MODE) {
    await delay(200);
    msgCounter++;
    const msg: Message = {
      id: `msg-${msgCounter}`,
      groupId: chatId,
      senderId: DEV_USER_ID,
      content,
      type: 'text',
      status: 'sent',
      createdAt: new Date(),
      sender: { id: DEV_USER_ID, username: 'devuser', fullName: 'You', email: 'dev@hallowok.com', status: 'online', createdAt: new Date() },
    };
    if (!MOCK_MESSAGES[chatId]) {
      MOCK_MESSAGES[chatId] = [];
    }
    MOCK_MESSAGES[chatId].push(msg);
    return msg;
  }
  const { default: axios } = await import('axios');
  const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
  const { data } = await axios.post<Message>(`${import.meta.env.VITE_API_URL}${endpoint}`, { content });
  return data;
}

export async function getConversations(): Promise<ChatConversation[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_CONVERSATIONS];
  }
  const { default: axios } = await import('axios');
    const { data } = await axios.get<ChatConversation[]>(`${import.meta.env.VITE_API_URL}/conversations`);
  return data;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
