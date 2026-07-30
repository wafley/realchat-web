import { useState, useRef, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Message } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTypingStore } from '@/store/typingStore';
import { getMessages, getConversations, DM_USER_MAP } from '@/services/chat';
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

  const chatName = convFromList?.name || location.state?.name || 'Chat';
  const chatOnline = location.state?.online ?? convFromList?.online ?? true;
  const chatLastSeen = location.state?.lastSeen ?? convFromList?.lastSeen ?? null;
  const memberCount = location.state?.members ?? null;
  const otherUserId = isDM && userId ? (DM_USER_MAP[userId] ?? undefined) : undefined;

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

  const filteredMessages = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
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
