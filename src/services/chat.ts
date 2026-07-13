import type { Message, PaginatedResponse, ReplyTo, Group, GroupMember, Reaction } from '@/types';

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
  muted?: boolean;
}

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const DEV_USER_ID = 'dev-user-1';

const MOCK_CONVERSATIONS: ChatConversation[] = [
  { id: '1', name: 'General', type: 'group', lastMessage: 'Hey everyone!', lastTime: '2m', unread: 3, online: true, members: 12, muted: false },
  { id: '2', name: 'Random', type: 'group', lastMessage: 'Anyone free for lunch?', lastTime: '1h', online: true, members: 10, muted: false },
  { id: '3', name: 'Project Alpha', type: 'group', lastMessage: 'Deploy is done ✅', lastTime: '3h', unread: 1, online: true, members: 6, muted: false },
  { id: '4', name: 'Design Team', type: 'group', lastMessage: 'New mockups uploaded', lastTime: 'Yesterday', online: false, members: 5, muted: false },
  { id: 'dm1', name: 'Aang Gacor', type: 'dm', lastMessage: 'Hey, can you check the latest design?', lastTime: '10:15', unread: 2, online: true, muted: false },
  { id: 'dm2', name: 'Bambang', type: 'dm', lastMessage: 'The server migration is complete', lastTime: '09:00', online: true, muted: false },
  { id: 'dm3', name: 'Cici', type: 'dm', lastMessage: "I'll be out tomorrow", lastTime: '16:00', online: false, muted: false },
  { id: 'dm4', name: 'Dewi', type: 'dm', lastMessage: 'The deadline has been extended', lastTime: '14:00', online: true, muted: false },
  { id: 'dm5', name: 'Eko', type: 'dm', lastMessage: 'Can you review my PR?', lastTime: '11:06', online: false, muted: false },
];

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

let groupIdCounter = 10;
let msgCounter = 100;

const MOCK_USERS = [
  { id: 'aang', username: 'aang_gacor', fullName: 'Aang Gacor', email: 'aang@example.com', status: 'online', createdAt: new Date() },
  { id: 'bambang', username: 'bambang', fullName: 'Bambang', email: 'bambang@example.com', status: 'online', createdAt: new Date() },
  { id: 'cici', username: 'cici', fullName: 'Cici', email: 'cici@example.com', status: 'online', createdAt: new Date() },
  { id: 'dewi', username: 'dewi', fullName: 'Dewi', email: 'dewi@example.com', status: 'offline', createdAt: new Date() },
  { id: 'eko', username: 'eko', fullName: 'Eko', email: 'eko@example.com', status: 'offline', createdAt: new Date() },
  { id: DEV_USER_ID, username: 'devuser', fullName: 'You', email: 'dev@example.com', status: 'online', createdAt: new Date() },
];

export async function getMessages(chatId: string, isDM: boolean, page: number = 1, limit: number = 30): Promise<PaginatedResponse<Message>> {
  try {
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
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to fetch messages');
  }
}

export async function sendImageMessage(chatId: string, file: File, isDM: boolean, caption?: string, replyTo?: ReplyTo): Promise<Message> {
  try {
    if (DEV_MODE) {
      await delay(500);
      msgCounter++;
      const url = URL.createObjectURL(file);
      const msg: Message = {
        id: `msg-${msgCounter}`,
        groupId: chatId,
        senderId: DEV_USER_ID,
        content: caption ?? '',
        type: 'image',
        fileUrl: url,
        fileName: file.name,
        status: 'sent',
        replyTo,
        createdAt: new Date(),
        sender: { id: DEV_USER_ID, username: 'devuser', fullName: 'You', email: 'dev@hallowok.com', status: 'online', createdAt: new Date() },
      };
      if (!MOCK_MESSAGES[chatId]) {
        MOCK_MESSAGES[chatId] = [];
      }
      MOCK_MESSAGES[chatId].push(msg);
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      if (conv) {
        conv.lastMessage = caption ? `📷 ${caption}` : '📷 Photo';
        conv.lastTime = 'now';
      }
      return msg;
    }
    const { default: axios } = await import('axios');
    const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    if (replyTo) form.append('replyTo', JSON.stringify(replyTo));
    const { data } = await axios.post<Message>(`${import.meta.env.VITE_API_URL}${endpoint}`, form);
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to send image');
  }
}

export async function sendMessage(chatId: string, content: string, isDM: boolean, replyTo?: ReplyTo): Promise<Message> {
  try {
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
        replyTo,
        createdAt: new Date(),
        sender: { id: DEV_USER_ID, username: 'devuser', fullName: 'You', email: 'dev@hallowok.com', status: 'online', createdAt: new Date() },
      };
      if (!MOCK_MESSAGES[chatId]) {
        MOCK_MESSAGES[chatId] = [];
      }
      MOCK_MESSAGES[chatId].push(msg);
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      if (conv) {
        conv.lastMessage = content;
        conv.lastTime = 'now';
      }
      return msg;
    }
    const { default: axios } = await import('axios');
    const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
    const { data } = await axios.post<Message>(`${import.meta.env.VITE_API_URL}${endpoint}`, { content, replyTo });
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to send message');
  }
}

export async function deleteMessage(chatId: string, messageId: string, deleteForAll: boolean): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(150);
      const msgs = MOCK_MESSAGES[chatId];
      if (!msgs) return;
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      if (deleteForAll) {
        msgs[idx] = {
          ...msgs[idx],
          content: 'You deleted this message',
          type: 'text',
          fileUrl: undefined,
          fileName: undefined,
          replyTo: undefined,
        };
      }
      return;
    }
    const { default: axios } = await import('axios');
    await axios.delete(`${import.meta.env.VITE_API_URL}/messages/${messageId}`, {
      data: { deleteForAll },
    });
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to delete message');
  }
}

export async function markConversationAsRead(chatId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      if (conv) conv.unread = 0;
      return;
    }
    const { default: axios } = await import('axios');
    await axios.post(`${import.meta.env.VITE_API_URL}/conversations/${chatId}/read`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to mark as read');
  }
}

export async function getConversations(): Promise<ChatConversation[]> {
  try {
    if (DEV_MODE) {
      await delay(200);
      return [...MOCK_CONVERSATIONS];
    }
    const { default: axios } = await import('axios');
    const { data } = await axios.get<ChatConversation[]>(`${import.meta.env.VITE_API_URL}/conversations`);
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to fetch conversations');
  }
}

export async function bulkDeleteConversations(ids: string[]): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      ids.forEach((id) => {
        const idx = MOCK_CONVERSATIONS.findIndex((c) => c.id === id);
        if (idx !== -1) MOCK_CONVERSATIONS.splice(idx, 1);
        delete MOCK_MESSAGES[id];
      });
      return;
    }
    const { default: axios } = await import('axios');
    await axios.post(`${import.meta.env.VITE_API_URL}/conversations/bulk-delete`, { ids });
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to delete conversations');
  }
}

export async function forwardMessage(targetChatId: string, msg: Message, sourceChatId: string): Promise<Message> {
  try {
    if (DEV_MODE) {
      await delay(300);
      msgCounter++;
      const forwarded: Message = {
        id: `msg-${msgCounter}`,
        groupId: targetChatId,
        senderId: DEV_USER_ID,
        content: msg.content,
        type: msg.type,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        status: 'sent',
        createdAt: new Date(),
        sender: { id: DEV_USER_ID, username: 'devuser', fullName: 'You', email: 'dev@hallowok.com', status: 'online', createdAt: new Date() },
      };
      if (!MOCK_MESSAGES[targetChatId]) MOCK_MESSAGES[targetChatId] = [];
      MOCK_MESSAGES[targetChatId].push(forwarded);
      return forwarded;
    }
    const { default: axios } = await import('axios');
    const { data } = await axios.post<Message>(`${import.meta.env.VITE_API_URL}/messages/forward`, {
      targetChatId, messageId: msg.id, sourceChatId,
    });
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to forward message');
  }
}

export async function pinMessage(chatId: string, messageId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const msgs = MOCK_MESSAGES[chatId];
      if (!msgs) return;
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      msgs[idx] = { ...msgs[idx], isPinned: true };
      return;
    }
    const { default: axios } = await import('axios');
    await axios.post(`${import.meta.env.VITE_API_URL}/messages/${messageId}/pin`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to pin message');
  }
}

export async function unpinMessage(chatId: string, messageId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const msgs = MOCK_MESSAGES[chatId];
      if (!msgs) return;
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      msgs[idx] = { ...msgs[idx], isPinned: false };
      return;
    }
    const { default: axios } = await import('axios');
    await axios.delete(`${import.meta.env.VITE_API_URL}/messages/${messageId}/pin`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to unpin message');
  }
}

export async function getPinnedMessages(chatId: string): Promise<Message[]> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const msgs = MOCK_MESSAGES[chatId] ?? [];
      return msgs.filter((m) => m.isPinned);
    }
    const { default: axios } = await import('axios');
    const { data } = await axios.get<Message[]>(`${import.meta.env.VITE_API_URL}/messages/${chatId}/pinned`);
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to get pinned messages');
  }
}

export async function sendFileMessage(chatId: string, file: File, isDM: boolean, caption?: string): Promise<Message> {
  try {
    if (DEV_MODE) {
      await delay(500);
      msgCounter++;
      const url = URL.createObjectURL(file);
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(ext);
      const msg: Message = {
        id: `msg-${msgCounter}`,
        groupId: chatId,
        senderId: DEV_USER_ID,
        content: caption ?? '',
        type: isVideo ? 'video' : 'file',
        fileUrl: url,
        fileName: file.name,
        fileSize: file.size,
        duration: isVideo ? 0 : undefined,
        status: 'sent',
        createdAt: new Date(),
        sender: { id: DEV_USER_ID, username: 'devuser', fullName: 'You', email: 'dev@hallowok.com', status: 'online', createdAt: new Date() },
      };
      if (!MOCK_MESSAGES[chatId]) MOCK_MESSAGES[chatId] = [];
      MOCK_MESSAGES[chatId].push(msg);
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      if (conv) {
        conv.lastMessage = isVideo ? '🎬 Video' : `📎 ${file.name}`;
        conv.lastTime = 'now';
      }
      return msg;
    }
    const { default: axios } = await import('axios');
    const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    const { data } = await axios.post<Message>(`${import.meta.env.VITE_API_URL}${endpoint}`, form);
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to send file');
  }
}

export async function toggleMuteConversation(chatId: string): Promise<boolean> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      if (!conv) return false;
      conv.muted = !conv.muted;
      return conv.muted;
    }
    const { default: axios } = await import('axios');
    const { data } = await axios.post<{ muted: boolean }>(`${import.meta.env.VITE_API_URL}/conversations/${chatId}/toggle-mute`);
    return data.muted;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to toggle mute');
  }
}

export async function blockUser(userId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      return;
    }
    const { default: axios } = await import('axios');
    await axios.post(`${import.meta.env.VITE_API_URL}/users/${userId}/block`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to block user');
  }
}

export async function reportUser(userId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      return;
    }
    const { default: axios } = await import('axios');
    await axios.post(`${import.meta.env.VITE_API_URL}/users/${userId}/report`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to report user');
  }
}

export async function getGroups(): Promise<ChatConversation[]> {
  try {
    if (DEV_MODE) {
      await delay(100);
      return MOCK_CONVERSATIONS.filter((c) => c.type === 'group');
    }
    const { default: axios } = await import('axios');
    const { data } = await axios.get<ChatConversation[]>(`${import.meta.env.VITE_API_URL}/groups`);
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to get groups');
  }
}

export async function searchUsers(query: string): Promise<typeof MOCK_USERS> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const q = query.toLowerCase();
      return MOCK_USERS.filter((u) => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    }
    const { default: axios } = await import('axios');
    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/users/search`, { params: { q: query } });
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to search users');
  }
}

export async function createGroup(name: string, description: string, memberIds: string[]): Promise<ChatConversation> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const id = String(++groupIdCounter);
      const newConv: ChatConversation = { id, name, type: 'group', avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563eb`, lastMessage: 'Group created', lastTime: 'now', members: memberIds.length + 1, online: true, muted: false };
      MOCK_CONVERSATIONS.unshift(newConv);
      MOCK_MESSAGES[id] = [
        { id: `sys-${id}`, groupId: id, senderId: 'system', content: 'Group created', type: 'system', createdAt: new Date() },
      ];
      return newConv;
    }
    const { default: axios } = await import('axios');
    const { data } = await axios.post<ChatConversation>(`${import.meta.env.VITE_API_URL}/groups`, { name, description, memberIds });
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to create group');
  }
}

export async function leaveGroup(groupId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const idx = MOCK_CONVERSATIONS.findIndex((c) => c.id === groupId);
      if (idx !== -1) MOCK_CONVERSATIONS.splice(idx, 1);
      delete MOCK_MESSAGES[groupId];
      return;
    }
    const { default: axios } = await import('axios');
    await axios.delete(`${import.meta.env.VITE_API_URL}/groups/${groupId}/leave`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to leave group');
  }
}

export async function getGroup(groupId: string): Promise<Group> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const members: GroupMember[] = [
        { id: 'gm1', userId: 'aang', groupId, role: 'admin', joinedAt: new Date(), user: { id: 'aang', username: 'aang_gacor', fullName: 'Aang Gacor', email: '', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Aang+Gacor&backgroundColor=4f46e5', status: 'online', createdAt: new Date() } },
        { id: 'gm2', userId: 'bambang', groupId, role: 'member', joinedAt: new Date(), user: { id: 'bambang', username: 'bambang', fullName: 'Bambang', email: '', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Bambang&backgroundColor=059669', status: 'online', createdAt: new Date() } },
        { id: 'gm3', userId: 'cici', groupId, role: 'admin', joinedAt: new Date(), user: { id: 'cici', username: 'cici', fullName: 'Cici', email: '', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Cici&backgroundColor=d97706', status: 'online', createdAt: new Date() } },
        { id: 'gm4', userId: 'dewi', groupId, role: 'member', joinedAt: new Date(), user: { id: 'dewi', username: 'dewi', fullName: 'Dewi', email: '', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Dewi&backgroundColor=dc2626', status: 'offline', createdAt: new Date() } },
        { id: 'gm5', userId: 'eko', groupId, role: 'member', joinedAt: new Date(), user: { id: 'eko', username: 'eko', fullName: 'Eko', email: '', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Eko&backgroundColor=7c3aed', status: 'offline', createdAt: new Date() } },
        { id: 'gm6', userId: DEV_USER_ID, groupId, role: 'admin', joinedAt: new Date(), user: { id: DEV_USER_ID, username: 'devuser', fullName: 'You', email: '', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=You&backgroundColor=0891b2', status: 'online', createdAt: new Date() } },
      ];
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === groupId);
      return {
        id: groupId,
        name: conv?.name ?? 'Group',
        description: 'A great group for discussion',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(conv?.name ?? 'Group') + '&backgroundColor=2563eb',
        members,
        creatorId: DEV_USER_ID,
        isPrivate: false,
        createdAt: new Date(),
      };
    }
    const { default: axios } = await import('axios');
    const { data } = await axios.get<Group>(`${import.meta.env.VITE_API_URL}/groups/${groupId}`);
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to get group');
  }
}

export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const user = MOCK_USERS.find((u) => u.id === userId);
      if (!user) return;
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === groupId);
      if (conv) conv.members = (conv.members ?? 0) + 1;
      return;
    }
    const { default: axios } = await import('axios');
    await axios.post(`${import.meta.env.VITE_API_URL}/groups/${groupId}/members`, { userId });
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to add member');
  }
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === groupId);
      if (conv) conv.members = Math.max(0, (conv.members ?? 1) - 1);
      return;
    }
    const { default: axios } = await import('axios');
    await axios.delete(`${import.meta.env.VITE_API_URL}/groups/${groupId}/members/${userId}`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to remove member');
  }
}

export async function updateGroup(groupId: string, data: { name?: string; description?: string; avatarUrl?: string }): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === groupId);
      if (conv) {
        if (data.name) conv.name = data.name;
      }
      return;
    }
    const { default: axios } = await import('axios');
    await axios.patch(`${import.meta.env.VITE_API_URL}/groups/${groupId}`, data);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to update group');
  }
}

export async function deleteGroup(groupId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const idx = MOCK_CONVERSATIONS.findIndex((c) => c.id === groupId);
      if (idx !== -1) MOCK_CONVERSATIONS.splice(idx, 1);
      delete MOCK_MESSAGES[groupId];
      return;
    }
    const { default: axios } = await import('axios');
    await axios.delete(`${import.meta.env.VITE_API_URL}/groups/${groupId}`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to delete group');
  }
}

export async function toggleReaction(chatId: string, messageId: string, emoji: string): Promise<Reaction[]> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const msgs = MOCK_MESSAGES[chatId];
      if (!msgs) return [];
      const msg = msgs.find((m) => m.id === messageId);
      if (!msg) return [];
      const current = msg.reactions ?? [];
      const existingIdx = current.findIndex((r) => r.userId === DEV_USER_ID && r.emoji === emoji);
      if (existingIdx !== -1) {
        current.splice(existingIdx, 1);
      } else {
        current.push({ emoji, userId: DEV_USER_ID, userName: 'You' });
      }
      msg.reactions = current;
      return [...current];
    }
    const { default: axios } = await import('axios');
    const { data } = await axios.post<{ reactions: Reaction[] }>(`${import.meta.env.VITE_API_URL}/messages/${messageId}/reactions`, { emoji });
    return data.reactions;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to toggle reaction');
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
