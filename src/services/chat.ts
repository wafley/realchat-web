import type { Message } from '@/types';

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
  { id: 'dm1', name: 'Alice Johnson', type: 'dm', lastMessage: 'Hey, can you check the latest design?', lastTime: '10:15', unread: 2, online: true },
  { id: 'dm2', name: 'Bob Smith', type: 'dm', lastMessage: 'The server migration is complete', lastTime: '09:00', online: true },
  { id: 'dm3', name: 'Charlie Brown', type: 'dm', lastMessage: "I'll be out tomorrow", lastTime: '16:00', online: false },
  { id: 'dm4', name: 'Diana Prince', type: 'dm', lastMessage: 'The deadline has been extended', lastTime: '14:00', online: true },
  { id: 'dm5', name: 'Eve Adams', type: 'dm', lastMessage: 'Can you review my PR?', lastTime: '11:06', online: false },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', groupId: '1', senderId: 'alice', content: 'Hey everyone!', type: 'text', createdAt: new Date('2026-07-10T10:30') },
    { id: 'm2', groupId: '1', senderId: DEV_USER_ID, content: 'Hi Alice! How are you?', type: 'text', createdAt: new Date('2026-07-10T10:31') },
    { id: 'm3', groupId: '1', senderId: 'bob', content: 'Good morning team 👋', type: 'text', createdAt: new Date('2026-07-10T10:32') },
    { id: 'm4', groupId: '1', senderId: DEV_USER_ID, content: 'Did anyone see the new update?', type: 'text', createdAt: new Date('2026-07-10T10:33') },
    { id: 'm5', groupId: '1', senderId: 'alice', content: 'Yes! The UI looks much cleaner now', type: 'text', createdAt: new Date('2026-07-10T10:34') },
    { id: 'm6', groupId: '1', senderId: 'bob', content: 'I just deployed the fix for the login bug', type: 'text', createdAt: new Date('2026-07-10T10:35') },
    { id: 'm7', groupId: '1', senderId: DEV_USER_ID, content: "Awesome, thanks Bob! I'll review it", type: 'text', createdAt: new Date('2026-07-10T10:36') },
    { id: 'm8', groupId: '1', senderId: 'alice', content: 'Should we have a quick standup?', type: 'text', createdAt: new Date('2026-07-10T10:37') },
  ],
  '2': [
    { id: 'n1', groupId: '2', senderId: 'charlie', content: 'Anyone free for lunch?', type: 'text', createdAt: new Date('2026-07-10T12:00') },
    { id: 'n2', groupId: '2', senderId: DEV_USER_ID, content: "I'm in! Where to?", type: 'text', createdAt: new Date('2026-07-10T12:05') },
  ],
  '3': [
    { id: 'p1', groupId: '3', senderId: 'deploy-bot', content: 'Deploy is done ✅', type: 'system', createdAt: new Date('2026-07-10T15:00') },
    { id: 'p2', groupId: '3', senderId: DEV_USER_ID, content: 'Great! Any issues?', type: 'text', createdAt: new Date('2026-07-10T15:02') },
    { id: 'p3', groupId: '3', senderId: 'deploy-bot', content: 'All green, no errors', type: 'system', createdAt: new Date('2026-07-10T15:03') },
  ],
  '4': [
    { id: 'd1', groupId: '4', senderId: 'diana', content: 'New mockups uploaded', type: 'text', createdAt: new Date('2026-07-09T14:00') },
    { id: 'd2', groupId: '4', senderId: DEV_USER_ID, content: "Looks great! Love the new color scheme", type: 'text', createdAt: new Date('2026-07-09T14:05') },
  ],
  'dm1': [
    { id: 'da1', groupId: 'dm1', senderId: 'alice-j', content: 'Hey, can you check the latest design?', type: 'text', createdAt: new Date('2026-07-10T10:15') },
    { id: 'da2', groupId: 'dm1', senderId: DEV_USER_ID, content: 'Sure, let me check that', type: 'text', createdAt: new Date('2026-07-10T10:17') },
    { id: 'da3', groupId: 'dm1', senderId: 'alice-j', content: 'Thanks! The file is in the shared folder', type: 'text', createdAt: new Date('2026-07-10T10:18') },
  ],
  'dm2': [
    { id: 'db1', groupId: 'dm2', senderId: 'bob-s', content: 'The server migration is complete', type: 'text', createdAt: new Date('2026-07-10T09:00') },
    { id: 'db2', groupId: 'dm2', senderId: DEV_USER_ID, content: 'Great work! Any downtime?', type: 'text', createdAt: new Date('2026-07-10T09:05') },
    { id: 'db3', groupId: 'dm2', senderId: 'bob-s', content: 'None at all, smooth transition', type: 'text', createdAt: new Date('2026-07-10T09:06') },
    { id: 'db4', groupId: 'dm2', senderId: DEV_USER_ID, content: 'Thanks for the update!', type: 'text', createdAt: new Date('2026-07-10T09:10') },
  ],
  'dm3': [
    { id: 'dc1', groupId: 'dm3', senderId: 'charlie-b', content: "I'll be out tomorrow", type: 'text', createdAt: new Date('2026-07-10T16:00') },
    { id: 'dc2', groupId: 'dm3', senderId: DEV_USER_ID, content: 'No problem, noted', type: 'text', createdAt: new Date('2026-07-10T16:05') },
    { id: 'dc3', groupId: 'dm3', senderId: 'charlie-b', content: 'See you tomorrow', type: 'text', createdAt: new Date('2026-07-10T16:06') },
  ],
  'dm4': [
    { id: 'dd1', groupId: 'dm4', senderId: 'diana-p', content: 'The deadline has been extended', type: 'text', createdAt: new Date('2026-07-10T14:00') },
    { id: 'dd2', groupId: 'dm4', senderId: DEV_USER_ID, content: 'Perfect, that gives us more time', type: 'text', createdAt: new Date('2026-07-10T14:05') },
    { id: 'dd3', groupId: 'dm4', senderId: 'diana-p', content: 'Got it 👍', type: 'text', createdAt: new Date('2026-07-10T14:06') },
  ],
  'dm5': [
    { id: 'de1', groupId: 'dm5', senderId: 'eve-a', content: 'I submitted my PR for review', type: 'text', createdAt: new Date('2026-07-10T11:00') },
    { id: 'de2', groupId: 'dm5', senderId: DEV_USER_ID, content: "I'll take a look after standup", type: 'text', createdAt: new Date('2026-07-10T11:05') },
    { id: 'de3', groupId: 'dm5', senderId: 'eve-a', content: 'Can you review my PR?', type: 'text', createdAt: new Date('2026-07-10T11:06') },
  ],
};

function senderName(senderId: string): string {
  const map: Record<string, string> = {
    [DEV_USER_ID]: 'You',
    'alice': 'Alice',
    'bob': 'Bob',
    'charlie': 'Charlie',
    'diana': 'Diana',
    'deploy-bot': 'Deploy Bot',
    'alice-j': 'Alice Johnson',
    'bob-s': 'Bob Smith',
    'charlie-b': 'Charlie Brown',
    'diana-p': 'Diana Prince',
    'eve-a': 'Eve Adams',
  };
  return map[senderId] ?? 'Unknown';
}

let msgCounter = 100;

export async function getMessages(chatId: string, isDM: boolean): Promise<Message[]> {
  if (DEV_MODE) {
    await delay(300);
    const msgs = MOCK_MESSAGES[chatId];
    if (!msgs) return [];
    return msgs.map((m) => ({
      ...m,
      status: m.status ?? (m.senderId === DEV_USER_ID ? 'read' as const : undefined),
      sender: { id: m.senderId, username: '', fullName: senderName(m.senderId), email: '', status: 'online' as const, createdAt: new Date() },
    }));
  }
  const { default: axios } = await import('axios');
  const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
  const { data } = await axios.get<Message[]>(`${import.meta.env.VITE_API_URL}${endpoint}`);
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
