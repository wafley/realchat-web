import api from '@/lib/api';
import { socketClient } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { markChatCleared } from '@/lib/chatCleared';
import { hideChats, isChatDeleted } from '@/lib/chatDeleted';
import type { InfiniteData } from '@tanstack/react-query';
import type { Message, MessageStatus, PaginatedResponse, ReplyTo, Group, GroupMember, Reaction, ReactionGroup, User, SearchMessageResult } from '@/types';
import { toError } from '@/utils/errors';
import { DEV_USER_ID, MOCK_USERS } from '@/mocks/users';
import { MOCK_CONTACTS } from '@/mocks/contacts';
import { delay } from '@/mocks/utils';
import {
  MOCK_CONVERSATIONS,
  MOCK_GROUP_OVERRIDES,
  MOCK_MESSAGES,
  MOCK_SENDER_MAP,
  DM_USER_MAP,
  GROUP_MEMBER_IDS,
  populateReadBy,
  type ChatConversation,
} from '@/mocks/chat';
export { DM_USER_MAP };

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export const MOCK_BLOCKED_USERS = new Map<string, User>();

export function senderName(senderId: string): string {
  return MOCK_SENDER_MAP[senderId] ?? 'Unknown';
}

let dmIdCounter = 6;

export async function findOrCreateConversation(userId: string): Promise<string> {
  const me = useAuthStore.getState().user?.id;
  if (me && userId === me) {
    throw new Error('You cannot start a conversation with yourself');
  }
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
  const { data } = await api.post<{ id?: string; conversationId?: string; conversation?: { id?: string }; data?: { id?: string } }>('/conversations', { type: 'PRIVATE', participantId: userId });
  const id = data?.id ?? data?.conversation?.id ?? data?.conversationId ?? data?.data?.id;
  if (!id) throw new Error('Failed to create conversation: no id in response');
  DM_USER_MAP[id] = userId;
  return id;
}

let groupIdCounter = 10;
let msgCounter = 100;

export interface RemoteMessage {
  id: string;
  conversationId?: string;
  senderId: string;
  type?: string;
  content: string;
  replyToId?: string | null;
  isPinned?: boolean | null;
  isStarred?: boolean | null;
  starredAt?: string | null;
  isEdited?: boolean | null;
  isDeleted?: boolean | null;
  deletedBy?: string | { id?: string; userId?: string; fullName?: string; username?: string } | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  duration?: number | null;
  status?: string | null;
  seenAt?: string | null;
  createdAt?: string | null;
  editedAt?: string | null;
  sender?: { id: string; username?: string | null; fullName?: string | null; avatarUrl?: string | null };
  conversation?: { id: string; type?: string; name?: string | null; avatarUrl?: string | null };
  reactions?: ReactionGroup[];
}

export interface StarredMessage extends Message {
  conversationName?: string;
  conversationType?: string;
  conversationAvatarUrl?: string;
}

function normalizeStatus(status?: string | null): MessageStatus | undefined {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return 'pending';
    case 'SENT':
      return 'sent';
    case 'DELIVERED':
      return 'delivered';
    case 'SEEN':
      return 'read';
    default:
      return undefined;
  }
}

export function normalizeRemoteStatus(status?: string | null): MessageStatus | undefined {
  return normalizeStatus(status);
}

export function flattenReactions(groups?: ReactionGroup[] | null): Reaction[] {
  if (!groups) return [];
  return groups.flatMap((group) =>
    (group.users ?? []).map((u) => ({
      emoji: group.emoji,
      userId: u.userId,
      userName: u.fullName || u.username || '',
      username: u.username ?? null,
      fullName: u.fullName ?? null,
      avatarUrl: u.avatarUrl ?? null,
    })),
  );
}

export function normalizeDeletedByUserId(
  deletedBy?: RemoteMessage['deletedBy'],
): string | undefined {
  if (typeof deletedBy === 'string') return deletedBy;
  return deletedBy?.id ?? deletedBy?.userId;
}

export function deletedMessageContentLabel(
  conversationId: string | undefined,
  deletedByUserId: string | undefined,
  senderId?: string,
): string {
  if (!conversationId || !deletedByUserId) return 'Message deleted';
  if (senderId && senderId === deletedByUserId) return 'Message deleted';
  const group = queryClient.getQueryData<Group | null>(['group', conversationId]);
  const isAdmin = group?.members?.some(
    (m) => m.userId === deletedByUserId && m.role === 'admin',
  );
  return isAdmin ? 'Message deleted by admin' : 'Message deleted';
}

function mapDeletedBy(deletedBy?: RemoteMessage['deletedBy']): Message['deletedBy'] {
  if (typeof deletedBy === 'string') return { id: deletedBy };
  if (!deletedBy) return undefined;
  return {
    id: deletedBy.id ?? deletedBy.userId ?? '',
    fullName: deletedBy.fullName,
    username: deletedBy.username,
  };
}

export function mapMessage(row: RemoteMessage): Message {
  const t = (row.type ?? '').toLowerCase();
  const type: Message['type'] =
    t === 'image' || t === 'video' || t === 'system' ? t : 'text';
  return {
    id: row.id,
    groupId: row.conversationId ?? '',
    senderId: row.senderId,
    content: row.isDeleted
      ? deletedMessageContentLabel(
          row.conversationId,
          normalizeDeletedByUserId(row.deletedBy),
          row.senderId,
        )
      : (row.content ?? ''),
    type: row.isDeleted ? 'text' : type,
    fileUrl: row.isDeleted ? undefined : (row.fileUrl ?? undefined),
    fileName: row.isDeleted ? undefined : (row.fileName ?? undefined),
    fileSize: row.fileSize ?? undefined,
    mimeType: row.mimeType ?? undefined,
    duration: row.duration ?? undefined,
    isPinned: row.isPinned ?? false,
    isStarred: row.isStarred ?? false,
    starredAt: row.starredAt ? new Date(row.starredAt) : null,
    isDeleted: row.isDeleted ?? false,
    deletedBy: mapDeletedBy(row.deletedBy),
    status: normalizeStatus(row.status) ?? (row.senderId === useAuthStore.getState().user?.id ? 'sent' : undefined),
    lastReadAt: row.seenAt ? new Date(row.seenAt) : undefined,
    edited: row.isEdited ?? false,
    reactions: flattenReactions(row.reactions),
    replyTo: row.replyToId
      ? { id: row.replyToId, senderId: '', senderName: '', content: '', type: 'text' }
      : undefined,
    createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
    sender: {
      id: row.senderId,
      username: row.sender?.username ?? '',
      fullName: row.sender?.fullName || row.sender?.username || '',
      email: '',
      status: 'offline',
      avatarUrl: row.sender?.avatarUrl ?? undefined,
      createdAt: new Date(),
    },
  };
}

export async function getMessages(chatId: string, _isDM: boolean, cursor?: string, limit: number = 50): Promise<PaginatedResponse<Message>> {
  try {
    if (DEV_MODE) {
      await delay(300);
      const all = MOCK_MESSAGES[chatId] ?? [];
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      const data = [...all].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map((m) => ({
        ...m,
        status: m.status ?? (m.senderId === DEV_USER_ID ? conv?.online ? 'delivered' as const : 'sent' as const : 'read' as const),
        readBy: m.readBy ?? populateReadBy(m),
        sender: { id: m.senderId, username: '', fullName: senderName(m.senderId), email: '', status: 'online' as const, createdAt: new Date() },
      }));
      return { data, total: data.length, page: cursor ? 2 : 1, limit, totalPages: 1 };
    }

    const { data } = await api.get<{ messages?: RemoteMessage[]; nextCursor?: string | null }>(`/conversations/${chatId}/messages`, {
      params: { ...(cursor ? { cursor } : {}), limit },
    });
    const raw = Array.isArray(data) ? (data as RemoteMessage[]) : (data?.messages ?? []);
    const mapped = raw.map(mapMessage).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (_isDM && !DM_USER_MAP[chatId]) {
      const me = useAuthStore.getState().user?.id;
      const peer = mapped.find((m) => m.senderId !== me)?.senderId;
      if (peer) DM_USER_MAP[chatId] = peer;
    }
    const visible = applyDeletedForMe(chatId, mapped);
    const nextCursor = !Array.isArray(data) ? (data?.nextCursor ?? null) : null;
    return {
      data: visible,
      total: visible.length,
      page: cursor ? 2 : 1,
      limit,
      totalPages: nextCursor ? 2 : 1,
      nextCursor,
    };
  } catch (err) {
    throw toError(err, 'Failed to fetch messages');
  }
}

function readVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) && d > 0 ? d : undefined);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });
}

async function postAttachment(chatId: string, file: File, caption?: string, replyTo?: ReplyTo, duration?: number): Promise<Message> {
  const form = new FormData();
  form.append('file', file);
  if (caption) form.append('caption', caption);
  if (replyTo?.id) form.append('replyToId', replyTo.id);
  if (typeof duration === 'number') form.append('duration', String(Math.round(duration)));
  const { data } = await api.post<Message>(`/conversations/${chatId}/messages`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapMessage(data as unknown as RemoteMessage);
}

export async function sendImageMessage(chatId: string, file: File, _isDM: boolean, caption?: string, replyTo?: ReplyTo): Promise<Message> {
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
        status: 'pending',
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

    const duration = file.type.startsWith('video/') ? await readVideoDuration(file) : undefined;
    return await postAttachment(chatId, file, caption, replyTo, duration);
  } catch (err) {
    throw toError(err, 'Failed to send image');
  }
}

export async function sendMessage(chatId: string, content: string, _isDM: boolean, replyTo?: ReplyTo): Promise<Message> {
  try {
    if (DEV_MODE) {
      await delay(200);
      msgCounter++;
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      const msg: Message = {
        id: `msg-${msgCounter}`,
        groupId: chatId,
        senderId: DEV_USER_ID,
        content,
        type: 'text',
        status: 'pending',
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

    const replyToId = replyTo?.id;
    if (!socketClient.isConnected) {
      throw new Error('Realtime connection unavailable. Please try again.');
    }
    const res = await socketClient.sendMessageAck(chatId, content, replyToId);
    if (res.error) throw new Error(res.error);
    if (!res.data) throw new Error('Failed to send message');
    return mapMessage(res.data);
  } catch (err) {
    throw toError(err, 'Failed to send message');
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

    const { data } = await api.put<RemoteMessage>(`/conversations/${chatId}/messages/${messageId}`, { content });
    return mapMessage({ ...data, isEdited: true });
  } catch (err) {
    throw toError(err, 'Failed to edit message');
  }
}

// --- Delete for me (client-local) ---

const DELETED_FOR_ME_KEY = 'hw_deleted_for_me';

function loadDeletedForMe(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_FOR_ME_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function persistDeletedForMe(ids: Set<string>): void {
  try {
    localStorage.setItem(DELETED_FOR_ME_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function applyDeletedForMe(chatId: string, msgs: Message[]): Message[] {
  const deleted = loadDeletedForMe();
  if (deleted.size === 0) return msgs;
  const prefix = `${chatId}:`;
  return msgs.filter((m) => !deleted.has(prefix + m.id));
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
          content: msgs[idx].senderId === DEV_USER_ID ? 'You deleted this message' : 'Message deleted by admin',
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

    if (!deleteForAll) {
      const deleted = loadDeletedForMe();
      deleted.add(`${chatId}:${messageId}`);
      persistDeletedForMe(deleted);
      return;
    }

    if (!socketClient.isConnected) {
      throw new Error('Realtime connection unavailable. Please try again.');
    }
    const res = await socketClient.deleteMessageAck(chatId, messageId);
    if (res.error) throw new Error(res.error);
  } catch (err) {
    throw toError(err, 'Failed to delete message');
  }
}

export async function markConversationAsSeen(chatId: string, _lastSeenMessageId?: string): Promise<void> {
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
            m.lastReadAt = new Date();
          }
        });
      }
      return;
    }

    // Kontrak: client → server POST /conversations/:id/read.
    // Reset unreadCount server untuk user ini (per-user, tidak mengirim seen ke lawan bicara).
    await api.post(`/conversations/${chatId}/read`);
  } catch (err) {
    throw toError(err, 'Failed to mark as seen');
  }
}

const STATUS_ORDER: Record<MessageStatus, number> = { pending: 0, sending: 1, sent: 2, delivered: 3, read: 4 };

export function statusIsAtLeast(status: MessageStatus | undefined, min: MessageStatus): boolean {
  if (!status) return false;
  return STATUS_ORDER[status] >= STATUS_ORDER[min];
}

export function simulateDevReceipts(chatId: string, messageId: string, isDM: boolean): void {
  if (!DEV_MODE) return;
  const readerId = DM_USER_MAP[chatId] ?? GROUP_MEMBER_IDS[0] ?? null;

  const patch = (status: MessageStatus, readBy?: string[]) => {
    queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
      ['messages', chatId, isDM],
      (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            data: page.data.map((m) => {
              if (m.id !== messageId) return m;
              const next: Message = { ...m, status, lastReadAt: status === 'read' ? new Date() : m.lastReadAt };
              if (readBy && readBy.length > 0 && !m.readBy?.includes(readBy[0])) {
                next.readBy = [...(m.readBy ?? []), ...readBy];
              }
              return next;
            }),
          })),
        };
      },
    );
    const mock = MOCK_MESSAGES[chatId];
    const idx = mock?.findIndex((m) => m.id === messageId);
    if (mock && idx !== undefined && idx >= 0) {
      mock[idx] = { ...mock[idx], status, ...(status === 'read' ? { lastReadAt: new Date() } : {}), ...(readBy && readBy.length > 0 ? { readBy: [...(mock[idx].readBy ?? []), ...readBy] } : {}) };
    }
  };

  setTimeout(() => patch('sent'), 700);
  setTimeout(() => patch('delivered'), 1800);
  setTimeout(() => patch('read', readerId ? [readerId] : undefined), 3500);
}

interface RemoteConversation {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  displayName?: string | null;
  avatar?: string | null;
  isOnline?: boolean | null;
  lastSeenAt?: string | null;
  memberCount?: number | null;
  mutedUntil?: string | null;
  unread?: number | null;
  unreadCount?: number | null;
  participantId?: string | null;
  otherUserId?: string | null;
  userId?: string | null;
  peerId?: string | null;
  participant?: { id?: string } | null;
  lastMessage?: {
    content: string;
    type: string;
    createdAt: string | null;
    isDeleted?: boolean | null;
    senderId?: string | null;
    sender?: { username?: string | null; fullName?: string | null } | null;
    fileName?: string | null;
  } | null;
}

function conversationPreview(lm?: RemoteConversation['lastMessage']): string {
  if (!lm) return '';
  if (lm.isDeleted) return 'Message deleted';
  const content = lm.content ?? '';
  const t = (lm.type ?? '').toLowerCase();
  if (t === 'image') return content ? `📷 ${content}` : '📷 Photo';
  if (t === 'video') return content ? `🎬 ${content}` : '🎬 Video';
  return content;
}

export function messagePreview(m: Message): string {
  if (m.isDeleted) return 'Message deleted';
  if (m.type === 'image') return '📷 Photo';
  if (m.type === 'video') return '🎬 Video';
  return m.content;
}

export function messageSenderName(m: { senderId: string; sender?: { username?: string | null; fullName?: string | null } | null }): string | undefined {
  const me = useAuthStore.getState().user;
  if (me && m.senderId === me.id) return 'You';
  if (m.sender?.username) return m.sender.username;
  if (m.sender?.fullName) return m.sender.fullName;
  return undefined;
}

export function refreshConversationPreview(chatId: string, isDM?: boolean): void {
  const msgs =
    queryClient.getQueryData<InfiniteData<PaginatedResponse<Message>>>(['messages', chatId, isDM ?? true]) ??
    queryClient.getQueryData<InfiniteData<PaginatedResponse<Message>>>(['messages', chatId, !(isDM ?? true)]);
  const all = msgs?.pages.flatMap((p) => p.data) ?? [];
  const last = all
    .filter(Boolean)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .pop();
  queryClient.setQueryData<{ id: string; type?: string; lastMessage?: string; lastTime?: string; lastSenderName?: string }[]>(
    ['conversations'],
    (prev) => {
      if (!prev) return prev;
      return prev.map((c) => {
        if (c.id !== chatId) return c;
        const effectiveIsDM = isDM ?? c.type === 'dm';
        let nextLastMessage = c.lastMessage;
        if (last) {
          nextLastMessage = messagePreview(last);
        } else {
          if (!c.lastMessage || c.lastMessage.trim() === '') {
            nextLastMessage = 'Message deleted';
          }
        }
        return {
          ...c,
          lastMessage: nextLastMessage,
          lastSenderName: !effectiveIsDM && last && last.type !== 'system' ? (last.sender?.username ?? last.sender?.fullName ?? undefined) : c.lastSenderName,
          lastTime: last?.createdAt
            ? last.createdAt instanceof Date
              ? last.createdAt.toISOString()
              : (last.createdAt as string)
            : c.lastTime,
        };
      });
    },
  );
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

const LOCAL_UNREAD_KEY = 'hw_unread_map';

function loadLocalUnread(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_UNREAD_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveLocalUnread(unreadMap: Record<string, number>): void {
  try {
    localStorage.setItem(LOCAL_UNREAD_KEY, JSON.stringify(unreadMap));
  } catch {}
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

    const { data } = await api.get<unknown>('/conversations');
    const rows = Array.isArray(data)
      ? (data as RemoteConversation[])
      : Array.isArray((data as { conversations?: RemoteConversation[] })?.conversations)
        ? (data as { conversations: RemoteConversation[] }).conversations
        : [];
    if (!Array.isArray(data) && !(data as { conversations?: unknown })?.conversations) {
      console.warn('[chat] GET /conversations unknown shape:', data);
    }
    const visibleRows = rows.filter((r) => !isChatDeleted(r.id) && (r.type !== 'PRIVATE' || !!r.lastMessage));
    const localUnread = loadLocalUnread();
    return visibleRows.map((r): ChatConversation => {
      const isPrivate = r.type === 'PRIVATE';
      const serverUnread = r.unread ?? r.unreadCount ?? 0;
      const dmUserId = isPrivate ? (r.peerId ?? r.participantId ?? r.otherUserId ?? r.userId ?? r.participant?.id ?? DM_USER_MAP[r.id]) : undefined;
      return {
        id: r.id,
        name: r.displayName ?? r.name ?? (isPrivate ? 'Unknown' : 'Group'),
        avatarUrl: r.avatar ?? r.avatarUrl ?? undefined,
        type: isPrivate ? 'dm' : 'group',
        lastMessage: conversationPreview(r.lastMessage),
        lastSenderName: String(r.lastMessage?.type ?? '').toLowerCase() === 'system'
          ? undefined
          : messageSenderName({ senderId: r.lastMessage?.senderId ?? '', sender: r.lastMessage?.sender ?? null }),
        lastTime: r.lastMessage?.createdAt ?? r.createdAt,
        online: r.isOnline ?? false,
        lastSeen: r.lastSeenAt ? new Date(r.lastSeenAt) : undefined,
        members: r.memberCount ?? (isPrivate ? 2 : undefined),
        muted: r.mutedUntil ? true : false,
        unread: Math.max(serverUnread, localUnread[r.id] ?? 0),
        userId: dmUserId ?? undefined,
      };
    });
  } catch (err) {
    throw toError(err, 'Failed to fetch conversations');
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

    hideChats(ids);
    ids.forEach((id) => {
      queryClient.removeQueries({ queryKey: ['messages', id] });
    });
  } catch (err) {
    throw toError(err, 'Failed to delete conversations');
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

    const { data } = await api.post<RemoteMessage>(
      `/conversations/${sourceChatId}/messages/${msg.id}/forward`,
      { targetConversationId: targetChatId },
    );
    return mapMessage(data);
  } catch (err) {
    throw toError(err, 'Failed to forward message');
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

    await api.put(`/conversations/${chatId}/messages/${messageId}/pin`);
  } catch (err) {
    throw toError(err, 'Failed to pin message');
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

    await api.delete(`/conversations/${chatId}/messages/${messageId}/pin`);
  } catch (err) {
    throw toError(err, 'Failed to unpin message');
  }
}

export async function getPinnedMessages(chatId: string): Promise<Message[]> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const msgs = MOCK_MESSAGES[chatId] ?? [];
      return msgs.filter((m) => m.isPinned);
    }

    const { data } = await api.get<{ messages?: RemoteMessage[] } | RemoteMessage[]>(
      `/conversations/${chatId}/pinned`,
      { params: { limit: 50 } },
    );
    const rows = Array.isArray(data) ? (data as RemoteMessage[]) : (data?.messages ?? []);
    return rows.map((row) => {
      const msg = mapMessage(row);
      if (row.sender) {
        const sender = msg.sender ?? { id: row.senderId, username: '', fullName: '', email: '', status: 'offline' as const, createdAt: new Date() };
        msg.sender = {
          ...sender,
          username: row.sender.username ?? '',
          fullName: row.sender.fullName ?? '',
          avatarUrl: row.sender.avatarUrl ?? undefined,
        };
      }
      return msg;
    });
  } catch (err) {
    throw toError(err, 'Failed to get pinned messages');
  }
}

export async function starMessage(chatId: string, messageId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const msgs = MOCK_MESSAGES[chatId];
      if (!msgs) return;
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      msgs[idx] = { ...msgs[idx], isStarred: true, starredAt: new Date() };
      return;
    }

    await api.put(`/conversations/${chatId}/messages/${messageId}/star`);
  } catch (err) {
    throw toError(err, 'Failed to star message');
  }
}

export async function unstarMessage(chatId: string, messageId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const msgs = MOCK_MESSAGES[chatId];
      if (!msgs) return;
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      msgs[idx] = { ...msgs[idx], isStarred: false, starredAt: null };
      return;
    }

    await api.delete(`/conversations/${chatId}/messages/${messageId}/star`);
  } catch (err) {
    throw toError(err, 'Failed to unstar message');
  }
}

export async function getStarredMessages(cursor?: string, limit = 50): Promise<StarredMessage[]> {
  try {
    if (DEV_MODE) {
      await delay(100);
      return Object.values(MOCK_MESSAGES)
        .flat()
        .filter((m) => m.isStarred);
    }

    const { data } = await api.get<{ messages?: RemoteMessage[]; nextCursor?: string | null }>(
      `/messages/starred`,
      { params: { ...(cursor ? { cursor } : {}), limit } },
    );
    const rows = data?.messages ?? [];
    return rows.map((row) => {
      const msg = mapMessage(row);
      if (row.sender) {
        const sender = msg.sender ?? { id: row.senderId, username: '', fullName: '', email: '', status: 'offline' as const, createdAt: new Date() };
        msg.sender = {
          ...sender,
          username: row.sender.username ?? '',
          fullName: row.sender.fullName ?? '',
          avatarUrl: row.sender.avatarUrl ?? undefined,
        };
      }
      const starred: StarredMessage = { ...msg };
      if (row.conversation) {
        starred.conversationName = row.conversation.name ?? '';
        starred.conversationType = row.conversation.type === 'PRIVATE' ? 'dm' : 'group';
        starred.conversationAvatarUrl = row.conversation.avatarUrl ?? undefined;
      }
      return starred;
    });
  } catch (err) {
    throw toError(err, 'Failed to get starred messages');
  }
}

export async function muteConversation(chatId: string, until?: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      if (conv) conv.muted = true;
      return;
    }

    await api.put(`/conversations/${chatId}/mute`, until ? { until } : {});
  } catch (err) {
    throw toError(err, 'Failed to mute conversation');
  }
}

export async function unmuteConversation(chatId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === chatId);
      if (conv) conv.muted = false;
      return;
    }

    await api.delete(`/conversations/${chatId}/mute`);
  } catch (err) {
    throw toError(err, 'Failed to unmute conversation');
  }
}

export async function blockUser(userId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const user = MOCK_USERS.find((u) => u.id === userId);
      if (user) MOCK_BLOCKED_USERS.set(userId, user as User);
      return;
    }

    await api.post(`/users/${userId}/block`);
  } catch (err) {
    throw toError(err, 'Failed to block user');
  }
}

export async function getBlockedUsers(): Promise<User[]> {
    if (DEV_MODE) {
      await delay(200);
      return Array.from(MOCK_BLOCKED_USERS.values());
    }
  const { data } = await api.get<User[]>('/users/me/blocked');
  return Array.isArray(data) ? data : [];
}

export async function unblockUser(userId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      MOCK_BLOCKED_USERS.delete(userId);
      return;
    }

    await api.delete(`/users/${userId}/block`);
  } catch (err) {
    throw toError(err, 'Failed to unblock user');
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
    throw toError(err, 'Failed to report user');
  }
}

export async function getGroups(): Promise<ChatConversation[]> {
  // BREAKING (5.1): tidak ada GET /groups di backend. Grup milik user diambil
  // dari GET /conversations (member-only) lalu difilter type GROUP.
  return (await getConversations()).filter((c) => c.type === 'group');
}

export async function searchUsers(query: string): Promise<User[]> {
  try {
    if (DEV_MODE) {
      await delay(100);
      const q = query.toLowerCase();
      return MOCK_USERS.filter((u) => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) as User[];
    }

    const { data } = await api.get<{ users?: User[] }>(`/search/users`, { params: { q: query } });
    return Array.isArray(data) ? (data as User[]) : (data?.users ?? []);
  } catch (err) {
    throw toError(err, 'Failed to search users');
  }
}

export async function createGroup(name: string, description: string, memberIds: string[], avatarFile?: File): Promise<ChatConversation> {
  const me = useAuthStore.getState().user?.id;
  if (me && memberIds.includes(me)) {
    throw new Error('You cannot add yourself as a group member');
  }
  if (new Set(memberIds).size !== memberIds.length) {
    throw new Error('Duplicate members are not allowed');
  }
  if (memberIds.length < 2) {
    throw new Error('Select at least 2 members to create a group');
  }
  try {
    if (DEV_MODE) {
      await delay(200);
      const id = String(++groupIdCounter);
      const newConv: ChatConversation = { id, name, type: 'group', avatarUrl: avatarFile ? URL.createObjectURL(avatarFile) : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563eb`, lastMessage: 'Group created', lastTime: 'now', members: memberIds.length + 1, online: false, muted: false };
      MOCK_CONVERSATIONS.unshift(newConv);
      MOCK_MESSAGES[id] = [
        { id: `sys-${id}`, groupId: id, senderId: 'system', content: 'Group created', type: 'system', createdAt: new Date() },
      ];
      return newConv;
    }

    // BREAKING (3.1): POST /groups multipart. participantIds = JSON string (min 2 max 49).
    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    form.append('participantIds', JSON.stringify(memberIds));
    if (avatarFile) form.append('avatar', avatarFile);
    const { data } = await api.post<{ id: string; type: string; name: string; avatarUrl?: string | null; description?: string | null; createdBy: string; createdAt: string }>(`/groups`, form);
    return {
      id: data.id,
      name: data.name,
      avatarUrl: data.avatarUrl ?? undefined,
      type: 'group',
      lastMessage: 'Group created',
      lastTime: data.createdAt,
      members: memberIds.length + 1,
      online: false,
      muted: false,
    };
  } catch (err) {
    throw toError(err, 'Failed to create group');
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

    await api.delete(`/groups/${groupId}/leave`);
  } catch (err) {
    throw toError(err, 'Failed to leave group');
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

    // BREAKING (3.5): tidak ada GET /groups/:id. Detail grup = GET /conversations/:id (detail + members).
    interface RemoteGroupDetail {
      id: string;
      type: string;
      name: string | null;
      description?: string | null;
      avatarUrl?: string | null;
      createdBy?: string | null;
      createdAt?: string | null;
      members?: {
        id: string;
        userId: string;
        role: string;
        joinedAt: string;
        user?: {
          id?: string;
          fullName?: string;
          name?: string;
          username?: string;
          avatarUrl?: string;
          status?: 'online' | 'offline' | 'away';
          isOnline?: boolean;
        };
      }[];
    }
    const { data } = await api.get<RemoteGroupDetail>(`/conversations/${groupId}`);
    return {
      id: data.id,
      name: data.name ?? 'Group',
      description: data.description ?? undefined,
      avatarUrl: data.avatarUrl ?? undefined,
      creatorId: data.createdBy ?? '',
      isPrivate: false,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      members: (data.members ?? []).map((m: any) => {
        const u = m.user || m.profile;
        const fullName = u?.fullName || u?.name || u?.username;
        return {
          id: m.id,
          groupId,
          userId: m.userId,
          role: m.role === 'ADMIN' || m.role === 'admin' ? 'admin' : 'member',
          joinedAt: new Date(m.joinedAt),
          user: fullName ? {
            id: m.userId,
            fullName,
            username: u?.username ?? '',
            avatarUrl: u?.avatarUrl ?? undefined,
            status: u?.status ?? (u?.isOnline ? 'online' : 'offline'),
            email: u?.email ?? '',
            createdAt: u?.createdAt ? new Date(u.createdAt) : new Date(),
          } : undefined,
        };
      }),
    };
  } catch (err) {
    throw toError(err, 'Failed to get group');
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

    await api.post(`/groups/${groupId}/members`, { userIds: [userId] });
  } catch (err) {
    throw toError(err, 'Failed to add member');
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
    throw toError(err, 'Failed to remove member');
  }
}

export async function updateGroup(groupId: string, data: { name?: string; description?: string }): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const existing = MOCK_GROUP_OVERRIDES.get(groupId) ?? {};
      MOCK_GROUP_OVERRIDES.set(groupId, { ...existing, ...data });
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === groupId);
      if (conv) {
        if (data.name) conv.name = data.name;
      }
      return;
    }

    // BREAKING (3.3): PUT (bukan PATCH), schema strict hanya name/description.
    await api.put(`/groups/${groupId}`, data);
  } catch (err) {
    throw toError(err, 'Failed to update group');
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

    // BREAKING (3.4): PUT + role UPPERCASE ('ADMIN'|'MEMBER').
    await api.put(`/groups/${groupId}/members/${userId}/role`, { role: role.toUpperCase() });
  } catch (err) {
    throw toError(err, 'Failed to update member role');
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
    throw toError(err, 'Failed to delete group');
  }
}

export async function uploadGroupAvatar(groupId: string, file: File): Promise<string> {
  try {
    if (DEV_MODE) {
      await delay(200);
      return URL.createObjectURL(file);
    }

    // BREAKING (3.4): PUT (bukan POST). Response berisi full row conversation (bukan { url }).
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.put<{ avatarUrl?: string | null; url?: string }>(`/groups/${groupId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.avatarUrl ?? data.url ?? '';
  } catch (err) {
    throw toError(err, 'Failed to upload group avatar');
  }
}

const lastReactionToggleAt: Record<string, number> = {};

function findMessageReactionsFromCache(chatId: string, messageId: string): Reaction[] | undefined {
  for (const isDM of [true, false]) {
    const data = queryClient.getQueryData<InfiniteData<PaginatedResponse<Message>>>(['messages', chatId, isDM]);
    if (!data) continue;
    for (const page of data.pages) {
      const msg = page.data.find((m) => m.id === messageId);
      if (msg) return msg.reactions;
    }
  }
  return undefined;
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

    const now = Date.now();
    if (now - (lastReactionToggleAt[messageId] ?? 0) < 500) {
      return findMessageReactionsFromCache(chatId, messageId) ?? [];
    }
    lastReactionToggleAt[messageId] = now;

    const me = useAuthStore.getState().user?.id;
    const current = findMessageReactionsFromCache(chatId, messageId) ?? [];
    const hasMine = me !== undefined && current.some((r) => r.userId === me && r.emoji === emoji);

    const res = hasMine
      ? await socketClient.reactionRemoveAck(messageId)
      : await socketClient.reactionAddAck(messageId, emoji);

    if (res?.error) {
      delete lastReactionToggleAt[messageId];
      throw new Error(res.error);
    }
    return flattenReactions(res?.data?.reactions);
  } catch (err) {
    throw toError(err, 'Failed to toggle reaction');
  }
}

export async function getMessageReactions(chatId: string, messageId: string): Promise<ReactionGroup[]> {
  try {
    if (DEV_MODE) {
      return [];
    }
    const { data } = await api.get<{ reactions: ReactionGroup[] }>(`/conversations/${chatId}/messages/${messageId}/reactions`);
    return data.reactions ?? [];
  } catch (err) {
    throw toError(err, 'Failed to fetch message reactions');
  }
}

export async function clearChat(chatId: string): Promise<void> {
  try {
    if (DEV_MODE) {
      await delay(200);
      delete MOCK_MESSAGES[chatId];
    } else {
      // BREAKING (2.5): reset percakapan via PATCH /conversations/:id/clear (bukan hapus total).
      await api.patch(`/conversations/${chatId}/clear`);
    }

    markChatCleared(chatId);

    const unread = loadLocalUnread();
    if (unread[chatId]) {
      unread[chatId] = 0;
      saveLocalUnread(unread);
    }
  } catch (err) {
    throw toError(err, 'Failed to clear chat');
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
      if (m.type === 'image' || m.type === 'video') return true;
      if (m.type === 'text') return /https?:\/\/[^\s]+/.test(m.content);
      return false;
    });
  }
  try {
    const media: Message[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 5; page++) {
      const res = await getMessages(conversationId, true, cursor, 50);
      for (const m of res.data) {
        if (m.type === 'image' || m.type === 'video') media.push(m);
        else if (m.type === 'text' && /https?:\/\/[^\s]+/.test(m.content)) media.push(m);
      }
      cursor = res.nextCursor ?? undefined;
      if (!cursor) break;
    }
    return media;
  } catch (err) {
    throw toError(err, 'Failed to get shared media');
  }
}

export async function getMutualGroups(userId: string): Promise<ChatConversation[]> {
  try {
    if (DEV_MODE) {
      await delay(200);
      const allGroups = await getGroups();
      const mutual: ChatConversation[] = [];
      for (const g of allGroups) {
        try {
          const groupDetail = await getGroup(g.id);
          if (groupDetail.members.some((m) => m.userId === userId)) {
            mutual.push(g);
          }
        } catch {
          continue;
        }
      }
      return mutual;
    }
    const groups = await getGroups();
    if (groups.length === 0) return [];
    const details = await Promise.all(
      groups.map(async (g) => {
        try {
          return { g, detail: await getGroup(g.id) };
        } catch {
          return null;
        }
      }),
    );
    return details.flatMap((d) => (d && d.detail.members.some((m) => m.userId === userId) ? [d.g] : []));
  } catch (err) {
    throw toError(err, 'Failed to get mutual groups');
  }
}

export interface MessageReader {
  userId: string;
  fullName: string;
  username?: string;
  avatarUrl?: string;
  status: 'seen' | 'delivered' | 'sent';
  seenAt: string | null;
}

export async function getMessageReaders(conversationId: string, messageId: string): Promise<MessageReader[]> {
  try {
    if (DEV_MODE) return [];
    const { data } = await api.get(`/conversations/${conversationId}/messages/${messageId}/readers`);
    const rows = Array.isArray(data) ? data : [];
    return rows.map((r: Record<string, unknown>) => {
      const s = normalizeRemoteStatus(r.status as string);
      return {
        userId: String(r.userId ?? ''),
        fullName: (r.fullName as string) ?? 'Unknown',
        username: (r.username as string) ?? undefined,
        avatarUrl: (r.avatarUrl as string) ?? undefined,
        status: s === 'read' ? 'seen' as const : s === 'delivered' ? 'delivered' as const : 'sent' as const,
        seenAt: (r.seenAt as string) ?? null,
      };
    });
  } catch (err) {
    throw toError(err, 'Failed to get message readers');
  }
}

export type { ChatConversation };
