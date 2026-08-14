import { socketClient } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import { useTypingStore } from '@/store/typingStore';
import { usePresenceStore } from '@/store/presenceStore';
import { useAuthStore } from '@/store/authStore';
import { usePrivacyStore } from '@/store/privacyStore';
import { useNotificationStore } from '@/store/notificationStore';
import { loadPrefs, showLocalNotification } from '@/services/notification';
import { mapMessage, messageSenderName, saveLocalUnread, statusIsAtLeast, normalizeRemoteStatus, refreshConversationPreview, getPinnedMessages, type RemoteMessage, type ChatConversation, DM_USER_MAP } from '@/services/chat';
import { getUser } from '@/services/user';
import { isChatDeleted, unhideChat } from '@/lib/chatDeleted';
import type { InfiniteData } from '@tanstack/react-query';
import type { Message, PaginatedResponse } from '@/types';
import type { Conversation } from '@/types';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

let currentChatId: string | null = null;
let currentTypingChatId: string | null = null;
let unsubscribeConversations: (() => void) | null = null;
const emittedSeenRef = new Map<string, string>();

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
  if (isChatDeleted(chatId)) unhideChat(chatId);
  const conversations = queryClient.getQueryData<{ id: string; type?: string }[]>(['conversations']);
  const conv = conversations?.find((c) => c.id === chatId);
  const isDM = conv?.type === 'dm';

  if (!conv) {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }

  queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
    ['messages', chatId, isDM],
    (prev) => {
      if (!prev) return prev;
      if (prev.pages.length === 0) {
        return { ...prev, pages: [{ data: [msg], total: 1, page: 1, limit: 50, totalPages: 1 }] };
      }
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
  queryClient.setQueryData<{ id: string; lastMessage?: string; lastTime?: string; unread?: number; lastSenderName?: string }[]>(
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
              lastSenderName: isDM ? undefined : messageSenderName(msg),
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

  // Read receipt: kirim message:seen ketika pesan masuk di chat yang sedang dibuka.
  if (currentChatId === chatId && msg.senderId !== currentUserId) {
    emitSeenForConversation(chatId, isDM, msg.id);
  }
}

// --- Read receipts (kirim message:seen ke server) ---

export function emitSeenForConversation(chatId: string, isDM: boolean, lastMessageId?: string): void {
  if (DEV_MODE) return;
  if (!usePrivacyStore.getState().readReceipts) return;
  if (!socketClient.isConnected) return;

  let lastId = lastMessageId;
  if (!lastId) {
    const data = queryClient.getQueryData<InfiniteData<PaginatedResponse<Message>>>([
      'messages',
      chatId,
      isDM,
    ]);
    const all = data?.pages.flatMap((p) => p.data) ?? [];
    lastId = all[all.length - 1]?.id;
  }
  if (!lastId) return;
  if (emittedSeenRef.get(chatId) === lastId) return;
  emittedSeenRef.set(chatId, lastId);
  socketClient.emitMessageSeen(chatId, lastId);
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
  refreshConversationPreview(data.conversationId, isDM);
}

function onMessagePinUpdated(data: { conversationId: string; messageId: string; isPinned: boolean }) {
  if (DEV_MODE) return;

  const chatId = data.conversationId;
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
          data: page.data.map((m) => (m.id === data.messageId ? { ...m, isPinned: data.isPinned } : m)),
        })),
      };
    },
  );

  if (currentChatId === chatId) {
    getPinnedMessages(chatId)
      .then((pinned) => {
        queryClient.setQueryData(['pinned', chatId], pinned);
        window.dispatchEvent(new CustomEvent('chat:pinned-updated', { detail: pinned }));
      })
      .catch(() => {});
  }
}

function onMessageStarUpdated(data: { messageId: string; isStarred: boolean }) {
  if (DEV_MODE) return;

  queryClient.invalidateQueries({ queryKey: ['starred'] });

  const conversations = queryClient.getQueryData<{ id: string; type?: string }[]>(['conversations']);
  if (!conversations) return;

  for (const conv of conversations) {
    const isDM = conv?.type === 'dm';
    queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
      ['messages', conv.id, isDM],
      (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            data: page.data.map((m) =>
              m.id === data.messageId
                ? { ...m, isStarred: data.isStarred, starredAt: data.isStarred ? new Date() : null }
                : m,
            ),
          })),
        };
      },
    );
  }
}

const typingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
const typingNameCache = new Map<string, string>();

async function fetchTypingName(userId: string): Promise<string> {
  const cached = typingNameCache.get(userId);
  if (cached) return cached;
  try {
    const user = await getUser(userId);
    const name = user.fullName || user.username || '';
    typingNameCache.set(userId, name);
    return name;
  } catch {
    return '';
  }
}

async function resolveTypingName(userId: string, conversationId: string): Promise<string> {
  const convs = queryClient.getQueryData<
    { id: string; type: string; name?: string; userId?: string }[]
  >(['conversations']);
  const conv = convs?.find((c) => c.id === conversationId);
  if (conv?.type === 'dm') return conv.name || (await fetchTypingName(userId));
  const group = queryClient.getQueryData<{
    members?: { userId: string; user?: { fullName?: string | null; username?: string | null } }[];
  }>(['group', conversationId]);
  const member = group?.members?.find((m) => m.userId === userId);
  const local = member?.user?.fullName || member?.user?.username;
  if (local) return local;
  return fetchTypingName(userId);
}

async function onTypingUpdate(data: { userId: string; conversationId: string; isTyping: boolean }) {
  const currentUserId = useAuthStore.getState().user?.id;
  if (data.userId === currentUserId) return;
  const key = `${data.conversationId}:${data.userId}`;
  if (typingTimeouts[key]) {
    clearTimeout(typingTimeouts[key]);
    delete typingTimeouts[key];
  }
  if (data.isTyping) {
    const name = await resolveTypingName(data.userId, data.conversationId);
    typingTimeouts[key] = setTimeout(() => {
      useTypingStore.getState().setTyping(data.conversationId, false, {
        userId: data.userId,
        name: '',
      });
      delete typingTimeouts[key];
    }, 10000);
    useTypingStore.getState().setTyping(data.conversationId, true, {
      userId: data.userId,
      name,
    });
    return;
  }
  useTypingStore.getState().setTyping(data.conversationId, false, {
    userId: data.userId,
    name: '',
  });
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

function onGroupCreated(data: { conversationId: string; name?: string }) {
  if (!data?.conversationId) return;
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
  // 3.8: langsung join room grup baru
  socketClient.joinRoom(data.conversationId);
}

function onGroupUpdated(data: { id: string }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.id] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

function onGroupAvatarUpdated(data: { id: string }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.id] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

function onGroupMemberAdd(data: { conversationId?: string; groupId?: string }) {
  const id = data?.conversationId ?? data?.groupId;
  if (!id) return;
  queryClient.invalidateQueries({ queryKey: ['group', id] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

function onGroupMemberRemove(data: { conversationId?: string; groupId?: string; targetUserId?: string; removedBy?: string }) {
  const id = data?.conversationId ?? data?.groupId;
  if (!id) return;
  queryClient.invalidateQueries({ queryKey: ['group', id] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });

  // User sendiri dikeluarkan/di-remove dari grup → arahkan keluar chat room.
  const currentUserId = useAuthStore.getState().user?.id;
  const selfRemoved = data.targetUserId === currentUserId || data.removedBy === currentUserId;
  if (selfRemoved) {
    window.dispatchEvent(new CustomEvent('chat:forced-leave', { detail: { conversationId: id } }));
  }
}

function onGroupMemberRole(data: { conversationId?: string; groupId?: string; targetUserId?: string; newRole?: string }) {
  const id = data?.conversationId ?? data?.groupId;
  if (!id) return;
  queryClient.invalidateQueries({ queryKey: ['group', id] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

function onGroupDismissed(data: { conversationId: string }) {
  const id = data?.conversationId;
  if (!id) return;
  queryClient.setQueryData<{ id: string }[]>(['conversations'], (prev) => (prev ?? []).filter((c) => c.id !== id));
  queryClient.removeQueries({ queryKey: ['group', id] });
  queryClient.removeQueries({ queryKey: ['messages', id] });
  window.dispatchEvent(new CustomEvent('chat:forced-leave', { detail: { conversationId: id } }));
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
  const isGroup = ['group', 'group_invite', 'mention'].includes(data?.type) || data?.conversationType === 'group';

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
  socketClient.on('message:pin:updated', onMessagePinUpdated);
  socketClient.on('message:star:updated', onMessageStarUpdated);
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
  socketClient.on('group:created', onGroupCreated);
  socketClient.on('group:updated', onGroupUpdated);
  socketClient.on('group:avatar-updated', onGroupAvatarUpdated);
  socketClient.on('group:member-added', onGroupMemberAdd);
  socketClient.on('group:member-removed', onGroupMemberRemove);
  socketClient.on('group:member-role-changed', onGroupMemberRole);
  socketClient.on('group:dismissed', onGroupDismissed);
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
  socketClient.off('message:pin:updated', onMessagePinUpdated);
  socketClient.off('message:star:updated', onMessageStarUpdated);
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
  socketClient.off('group:created', onGroupCreated);
  socketClient.off('group:updated', onGroupUpdated);
  socketClient.off('group:avatar-updated', onGroupAvatarUpdated);
  socketClient.off('group:member-added', onGroupMemberAdd);
  socketClient.off('group:member-removed', onGroupMemberRemove);
  socketClient.off('group:member-role-changed', onGroupMemberRole);
  socketClient.off('group:dismissed', onGroupDismissed);
  socketClient.off('contact:new', onContactChanged);
  socketClient.off('contact:remove', onContactChanged);
  socketClient.off('notification:new', onNotification);
  socketClient.disconnect();
}

export function setCurrentChat(chatId: string | null, _isDM: boolean) {
  currentChatId = chatId;
}
