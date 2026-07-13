import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { ArrowLeft, Search, Send, X, Loader2, Check, CheckCheck, Clock, AlertCircle, RefreshCw, MessageSquareText, ImagePlus, Smile, Ellipsis } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message, MessageStatus, PaginatedResponse, ReplyTo } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useTypingStore } from '@/store/typingStore';
import { queryClient } from '@/lib/queryClient';
import { getMessages, sendMessage, sendImageMessage, markConversationAsRead } from '@/services/chat';
import EmojiPicker from 'emoji-picker-react';

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDateSeparator(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ChatRoom() {
  const { groupId, userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const [input, setInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
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
  });

  const sendImageMutation = useMutation({
    mutationFn: ({ file, caption, replyTo: rp }: { file: File; caption: string; replyTo?: ReplyTo }) => sendImageMessage(chatId, file, isDM, caption || undefined, rp),
    onSuccess(r) { onMessageSent(r); },
  });

  const filteredMessages = showSearch && searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : messages;

  const handleKeyDown = useCallback((e: globalThis.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showSearch) { setShowSearch(false); setSearchQuery(''); }
      if (showEmojiPicker) setShowEmojiPicker(false);
      if (replyingTo) setReplyingTo(null);
      if (lightboxUrl) setLightboxUrl(null);
    }
  }, [showSearch, showEmojiPicker, replyingTo, lightboxUrl]);

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

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setInput((prev) => prev + emojiData.emoji);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleReplyClick = (msg: Message) => {
    if (showEmojiPicker) setShowEmojiPicker(false);
    setReplyingTo(msg);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSendImage = () => {
    if (!selectedImage) return;
    const file = selectedImage;
    const caption = input.trim();
    const rp = replyingTo ? { id: replyingTo.id, senderId: replyingTo.senderId, senderName: replyingTo.sender?.fullName ?? 'Unknown', content: replyingTo.content, type: replyingTo.type as 'text' | 'image', fileUrl: replyingTo.fileUrl, fileName: replyingTo.fileName } : undefined;
    setSelectedImage(null);
    setImagePreview(null);
    setInput('');
    setReplyingTo(null);
    sendImageMutation.mutate({ file, caption, replyTo: rp });
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const rp = replyingTo ? { id: replyingTo.id, senderId: replyingTo.senderId, senderName: replyingTo.sender?.fullName ?? 'Unknown', content: replyingTo.content, type: replyingTo.type as 'text' | 'image', fileUrl: replyingTo.fileUrl, fileName: replyingTo.fileName } : undefined;
    setInput('');
    setReplyingTo(null);
    sendMutation.mutate({ content: text, replyTo: rp });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back to chats"
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-foreground lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar className="h-9 w-9 lg:h-11 lg:w-11">
          <AvatarFallback className="lg:text-base">{chatName.charAt(0)}</AvatarFallback>
        </Avatar>
          <div className="flex-1">
            <h2 className="truncate text-sm font-semibold text-foreground lg:text-base">{chatName}</h2>
            {otherTyping ? (
              <p className="flex items-center gap-1 text-xs text-accent">
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
                </span>
                typing
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{chatOnline ? 'Online' : 'Offline'}</p>
            )}
          </div>
        <button
          onClick={() => {
            if (showSearch) { setSearchQuery(''); setShowSearch(false); }
            else { setShowSearch(true); }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:h-10 lg:w-10"
        >
          <Search size={18} className="lg:size-5" />
        </button>
      </div>

      {showSearch && (
        <div className="border-b border-border bg-sidebar px-4 py-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-input py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-chat-tile-overlay px-4 py-4">
        {isPending ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <AlertCircle size={48} className="mb-3 text-destructive/60" />
            <p className="text-sm font-medium text-foreground lg:text-base">Failed to load messages</p>
            <p className="mt-1 text-xs text-muted-foreground lg:text-sm">{error?.message || 'Something went wrong'}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquareText size={48} className="mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground lg:text-base">
              {showSearch && searchQuery ? 'No messages found' : 'No messages yet'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
              {showSearch && searchQuery ? `No results for "${searchQuery}"` : 'Start a conversation!'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {hasNextPage && (
              <div ref={scrollTriggerRef} className="flex justify-center py-2">
                {isFetchingNextPage && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
              </div>
            )}
            {filteredMessages.map((msg, idx) => {
              const isOwn = msg.sender?.id === currentUser?.id || msg.senderId === currentUser?.id;
              const name = isOwn ? 'You' : (msg.sender?.fullName ?? 'Unknown');
              const isNew = idx >= filteredMessages.length - (sendMutation.isPending ? 1 : 0);
              const prevDateKey = idx > 0 ? getDateKey(filteredMessages[idx - 1].createdAt) : null;
              const currDateKey = getDateKey(msg.createdAt);
              const showDateSeparator = prevDateKey !== currDateKey;
              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex justify-center py-1">
                      <span className="rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border lg:text-xs">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${isNew ? 'animate-[fade-in-up_0.3s_ease-out]' : ''}`}
                  >
                  {!isOwn && (
                    <Avatar className="mt-1 h-8 w-8 shrink-0 lg:h-10 lg:w-10">
                      <AvatarFallback className="text-xs lg:text-sm">
                        {name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                    {!isOwn && (
                      <p className="mb-1 text-xs font-medium text-muted-foreground lg:text-sm">
                        {name}
                      </p>
                    )}
                  <div
                    onClick={() => handleReplyClick(msg)}
                    className={`cursor-pointer overflow-hidden ${
                      msg.type === 'image' ? 'rounded-2xl' : 'rounded-2xl px-3 py-1.5 text-sm lg:px-4 lg:py-2 lg:text-base'
                    } ${isOwn
                      ? 'bg-chat-outgoing-bg text-chat-outgoing-foreground rounded-br-md border border-white/10'
                      : 'bg-chat-incoming-bg text-chat-incoming-foreground rounded-bl-md border border-black/5'
                    }`}
                  >
                    {msg.replyTo && (
                      <div className={`mb-2 rounded-lg border-l-4 px-3 py-2 text-xs ${isOwn ? 'border-white/30 bg-white/5' : 'border-black/20 bg-black/5'}`}>
                        <p className="text-[11px] font-semibold text-muted-foreground lg:text-xs">{msg.replyTo.senderName}</p>
                        <p className="truncate text-muted-foreground/80">{msg.replyTo.type === 'image' ? '📷 Photo' : msg.replyTo.content}</p>
                      </div>
                    )}
                    {msg.type === 'image' && msg.fileUrl ? (
                      <div className="flex flex-col">
                        <div className="overflow-hidden">
                          <img
                            src={msg.fileUrl}
                            alt={msg.content || 'Image'}
                            className="block w-full cursor-pointer object-cover transition-transform duration-200 hover:scale-[1.03]"
                            style={{ maxHeight: '300px' }}
                            onClick={(e) => { e.stopPropagation(); setLightboxUrl(msg.fileUrl!); }}
                            loading="lazy"
                          />
                        </div>
                        {msg.content && (
                          <>
                            <div className="mx-4 h-px bg-black/10" />
                            <p className="px-4 pb-3 pt-2 text-sm lg:px-5 lg:pb-3 lg:pt-2.5 lg:text-base">
                              {msg.content}
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                    <p className={`mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground lg:text-xs ${isOwn ? 'justify-end' : ''}`}>
                      {formatTime(msg.createdAt)}
                      {isOwn && msg.status && (
                        msg.status === 'sending' ? <Clock size={12} className="text-muted-foreground lg:size-3.5" />
                        : msg.status === 'sent' ? <Check size={12} className="lg:size-3.5" />
                        : msg.status === 'delivered' ? <CheckCheck size={12} className="lg:size-3.5" />
                        : <CheckCheck size={12} className="text-accent lg:size-3.5" />
                      )}
                    </p>
                </div>
              </div>
            </div>
            );
          })}
              <div ref={messagesEndRef} />
            {otherTyping && (
              <div className="flex items-center gap-2 px-1 py-1">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-chat-incoming-bg px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-muted-foreground">typing</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative border-t border-border">
        {replyingTo && (
          <div className="mx-4 mb-2 mt-3 flex items-start gap-3 rounded-xl border border-border bg-card p-2 pr-1 shadow-sm">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div className="mt-0.5 h-full w-0.5 shrink-0 self-stretch rounded-full bg-accent/60" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-accent lg:text-sm">Replying to {replyingTo.sender?.fullName ?? 'Unknown'}</p>
                <p className="truncate text-xs text-muted-foreground lg:text-sm">{replyingTo.type === 'image' ? '📷 Photo' : replyingTo.content}</p>
              </div>
            </div>
            <button
              onClick={handleCancelReply}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 lg:h-8 lg:w-8"
            >
              <X size={14} className="lg:size-4" />
            </button>
          </div>
        )}
        {imagePreview && (
          <div className="mx-4 mb-2 mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-1 shadow-sm">
            <div className="relative shrink-0">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-14 w-14 rounded-lg object-cover ring-1 ring-border lg:h-16 lg:w-16"
              />
              <div className="absolute inset-0 rounded-lg ring-1 ring-black/10" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">Image</p>
              <p className="truncate text-xs text-muted-foreground">{selectedImage?.name}</p>
            </div>
            <button
              onClick={handleCancelImage}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-full left-0 right-0 z-50 mx-4 mb-1">
            <div className="overflow-hidden rounded-xl shadow-lg">
              <EmojiPicker onEmojiClick={handleEmojiClick} theme={theme as 'dark' | 'light'} />
            </div>
          </div>
        )}
        <div className="mx-4 mb-3 mt-3 flex items-center gap-2 rounded-xl border border-input bg-input px-3 py-1.5 lg:px-4 lg:py-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 lg:h-10 lg:w-10"
            type="button"
          >
            <ImagePlus size={18} className="lg:size-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            ref={emojiToggleRef}
            onClick={() => setShowEmojiPicker((v) => !v)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors lg:h-10 lg:w-10 ${showEmojiPicker ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'}`}
            type="button"
          >
            <Smile size={18} className="lg:size-5" />
          </button>
          <input
            type="text"
            placeholder={selectedImage ? 'Add a caption...' : 'Type a message...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (selectedImage) handleSendImage();
                else handleSend();
              }
            }}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none lg:text-base"
          />
          <button
            onClick={() => {
              if (selectedImage) handleSendImage();
              else handleSend();
            }}
            disabled={!input.trim() && !selectedImage}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10 disabled:opacity-40 lg:h-10 lg:w-10"
          >
            <Send size={18} className="lg:size-5" />
          </button>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            <X size={22} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
