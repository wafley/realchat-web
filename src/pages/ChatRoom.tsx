import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Message, MessageStatus, PaginatedResponse, ReplyTo } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTypingStore } from '@/store/typingStore';
import { queryClient } from '@/lib/queryClient';
import { getMessages, sendMessage, sendImageMessage, deleteMessage, markConversationAsRead, forwardMessage, pinMessage, unpinMessage, getPinnedMessages, sendFileMessage, toggleMuteConversation, blockUser, reportUser, getConversations, getGroup, toggleReaction } from '@/services/chat';
import ReactionPicker from '@/components/chat/ReactionPicker';

import ChatHeader from '@/components/chat/ChatHeader';
import ChatSearchBar from '@/components/chat/ChatSearchBar';
import PinnedBanner from '@/components/chat/PinnedBanner';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import ChatOverlays from '@/components/chat/ChatOverlays';

export default function ChatRoom() {
  const { groupId, userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((s) => s.user);
  const [input, setInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const setTyping = useTypingStore((s) => s.setTyping);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiToggleRef = useRef<HTMLButtonElement>(null);
  const scrollTriggerRef = useRef<HTMLDivElement>(null);
  const prevLastMsgIdRef = useRef<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const [forwardSearch, setForwardSearch] = useState('');

  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [groupInfoOpen, setGroupInfoOpen] = useState(false);

  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [reportConfirmOpen, setReportConfirmOpen] = useState(false);

  const [readReceiptTarget, setReadReceiptTarget] = useState<Message | null>(null);
  const [reactingMsgId, setReactingMsgId] = useState<string | null>(null);
  const [reactionPickerRect, setReactionPickerRect] = useState<DOMRect | null>(null);

  const [muted, setMuted] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const isDM = location.pathname.startsWith('/dm/');
  const chatId = (isDM ? userId : groupId) || '';
  const chatName = location.state?.name || 'Chat';
  const chatOnline = location.state?.online ?? true;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['messages', chatId, isDM],
    queryFn: ({ pageParam = 1 }) => getMessages(chatId, isDM, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    enabled: !!chatId,
  });

  const messages = useMemo(
    () => [...(data?.pages ?? [])].reverse().flatMap((p) => p.data),
    [data],
  );

  const onMessageSent = useCallback((newMsg: Message) => {
    queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(['messages', chatId, isDM], (prev) => {
      if (!prev) return prev;
      const [firstPage, ...rest] = prev.pages;
      return {
        ...prev,
        pages: [
          { ...firstPage, data: [...firstPage.data, newMsg], total: firstPage.total + 1 },
          ...rest,
        ],
      };
    });
    const preview = newMsg.type === 'image' ? '📷 Photo' : newMsg.content;
    queryClient.setQueryData<{ id: string; lastMessage?: string; lastTime?: string }[]>(['conversations'], (prev) => {
      if (!prev) return prev;
      const updated = prev.map((c) =>
        c.id === chatId ? { ...c, lastMessage: preview, lastTime: 'now' } : c,
      );
      const idx = updated.findIndex((c) => c.id === chatId);
      if (idx <= 0) return updated;
      return [updated[idx], ...updated.slice(0, idx), ...updated.slice(idx + 1)];
    });
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      const steps: MessageStatus[] = ['delivered', 'read'];
      steps.forEach((s, i) => {
        setTimeout(() => {
          queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(['messages', chatId, isDM], (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              pages: prev.pages.map((page) => ({
                ...page,
                data: page.data.map((m) => (m.id === newMsg.id ? { ...m, status: s } : m)),
              })),
            };
          });
        }, (i + 1) * 1000);
      });
    }
  }, [chatId, isDM]);

  const sendMutation = useMutation({
    mutationFn: ({ content, replyTo: rp }: { content: string; replyTo?: ReplyTo }) => sendMessage(chatId, content, isDM, rp),
    onSuccess(r) { onMessageSent(r); },
    onError() { toast.error('Failed to send message. Please try again.'); },
  });

  const sendImageMutation = useMutation({
    mutationFn: ({ file, caption, replyTo: rp }: { file: File; caption: string; replyTo?: ReplyTo }) => sendImageMessage(chatId, file, isDM, caption || undefined, rp),
    onSuccess(r) { onMessageSent(r); },
    onError() { toast.error('Failed to send image. Please try again.'); },
  });

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<Message | null>(null);

  const deleteMutation = useMutation({
    mutationFn: ({ msgId, delForAll }: { msgId: string; delForAll: boolean }) => deleteMessage(chatId, msgId, delForAll),
    onMutate: async ({ msgId, delForAll }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId, isDM] });
      const prev = queryClient.getQueryData<InfiniteData<PaginatedResponse<Message>>>(['messages', chatId, isDM]);
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(['messages', chatId, isDM], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: !delForAll
              ? page.data.filter((m) => m.id !== msgId)
              : page.data.map((m) =>
                  m.id === msgId ? { ...m, content: 'You deleted this message', type: 'text' as const, fileUrl: undefined, fileName: undefined, replyTo: undefined } : m,
                ),
            total: !delForAll ? page.total - 1 : page.total,
          })),
        };
      });
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
        queryClient.setQueryData<{ id: string; lastMessage?: string }[]>(['conversations'], (prev) => {
          if (!prev) return prev;
          return prev.map((c) =>
            c.id === chatId && c.lastMessage === deleteTarget?.content
              ? { ...c, lastMessage: 'You deleted this message' }
              : c,
          );
        });
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

  const forwardableConversations = useMemo(
    () => allConversations.filter((c) => c.id !== chatId),
    [allConversations, chatId],
  );

  const forwardMutation = useMutation({
    mutationFn: ({ targetChatId, msg }: { targetChatId: string; msg: Message }) => {
      return forwardMessage(targetChatId, msg, chatId);
    },
    onSuccess: () => {
      toast.success('Message forwarded');
      setForwardTarget(null);
      setForwardSearch('');
    },
    onError: () => toast.error('Failed to forward message. Please try again.'),
  });

  const updateMsgPin = useCallback((msgId: string, pinned: boolean) => {
    queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(['messages', chatId, isDM], (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          data: page.data.map((m) => (m.id === msgId ? { ...m, isPinned: pinned } : m)),
        })),
      };
    });
  }, [chatId, isDM]);

  const pinMutation = useMutation({
    mutationFn: (msgId: string) => pinMessage(chatId, msgId),
    onSuccess: (_data, msgId) => {
      toast.success('Message pinned');
      updateMsgPin(msgId, true);
      refetchPinned().then((r) => { if (r.data) setPinnedMessages(r.data); });
    },
    onError: () => toast.error('Failed to pin message'),
  });

  const unpinMutation = useMutation({
    mutationFn: (msgId: string) => unpinMessage(chatId, msgId),
    onSuccess: (_data, msgId) => {
      toast.success('Message unpinned');
      updateMsgPin(msgId, false);
      refetchPinned().then((r) => { if (r.data) setPinnedMessages(r.data); });
    },
    onError: () => toast.error('Failed to unpin message'),
  });

  const { refetch: refetchPinned } = useQuery({
    queryKey: ['pinned', chatId],
    queryFn: () => getPinnedMessages(chatId),
    enabled: false,
  });


  const sendFileMutation = useMutation({
    mutationFn: ({ file, caption }: { file: File; caption: string }) => sendFileMessage(chatId, file, isDM, caption || undefined),
    onSuccess(r) { onMessageSent(r); },
    onError() { toast.error('Failed to send file. Please try again.'); },
  });

  const { data: group } = useQuery({
    queryKey: ['group', chatId],
    queryFn: () => getGroup(chatId),
    enabled: !isDM && !!chatId,
  });

  const filteredMessages = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, showSearch, searchQuery]);

  const searchMatchIds = useMemo(() => filteredMessages.map((m) => m.id), [filteredMessages]);
  const hasActiveSearch = showSearch && searchQuery.trim().length > 0;
  useEffect(() => {
    if (!hasActiveSearch) { setSearchMatches([]); setActiveMatchIndex(0); return; }
    setSearchMatches(searchMatchIds);
    if (activeMatchIndex >= searchMatchIds.length) setActiveMatchIndex(0);
  }, [searchMatchIds, activeMatchIndex, hasActiveSearch]);

  const scrollToMatch = useCallback((index: number) => {
    const el = document.getElementById(`msg-${searchMatchIds[index]}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [searchMatchIds]);

  const handleKeyDown = useCallback((e: globalThis.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showSearch) { setShowSearch(false); setSearchQuery(''); setSearchMatches([]); setActiveMatchIndex(0); }
      if (showEmojiPicker) setShowEmojiPicker(false);
      if (replyingTo) setReplyingTo(null);
      if (lightboxUrl) setLightboxUrl(null);
      if (contextMenu) setContextMenu(null);
      if (deleteTarget) setDeleteTarget(null);
      if (forwardTarget) { setForwardTarget(null); setForwardSearch(''); }
      if (groupInfoOpen) setGroupInfoOpen(false);
      if (blockConfirmOpen) setBlockConfirmOpen(false);
      if (reportConfirmOpen) setReportConfirmOpen(false);
      if (readReceiptTarget) setReadReceiptTarget(null);
      if (reactingMsgId) { setReactingMsgId(null); setReactionPickerRect(null); }
    }
  }, [showSearch, showEmojiPicker, replyingTo, lightboxUrl, contextMenu, deleteTarget, forwardTarget, groupInfoOpen, blockConfirmOpen, reportConfirmOpen, readReceiptTarget, reactingMsgId]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutsidePicker = emojiPickerRef.current && !emojiPickerRef.current.contains(target);
      const isOnToggle = emojiToggleRef.current && emojiToggleRef.current.contains(target);
      if (isOutsidePicker && !isOnToggle) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiClick = (emoji: string) => {
    setInput((prev) => prev + emoji);
  };

  useEffect(() => {
    if (!chatId || import.meta.env.VITE_DEV_MODE !== 'true') return;
    if (!input) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (typingDoneTimerRef.current) clearTimeout(typingDoneTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setOtherTyping(true);
      setTyping(chatId, true);
      typingDoneTimerRef.current = setTimeout(() => {
        setOtherTyping(false);
        setTyping(chatId, false);
      }, 3000);
    }, 1500);
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (typingDoneTimerRef.current) clearTimeout(typingDoneTimerRef.current);
      setOtherTyping(false);
      setTyping(chatId, false);
    };
  }, [input, chatId]);

  useEffect(() => {
    if (!chatId) return;
    markConversationAsRead(chatId);
    queryClient.setQueryData<{ id: string; unread?: number }[]>(['conversations'], (prev) => {
      if (!prev) return prev;
      return prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c));
    });
  }, [chatId]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastId = messages[messages.length - 1]?.id;
    if (lastId && lastId !== prevLastMsgIdRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLastMsgIdRef.current = lastId;
  }, [messages]);

  useEffect(() => {
    const el = scrollTriggerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
      longPressStartPosRef.current = null;
      if (typingTimerRef.current) { clearTimeout(typingTimerRef.current); typingTimerRef.current = null; }
      if (typingDoneTimerRef.current) { clearTimeout(typingDoneTimerRef.current); typingDoneTimerRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (chatId) refetchPinned().then((r) => { if (r.data) setPinnedMessages(r.data); });
  }, [chatId, refetchPinned]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(file);
    }
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedFile(file);
    setImagePreview(null);
    e.target.value = '';
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSendImage = () => {
    if (selectedImage) {
      const file = selectedImage;
      const caption = input.trim();
      const rp = replyingTo ? { id: replyingTo.id, senderId: replyingTo.senderId, senderName: replyingTo.sender?.fullName ?? 'Unknown', content: replyingTo.content, type: replyingTo.type as 'text' | 'image', fileUrl: replyingTo.fileUrl, fileName: replyingTo.fileName } : undefined;
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setSelectedImage(null);
      setImagePreview(null);
      setInput('');
      setReplyingTo(null);
      sendImageMutation.mutate({ file, caption, replyTo: rp });
    } else if (selectedFile) {
      const file = selectedFile;
      const caption = input.trim();
      setSelectedFile(null);
      setInput('');
      setReplyingTo(null);
      sendFileMutation.mutate({ file, caption });
    }
  };

  const handleCancelImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedFile(null);
  };

  const handleLongPressStart = (msg: Message, e: React.PointerEvent) => {
    longPressStartPosRef.current = { x: e.clientX, y: e.clientY };
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressStartPosRef.current = null;
      if (navigator.vibrate) navigator.vibrate(50);
      let x = e.clientX;
      let y = e.clientY;
      const menuW = 180;
      const menuH = 200;
      if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
      if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
      if (x < 8) x = 8;
      if (y < 8) y = 8;
      setContextMenu({ msg, x, y });
      e.preventDefault();
    }, 500);
  };

  const handleLongPressMove = (e: React.PointerEvent) => {
    if (!longPressStartPosRef.current) return;
    const dx = e.clientX - longPressStartPosRef.current.x;
    const dy = e.clientY - longPressStartPosRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      handleLongPressEnd();
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartPosRef.current = null;
  };

  const handleTouchStart = (msg: Message, e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressStartPosRef.current = null;
      if (navigator.vibrate) navigator.vibrate(50);
      let x = touch.clientX;
      let y = touch.clientY;
      const menuW = 180;
      const menuH = 200;
      if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
      if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
      if (x < 8) x = 8;
      if (y < 8) y = 8;
      setContextMenu({ msg, x, y });
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!longPressStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - longPressStartPosRef.current.x;
    const dy = touch.clientY - longPressStartPosRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      handleLongPressEnd();
    }
  };

  const handleTouchEnd = () => {
    handleLongPressEnd();
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;
    const msg = contextMenu.msg;
    setContextMenu(null);
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(msg.content);
        toast.success('Copied to clipboard');
        break;
      case 'reply':
        setReplyingTo(msg);
        break;
      case 'forward':
        setForwardTarget(msg);
        break;
      case 'pin':
        pinMutation.mutate(msg.id);
        break;
      case 'unpin':
        unpinMutation.mutate(msg.id);
        break;
      case 'read-receipts':
        setReadReceiptTarget(msg);
        break;
      case 'block':
        setBlockConfirmOpen(true);
        break;
      case 'report':
        setReportConfirmOpen(true);
        break;
      case 'delete':
        setDeleteTarget(msg);
        break;
    }
  };

  const handleDeleteMessage = (deleteForAll: boolean) => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    deleteMutation.mutate({ msgId: deleteTarget.id, delForAll: deleteForAll });
  };

  const handleForward = useCallback((targetChatId: string, msg: Message) => {
    forwardMutation.mutate({ targetChatId, msg });
  }, [forwardMutation]);

  const handleBlock = useCallback(() => {
    blockUser(chatId);
    setBlockConfirmOpen(false);
    toast.success(`${chatName} has been blocked`);
  }, [chatId, chatName]);

  const handleReport = useCallback(() => {
    reportUser(chatId);
    setReportConfirmOpen(false);
    toast.success('Report submitted');
  }, [chatId]);

  const toggleReactionMutation = useMutation({
    mutationFn: ({ msgId, emoji }: { msgId: string; emoji: string }) => toggleReaction(chatId, msgId, emoji),
    onSuccess: (reactions, { msgId }) => {
      queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(['messages', chatId, isDM], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            data: page.data.map((m) => (m.id === msgId ? { ...m, reactions } : m)),
          })),
        };
      });
    },
    onError: () => toast.error('Failed to toggle reaction'),
  });

  const handleToggleReaction = useCallback((msgId: string, emoji: string) => {
    toggleReactionMutation.mutate({ msgId, emoji });
  }, [toggleReactionMutation]);

  const handleReactionPickerOpen = useCallback((msgId: string, rect: DOMRect) => {
    setReactingMsgId(msgId);
    setReactionPickerRect(rect);
  }, []);

  const handleReactionPickerClose = useCallback(() => {
    setReactingMsgId(null);
    setReactionPickerRect(null);
  }, []);

  const handleReactionPickerSelect = useCallback((emoji: string) => {
    if (reactingMsgId) {
      toggleReactionMutation.mutate({ msgId: reactingMsgId, emoji });
    }
    handleReactionPickerClose();
  }, [reactingMsgId, toggleReactionMutation, handleReactionPickerClose]);

  const handleToggleMute = useCallback(() => {
    const n = !muted;
    setMuted(n);
    toggleMuteConversation(chatId);
    toast(n ? 'Notifications muted' : 'Notifications unmuted');
  }, [muted, chatId]);

  const handleSend = () => {
    if (selectedImage || selectedFile) {
      handleSendImage();
      return;
    }
    const text = input.trim();
    if (!text) return;
    const rp = replyingTo ? { id: replyingTo.id, senderId: replyingTo.senderId, senderName: replyingTo.sender?.fullName ?? 'Unknown', content: replyingTo.content, type: replyingTo.type as 'text' | 'image', fileUrl: replyingTo.fileUrl, fileName: replyingTo.fileName } : undefined;
    setInput('');
    setReplyingTo(null);
    sendMutation.mutate({ content: text, replyTo: rp });
  };

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        chatName={chatName}
        otherTyping={otherTyping}
        chatOnline={chatOnline}
        isDM={isDM}
        muted={muted}
        onBack={() => navigate(-1)}
        onSearchToggle={() => {
          if (showSearch) { setSearchQuery(''); setShowSearch(false); }
          else { setShowSearch(true); }
        }}
        onToggleMute={handleToggleMute}
        onBlockClick={() => setBlockConfirmOpen(true)}
        onReportClick={() => setReportConfirmOpen(true)}
        onGroupInfoClick={() => setGroupInfoOpen(true)}
      />

      {showSearch && (
        <ChatSearchBar
          searchQuery={searchQuery}
          searchMatches={searchMatches}
          activeMatchIndex={activeMatchIndex}
          inputRef={searchInputRef as React.RefObject<HTMLInputElement>}
          onSearchChange={setSearchQuery}
          onPreviousMatch={() => {
            const next = (activeMatchIndex - 1 + searchMatches.length) % Math.max(searchMatches.length, 1);
            setActiveMatchIndex(next);
            scrollToMatch(next);
          }}
          onNextMatch={() => {
            const next = (activeMatchIndex + 1) % Math.max(searchMatches.length, 1);
            setActiveMatchIndex(next);
            scrollToMatch(next);
          }}
          onClear={() => { setSearchQuery(''); setSearchMatches([]); setActiveMatchIndex(0); }}
        />
      )}

      <PinnedBanner pinnedMessages={pinnedMessages} onUnpin={(id) => unpinMutation.mutate(id)} />

      <MessageList
        filteredMessages={filteredMessages}
        searchQuery={searchQuery}
        isPending={isPending}
        isError={isError}
        error={error}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        hasActiveSearch={hasActiveSearch}
        searchMatchIds={searchMatchIds}
        activeMatchIndex={activeMatchIndex}
        otherTyping={otherTyping}
        currentUserId={currentUser?.id}
        onRetry={() => refetch()}
        scrollTriggerRef={scrollTriggerRef as React.RefObject<HTMLDivElement>}
        messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
        onContextMenu={(msg, x, y) => setContextMenu({ msg, x, y })}
        onLongPressStart={handleLongPressStart}
        onLongPressMove={handleLongPressMove}
        onLongPressEnd={handleLongPressEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickImage={(url) => setLightboxUrl(url)}
        onToggleReaction={handleToggleReaction}
        onReactionPickerOpen={handleReactionPickerOpen}
      />

      <ChatInput
        input={input}
        replyingTo={replyingTo}
        imagePreview={imagePreview}
        selectedImage={selectedImage}
        selectedFile={selectedFile}
        showEmojiPicker={showEmojiPicker}
        onInputChange={setInput}
        onSend={handleSend}
        onSendImage={handleSendImage}
        onCancelReply={handleCancelReply}
        onCancelImage={handleCancelImage}
        onImageSelect={handleImageSelect}
        onFileSelect={handleFileSelect}
        onEmojiToggle={() => setShowEmojiPicker((v) => !v)}
        onEmojiClick={handleEmojiClick}
        emojiPickerRef={emojiPickerRef as React.RefObject<HTMLDivElement>}
        emojiToggleRef={emojiToggleRef as React.RefObject<HTMLButtonElement>}
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        imageInputRef={imageInputRef as React.RefObject<HTMLInputElement>}
      />

      {reactingMsgId && reactionPickerRect && (
        <ReactionPicker
          onReact={handleReactionPickerSelect}
          onClose={handleReactionPickerClose}
          anchorRect={reactionPickerRect}
        />
      )}

      <ChatOverlays
        deleteTarget={deleteTarget}
        deleteLoading={deleteLoading}
        contextMenu={contextMenu}
        forwardTarget={forwardTarget}
        forwardSearch={forwardSearch}
        forwardableConversations={forwardableConversations}
        lightboxUrl={lightboxUrl}
        blockConfirmOpen={blockConfirmOpen}
        reportConfirmOpen={reportConfirmOpen}
        groupInfoOpen={groupInfoOpen}
        readReceiptTarget={readReceiptTarget}
        group={group ?? null}
        chatName={chatName}
        chatId={chatId}
        currentUserId={currentUser?.id}
        onCloseDelete={() => { if (!deleteLoading) setDeleteTarget(null); }}
        onDeleteMessage={handleDeleteMessage}
        onCloseContextMenu={() => setContextMenu(null)}
        onContextMenuAction={handleContextMenuAction}
        onCloseForward={() => { setForwardTarget(null); setForwardSearch(''); }}
        onForwardSearchChange={setForwardSearch}
        onForward={handleForward}
        onCloseLightbox={() => setLightboxUrl(null)}
        onCloseBlock={() => setBlockConfirmOpen(false)}
        onBlock={handleBlock}
        onCloseReport={() => setReportConfirmOpen(false)}
        onReport={handleReport}
        onCloseGroupInfo={() => setGroupInfoOpen(false)}
        onCloseReadReceipts={() => setReadReceiptTarget(null)}
      />
    </div>
  );
}
