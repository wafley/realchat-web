import { socketClient } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import { useTypingStore } from '@/store/typingStore';
import { usePresenceStore } from '@/store/presenceStore';
import { useAuthStore } from '@/store/authStore';
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

function onMessageNew(msg: Message) {
  if (DEV_MODE) return;

  const chatId = msg.groupId;
  const conversations = queryClient.getQueryData<{ id: string }[]>(['conversations']);
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

  // Update conversation preview + reorder
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

  // Auto-emit seen if this chat is currently open
  if (currentChatId === chatId) {
    socketClient.emitMessageSeen(chatId);
  }
}

function onMessageEdited(msg: Message) {
  if (DEV_MODE) return;

  const conversations = queryClient.getQueryData<{ id: string; type: string }[]>(['conversations']);
  const conv = conversations?.find((c) => c.id === msg.groupId);
  const isDM = conv?.type === 'dm';

  queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
    ['messages', msg.groupId, isDM],
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

function onMessageDeleted(data: { id: string; groupId: string }) {
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
          data: page.data.map((m) =>
            m.id === data.id
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

function onTypingUpdate(data: { userId: string; conversationId: string; isTyping: boolean }) {
  const currentUserId = useAuthStore.getState().user?.id;
  if (data.userId === currentUserId) return;
  useTypingStore.getState().setTyping(data.conversationId, data.isTyping);
}

function onPresenceUpdate(data: { userId: string; isOnline: boolean; lastSeen: Date | null }) {
  usePresenceStore.getState().setPresence(data.userId, {
    isOnline: data.isOnline,
    lastSeen: data.lastSeen ? new Date(data.lastSeen) : null,
  });
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

function onNotification(_data: any) {
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['pendingFriendRequestCount'] });
}

// --- Init / Destroy ---

export function initSocket(token?: string) {
  if (DEV_MODE) return;

  socketClient.connect(token);

  socketClient.on('message:new', onMessageNew);
  socketClient.on('message:edited', onMessageEdited);
  socketClient.on('message:deleted', onMessageDeleted);
  socketClient.on('message:status', onMessageStatus);
  socketClient.on('typing:update', onTypingUpdate);
  socketClient.on('presence:update', onPresenceUpdate);
  socketClient.on('group:updated', onGroupUpdated);
  socketClient.on('group:member:add', onGroupMemberAdd);
  socketClient.on('group:member:remove', onGroupMemberRemove);
  socketClient.on('group:member:role', onGroupMemberRole);
  socketClient.on('notification:new', onNotification);
}

export function destroySocket() {
  socketClient.off('message:new', onMessageNew);
  socketClient.off('message:edited', onMessageEdited);
  socketClient.off('message:deleted', onMessageDeleted);
  socketClient.off('message:status', onMessageStatus);
  socketClient.off('typing:update', onTypingUpdate);
  socketClient.off('presence:update', onPresenceUpdate);
  socketClient.off('group:updated', onGroupUpdated);
  socketClient.off('group:member:add', onGroupMemberAdd);
  socketClient.off('group:member:remove', onGroupMemberRemove);
  socketClient.off('group:member:role', onGroupMemberRole);
  socketClient.off('notification:new', onNotification);
  socketClient.disconnect();
}

export function setCurrentChat(chatId: string | null, isDM: boolean) {
  currentChatId = chatId;
  currentIsDM = isDM;
}
