import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Message, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTypingStore } from '@/store/typingStore';
import { usePresenceStore } from '@/store/presenceStore';
import { getMessages, getConversations, getGroup, DM_USER_MAP } from '@/services/chat';
import { isChatCleared } from '@/lib/chatCleared';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

export function useChatState() {
  const { groupId, userId } = useParams();
  const location = useLocation();
  const currentUser = useAuthStore((s) => s.user);

  const [input, setInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<Message | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [reportConfirmOpen, setReportConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [readReceiptTarget, setReadReceiptTarget] = useState<Message | null>(null);
  const [reactingMsgId, setReactingMsgId] = useState<string | null>(null);
  const [reactionPickerRect, setReactionPickerRect] = useState<DOMRect | null>(null);
  const [muted, setMuted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

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
  const imageInputRef = useRef<HTMLInputElement>(null);

  const keyboardHeight = useKeyboardHeight();
  const isDM = location.pathname.startsWith('/dm/');
  const chatId = (isDM ? userId : groupId) || '';
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const convFromList = useMemo(
    () => conversations.find((c) => c.id === chatId),
    [conversations, chatId],
  );

  const { data: senderGroup } = useQuery({
    queryKey: ['group', chatId],
    queryFn: () => getGroup(chatId),
    enabled: !isDM && !!chatId,
  });

  useEffect(() => {
    setMuted(convFromList?.muted ?? false);
  }, [convFromList?.muted]);

  useEffect(() => {
    const onPinnedUpdated = (e: Event) => {
      const pinned = (e as CustomEvent<Message[]>).detail;
      setPinnedMessages(Array.isArray(pinned) ? pinned : []);
    };
    window.addEventListener('chat:pinned-updated', onPinnedUpdated);
    return () => window.removeEventListener('chat:pinned-updated', onPinnedUpdated);
  }, []);

  useEffect(() => {
    setInput('');
    setShowSearch(false);
    setSearchQuery('');
    setSelectedImage(null);
    setImagePreview(null);
    setShowEmojiPicker(false);
    setReplyingTo(null);
    setEditingMsg(null);
    setLightboxUrl(null);
    setContextMenu(null);
    setDeleteTarget(null);
    setForwardTarget(null);
    setForwardSearch('');
    setPinnedMessages([]);
    setSelectedFile(null);
    setGroupInfoOpen(false);
    setBlockConfirmOpen(false);
    setReportConfirmOpen(false);
    setClearConfirmOpen(false);
    setReadReceiptTarget(null);
    setReactingMsgId(null);
    setReactionPickerRect(null);
    setSelectedIds([]);
    setSearchMatches([]);
    setActiveMatchIndex(0);
    return () => {
      useTypingStore.getState().setTyping(chatId, false);
    };
  }, [chatId]);

  const chatName = convFromList?.name || location.state?.name || 'Chat';
  const otherUserId = isDM && userId ? (convFromList?.userId || DM_USER_MAP[userId]) : undefined;

  const resolveSenderName = useCallback(
    (senderId: string): string => {
      if (senderId === currentUser?.id) return currentUser?.fullName || 'You';
      if (!isDM) {
        const m = senderGroup?.members?.find((mem) => mem.userId === senderId);
        const name = m?.user?.fullName;
        if (name) return name;
      }
      if (isDM) return convFromList?.name || chatName;
      return 'Unknown';
    },
    [currentUser, isDM, senderGroup, convFromList, chatName],
  );
  const presence = usePresenceStore((s) => (otherUserId ? s.presenceMap[otherUserId] : undefined));
  const chatOnline = presence ? presence.isOnline : (convFromList?.online ?? location.state?.online ?? true);
  const chatLastSeen = presence ? presence.lastSeen : (convFromList?.lastSeen ?? location.state?.lastSeen ?? null);
  const memberCount = location.state?.members ?? null;

  const otherTyping = useTypingStore((s) => !!s.typingMap[chatId]);

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
    queryFn: ({ pageParam }) => getMessages(chatId, isDM, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.nextCursor) return lastPage.nextCursor;
      return undefined;
    },
    enabled: !!chatId,
  });

  const messages = useMemo(() => {
    if (!data?.pages) return [];
    const clearedAt = isChatCleared(chatId);
    const clearedMs = clearedAt ? new Date(clearedAt).getTime() : null;
    const raw = [...data.pages].reverse().flatMap((p) => p.data);
    const map = new Map<string, Message>();
    for (const msg of raw) {
      if (msg && msg.id && (!clearedMs || new Date(msg.createdAt).getTime() >= clearedMs)) {
        map.set(msg.id, msg);
      }
    }
    const unique = Array.from(map.values());
    unique.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
    return unique.map((m) => {
      const withSender: Message = m.sender?.fullName
        ? m
        : {
            ...m,
            sender: {
              ...(m.sender ?? ({} as Message['sender'])),
              id: m.sender?.id ?? m.senderId,
              fullName: resolveSenderName(m.senderId),
            } as User,
          };
      if (!withSender.replyTo?.id) return withSender;
      const target = map.get(withSender.replyTo.id);
      if (!target) {
        return { ...withSender, replyTo: { ...withSender.replyTo, senderName: 'Unknown', content: 'Message unavailable' } };
      }
      return {
        ...withSender,
        replyTo: {
          id: target.id,
          senderId: target.senderId,
          senderName: resolveSenderName(target.senderId),
          content: target.type === 'image' ? '📷 Photo' : target.content,
          type: target.type as 'text' | 'image',
          fileUrl: target.fileUrl,
          fileName: target.fileName,
        },
      };
    });
  }, [data, resolveSenderName]);

  const filteredMessages = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        (m.fileName ?? '').toLowerCase().includes(q),
    );
  }, [messages, showSearch, searchQuery]);

  const searchMatchIds = useMemo(() => filteredMessages.map((m) => m.id), [filteredMessages]);
  const hasActiveSearch = showSearch && searchQuery.trim().length > 0;

  return {
    // User
    currentUser,
    // Route params
    chatId,
    isDM,
    chatName,
    chatOnline,
    chatLastSeen,
    memberCount,
    otherUserId,
    // State
    input, setInput,
    showSearch, setShowSearch,
    searchQuery, setSearchQuery,
    selectedImage, setSelectedImage,
    imagePreview, setImagePreview,
    showEmojiPicker, setShowEmojiPicker,
    otherTyping,
    replyingTo, setReplyingTo,
    editingMsg, setEditingMsg,
    lightboxUrl, setLightboxUrl,
    contextMenu, setContextMenu,
    deleteTarget, setDeleteTarget,
    deleteLoading, setDeleteLoading,
    forwardTarget, setForwardTarget,
    forwardSearch, setForwardSearch,
    pinnedMessages, setPinnedMessages,
    selectedFile, setSelectedFile,
    groupInfoOpen, setGroupInfoOpen,
    blockConfirmOpen, setBlockConfirmOpen,
    reportConfirmOpen, setReportConfirmOpen,
    clearConfirmOpen, setClearConfirmOpen,
    readReceiptTarget, setReadReceiptTarget,
    reactingMsgId, setReactingMsgId,
    reactionPickerRect, setReactionPickerRect,
    muted, setMuted,
    selectedIds, setSelectedIds,
    searchMatches, setSearchMatches,
    activeMatchIndex, setActiveMatchIndex,
    // Refs
    typingTimerRef,
    typingDoneTimerRef,
    messagesEndRef,
    searchInputRef,
    fileInputRef,
    emojiPickerRef,
    emojiToggleRef,
    scrollTriggerRef,
    prevLastMsgIdRef,
    longPressTimerRef,
    longPressStartPosRef,
    imageInputRef,
    // Keyboard
    keyboardHeight,
    // Infinite query
    messages,
    filteredMessages,
    searchMatchIds,
    hasActiveSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
    refetch,
  };
}
