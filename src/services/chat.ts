import api from '@/lib/api';
import type { Message, PaginatedResponse, ReplyTo, Group, GroupMember, Reaction, User, SearchMessageResult } from '@/types';
import { DEV_USER_ID, MOCK_USERS } from '@/mocks/users';
import { MOCK_CONTACTS } from '@/mocks/contacts';
import { delay } from '@/mocks/utils';
import {
  MOCK_CONVERSATIONS,
  MOCK_GROUP_OVERRIDES,
  MOCK_MESSAGES,
  MOCK_SENDER_MAP,
  DM_USER_MAP,
  populateReadBy,
  type ChatConversation,
} from '@/mocks/chat';
export { DM_USER_MAP };

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export function senderName(senderId: string): string {
  return MOCK_SENDER_MAP[senderId] ?? 'Unknown';
}

let dmIdCounter = 6;

export async function findOrCreateConversation(userId: string): Promise<string> {
  if (DEV_MODE) {
    await delay(100);
    const existing = Object.entries(DM_USER_MAP).find(([, uid]) => uid === userId);
    if (existing) return existing[0];
    const newId = `dm${dmIdCounter++}`;
    DM_USER_MAP[newId] = userId;
    const mockUser = MOCK_USERS.find((u) => u.id === userId);
    const mockContact = MOCK_CONTACTS.find((c) => c.userId === userId);
    MOCK_CONVERSATIONS.push({
      id: newId,
      name: mockContact?.customName || mockUser?.fullName || userId,
      avatarUrl: mockUser?.avatarUrl,
      type: 'dm',
      lastMessage: '',
      lastTime: 'Now',
      online: true,
      muted: false,
    });
    return newId;
  }
  const { data } = await api.post<{ id: string }>('/conversations', { userId, type: 'dm' });
  return data.id;
}

let groupIdCounter = 10;
let msgCounter = 100;

export async function getMessages(chatId: string, isDM: boolean, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Message>> {
  try {
    if (DEV_MODE) {
      await delay(300);
      const all = MOCK_MESSAGES[chatId] ?? [];
      const total = all.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = Math.max(0, total - page * limit);
      const end = total - (page - 1) * limit;
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      const data = all.slice(start, end).map((m) => ({
        ...m,
        status: m.status ?? (m.senderId === DEV_USER_ID ? conv?.online ? 'delivered' as const : 'sent' as const : undefined),
        readBy: m.readBy ?? populateReadBy(m),
        sender: { id: m.senderId, username: '', fullName: senderName(m.senderId), email: '', status: 'online' as const, createdAt: new Date() },
      }));
      return { data, total, page, limit, totalPages };
    }

    const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
    const { data } = await api.get<PaginatedResponse<Message>>(`${endpoint}`, {
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
        conv.lastTime = new Date().toISOString();
      }
      return msg;
    }

    const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    if (replyTo) form.append('replyTo', JSON.stringify(replyTo));
    const { data } = await api.post<Message>(`${endpoint}`, form);
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
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      const online = conv?.online ?? true;
      const msg: Message = {
        id: `msg-${msgCounter}`,
        groupId: chatId,
        senderId: DEV_USER_ID,
        content,
        type: 'text',
        status: online ? 'delivered' as const : 'sent' as const,
        replyTo,
        createdAt: new Date(),
        sender: { id: DEV_USER_ID, username: 'devuser', fullName: 'You', email: 'dev@hallowok.com', status: 'online', createdAt: new Date() },
      };
      if (!MOCK_MESSAGES[chatId]) {
        MOCK_MESSAGES[chatId] = [];
      }
      MOCK_MESSAGES[chatId].push(msg);
      if (conv) {
        conv.lastMessage = content;
        conv.lastTime = new Date().toISOString();
      }
      return msg;
    }

    const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
    const { data } = await api.post<Message>(`${endpoint}`, { content, replyTo });
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to send message');
  }
}

export async function editMessage(chatId: string, messageId: string, content: string): Promise<Message> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const msgs = MOCK_MESSAGES[chatId];
      if (!msgs) throw new Error('Chat not found');
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx === -1) throw new Error('Message not found');
      msgs[idx] = { ...msgs[idx], content, edited: true, updatedAt: new Date() };
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      if (conv) { conv.lastMessage = content; conv.lastTime = new Date().toISOString(); }
      return { ...msgs[idx] };
    }

    const { data } = await api.patch<Message>(`/messages/${messageId}`, { content });
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to edit message');
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
      } else {
        msgs.splice(idx, 1);
      }
      return;
    }

    await api.delete(`/messages/${messageId}`, {
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
      const msgs = MOCK_MESSAGES[chatId];
      if (msgs) {
        msgs.forEach((m) => {
          if (m.senderId !== DEV_USER_ID && !m.readBy?.includes(DEV_USER_ID)) {
            m.readBy = [...(m.readBy ?? []), DEV_USER_ID];
            m.status = 'read';
          }
        });
      }
      return;
    }

    await api.post(`/conversations/${chatId}/read`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to mark as read');
  }
}

export async function getConversations(): Promise<ChatConversation[]> {
  try {
    if (DEV_MODE) {
      await delay(200);
      return MOCK_CONVERSATIONS.map((c) => {
        if (c.type === 'group') {
          const override = MOCK_GROUP_OVERRIDES.get(c.id);
          return { ...c, name: override?.name ?? c.name, avatarUrl: override?.avatarUrl ?? c.avatarUrl };
        }
        return c;
      });
    }

    const { data } = await api.get(`/conversations`);
    return Array.isArray(data) ? data : Array.isArray(data?.conversations) ? data.conversations : [];
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
        delete DM_USER_MAP[id];
      });
      return;
    }

    await api.post(`/conversations/bulk-delete`, { ids });
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to delete conversations');
  }
}

export async function forwardMessage(targetChatId: string, msg: Message, sourceChatId: string): Promise<Message> {
  try {
    if (DEV_MODE) {
      await delay(300);
      msgCounter++;
      const targetConv = MOCK_CONVERSATIONS.find((c) => c.id === targetChatId);
      const forwarded: Message = {
        id: `msg-${msgCounter}`,
        groupId: targetChatId,
        senderId: DEV_USER_ID,
        content: msg.content,
        type: msg.type,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        status: targetConv?.online ? 'delivered' as const : 'sent' as const,
        createdAt: new Date(),
        sender: { id: DEV_USER_ID, username: 'devuser', fullName: 'You', email: 'dev@hallowok.com', status: 'online', createdAt: new Date() },
      };
      if (!MOCK_MESSAGES[targetChatId]) MOCK_MESSAGES[targetChatId] = [];
      MOCK_MESSAGES[targetChatId].push(forwarded);
      if (targetConv) {
        targetConv.lastMessage = msg.content ? `↗ ${msg.content}` : '↗ Forwarded message';
        targetConv.lastTime = new Date().toISOString();
      }
      return forwarded;
    }

    const { data } = await api.post<Message>(`/messages/forward`, {
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

    await api.post(`/messages/${messageId}/pin`);
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

    await api.delete(`/messages/${messageId}/pin`);
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

    const { data } = await api.get<Message[]>(`/messages/${chatId}/pinned`);
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
        conv.lastTime = new Date().toISOString();
      }
      return msg;
    }

    const endpoint = isDM ? `/dm/${chatId}/messages` : `/groups/${chatId}/messages`;
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    const { data } = await api.post<Message>(`${endpoint}`, form);
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

    const { data } = await api.post<{ muted: boolean }>(`/conversations/${chatId}/toggle-mute`);
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

    await api.post(`/users/${userId}/block`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to block user');
  }
}

export async function getBlockedUsers(): Promise<User[]> {
  if (DEV_MODE) {
    await delay(200);
    return [
      { id: 'blocked1', username: 'spam_bot', fullName: 'Spam Bot', email: 'spam@example.com', status: 'offline', lastSeen: new Date(Date.now() - 86400000 * 3), createdAt: new Date() },
      { id: 'blocked2', username: 'troll', fullName: 'Troll Account', email: 'troll@example.com', status: 'offline', createdAt: new Date() },
    ];
  }
  const { data } = await api.get<User[]>('/users/blocked');
  return Array.isArray(data) ? data : [];
}

export async function unblockUser(userId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      return;
    }

    await api.delete(`/users/${userId}/block`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to unblock user');
  }
}

export async function reportUser(userId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      return;
    }

    await api.post(`/users/${userId}/report`);
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

    const { data } = await api.get(`/groups`);
    return Array.isArray(data) ? data : Array.isArray(data?.groups) ? data.groups : [];
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to get groups');
  }
}

export async function searchUsers(query: string): Promise<User[]> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const q = query.toLowerCase();
      return MOCK_USERS.filter((u) => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) as User[];
    }

    const { data } = await api.get(`/users/search`, { params: { q: query } });
    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to search users');
  }
}

export async function createGroup(name: string, description: string, memberIds: string[], isPrivate = false): Promise<ChatConversation> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const id = String(++groupIdCounter);
      const newConv: ChatConversation = { id, name, type: 'group', avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563eb`, lastMessage: 'Group created', lastTime: 'now', members: memberIds.length + 1, online: false, muted: false };
      MOCK_CONVERSATIONS.unshift(newConv);
      MOCK_MESSAGES[id] = [
        { id: `sys-${id}`, groupId: id, senderId: 'system', content: 'Group created', type: 'system', createdAt: new Date() },
      ];
      return newConv;
    }

    const { data } = await api.post<ChatConversation>(`/groups`, { name, description, memberIds, isPrivate });
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

    await api.delete(`/groups/${groupId}/members/me`);
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
      const override = MOCK_GROUP_OVERRIDES.get(groupId);
      return {
        id: groupId,
        name: override?.name ?? conv?.name ?? 'Group',
        description: override?.description ?? 'A great group for discussion',
        avatarUrl: override?.avatarUrl,
        members,
        creatorId: DEV_USER_ID,
        isPrivate: false,
        createdAt: new Date(),
      };
    }

    const { data } = await api.get<Group>(`/groups/${groupId}`);
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
      MOCK_MESSAGES[groupId] = [
        ...(MOCK_MESSAGES[groupId] ?? []),
        { id: `sys-join-${++msgCounter}`, groupId, senderId: 'system', content: `${user.fullName} telah bergabung`, type: 'system', createdAt: new Date() },
      ];
      return;
    }

    await api.post(`/groups/${groupId}/members`, { userId });
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to add member');
  }
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const user = MOCK_USERS.find((u) => u.id === userId);
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === groupId);
      if (conv) conv.members = Math.max(0, (conv.members ?? 1) - 1);
      MOCK_MESSAGES[groupId] = [
        ...(MOCK_MESSAGES[groupId] ?? []),
        { id: `sys-leave-${++msgCounter}`, groupId, senderId: 'system', content: `${user?.fullName ?? userId} telah keluar`, type: 'system', createdAt: new Date() },
      ];
      return;
    }

    await api.delete(`/groups/${groupId}/members/${userId}`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to remove member');
  }
}

export async function updateGroup(groupId: string, data: { name?: string; description?: string; avatarUrl?: string }): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const existing = MOCK_GROUP_OVERRIDES.get(groupId) ?? {};
      MOCK_GROUP_OVERRIDES.set(groupId, { ...existing, ...data });
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === groupId);
      if (conv) {
        if (data.name) conv.name = data.name;
        if (data.avatarUrl) conv.avatarUrl = data.avatarUrl;
      }
      return;
    }

    await api.patch(`/groups/${groupId}`, data);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to update group');
  }
}

export async function updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const user = MOCK_USERS.find((u) => u.id === userId);
      if (!user) return;
      MOCK_MESSAGES[groupId] = [
        ...(MOCK_MESSAGES[groupId] ?? []),
        { id: `sys-role-${++msgCounter}`, groupId, senderId: 'system', content: role === 'admin' ? `${user.fullName} menjadi admin` : `${user.fullName} tidak lagi admin`, type: 'system', createdAt: new Date() },
      ];
      return;
    }

    await api.patch(`/groups/${groupId}/members/${userId}/role`, { role });
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to update member role');
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

    await api.delete(`/groups/${groupId}`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to delete group');
  }
}

export async function uploadGroupAvatar(groupId: string, file: File): Promise<string> {
  try {
    if (DEV_MODE) {
      await delay(200);
      return URL.createObjectURL(file);
    }

    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post<{ url: string }>(`/groups/${groupId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to upload group avatar');
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

    const { data } = await api.post<{ reactions: Reaction[] }>(`/messages/${messageId}/reactions`, { emoji });
    return data.reactions;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to toggle reaction');
  }
}

export async function clearChat(chatId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      delete MOCK_MESSAGES[chatId];
      return;
    }

    await api.delete(`/chats/${chatId}/messages`);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to clear chat');
  }
}

export function searchAllMessages(query: string): SearchMessageResult[] {
  if (DEV_MODE) {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: SearchMessageResult[] = [];

    for (const [convId, messages] of Object.entries(MOCK_MESSAGES)) {
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === convId);
      if (!conv) continue;

      for (const msg of messages) {
        if (msg.content.toLowerCase().includes(q)) {
          results.push({
            messageId: msg.id,
            conversationId: convId,
            conversationName: conv.name,
            conversationType: conv.type,
            senderId: msg.senderId,
            senderName: senderName(msg.senderId),
            content: msg.content,
            createdAt: msg.createdAt,
          });
        }
      }
    }

    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return [];
}

export async function getSharedMedia(conversationId: string): Promise<Message[]> {
  if (DEV_MODE) {
    await delay(200);
    const messages = MOCK_MESSAGES[conversationId] ?? [];
    return messages.filter((m) => {
      if (m.type === 'image' || m.type === 'video' || m.type === 'file') return true;
      if (m.type === 'text') return /https?:\/\/[^\s]+/.test(m.content);
      return false;
    });
  }
  const { data } = await api.get(`/conversations/${conversationId}/media`);
  return Array.isArray(data) ? data : [];
}

export type { ChatConversation };
