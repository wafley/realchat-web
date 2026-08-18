import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/errors';
import type { Message, PaginatedResponse, ReplyTo } from '@/types';
import { queryClient } from '@/lib/queryClient';
import {
  sendMessage,
  sendImageMessage,
  editMessage,
  deleteMessage,
  forwardMessage,
  pinMessage,
  unpinMessage,
  starMessage,
  unstarMessage,
  getPinnedMessages,
  sendFileMessage,
  getConversations,
  getGroup,
  toggleReaction,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  deleteGroup,
  updateMemberRole,
  clearChat,
  simulateDevReceipts,
  refreshConversationPreview,
  messageSenderName,
} from '@/services/chat';
import { leaveRoom } from '@/services/socket.service';

interface UseChatMutationsProps {
  chatId: string;
  isDM: boolean;
  setDeleteTarget: (msg: Message | null) => void;
  setDeleteLoading: (v: boolean) => void;
  setForwardTarget: (msg: Message | null) => void;
  setForwardSearch: (v: string) => void;
  setEditingMsg: (msg: Message | null) => void;
  setInput: (v: string) => void;
  setPinnedMessages: (msgs: Message[]) => void;
  setGroupInfoOpen?: (v: boolean) => void;
}

export function useChatMutations({
  chatId,
  isDM,
  setDeleteTarget,
  setDeleteLoading,
  setForwardTarget,
  setForwardSearch,
  setEditingMsg,
  setInput,
  setPinnedMessages,
  setGroupInfoOpen: _setGroupInfoOpen,
}: UseChatMutationsProps) {
  const navigate = useNavigate();

  const onMessageSent = useCallback(
    (newMsg: Message) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
        ['messages', chatId, isDM],
        (prev) => {
           if (!prev) return prev;
           if (prev.pages.length === 0) {
             return { ...prev, pages: [{ data: [newMsg], total: 1, page: 1, limit: 50, totalPages: 1 }] };
           }
           if (prev.pages[0].data.some((m) => m.id === newMsg.id)) return prev;
           const [firstPage, ...rest] = prev.pages;
           return {
             ...prev,
             pages: [
               { ...firstPage, data: [...firstPage.data, newMsg], total: firstPage.total + 1 },
               ...rest,
             ],
           };
        },
      );
      const preview = newMsg.type === 'image' ? '📷 Photo' : newMsg.content;
      queryClient.setQueryData<{ id: string; lastMessage?: string; lastTime?: string; lastSenderName?: string }[]>(
        ['conversations'],
        (prev) => {
          if (!prev) return prev;
          const updated = prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  lastMessage: preview,
                  lastSenderName: !isDM ? messageSenderName(newMsg) : undefined,
                  lastTime: new Date().toISOString(),
                }
              : c,
          );
      const idx = updated.findIndex((c) => c.id === chatId);
      if (idx <= 0) return updated;
      return [updated[idx], ...updated.slice(0, idx), ...updated.slice(idx + 1)];
    },
      );
      simulateDevReceipts(chatId, newMsg.id, isDM);
    },
    [chatId, isDM],
  );

  const updateMsgPin = useCallback(
    (msgId: string, pinned: boolean) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
        ['messages', chatId, isDM],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              data: page.data.map((m) => (m.id === msgId ? { ...m, isPinned: pinned } : m)),
            })),
          };
        },
      );
    },
    [chatId, isDM],
  );

  const { refetch: refetchPinned } = useQuery({
    queryKey: ['pinned', chatId],
    queryFn: () => getPinnedMessages(chatId),
    enabled: false,
  });

  const sendMutation = useMutation({
    mutationFn: ({ content, replyTo: rp }: { content: string; replyTo?: ReplyTo }) =>
      sendMessage(chatId, content, isDM, rp),
    onSuccess(r) {
      onMessageSent(r);
    },
    onError() {
      toast.error('Failed to send message. Please try again.');
    },
  });

  const sendImageMutation = useMutation({
    mutationFn: ({ file, caption, replyTo: rp }: { file: File; caption: string; replyTo?: ReplyTo; preview?: string | null }) =>
      sendImageMessage(chatId, file, isDM, caption || undefined, rp),
    onSuccess(r, vars) {
      onMessageSent(r);
      if (vars.preview) URL.revokeObjectURL(vars.preview);
    },
    onError: (_err) => {
      toast.error(getApiErrorMessage(_err, 'Failed to send image. Please try again.'));
    },
  });

  const sendFileMutation = useMutation({
    mutationFn: ({ file, caption, replyTo: rp }: { file: File; caption: string; replyTo?: ReplyTo }) =>
      sendFileMessage(chatId, file, isDM, caption || undefined, rp),
    onSuccess(r) {
      onMessageSent(r);
    },
    onError: (_err) => {
      toast.error(getApiErrorMessage(_err, 'Failed to send file. Please try again.'));
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ msgId, content }: { msgId: string; content: string }) =>
      editMessage(chatId, msgId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId, isDM] });
      setEditingMsg(null);
      setInput('');
      toast.success('Message edited');
    },
    onError: (_err) => toast.error(getApiErrorMessage(_err)),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ msgId, delForAll }: { msgId: string; delForAll: boolean }) =>
      deleteMessage(chatId, msgId, delForAll),
    onMutate: async ({ msgId, delForAll }) => {
      setDeleteLoading(true);
      await queryClient.cancelQueries({ queryKey: ['messages', chatId, isDM] });
      const prev = queryClient.getQueryData<InfiniteData<PaginatedResponse<Message>>>([
        'messages',
        chatId,
        isDM,
      ]);
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
        ['messages', chatId, isDM],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => {
              const hadMsg = page.data.some((m) => m.id === msgId);
              return {
                ...page,
                data: !delForAll
                  ? page.data.filter((m) => m.id !== msgId)
                  : page.data.map((m) =>
                      m.id === msgId
                        ? {
                            ...m,
                            content: 'You deleted this message',
                            type: 'text' as const,
                            fileUrl: undefined,
                            fileName: undefined,
                            replyTo: undefined,
                            isDeleted: true,
                          }
                        : m,
                    ),
                total: !delForAll && hadMsg ? page.total - 1 : page.total,
              };
            }),
          };
        },
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['messages', chatId, isDM], context.prev);
      }
      toast.error('Failed to delete message. Please try again.');
    },
    onSuccess: () => {
      refreshConversationPreview(chatId, isDM);
      toast.success('Message deleted');
    },
    onSettled: () => {
      setDeleteTarget(null);
      setDeleteLoading(false);
    },
  });

  const { data: allConversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const forwardableConversations = allConversations.filter((c) => c.id !== chatId);

  const forwardMutation = useMutation({
    mutationFn: ({ targetChatId, msg }: { targetChatId: string; msg: Message }) =>
      forwardMessage(targetChatId, msg, chatId),
    onSuccess: () => {
      toast.success('Message forwarded');
      setForwardTarget(null);
      setForwardSearch('');
    },
    onError: (_err) => toast.error(getApiErrorMessage(_err)),
  });

  const pinMutation = useMutation({
    mutationFn: (msgId: string) => pinMessage(chatId, msgId),
    onSuccess: (_data, msgId) => {
      toast.success('Message pinned');
      updateMsgPin(msgId, true);
      refetchPinned().then((r) => {
        if (r.data) setPinnedMessages(r.data);
      });
    },
    onError: (_err) => toast.error(getApiErrorMessage(_err)),
  });

  const unpinMutation = useMutation({
    mutationFn: (msgId: string) => unpinMessage(chatId, msgId),
    onSuccess: (_data, msgId) => {
      toast.success('Message unpinned');
      updateMsgPin(msgId, false);
      refetchPinned().then((r) => {
        if (r.data) setPinnedMessages(r.data);
      });
    },
    onError: (_err) => toast.error(getApiErrorMessage(_err)),
  });

  const updateMsgStar = useCallback(
    (msgId: string, starred: boolean) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
        ['messages', chatId, isDM],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              data: page.data.map((m) =>
                m.id === msgId
                  ? { ...m, isStarred: starred, starredAt: starred ? new Date() : null }
                  : m,
              ),
            })),
          };
        },
      );
    },
    [chatId, isDM],
  );

  const starMutation = useMutation({
    mutationFn: (msgId: string) => starMessage(chatId, msgId),
    onSuccess: (_data, msgId) => {
      updateMsgStar(msgId, true);
      queryClient.invalidateQueries({ queryKey: ['starred'] });
    },
    onError: (_err) => toast.error(getApiErrorMessage(_err)),
  });

  const unstarMutation = useMutation({
    mutationFn: (msgId: string) => unstarMessage(chatId, msgId),
    onSuccess: (_data, msgId) => {
      updateMsgStar(msgId, false);
      queryClient.invalidateQueries({ queryKey: ['starred'] });
    },
    onError: (_err) => toast.error(getApiErrorMessage(_err)),
  });

  const { data: group } = useQuery({
    queryKey: ['group', chatId],
    queryFn: () => getGroup(chatId),
    enabled: !isDM && !!chatId,
  });

  const toggleReactionMutation = useMutation({
    mutationFn: ({ msgId, emoji }: { msgId: string; emoji: string }) =>
      toggleReaction(chatId, msgId, emoji),
    onSuccess: (reactions, { msgId }) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
        ['messages', chatId, isDM],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              data: page.data.map((m) => (m.id === msgId ? { ...m, reactions } : m)),
            })),
          };
        },
      );
    },
    onError: (_err) => toast.error(getApiErrorMessage(_err)),
  });

  const updateGroupMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      updateGroup(chatId, data),
    // Cache di-invalidate oleh socket event group:updated / group:avatar-updated.
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => addGroupMember(chatId, userId),
    // Cache di-invalidate oleh socket event group:member-added.
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeGroupMember(chatId, userId),
    // Cache di-invalidate oleh socket event group:member-removed.
  });

  const leaveGroupMutation = useMutation({
    mutationFn: () => leaveGroup(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      leaveRoom(chatId);
      navigate('/');
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () => deleteGroup(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate('/');
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'member' }) =>
      updateMemberRole(chatId, userId, role),
    // Cache di-invalidate oleh socket event group:member-role-changed.
  });

  const clearChatMutation = useMutation({
    mutationFn: () => clearChat(chatId),
    onSuccess: () => {
      queryClient.setQueryData(['messages', chatId, isDM], { pages: [], pageParams: [] });
      toast.success('Chat cleared');
    },
    onError: (_err) => toast.error(getApiErrorMessage(_err)),
  });

  return {
    // Callbacks
    onMessageSent,
    // Conversations
    forwardableConversations,
    // Group
    group: group ?? null,
    // Pinned
    refetchPinned,
    // All mutations
    sendMutation,
    sendImageMutation,
    editMutation,
    deleteMutation,
    forwardMutation,
    pinMutation,
    unpinMutation,
    starMutation,
    unstarMutation,
    sendFileMutation,
    toggleReactionMutation,
    updateGroupMutation,
    addMemberMutation,
    removeMemberMutation,
    leaveGroupMutation,
    deleteGroupMutation,
    updateMemberRoleMutation,
    clearChatMutation,
  };
}
