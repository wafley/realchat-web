import { useEffect, useCallback, useState, useRef } from 'react';
import { toast } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { markConversationAsSeen, muteConversation, unmuteConversation, blockUser, reportUser, searchUsers, saveLocalUnread } from '@/services/chat';
import { emitTypingStart, emitTypingStop } from '@/services/socket.service';
import { isSupportedImage, SUPPORTED_IMAGE_LABEL } from '@/utils/imageValidation';
import type { Message, ReplyTo } from '@/types';

function buildReplyTo(replyingTo: Message | null): ReplyTo | undefined {
  if (!replyingTo) return undefined;
  return {
    id: replyingTo.id,
    senderId: replyingTo.senderId,
    senderName: replyingTo.sender?.fullName ?? replyingTo.sender?.username ?? 'Unknown',
    content: replyingTo.content,
    type: replyingTo.type as 'text' | 'image',
    fileUrl: replyingTo.fileUrl,
    fileName: replyingTo.fileName,
  };
}

interface UseChatActionsProps {
  chatId: string;
  input: string;
  messages: Message[];
  showSearch: boolean;
  showEmojiPicker: boolean;
  replyingTo: Message | null;
  editingMsg: Message | null;
  lightboxUrl: string | null;
  contextMenu: { msg: Message; x: number; y: number } | null;
  deleteTarget: Message | null;
  forwardTarget: Message | null;
  groupInfoOpen: boolean;
  blockConfirmOpen: boolean;
  reportConfirmOpen: boolean;
  readReceiptTarget: Message | null;
  reactingMsgId: string | null;
  selectedIds: string[];
  searchMatchIds: string[];
  activeMatchIndex: number;
  searchQuery: string;
  chatName: string;
  otherUserId: string | undefined;
  selectedImage: File | null;
  selectedFile: File | null;
  replyingToForSend: Message | null;
  imagePreview: string | null;
  // Setters
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setShowSearch: (v: boolean) => void;
  setSearchQuery: (v: string) => void;
  setShowEmojiPicker: (v: boolean) => void;
  setReplyingTo: React.Dispatch<React.SetStateAction<Message | null>>;
  setEditingMsg: (msg: Message | null) => void;
  setLightboxUrl: (url: string | null) => void;
  setContextMenu: (menu: { msg: Message; x: number; y: number } | null) => void;
  setDeleteTarget: (msg: Message | null) => void;
  setForwardTarget: (msg: Message | null) => void;
  setForwardSearch: (v: string) => void;
  setGroupInfoOpen: (v: boolean) => void;
  setBlockConfirmOpen: (v: boolean) => void;
  setReportConfirmOpen: (v: boolean) => void;
  setReadReceiptTarget: (msg: Message | null) => void;
  setReactingMsgId: (id: string | null) => void;
  setReactionPickerRect: (rect: DOMRect | null) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSearchMatches: (matches: string[]) => void;
  setActiveMatchIndex: (i: number) => void;
  setMuted: (v: boolean) => void;
  setSelectedImage: React.Dispatch<React.SetStateAction<File | null>>;
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  // Refs
  typingTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  typingDoneTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  emojiToggleRef: React.RefObject<HTMLButtonElement | null>;
  scrollTriggerRef: React.RefObject<HTMLDivElement | null>;
  prevLastMsgIdRef: React.RefObject<string | null>;
  longPressTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  longPressStartPosRef: React.RefObject<{ x: number; y: number } | null>;
  // Mutations
  sendMutation: { mutate: (vars: { content: string; replyTo?: any }, options?: { onError?: () => void }) => void; isPending: boolean };
  sendImageMutation: { mutate: (vars: { file: File; caption: string; replyTo?: any; preview?: string | null }, options?: { onError?: () => void }) => void; isPending: boolean };
  sendFileMutation: { mutate: (vars: { file: File; caption: string; replyTo?: ReplyTo }, options?: { onError?: () => void }) => void; isPending: boolean };
  editMutation: { mutate: (vars: { msgId: string; content: string }) => void };
  deleteMutation: { mutate: (vars: { msgId: string; delForAll: boolean }) => void };
  pinMutation: { mutate: (msgId: string) => void };
  unpinMutation: { mutate: (msgId: string) => void };
  starMutation: { mutate: (msgId: string) => void };
  unstarMutation: { mutate: (msgId: string) => void };
  toggleReactionMutation: { mutate: (vars: { msgId: string; emoji: string }) => void };
  forwardMutation: { mutate: (vars: { targetChatId: string; msg: Message }) => void };
  refetchPinned: () => Promise<any>;
  setPinnedMessages: (msgs: Message[]) => void;
  // Infinite query
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function useChatActions(props: UseChatActionsProps) {
  const {
    chatId,
    input,
    messages,
    showSearch,
    showEmojiPicker,
    replyingTo,
    editingMsg,
    lightboxUrl,
    contextMenu,
    deleteTarget,
    forwardTarget,
    groupInfoOpen,
    blockConfirmOpen,
    reportConfirmOpen,
    readReceiptTarget,
    reactingMsgId,
    selectedIds,
    searchMatchIds,
    activeMatchIndex,
    searchQuery,
    chatName,
    otherUserId,
    selectedImage,
    selectedFile,
    imagePreview,
    setInput,
    setShowSearch,
    setSearchQuery,
    setShowEmojiPicker,
    setReplyingTo,
    setEditingMsg,
    setLightboxUrl,
    setContextMenu,
    setDeleteTarget,
    setForwardTarget,
    setForwardSearch,
    setGroupInfoOpen,
    setBlockConfirmOpen,
    setReportConfirmOpen,
    setReadReceiptTarget,
    setReactingMsgId,
    setReactionPickerRect,
    setSelectedIds,
    setSearchMatches,
    setActiveMatchIndex,
    setMuted,
    setSelectedImage,
    setImagePreview,
    setSelectedFile,
    typingTimerRef,
    typingDoneTimerRef,
    messagesEndRef,
    searchInputRef,
    emojiPickerRef,
    emojiToggleRef,
    scrollTriggerRef,
    prevLastMsgIdRef,
    longPressTimerRef,
    longPressStartPosRef,
    sendMutation,
    sendImageMutation,
    sendFileMutation,
    editMutation,
    deleteMutation,
    pinMutation,
    unpinMutation,
    starMutation,
    unstarMutation,
    toggleReactionMutation,
    forwardMutation,
    refetchPinned,
    setPinnedMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = props;

  const isInitialLoadRef = useRef(true);
  const ioCooldownRef = useRef(false);
  const typingActiveRef = useRef(false);
  const emittedReadIdsRef = useRef<Set<string>>(new Set());

  // --- Effects ---

  useEffect(() => {
    isInitialLoadRef.current = true;
    ioCooldownRef.current = false;
    prevLastMsgIdRef.current = null;
    typingActiveRef.current = false;
    emittedReadIdsRef.current = new Set();
  }, [chatId]);

  useEffect(() => {
    if (!hasActiveSearch()) {
      setSearchMatches([]);
      setActiveMatchIndex(0);
      return;
    }
    setSearchMatches(searchMatchIds);
    if (activeMatchIndex >= searchMatchIds.length) setActiveMatchIndex(0);
  }, [searchMatchIds, activeMatchIndex]);

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

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (typingActiveRef.current) {
      typingActiveRef.current = false;
      emitTypingStop(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    if (typingDoneTimerRef.current) clearTimeout(typingDoneTimerRef.current);
    if (!input) {
      stopTyping();
      return;
    }
    if (!typingActiveRef.current && !typingTimerRef.current) {
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null;
        typingActiveRef.current = true;
        emitTypingStart(chatId);
      }, 300);
    }
    typingDoneTimerRef.current = setTimeout(stopTyping, 10000);
    const handleBeforeUnload = () => stopTyping();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [input, chatId, stopTyping]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [chatId, stopTyping]);

  useEffect(() => {
    if (!chatId) return;
    queryClient.setQueryData<{ id: string; unread?: number }[]>(['conversations'], (prev) => {
      if (!prev) return prev;
      return prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c));
    });
    const convs = queryClient.getQueryData<{ id: string; unread?: number }[]>(['conversations']);
    if (convs) {
      saveLocalUnread(Object.fromEntries(convs.map((c) => [c.id, c.unread ?? 0])));
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    markConversationAsSeen(chatId);
  }, [chatId]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastId = messages[messages.length - 1]?.id;
    if (lastId && lastId !== prevLastMsgIdRef.current) {
      const el = messagesEndRef.current;
      if (el) {
        if (isInitialLoadRef.current) {
          const restored = sessionStorage.getItem(`scrollRestored-${chatId}`);
          if (restored) {
            sessionStorage.removeItem(`scrollRestored-${chatId}`);
            isInitialLoadRef.current = false;
            return;
          }
          el.scrollIntoView({ behavior: 'instant' });
          isInitialLoadRef.current = false;
        } else {
          const container = messagesEndRef.current?.parentElement?.parentElement;
          let nearBottom = true;
          if (container) {
            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            nearBottom = distanceFromBottom <= 200;
          }
          if (nearBottom) el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    prevLastMsgIdRef.current = lastId;
  }, [messages]);

  useEffect(() => {
    const el = scrollTriggerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isInitialLoadRef.current) return;

        if (!entry.isIntersecting) {
          ioCooldownRef.current = false;
          return;
        }

        if (!hasNextPage || isFetchingNextPage) return;

        const container = messagesEndRef.current?.parentElement?.parentElement;
        if (container) {
          if (container.scrollHeight <= container.clientHeight) return;
          if (container.scrollTop > 5) return;
        }

        if (ioCooldownRef.current) return;
        ioCooldownRef.current = true;
        fetchNextPage();
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      longPressStartPosRef.current = null;
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (typingDoneTimerRef.current) {
        clearTimeout(typingDoneTimerRef.current);
        typingDoneTimerRef.current = null;
      }
      typingActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (chatId)
      refetchPinned().then((r) => {
        if (r.data) setPinnedMessages(r.data);
      });
  }, [chatId, refetchPinned]);

  // --- Handlers ---

  const hasActiveSearch = useCallback(
    () => showSearch && searchQuery.length > 0,
    [showSearch, searchQuery],
  );

  const scrollToMatch = useCallback(
    (index: number) => {
      const el = document.getElementById(`msg-${searchMatchIds[index]}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [searchMatchIds],
  );

  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
          setSearchMatches([]);
          setActiveMatchIndex(0);
        }
        if (showEmojiPicker) setShowEmojiPicker(false);
        if (replyingTo) setReplyingTo(null);
        if (editingMsg) {
          setEditingMsg(null);
          setInput('');
        }
        if (lightboxUrl) setLightboxUrl(null);
        if (contextMenu) setContextMenu(null);
        if (deleteTarget) setDeleteTarget(null);
        if (forwardTarget) {
          setForwardTarget(null);
          setForwardSearch('');
        }
        if (groupInfoOpen) setGroupInfoOpen(false);
        if (blockConfirmOpen) setBlockConfirmOpen(false);
        if (reportConfirmOpen) setReportConfirmOpen(false);
        if (readReceiptTarget) setReadReceiptTarget(null);
        if (reactingMsgId) {
          setReactingMsgId(null);
          setReactionPickerRect(null);
        }
        if (selectedIds.length > 0) setSelectedIds([]);
      }
    },
    [
      showSearch,
      showEmojiPicker,
      replyingTo,
      lightboxUrl,
      contextMenu,
      deleteTarget,
      forwardTarget,
      groupInfoOpen,
      blockConfirmOpen,
      reportConfirmOpen,
      readReceiptTarget,
      reactingMsgId,
      selectedIds.length,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleEmojiClick = useCallback((emoji: string) => {
    setInput((prev) => prev + emoji);
  }, []);

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (isSupportedImage(file)) {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        toast.error(`Unsupported image format. Please upload ${SUPPORTED_IMAGE_LABEL}.`);
        setSelectedFile(null);
        setImagePreview(null);
      }
      e.target.value = '';
    },
    [imagePreview],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setSelectedFile(file);
      setImagePreview(null);
      e.target.value = '';
    },
    [imagePreview],
  );

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleSendImage = useCallback(() => {
    if (selectedImage) {
      const file = selectedImage;
      const caption = input.trim();
      const rp = buildReplyTo(replyingTo);
      const preview = imagePreview;
      if (sendImageMutation.isPending) return;
      setInput('');
      setReplyingTo(null);
      setSelectedImage(null);
      setImagePreview(null);
      sendImageMutation.mutate(
        { file, caption, replyTo: rp, preview },
        {
          onError: () => {
            setInput((prev) => prev || caption);
            setReplyingTo((prev) => prev ?? replyingTo);
            setSelectedImage((prev) => prev || file);
            setImagePreview((prev) => prev || preview);
          },
        },
      );
    } else if (selectedFile) {
      const file = selectedFile;
      const caption = input.trim();
      const rp = buildReplyTo(replyingTo);
      if (sendFileMutation.isPending) return;
      setInput('');
      setReplyingTo(null);
      setSelectedFile(null);
      sendFileMutation.mutate(
        { file, caption, replyTo: rp },
        {
          onError: () => {
            setInput((prev) => prev || caption);
            setReplyingTo((prev) => prev ?? replyingTo);
            setSelectedFile((prev) => prev || file);
          },
        },
      );
    }
  }, [selectedImage, selectedFile, input, replyingTo, imagePreview, sendImageMutation, sendFileMutation]);

  const handleCancelImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedFile(null);
  }, [imagePreview]);

  const handleLongPressStart = useCallback(
    (msg: Message, e: React.PointerEvent) => {
      longPressStartPosRef.current = { x: e.clientX, y: e.clientY };
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        longPressStartPosRef.current = null;
        if (navigator.vibrate) navigator.vibrate(50);
        const menuW = 180;
        const menuH = 200;
        let x = e.clientX;
        let y = e.clientY;
        if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
        if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
        if (x < 8) x = 8;
        if (y < 8) y = 8;
        setContextMenu({ msg, x, y });
        e.preventDefault();
      }, 500);
    },
    [],
  );

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartPosRef.current = null;
  }, []);

  const handleLongPressMove = useCallback(
    (e: React.PointerEvent) => {
      if (!longPressStartPosRef.current) return;
      const dx = e.clientX - longPressStartPosRef.current.x;
      const dy = e.clientY - longPressStartPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        handleLongPressEnd();
      }
    },
    [handleLongPressEnd],
  );

  const handleTouchStart = useCallback(
    (msg: Message, e: React.TouchEvent) => {
      const touch = e.touches[0];
      longPressStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        longPressStartPosRef.current = null;
        if (navigator.vibrate) navigator.vibrate(50);
        const menuW = 180;
        const menuH = 200;
        let x = touch.clientX;
        let y = touch.clientY;
        if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
        if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
        if (x < 8) x = 8;
        if (y < 8) y = 8;
        setContextMenu({ msg, x, y });
      }, 500);
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!longPressStartPosRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - longPressStartPosRef.current.x;
      const dy = touch.clientY - longPressStartPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        handleLongPressEnd();
      }
    },
    [handleLongPressEnd],
  );

  const handleTouchEnd = useCallback(() => {
    handleLongPressEnd();
  }, [handleLongPressEnd]);

  const handleContextMenuAction = useCallback(
    (action: string) => {
      if (!contextMenu) return;
      const msg = contextMenu.msg;
      setContextMenu(null);
      switch (action) {
        case 'edit':
          setEditingMsg(msg);
          setInput(msg.content);
          break;
        case 'copy':
          navigator.clipboard.writeText(msg.content);
          toast.success('Copied to clipboard');
          break;
        case 'reply':
          setReplyingTo(msg);
          break;
        case 'select':
          setSelectedIds([msg.id]);
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
        case 'star':
          starMutation.mutate(msg.id);
          break;
        case 'unstar':
          unstarMutation.mutate(msg.id);
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
    },
    [contextMenu],
  );

  const handleDeleteMessage = useCallback(
    (delForAll: boolean) => {
      if (!deleteTarget) return;
      deleteMutation.mutate({ msgId: deleteTarget.id, delForAll });
    },
    [deleteTarget, deleteMutation],
  );

  const handleBlock = useCallback(async () => {
    try {
      const target = otherUserId ?? chatId;
      await blockUser(target);
      setBlockConfirmOpen(false);
      toast.success(`${chatName} has been blocked`);
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch {
      toast.error('Failed to block user');
    }
  }, [chatId, chatName, otherUserId]);

  const handleReport = useCallback(async () => {
    try {
      const target = otherUserId ?? chatId;
      await reportUser(target);
      setReportConfirmOpen(false);
      toast.success('Report submitted');
    } catch {
      toast.error('Failed to submit report');
    }
  }, [chatId, otherUserId]);

  const handleToggleReaction = useCallback(
    (msgId: string, emoji: string) => {
      toggleReactionMutation.mutate({ msgId, emoji });
    },
    [toggleReactionMutation],
  );

  const handleReactionPickerOpen = useCallback((msgId: string, rect: DOMRect) => {
    setReactingMsgId(msgId);
    setReactionPickerRect(rect);
  }, []);

  const handleReactionPickerClose = useCallback(() => {
    setReactingMsgId(null);
    setReactionPickerRect(null);
  }, []);

  const handleReactionPickerSelect = useCallback(
    (emoji: string) => {
      if (reactingMsgId) {
        toggleReactionMutation.mutate({ msgId: reactingMsgId, emoji });
      }
      handleReactionPickerClose();
    },
    [reactingMsgId, toggleReactionMutation, handleReactionPickerClose],
  );

  const toggleSelect = useCallback((msgId: string) => {
    setSelectedIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId],
    );
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      const target = messages.find((m) => m.id === id);
      if (target && !target.isDeleted) deleteMutation.mutate({ msgId: id, delForAll: false });
    });
    setSelectedIds([]);
  }, [selectedIds, messages, deleteMutation]);

  const [bulkForwardMessages, setBulkForwardMessages] = useState<Message[]>([]);

  const handleBulkForward = useCallback(() => {
    if (selectedIds.length === 0) return;
    const msgs = messages.filter((m) => selectedIds.includes(m.id) && !m.isDeleted);
    if (msgs.length === 1) {
      setForwardTarget(msgs[0]);
    } else if (msgs.length > 1) {
      setBulkForwardMessages(msgs);
      setForwardTarget(msgs[0]);
    }
  }, [selectedIds, messages]);

  const handleForward = useCallback(
    (targetChatId: string, msg: Message) => {
      if (bulkForwardMessages.length > 0) {
        bulkForwardMessages.forEach((m) => forwardMutation.mutate({ targetChatId, msg: m }));
        setBulkForwardMessages([]);
        setSelectedIds([]);
      } else {
        forwardMutation.mutate({ targetChatId, msg });
      }
    },
    [bulkForwardMessages, forwardMutation, setSelectedIds],
  );

    // Dialog mute (checklist 2.1): 'unmute' | 'forever' | ISO date string (durasi sampai waktu tertentu).
  const handleMute = useCallback(async (option: 'unmute' | 'forever' | string) => {
    if (option === 'unmute') {
      try {
        await unmuteConversation(chatId);
        setMuted(false);
        toast('Notifications unmuted');
      } catch {
        toast.error('Failed to unmute conversation');
      }
      return;
    }

    setMuted(true);
    try {
      await muteConversation(chatId, option === 'forever' ? undefined : option);
      toast('Notifications muted');
    } catch {
      setMuted(false);
      toast.error('Failed to update mute setting');
    }
  }, [chatId, setMuted]);

  const handleUpdateEdit = useCallback(() => {
    const text = input.trim();
    if (!text || !editingMsg) return;
    editMutation.mutate({ msgId: editingMsg.id, content: text });
  }, [input, editingMsg, editMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditingMsg(null);
    setInput('');
  }, []);

  const handleSend = useCallback(() => {
    if (selectedImage || selectedFile) {
      handleSendImage();
      return;
    }
    const text = input.trim();
    if (!text) return;
    if (sendMutation.isPending) return;
    const rp = buildReplyTo(replyingTo);
    setInput('');
    setReplyingTo(null);
    sendMutation.mutate(
      { content: text, replyTo: rp },
      {
        onError: () => {
          setInput((prev) => prev || text);
          setReplyingTo((prev) => prev ?? replyingTo);
        },
      },
    );
  }, [selectedImage, selectedFile, input, replyingTo, sendMutation, handleSendImage]);

  const handleSearchUsers = useCallback(async (query: string) => {
    return searchUsers(query);
  }, []);

  return {
    // Handlers
    handleKeyDown,
    handleEmojiClick,
    handleImageSelect,
    handleFileSelect,
    handleCancelReply,
    handleSendImage,
    handleCancelImage,
    handleLongPressStart,
    handleLongPressEnd,
    handleLongPressMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContextMenuAction,
    handleDeleteMessage,
    handleForward,
    handleBlock,
    handleReport,
    handleToggleReaction,
    handleReactionPickerOpen,
    handleReactionPickerClose,
    handleReactionPickerSelect,
    toggleSelect,
    handleBulkDelete,
    handleBulkForward,
    handleMute,
    handleUpdateEdit,
    handleCancelEdit,
    handleSend,
    handleSearchUsers,
    scrollToMatch,
  };
}
