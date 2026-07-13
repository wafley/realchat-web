import { type RefObject, type PointerEvent, type TouchEvent } from 'react';
import { Loader2, AlertCircle, RefreshCw, MessageSquareText } from 'lucide-react';
import type { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { formatDateSeparator, getDateKey } from '@/lib/chatHelpers';

interface MessageListProps {
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
  otherTyping: boolean;
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
  otherTyping,
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
  return (
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
            const name = isOwn ? 'You' : (msg.sender?.fullName ?? 'Unknown');
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
  );
}
