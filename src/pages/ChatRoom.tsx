import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { ArrowLeft, Search, Send, X, Loader2, Check, CheckCheck, Clock, AlertCircle, RefreshCw, MessageSquareText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message, MessageStatus, PaginatedResponse } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { queryClient } from '@/lib/queryClient';
import { getMessages, sendMessage, markConversationAsRead } from '@/services/chat';

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatRoom() {
  const { groupId, userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((s) => s.user);
  const [input, setInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(chatId, content, isDM),
    onSuccess: (newMsg) => {
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
      queryClient.setQueryData<{ id: string; lastMessage?: string; lastTime?: string }[]>(['conversations'], (prev) => {
        if (!prev) return prev;
        const updated = prev.map((c) =>
          c.id === chatId ? { ...c, lastMessage: newMsg.content, lastTime: 'now' } : c,
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
    },
  });

  const filteredMessages = showSearch && searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : messages;

  const handleKeyDown = useCallback((e: globalThis.KeyboardEvent) => {
    if (e.key === 'Escape' && showSearch) {
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [showSearch]);

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

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMutation.mutate(text);
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
          <p className="text-xs text-muted-foreground">{chatOnline ? 'Online' : 'Offline'}</p>
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
          <div className="space-y-3">
            {hasNextPage && (
              <div ref={scrollTriggerRef} className="flex justify-center py-2">
                {isFetchingNextPage && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
              </div>
            )}
            {filteredMessages.map((msg, idx) => {
              const isOwn = msg.sender?.id === currentUser?.id || msg.senderId === currentUser?.id;
              const name = isOwn ? 'You' : (msg.sender?.fullName ?? 'Unknown');
              const isNew = idx >= filteredMessages.length - (sendMutation.isPending ? 1 : 0);
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 lg:gap-4 ${isOwn ? 'flex-row-reverse' : ''} ${isNew ? 'animate-[fade-in-up_0.3s_ease-out]' : ''}`}
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
                      className={`rounded-2xl px-4 py-2 text-sm lg:px-5 lg:py-3 lg:text-base ${
                        isOwn
                          ? 'bg-chat-outgoing-bg text-chat-outgoing-foreground rounded-br-md'
                          : 'bg-chat-incoming-bg text-chat-incoming-foreground rounded-bl-md'
                      }`}
                    >
                      <p>{msg.content}</p>
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
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-input px-3 py-1.5 lg:px-4 lg:py-2.5">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none lg:text-base"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10 disabled:opacity-40 lg:h-10 lg:w-10"
          >
            <Send size={18} className="lg:size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
