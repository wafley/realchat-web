import { socketClient } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import { useTypingStore } from '@/store/typingStore';
import { usePresenceStore } from '@/store/presenceStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { loadPrefs, showLocalNotification } from '@/services/notification';
import { mapMessage, saveLocalUnread, statusIsAtLeast, normalizeRemoteStatus, type RemoteMessage, type ChatConversation, DM_USER_MAP } from '@/services/chat';
import type { InfiniteData } from '@tanstack/react-query';
import type { Message, PaginatedResponse, Group } from '@/types';
import type { Conversation } from '@/types';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

let currentChatId: string | null = null;
let currentTypingChatId: string | null = null;
let unsubscribeConversations: (() => void) | null = null;

// --- Emit helpers ---

export function joinRoom(conversationId: string) {
  socketClient.joinRoom(conversationId);
}

export function leaveRoom(conversationId: string) {
  socketClient.leaveRoom(conversationId);
}

export function joinAllConversationRooms() {
  if (DEV_MODE) return;
  const convs = queryClient.getQueryData<{ id?: string }[]>(['conversations']);
  if (!convs || !Array.isArray(convs)) return;
  for (const c of convs) {
    if (c?.id) socketClient.joinRoom(c.id);
  }
}

async function onSocketConnected() {
  if (DEV_MODE) return;
  try {
    await queryClient.refetchQueries({ queryKey: ['conversations'] });
  } catch {}
  try {
    await queryClient.refetchQueries({ queryKey: ['messages'], type: 'active' });
  } catch {}
  joinAllConversationRooms();
  if (currentTypingChatId) {
    socketClient.emitTypingStart(currentTypingChatId);
  }
}

export function emitTypingStart(conversationId: string) {
  currentTypingChatId = conversationId;
  socketClient.emitTypingStart(conversationId);
}

export function emitTypingStop(conversationId: string) {
  if (currentTypingChatId === conversationId) {
    currentTypingChatId = null;
  }
  socketClient.emitTypingStop(conversationId);
}

// --- Listener registration ---

function onMessageNew(raw: RemoteMessage) {
  if (DEV_MODE) return;

  const msg = mapMessage(raw);
  const chatId = raw.conversationId ?? '';
  const conversations = queryClient.getQueryData<{ id: string; type?: string }[]>(['conversations']);
  const conv = conversations?.find((c) => c.id === chatId);
  const isDM = conv?.type === 'dm';

  queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
    ['messages', chatId, isDM],
    (prev) => {
      if (!prev) return prev;
      const [firstPage, ...rest] = prev.pages;
      if (firstPage.data.some((m) => m.id === msg.id)) return prev;
      return {
        ...prev,
        pages: [
          { ...firstPage, data: [...firstPage.data, msg], total: firstPage.total + 1 },
          ...rest,
        ],
      };
    },
  );

  // Update conversation preview + reorder + unread badge
  const preview = msg.type === 'image' ? '📷 Photo' : (msg.type === 'file' ? '📎 File' : msg.type === 'video' ? '🎬 Video' : msg.content);
  const currentUserId = useAuthStore.getState().user?.id;
  queryClient.setQueryData<{ id: string; lastMessage?: string; lastTime?: string; unread?: number }[]>(
    ['conversations'],
    (prev) => {
      if (!prev) return prev;
      const isOwn = msg.senderId === currentUserId;
      const shouldCount = !isOwn && currentChatId !== chatId;
      const updated = prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: preview,
              lastTime: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : (msg.createdAt as string | undefined) ?? 'now',
              unread: shouldCount ? (c.unread ?? 0) + 1 : 0,
            }
          : c,
      );
      const idx = updated.findIndex((c) => c.id === chatId);
      if (idx <= 0) return updated;
      return [updated[idx], ...updated.slice(0, idx), ...updated.slice(idx + 1)];
    },
  );
  const persisted = queryClient.getQueryData<{ id: string; unread?: number }[]>(['conversations']);
  if (persisted) {
    saveLocalUnread(Object.fromEntries(persisted.map((c) => [c.id, c.unread ?? 0])));
  }
}

function onMessageEdited(event: RemoteMessage) {
  if (DEV_MODE) return;

  const updated = mapMessage({ ...event, isEdited: true });
  const chatId = event.conversationId ?? '';
  const conversations = queryClient.getQueryData<{ id: string; type?: string }[]>(['conversations']);
  const conv = conversations?.find((c) => c.id === chatId);
  const isDM = conv?.type === 'dm';

  queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
    ['messages', chatId, isDM],
    (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          data: page.data.map((m) => (m.id === updated.id ? updated : m)),
        })),
      };
    },
  );
}

function onMessageDeleted(data: { messageId: string; conversationId: string }) {
  if (DEV_MODE) return;

  const conversations = queryClient.getQueryData<{ id: string; type: string }[]>(['conversations']);
  const conv = conversations?.find((c) => c.id === data.conversationId);
  const isDM = conv?.type === 'dm';

  queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
    ['messages', data.conversationId, isDM],
    (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          data: page.data.map((m) =>
            m.id === data.messageId
              ? { ...m, content: 'Message deleted', type: 'text' as const, fileUrl: undefined, fileName: undefined, isDeleted: true }
              : m,
          ),
        })),
      };
    },
  );
}









const typingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

function onTypingUpdate(data: { userId: string; conversationId: string; isTyping: boolean }) {
  const currentUserId = useAuthStore.getState().user?.id;
  if (data.userId === currentUserId) return;
  if (typingTimeouts[data.conversationId]) {
    clearTimeout(typingTimeouts[data.conversationId]);
    delete typingTimeouts[data.conversationId];
  }
  if (data.isTyping) {
    typingTimeouts[data.conversationId] = setTimeout(() => {
      useTypingStore.getState().setTyping(data.conversationId, false);
      delete typingTimeouts[data.conversationId];
    }, 10000);
  }
  useTypingStore.getState().setTyping(data.conversationId, data.isTyping);
}

function onPresenceUpdate(data: { userId?: string; id?: string; isOnline?: boolean; online?: boolean; lastSeen?: Date | string | null; lastSeenAt?: string | null }) {
  const userId = data.userId || data.id;
  if (!userId) return;

  const isOnline = data.isOnline ?? data.online ?? false;
  const rawLastSeen = data.lastSeen ?? data.lastSeenAt ?? null;
  const lastSeen = rawLastSeen ? new Date(rawLastSeen) : null;

  usePresenceStore.getState().setPresence(userId, {
    isOnline,
    lastSeen,
  });

  queryClient.setQueryData<ChatConversation[]>(['conversations'], (prev) => {
    if (!prev) return prev;
    return prev.map((c) => {
      const isTarget = c.userId === userId || c.id === userId || c.id === `dm-${userId}` || (c.type === 'dm' && DM_USER_MAP[c.id] === userId);
      if (isTarget) {
        return {
          ...c,
          online: isOnline,
          lastSeen: lastSeen ?? (isOnline ? undefined : c.lastSeen),
        };
      }
      return c;
    });
  });
}

function onPresenceOnline(data: { userId?: string; id?: string }) {
  const uid = data?.userId ?? data?.id;
  if (uid) onPresenceUpdate({ userId: uid, isOnline: true, lastSeen: null });
}

function onPresenceOffline(data: { userId?: string; id?: string; lastSeen?: string | Date; lastSeenAt?: string | Date }) {
  const uid = data?.userId ?? data?.id;
  if (uid) onPresenceUpdate({ userId: uid, isOnline: false, lastSeen: data.lastSeen ?? data.lastSeenAt ?? new Date() });
}

function onPresenceGeneral(data: { userId?: string; id?: string; isOnline?: boolean; online?: boolean; lastSeen?: string | Date; lastSeenAt?: string | Date }) {
  const uid = data?.userId ?? data?.id;
  if (uid) {
    onPresenceUpdate({
      userId: uid,
      isOnline: data.isOnline ?? data.online ?? false,
      lastSeen: data.lastSeen ?? data.lastSeenAt ?? null,
    });
  }
}

function onGroupUpdated(group: Group) {
  queryClient.invalidateQueries({ queryKey: ['group', group.id] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

function onGroupMemberAdd(data: { groupId: string }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.groupId] });
}

function onGroupMemberRemove(data: { groupId: string; userId: string }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.groupId] });
}

function onGroupMemberRole(data: { groupId: string }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.groupId] });
}

function onNotification(data: any) {
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });

  const notification = data?.notification ?? data;
  useNotificationStore.getState().addNotification({
    ...notification,
    read: notification.isRead ?? notification.read ?? false,
  });

  const prefs = loadPrefs();
  const isGroup = data?.type === 'group' || data?.conversationType === 'group';

  if (isGroup && !prefs.groups) return;
  if (!isGroup && !prefs.messages) return;

  const convs = queryClient.getQueryData<Conversation[]>(['conversations']);
  const conv = convs?.find((c) => c.id === data?.conversationId);
  if (conv?.muted) return;

  const title = data?.title || 'New notification';
  const body = data?.body || '';

  showLocalNotification(title, { body });

  if (prefs.sound) {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  }
}

function onContactChanged() {
  queryClient.invalidateQueries({ queryKey: ['contacts'] });
}

function onTypingStart(data: { conversationId: string; userId: string }) {
  onTypingUpdate({ ...data, isTyping: true });
}

function onTypingStop(data: { conversationId: string; userId: string }) {
  onTypingUpdate({ ...data, isTyping: false });
}

// --- Read receipts (#17: message:seen in, message:status out) ---

interface StatusEvent {
  messageId: string;
  status: string;
  userId?: string;
  seenAt?: string | null;
}

let statusEventBuffer = new Map<string, StatusEvent>();
let statusPending = new Map<string, { evt: StatusEvent; ts: number }>();
let statusFlushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleStatusFlush(delay = 120) {
  if (statusFlushTimer) clearTimeout(statusFlushTimer);
  statusFlushTimer = setTimeout(flushStatusBuffer, delay);
}

function flushStatusBuffer() {
  statusFlushTimer = null;
  const now = Date.now();

  const combined = new Map<string, { evt: StatusEvent; ts: number }>();
  for (const evt of statusEventBuffer.values()) {
    combined.set(evt.messageId, { evt, ts: now });
  }
  statusEventBuffer.clear();
  for (const [id, p] of statusPending) {
    if (now - p.ts > 8000) continue; // stale, drop
    if (!combined.has(id)) combined.set(id, p);
  }
  statusPending.clear();
  if (combined.size === 0) return;

  const currentUserId = useAuthStore.getState().user?.id;
  const eventMap = new Map(Array.from(combined.values(), (p) => [p.evt.messageId, p.evt]));
  const matched = new Set<string>();
  const queries = queryClient.getQueryCache().findAll({ queryKey: ['messages'] });
  for (const query of queries) {
    const data_ = query.state.data as InfiniteData<PaginatedResponse<Message>> | undefined;
    if (!data_?.pages) continue;
    let touched = false;
    const nextPages = data_.pages.map((page) => ({
      ...page,
      data: page.data.map((m) => {
        if (m.senderId !== currentUserId) return m;
        const evt = eventMap.get(m.id);
        if (!evt) return m;
        const status = normalizeRemoteStatus(evt.status);
        if (!status) return m;
        matched.add(m.id);
        let next = m;
        if (!statusIsAtLeast(next.status, status)) {
          next = { ...next, status };
          touched = true;
        }
        if (evt.seenAt) {
          const seen = new Date(evt.seenAt);
          if (!next.lastReadAt || seen.getTime() > next.lastReadAt.getTime()) {
            next = { ...next, lastReadAt: seen };
            touched = true;
          }
        }
        return next;
      }),
    }));
    if (touched) {
      queryClient.setQueryData(query.queryKey, { ...data_, pages: nextPages });
    }
  }

  // Event yang pesannya belum ada di cache: retry lagi nanti (bisa jadi pesan
  // belum masuk cache saat event tiba — race dengan ack message:send).
  for (const [id, p] of combined) {
    if (!matched.has(id)) statusPending.set(id, p);
  }
  if (statusPending.size > 0) {
    scheduleStatusFlush(800);
  }
}

function onMessageStatus(data: StatusEvent) {
  if (DEV_MODE) return;
  if (!normalizeRemoteStatus(data.status)) return;
  statusEventBuffer.set(data.messageId, data);
  scheduleStatusFlush(120);
}

// --- Init / Destroy ---

export function initSocket(token?: string) {
  if (DEV_MODE) return;

  socketClient.connect(token);

  socketClient.on('connect', onSocketConnected);
  socketClient.on('message:new', onMessageNew);

  if (socketClient.isConnected) {
    joinAllConversationRooms();
  }

  if (!unsubscribeConversations) {
    unsubscribeConversations = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.queryKey[0] === 'conversations') {
        joinAllConversationRooms();
      }
    });
  }
  socketClient.on('message:edited', onMessageEdited);
  socketClient.on('message:deleted', onMessageDeleted);
  socketClient.on('message:status', onMessageStatus);
  socketClient.on('typing:start', onTypingStart);
  socketClient.on('typing:stop', onTypingStop);
  socketClient.on('presence:online', onPresenceOnline);
  socketClient.on('presence:offline', onPresenceOffline);
  socketClient.on('presence:update', onPresenceGeneral);
  socketClient.on('user:online', onPresenceOnline);
  socketClient.on('user:offline', onPresenceOffline);
  socketClient.on('user:status', onPresenceGeneral);
  socketClient.on('user_status', onPresenceGeneral);
  socketClient.on('group:updated', onGroupUpdated);
  socketClient.on('group:member-added', onGroupMemberAdd);
  socketClient.on('group:member-removed', onGroupMemberRemove);
  socketClient.on('group:member-role-changed', onGroupMemberRole);
  socketClient.on('contact:new', onContactChanged);
  socketClient.on('contact:remove', onContactChanged);
  socketClient.on('notification:new', onNotification);
}

export function destroySocket() {
  Object.values(typingTimeouts).forEach((t) => clearTimeout(t));
  unsubscribeConversations?.();
  unsubscribeConversations = null;
  socketClient.off('connect', onSocketConnected);
  socketClient.off('message:new', onMessageNew);
  socketClient.off('message:edited', onMessageEdited);
  socketClient.off('message:deleted', onMessageDeleted);
  socketClient.off('message:status', onMessageStatus);
  socketClient.off('typing:start', onTypingStart);
  socketClient.off('typing:stop', onTypingStop);
  socketClient.off('presence:online', onPresenceOnline);
  socketClient.off('presence:offline', onPresenceOffline);
  socketClient.off('presence:update', onPresenceGeneral);
  socketClient.off('user:online', onPresenceOnline);
  socketClient.off('user:offline', onPresenceOffline);
  socketClient.off('user:status', onPresenceGeneral);
  socketClient.off('user_status', onPresenceGeneral);
  socketClient.off('group:updated', onGroupUpdated);
  socketClient.off('group:member-added', onGroupMemberAdd);
  socketClient.off('group:member-removed', onGroupMemberRemove);
  socketClient.off('group:member-role-changed', onGroupMemberRole);
  socketClient.off('contact:new', onContactChanged);
  socketClient.off('contact:remove', onContactChanged);
  socketClient.off('notification:new', onNotification);
  socketClient.disconnect();
}

export function setCurrentChat(chatId: string | null, _isDM: boolean) {
  currentChatId = chatId;
}
