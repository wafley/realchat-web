import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
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
} from '@/services/chat';

interface UseChatMutationsProps {
  chatId: string;
  isDM: boolean;
  deleteTarget: Message | null;
  setDeleteTarget: (msg: Message | null) => void;
  setDeleteLoading: (v: boolean) => void;
  setForwardTarget: (msg: Message | null) => void;
  setForwardSearch: (v: string) => void;
  setEditingMsg: (msg: Message | null) => void;
  setInput: (v: string) => void;
  setReplyingTo: (msg: Message | null) => void;
  setSelectedImage: (f: File | null) => void;
  setImagePreview: (v: string | null) => void;
  setSelectedFile: (f: File | null) => void;
  setPinnedMessages: (msgs: Message[]) => void;
  setGroupInfoOpen: (v: boolean) => void;
}

export function useChatMutations({
  chatId,
  isDM,
  deleteTarget,
  setDeleteTarget,
  setDeleteLoading,
  setForwardTarget,
  setForwardSearch,
  setEditingMsg,
  setInput,
  setReplyingTo,
  setSelectedImage,
  setImagePreview,
  setSelectedFile,
  setPinnedMessages,
  setGroupInfoOpen,
}: UseChatMutationsProps) {
  const navigate = useNavigate();

  const onMessageSent = useCallback(
    (newMsg: Message) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
        ['messages', chatId, isDM],
        (prev) => {
           if (!prev) return prev;
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
      queryClient.setQueryData<{ id: string; lastMessage?: string; lastTime?: string }[]>(
        ['conversations'],
        (prev) => {
          if (!prev) return prev;
          const updated = prev.map((c) =>
            c.id === chatId ? { ...c, lastMessage: preview, lastTime: new Date().toISOString() } : c,
          );
          const idx = updated.findIndex((c) => c.id === chatId);
          if (idx <= 0) return updated;
          return [updated[idx], ...updated.slice(0, idx), ...updated.slice(idx + 1)];
        },
      );
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
      setInput('');
      setReplyingTo(null);
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
      setInput('');
      setReplyingTo(null);
      setSelectedImage(null);
      setImagePreview(null);
      if (vars.preview) URL.revokeObjectURL(vars.preview);
    },
    onError() {
      toast.error('Failed to send image. Please try again.');
    },
  });

  const sendFileMutation = useMutation({
    mutationFn: ({ file, caption, replyTo: rp }: { file: File; caption: string; replyTo?: ReplyTo }) =>
      sendFileMessage(chatId, file, isDM, caption || undefined, rp),
    onSuccess(r) {
      onMessageSent(r);
      setInput('');
      setReplyingTo(null);
      setSelectedFile(null);
    },
    onError() {
      toast.error('Failed to send file. Please try again.');
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
    onError: () => toast.error('Failed to edit message. Please try again.'),
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
    onSuccess: (_data, { delForAll }) => {
      if (!delForAll) {
        queryClient.setQueryData<{ id: string; lastMessage?: string }[]>(
          ['conversations'],
          (prev) => {
            if (!prev) return prev;
            return prev.map((c) =>
              c.id === chatId && c.lastMessage === deleteTarget?.content
                ? { ...c, lastMessage: 'You deleted this message' }
                : c,
            );
          },
        );
      }
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
    onError: () => toast.error('Failed to forward message. Please try again.'),
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
    onError: () => toast.error('Failed to pin message'),
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
    onError: () => toast.error('Failed to unpin message'),
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
    onError: () => toast.error('Failed to toggle reaction'),
  });

  const updateGroupMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string; avatarUrl?: string }) =>
      updateGroup(chatId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', chatId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setGroupInfoOpen(false);
      toast.success('Group updated');
    },
    onError: () => toast.error('Failed to update group'),
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => addGroupMember(chatId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', chatId] });
      toast.success('Member added');
    },
    onError: () => toast.error('Failed to add member'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeGroupMember(chatId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', chatId] });
      toast.success('Member removed');
    },
    onError: () => toast.error('Failed to remove member'),
  });

  const leaveGroupMutation = useMutation({
    mutationFn: () => leaveGroup(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Left the group');
      navigate('/');
    },
    onError: () => toast.error('Failed to leave group'),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () => deleteGroup(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Group deleted');
      navigate('/');
    },
    onError: () => toast.error('Failed to delete group'),
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'member' }) =>
      updateMemberRole(chatId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', chatId] });
      queryClient.invalidateQueries({ queryKey: ['messages', chatId, isDM] });
      toast.success('Member role updated');
    },
    onError: () => toast.error('Failed to update member role'),
  });

  const clearChatMutation = useMutation({
    mutationFn: () => clearChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId, isDM] });
      toast.success('Chat cleared');
    },
    onError: () => toast.error('Failed to clear chat'),
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
