import { type RefObject, type PointerEvent, type TouchEvent, useState, useRef, useCallback, useLayoutEffect, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw, MessageSquareText, ChevronDown } from 'lucide-react';
import type { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { formatDateSeparator, getDateKey } from '@/lib/chatHelpers';
import { getGroup } from '@/services/chat';
import { resolveFileUrl } from '@/lib/url';
import { useCustomNames } from '@/hooks/useCustomNames';
import { type TypingUser } from '@/store/typingStore';
import { setChatViewport } from '@/lib/chatViewport';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface MessageListProps {
  highlightedMsgId?: string | null;
  chatId: string;
  isDM: boolean;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  filteredMessages: Message[];
  hasActiveSearch: boolean;
  searchQuery: string;
  searchMatchIds: string[];
  activeMatchIndex: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  typingUsers: TypingUser[];
  currentUserId: string | undefined;
  peerAvatarUrl?: string | null;
  scrollTriggerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onRetry: () => void;
  onContextMenu: (msg: Message, x: number, y: number) => void;
  onLongPressStart: (msg: Message, e: PointerEvent) => void;
  onLongPressMove: (e: PointerEvent) => void;
  onLongPressEnd: () => void;
  onTouchStart: (msg: Message, e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
  onClickImage: (url: string, fileName?: string, mimeType?: string) => void;
  onReplyClick: (messageId: string) => void;
  onSenderClick: (userId: string) => void;
  onMentionClick?: (username: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onReactionPickerOpen: (msgId: string, rect: DOMRect) => void;
  selectedIds: string[];
  toggleSelect: (msgId: string) => void;
  newMessageAnchorId?: string | null;
  onNewMessagesSeen: () => void;
}

export default function MessageList({
  highlightedMsgId,
  chatId,
  isDM,
  isPending,
  isError,
  error,
  filteredMessages,
  hasActiveSearch,
  searchQuery,
  searchMatchIds,
  activeMatchIndex,
  hasNextPage,
  isFetchingNextPage,
  typingUsers,
  currentUserId,
  peerAvatarUrl,
  scrollTriggerRef,
  messagesEndRef,
  onRetry,
  onContextMenu,
  onLongPressStart,
  onLongPressMove,
  onLongPressEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClickImage,
  onReplyClick,
  onSenderClick,
  onMentionClick,
  onToggleReaction,
  onReactionPickerOpen,
  selectedIds,
  toggleSelect,
  newMessageAnchorId,
  onNewMessagesSeen,
}: MessageListProps) {
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Ref agar handler/effect tidak perlu re-register saat anchor/callback berubah.
  const anchorRef = useRef(newMessageAnchorId);
  anchorRef.current = newMessageAnchorId;
  const onSeenRef = useRef(onNewMessagesSeen);
  onSeenRef.current = onNewMessagesSeen;

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 200;
  }, []);

  const maybeClearNewMessages = useCallback(() => {
    if (!anchorRef.current) return;
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
    if (isNearBottom()) onSeenRef.current();
  }, [isNearBottom]);

  const { data: groupDetail } = useQuery({
    queryKey: ['group', chatId],
    queryFn: () => getGroup(chatId),
    enabled: !isDM,
    staleTime: 60_000,
  });

  const customNames = useCustomNames();

  const typingAvatars = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of groupDetail?.members ?? []) {
      if (!m?.userId) continue;
      const avatarUrl = m.user?.avatarUrl;
      if (typeof avatarUrl !== 'string' || !avatarUrl) continue;
      const resolved = resolveFileUrl(avatarUrl);
      if (resolved) map.set(m.userId, resolved);
    }
    return map;
  }, [groupDetail]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom <= 200;
    setShowScrollDown(!nearBottom);
    setChatViewport(chatId, nearBottom);
    if (nearBottom) maybeClearNewMessages();
    sessionStorage.setItem(`scrollPos-${chatId}`, String(el.scrollTop));
  }, [chatId, maybeClearNewMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesEndRef]);

  const scrollRestoredRef = useRef(false);
  const prevFirstIdRef = useRef<string | null>(null);
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    scrollRestoredRef.current = false;
    prevFirstIdRef.current = null;
    prevScrollHeightRef.current = 0;
  }, [chatId]);

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || filteredMessages.length === 0) return;

    if (!scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      const saved = sessionStorage.getItem(`scrollPos-${chatId}`);
      if (saved) {
        const pos = parseInt(saved, 10);
        if (pos > 0 && pos < el.scrollHeight) {
          el.scrollTop = pos;
          setChatViewport(chatId, el.scrollHeight - el.scrollTop - el.clientHeight <= 200);
        }
        sessionStorage.setItem(`scrollRestored-${chatId}`, '1');
        sessionStorage.removeItem(`scrollPos-${chatId}`);
        prevFirstIdRef.current = filteredMessages[0]?.id ?? null;
        prevScrollHeightRef.current = el.scrollHeight;
        return;
      }
    }

    const firstId = filteredMessages[0]?.id ?? null;
    const prevFirstId = prevFirstIdRef.current;
    if (prevFirstId && prevFirstId !== firstId) {
      const diff = el.scrollHeight - prevScrollHeightRef.current;
      if (diff > 0) {
        el.scrollTop += diff;
      }
    }

    prevFirstIdRef.current = firstId;
    prevScrollHeightRef.current = el.scrollHeight;
    setChatViewport(chatId, isNearBottom());
  }, [filteredMessages, chatId, isNearBottom]);

  // Kembali aktif ke tab saat posisi sudah di bottom → pill dianggap terlihat.
  useEffect(() => {
    const onActive = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        maybeClearNewMessages();
      }
    };
    document.addEventListener('visibilitychange', onActive);
    window.addEventListener('focus', onActive);
    return () => {
      document.removeEventListener('visibilitychange', onActive);
      window.removeEventListener('focus', onActive);
    };
  }, [maybeClearNewMessages]);

  return (
    <div className="relative flex min-h-0 min-w-0 w-full flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="chat-scroll flex h-full min-w-0 w-full flex-col overflow-x-hidden overflow-y-auto bg-chat-tile-overlay px-4 py-4"
      >
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
            onClick={onRetry}
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
            {hasActiveSearch && searchQuery ? 'No messages found' : 'No messages yet'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
            {hasActiveSearch && searchQuery ? `No results for "${searchQuery}"` : 'Start a conversation!'}
          </p>
        </div>
      ) : (
        <div className="w-full space-y-1">
          {hasNextPage && (
            <div ref={scrollTriggerRef} className="flex justify-center py-2">
              {isFetchingNextPage && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
            </div>
          )}
          {filteredMessages.map((msg, idx) => {
            const isOwn = msg.sender?.id === currentUserId || msg.senderId === currentUserId;
            const previousMessage = idx > 0 ? filteredMessages[idx - 1] : null;
            const prevDateKey = idx > 0 ? getDateKey(filteredMessages[idx - 1].createdAt) : null;
            const currDateKey = getDateKey(msg.createdAt);
            const showDateSeparator = prevDateKey !== currDateKey;
            const isFirstInRun =
              !previousMessage ||
              previousMessage.type === 'system' ||
              previousMessage.senderId !== msg.senderId ||
              showDateSeparator;
            const name = isOwn || isDM || !isFirstInRun
              ? undefined
              : (customNames.get(msg.senderId) || msg.sender?.fullName || 'Unknown');
            const showAvatar = !isOwn && !isDM && isFirstInRun;
            const showSpacer = !isOwn && !isDM && !showAvatar;
            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className="flex justify-center py-1">
                    <span className="rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border lg:text-xs">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                {msg.id === newMessageAnchorId && (
                  <div className="flex justify-center py-1">
                    <span className="rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border lg:text-xs">
                      New messages
                    </span>
                  </div>
                )}
                <MessageBubble
                  isHighlighted={highlightedMsgId === msg.id}
                  msg={msg}
                  isOwn={isOwn}
                  isFirstInRun={isFirstInRun}
                  name={name}
                  showAvatar={showAvatar}
                  showSpacer={showSpacer}
                  searchQuery={searchQuery}
                  hasActiveSearch={hasActiveSearch}
                  searchMatchIds={searchMatchIds}
                  activeMatchIndex={activeMatchIndex}
                  onContextMenu={onContextMenu}
                  onLongPressStart={onLongPressStart}
                  onLongPressMove={onLongPressMove}
                  onLongPressEnd={onLongPressEnd}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onClickImage={onClickImage}
                  onReplyClick={onReplyClick}
                  onSenderClick={onSenderClick}
                  onMentionClick={onMentionClick}
                  currentUserId={currentUserId}
                  onToggleReaction={onToggleReaction}
                  onReactionPickerOpen={onReactionPickerOpen}
                  selectedIds={selectedIds}
                  toggleSelect={toggleSelect}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          {typingUsers.length > 0 && (
            <div className="flex items-end gap-2 px-1 py-1">
              {isDM ? (
                <Avatar className="h-7 w-7 ring-2 ring-background">
                  {peerAvatarUrl && <AvatarImage src={resolveFileUrl(peerAvatarUrl)} alt={typingUsers[0]?.name} />}
                  <AvatarFallback className="bg-chat-incoming-bg text-[10px] text-muted-foreground">
                    {(typingUsers[0]?.name || '?').trim().charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex -space-x-2">
                  {typingUsers.slice(0, 3).map((t) => {
                    const avatar = typingAvatars.get(t.userId);
                    const initials = (t.name || '?').trim().charAt(0).toUpperCase() || '?';
                    return (
                      <Avatar key={t.userId} className="h-7 w-7 ring-2 ring-background">
                        {avatar && <AvatarImage src={avatar} alt={t.name} />}
                        <AvatarFallback className="bg-chat-incoming-bg text-[10px] text-muted-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-chat-incoming-bg px-3.5 py-2.5">
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: '150ms' }} />
                <span className="typing-dot" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      )}
      </div>
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-lg ring-1 ring-border transition-transform hover:scale-110"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={20} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
