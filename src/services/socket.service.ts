import { socketClient } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import { useTypingStore } from '@/store/typingStore';
import { usePresenceStore } from '@/store/presenceStore';
import { useAuthStore } from '@/store/authStore';
import { usePrivacyStore } from '@/store/privacyStore';
import { loadPrefs, showLocalNotification } from '@/services/notification';
import type { InfiniteData } from '@tanstack/react-query';
import type { Message, MessageStatus, PaginatedResponse, Group } from '@/types';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

let currentChatId: string | null = null;
let currentIsDM = false;

// --- Emit helpers ---

export function joinRoom(conversationId: string) {
  socketClient.joinRoom(conversationId);
}

export function leaveRoom(conversationId: string) {
  socketClient.leaveRoom(conversationId);
}

export function emitTypingStart(conversationId: string) {
  socketClient.emitTypingStart(conversationId);
}

export function emitTypingStop(conversationId: string) {
  socketClient.emitTypingStop(conversationId);
}

export function emitMessageSeen(conversationId: string) {
  socketClient.emitMessageSeen(conversationId);
}

// --- Listener registration ---

// Backend sends: { conversationId, message }
function onMessageNew(data: { conversationId: string; message: Message } | Message) {
  if (DEV_MODE) return;

  const msg: Message = (data as any).message ?? (data as Message);
  const chatId = (data as any).conversationId ?? msg.groupId;

  const conversations = queryClient.getQueryData<{ id: string; type: string }[]>(['conversations']);
  const conv = conversations?.find((c) => c.id === chatId);
  const isDM = conv?.type === 'dm';

  queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
    ['messages', chatId, isDM],
    (prev) => {
      if (!prev) return prev;
      const [firstPage, ...rest] = prev.pages;
      return {
        ...prev,
        pages: [
          { ...firstPage, data: [...firstPage.data, msg], total: firstPage.total + 1 },
          ...rest,
        ],
      };
    },
  );

  const preview = msg.type === 'image' ? '📷 Photo' : msg.content;
  queryClient.setQueryData<{ id: string; lastMessage?: string; lastTime?: string }[]>(
    ['conversations'],
    (prev) => {
      if (!prev) return prev;
      const updated = prev.map((c) =>
        c.id === chatId ? { ...c, lastMessage: preview, lastTime: 'now' } : c,
      );
      const idx = updated.findIndex((c) => c.id === chatId);
      if (idx <= 0) return updated;
      return [updated[idx], ...updated.slice(0, idx), ...updated.slice(idx + 1)];
    },
  );

  if (currentChatId === chatId && usePrivacyStore.getState().readReceipts) {
    socketClient.emitMessageSeen(chatId);
  }
}

function onMessageEdited(data: { conversationId: string; message: Message } | Message) {
  if (DEV_MODE) return;

  const msg: Message = (data as any).message ?? (data as Message);
  const chatId = (data as any).conversationId ?? msg.groupId;

  const conversations = queryClient.getQueryData<{ id: string; type: string }[]>(['conversations']);
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
          data: page.data.map((m) => (m.id === msg.id ? { ...m, content: msg.content, edited: true } : m)),
        })),
      };
    },
  );
}

// Backend sends: { conversationId, messageId }
function onMessageDeleted(data: { conversationId: string; messageId: string }) {
  if (DEV_MODE) return;

  const chatId = data.conversationId;
  const conversations = queryClient.getQueryData<{ id: string; type: string }[]>(['conversations']);
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
          data: page.data.map((m) =>
            m.id === data.messageId
              ? { ...m, content: 'Message deleted', type: 'text' as const, fileUrl: undefined, fileName: undefined }
              : m,
          ),
        })),
      };
    },
  );
}

function onMessageStatus(data: { id: string; status: MessageStatus; groupId: string }) {
  if (DEV_MODE) return;

  const conversations = queryClient.getQueryData<{ id: string; type: string }[]>(['conversations']);
  const conv = conversations?.find((c) => c.id === data.groupId);
  const isDM = conv?.type === 'dm';

  queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
    ['messages', data.groupId, isDM],
    (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          data: page.data.map((m) => (m.id === data.id ? { ...m, status: data.status } : m)),
        })),
      };
    },
  );
}

// Backend sends separate events: typing:start / typing:stop
function onTypingStart(data: { conversationId: string; userId: string }) {
  const currentUserId = useAuthStore.getState().user?.id;
  if (data.userId === currentUserId) return;
  useTypingStore.getState().setTyping(data.conversationId, true);
}

function onTypingStop(data: { conversationId: string; userId: string }) {
  const currentUserId = useAuthStore.getState().user?.id;
  if (data.userId === currentUserId) return;
  useTypingStore.getState().setTyping(data.conversationId, false);
}

// Backend sends separate events: presence:online / presence:offline
function onPresenceOnline(data: { userId: string }) {
  usePresenceStore.getState().setPresence(data.userId, {
    isOnline: true,
    lastSeen: new Date(),
  });
}

function onPresenceOffline(data: { userId: string }) {
  usePresenceStore.getState().setPresence(data.userId, {
    isOnline: false,
    lastSeen: new Date(),
  });
}

function onGroupUpdated(data: { id: string; name?: string; description?: string }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.id] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

function onGroupAvatarUpdated(data: { id: string; avatarUrl: string }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.id] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

// Backend sends: { conversationId, members }
function onGroupMemberAdded(data: { conversationId: string; members: any[] }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.conversationId] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

// Backend sends: { conversationId, removedUserId }
function onGroupMemberRemoved(data: { conversationId: string; removedUserId: string }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.conversationId] });
}

// Backend sends: { conversationId, userId, role }
function onGroupRoleChanged(data: { conversationId: string; userId: string; role: string }) {
  queryClient.invalidateQueries({ queryKey: ['group', data.conversationId] });
}

// Backend sends: { request } for friend events
function onFriendRequestReceived(data: { request: any }) {
  queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const prefs = loadPrefs();
  const senderName = data?.request?.sender?.fullName || data?.request?.sender?.username || 'Someone';
  showLocalNotification(`${senderName} wants to follow you`, { body: '' });

  if (prefs.sound) {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  }
}

function onFriendRequestAccepted() {
  queryClient.invalidateQueries({ queryKey: ['friends'] });
  queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
}

function onFriendRequestRejected() {
  queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
}

function onFriendRequestCancelled() {
  queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
}

// Backend sends: { unfriendedBy }
function onFriendUnfriended() {
  queryClient.invalidateQueries({ queryKey: ['friends'] });
}

// --- Init / Destroy ---

export function initSocket(token?: string) {
  if (DEV_MODE) return;

  socketClient.connect(token);

  const userId = useAuthStore.getState().user?.id;
  if (userId) {
    socketClient.joinRoom(`user:${userId}`);
  }

  socketClient.on('message:new', onMessageNew);
  socketClient.on('message:edited', onMessageEdited);
  socketClient.on('message:deleted', onMessageDeleted);
  socketClient.on('message:status', onMessageStatus);
  socketClient.on('typing:start', onTypingStart);
  socketClient.on('typing:stop', onTypingStop);
  socketClient.on('presence:online', onPresenceOnline);
  socketClient.on('presence:offline', onPresenceOffline);
  socketClient.on('group:updated', onGroupUpdated);
  socketClient.on('group:avatar-updated', onGroupAvatarUpdated);
  socketClient.on('group:member-added', onGroupMemberAdded);
  socketClient.on('group:member-removed', onGroupMemberRemoved);
  socketClient.on('group:role-changed', onGroupRoleChanged);
  socketClient.on('friend:request-received', onFriendRequestReceived);
  socketClient.on('friend:request-accepted', onFriendRequestAccepted);
  socketClient.on('friend:request-rejected', onFriendRequestRejected);
  socketClient.on('friend:request-cancelled', onFriendRequestCancelled);
  socketClient.on('friend:unfriended', onFriendUnfriended);
}

export function destroySocket() {
  socketClient.off('message:new', onMessageNew);
  socketClient.off('message:edited', onMessageEdited);
  socketClient.off('message:deleted', onMessageDeleted);
  socketClient.off('message:status', onMessageStatus);
  socketClient.off('typing:start', onTypingStart);
  socketClient.off('typing:stop', onTypingStop);
  socketClient.off('presence:online', onPresenceOnline);
  socketClient.off('presence:offline', onPresenceOffline);
  socketClient.off('group:updated', onGroupUpdated);
  socketClient.off('group:avatar-updated', onGroupAvatarUpdated);
  socketClient.off('group:member-added', onGroupMemberAdded);
  socketClient.off('group:member-removed', onGroupMemberRemoved);
  socketClient.off('group:role-changed', onGroupRoleChanged);
  socketClient.off('friend:request-received', onFriendRequestReceived);
  socketClient.off('friend:request-accepted', onFriendRequestAccepted);
  socketClient.off('friend:request-rejected', onFriendRequestRejected);
  socketClient.off('friend:request-cancelled', onFriendRequestCancelled);
  socketClient.off('friend:unfriended', onFriendUnfriended);
  socketClient.disconnect();
}

export function setCurrentChat(chatId: string | null, isDM: boolean) {
  currentChatId = chatId;
  currentIsDM = isDM;
}
