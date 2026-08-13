import { type RefObject, type PointerEvent, type TouchEvent, useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw, MessageSquareText, ChevronDown } from 'lucide-react';
import type { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { formatDateSeparator, getDateKey } from '@/lib/chatHelpers';
import { formatTypingLabel } from '@/store/typingStore';

interface MessageListProps {
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
  typingNames: string[];
  currentUserId: string | undefined;
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
  onClickImage: (url: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onReactionPickerOpen: (msgId: string, rect: DOMRect) => void;
  selectedIds: string[];
  toggleSelect: (msgId: string) => void;
}

export default function MessageList({
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
  typingNames,
  currentUserId,
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
  onToggleReaction,
  onReactionPickerOpen,
  selectedIds,
  toggleSelect,
}: MessageListProps) {
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom > 200);
    sessionStorage.setItem(`scrollPos-${chatId}`, String(el.scrollTop));
  }, [chatId]);

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
  }, [filteredMessages, chatId]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex h-full flex-col overflow-y-auto bg-chat-tile-overlay px-4 py-4"
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
        <div className="space-y-1">
          {hasNextPage && (
            <div ref={scrollTriggerRef} className="flex justify-center py-2">
              {isFetchingNextPage && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
            </div>
          )}
          {filteredMessages.map((msg, idx) => {
            const isOwn = msg.sender?.id === currentUserId || msg.senderId === currentUserId;
            const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
            const isFirstInRun = !prevMsg || prevMsg.senderId !== msg.senderId;
            const name = isOwn || isDM || !isFirstInRun ? undefined : (msg.sender?.fullName ?? 'Unknown');
            const showAvatar = !isOwn && !isDM && isFirstInRun;
            const showSpacer = !isOwn && !isDM && !showAvatar;
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
                <MessageBubble
                  msg={msg}
                  isOwn={isOwn}
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
          {typingNames.length > 0 && (
            <div className="flex items-center gap-2 px-1 py-1">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-chat-incoming-bg px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-muted-foreground">{isDM ? 'typing...' : formatTypingLabel(typingNames)}</span>
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
