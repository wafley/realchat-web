import { memo, useState, type PointerEvent, type TouchEvent } from 'react';
import { Pin, Check, CheckCheck, Clock, FileText, SmilePlus, CheckSquare, Square, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message } from '@/types';
import { formatTime, formatFileSize, highlightText } from '@/lib/chatHelpers';

interface MessageBubbleProps {
  msg: Message;
  isOwn: boolean;
  name: string;
  searchQuery: string;
  hasActiveSearch: boolean;
  searchMatchIds: string[];
  activeMatchIndex: number;
  currentUserId: string | undefined;
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

function MessageBubbleComp({
  msg,
  isOwn,
  name,
  searchQuery,
  hasActiveSearch,
  searchMatchIds,
  activeMatchIndex,
  currentUserId,
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
}: MessageBubbleProps) {
  const isSelected = selectedIds.includes(msg.id);
  const inSelectionMode = selectedIds.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-muted/50 px-4 py-1 text-[11px] italic text-muted-foreground lg:text-xs">
          {msg.content}
        </span>
      </div>
    );
  }

  const reactionMap = new Map<string, { count: number; hasMine: boolean }>();
  if (msg.reactions) {
    for (const r of msg.reactions) {
      const entry = reactionMap.get(r.emoji) ?? { count: 0, hasMine: false };
      entry.count++;
      if (r.userId === currentUserId) entry.hasMine = true;
      reactionMap.set(r.emoji, entry);
    }
  }

  const showReadMore = (msg.content || '').length > 500;
  const displayedContent = showReadMore && !isExpanded 
    ? (msg.content || '').slice(0, 500) + '...'
    : (msg.content || '');

  const renderTimestamp = (isOverlay = false) => {
    return (
      <span className={`inline-flex items-center gap-1 text-[9px] lg:text-[10px] select-none ${
        isOverlay 
          ? 'text-white bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-[1px] absolute bottom-2 right-2 font-medium' 
          : `${isOwn ? 'text-white/60' : 'text-muted-foreground/75'} absolute bottom-1 right-2`
      }`}>
        {msg.edited && <span className="italic text-[8px] lg:text-[9px]">edited</span>}
        {formatTime(msg.createdAt)}
        {isOwn && msg.status && (
          msg.status === 'sending' ? <Clock size={10} className={`${isOverlay ? 'text-white' : isOwn ? 'text-white/60' : 'text-muted-foreground/75'} lg:size-3`} />
          : msg.status === 'sent' ? <Check size={10} className="lg:size-3" />
          : msg.status === 'delivered' ? <CheckCheck size={10} className="lg:size-3" />
          : <CheckCheck size={10} className="text-accent lg:size-3" />
        )}
      </span>
    );
  };

  return (
    <div
      className={`flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${inSelectionMode && !isSelected ? 'opacity-50' : ''}`}
      onClick={() => { if (inSelectionMode) toggleSelect(msg.id); }}
    >
      {inSelectionMode ? (
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelect(msg.id); }}
          className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center"
        >
          {isSelected ? <CheckSquare size={18} className="text-accent" /> : <Square size={18} className="text-muted-foreground" />}
        </button>
      ) : !isOwn ? (
        <Avatar className="mt-1 h-8 w-8 shrink-0 lg:h-10 lg:w-10">
          <AvatarFallback className="text-xs lg:text-sm">
            <User size={14} />
          </AvatarFallback>
        </Avatar>
      ) : null}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : ''} flex flex-col min-w-0`}>
        {!isOwn && (
          <p className="mb-1 text-xs font-medium text-muted-foreground lg:text-sm">
            {name}
          </p>
        )}
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            let x = e.clientX;
            let y = e.clientY;
            const menuW = 180;
            const menuH = 200;
            if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
            if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
            if (x < 8) x = 8;
            if (y < 8) y = 8;
            onContextMenu(msg, x, y);
          }}
          onPointerDown={(e) => onLongPressStart(msg, e)}
          onPointerMove={onLongPressMove}
          onPointerUp={onLongPressEnd}
          onPointerCancel={onLongPressEnd}
          onTouchStart={(e) => onTouchStart(msg, e)}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          id={`msg-${msg.id}`}
          className={`cursor-pointer overflow-hidden relative ${
            msg.type === 'image' || msg.type === 'video' ? 'rounded-2xl' : 'rounded-2xl px-2.5 py-1.5 text-sm lg:px-3 lg:py-2 lg:text-base'
          } ${isOwn
            ? 'bg-chat-outgoing-bg text-chat-outgoing-foreground rounded-br-md border border-white/10'
            : 'bg-chat-incoming-bg text-chat-incoming-foreground rounded-bl-md border border-black/5'
          } ${hasActiveSearch && searchMatchIds.includes(msg.id) && searchMatchIds[activeMatchIndex] === msg.id ? 'ring-2 ring-accent' : ''} ${isSelected ? 'ring-2 ring-accent' : ''}`}
        >
          {msg.replyTo && (
            <div className={`mb-1.5 rounded-lg border-l-4 px-2.5 py-1.5 text-xs ${isOwn ? 'border-white/40 bg-white/10' : 'border-black/30 bg-black/8'}`}>
              <p className="text-[11px] font-semibold text-foreground/90 lg:text-xs">{msg.replyTo.senderName}</p>
              <p className="truncate text-foreground/70">{msg.replyTo.type === 'image' ? '📷 Photo' : msg.replyTo.content}</p>
            </div>
          )}
          {msg.type === 'image' && msg.fileUrl ? (
            <div className="flex flex-col">
              {msg.content ? (
                <>
                  <div className="overflow-hidden">
                    <img
                      src={msg.fileUrl}
                      alt={msg.content || 'Image'}
                      className="block w-full cursor-pointer object-cover transition-transform duration-200 hover:scale-[1.03]"
                      style={{ maxHeight: '300px' }}
                      onClick={(e) => { e.stopPropagation(); onClickImage(msg.fileUrl!); }}
                      loading="lazy"
                    />
                  </div>
                  <div className="mx-4 h-px bg-black/10" />
                  <p className="px-3 pb-5 pt-1.5 pr-14 text-sm lg:px-4 lg:pb-6 lg:pt-2 lg:text-base whitespace-pre-wrap break-words">
                    {highlightText(displayedContent, searchQuery)}
                    {showReadMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(!isExpanded);
                        }}
                        className="text-primary font-semibold hover:underline cursor-pointer ml-1 inline-block"
                      >
                        {isExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </p>
                </>
              ) : (
                <div className="relative overflow-hidden">
                  <img
                    src={msg.fileUrl}
                    alt="Image"
                    className="block w-full cursor-pointer object-cover transition-transform duration-200 hover:scale-[1.03]"
                    style={{ maxHeight: '300px' }}
                    onClick={(e) => { e.stopPropagation(); onClickImage(msg.fileUrl!); }}
                    loading="lazy"
                  />
                  {renderTimestamp(true)}
                </div>
              )}
            </div>
          ) : msg.type === 'video' && msg.fileUrl ? (
            <div className="flex flex-col">
              {msg.content ? (
                <>
                  <video
                    src={msg.fileUrl}
                    controls
                    className="block w-full rounded-t-2xl"
                    style={{ maxHeight: '400px' }}
                    preload="metadata"
                  />
                  <p className="px-3 pb-5 pt-1.5 pr-14 text-sm lg:px-4 lg:pb-6 lg:pt-2 lg:text-base whitespace-pre-wrap break-words">
                    {highlightText(displayedContent, searchQuery)}
                    {showReadMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(!isExpanded);
                        }}
                        className="text-primary font-semibold hover:underline cursor-pointer ml-1 inline-block"
                      >
                        {isExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </p>
                </>
              ) : (
                <div className="relative">
                  <video
                    src={msg.fileUrl}
                    controls
                    className="block w-full rounded-2xl"
                    style={{ maxHeight: '400px' }}
                    preload="metadata"
                  />
                  {renderTimestamp(true)}
                </div>
              )}
            </div>
          ) : msg.fileUrl ? (
            <div className="pb-5">
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-2 transition-colors hover:bg-card"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <FileText size={18} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{msg.fileName || 'Document'}</p>
                  {msg.fileSize && (
                    <p className="text-xs text-muted-foreground">{formatFileSize(msg.fileSize)}</p>
                  )}
                </div>
              </a>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words pr-14 pb-0.5">
              {highlightText(displayedContent, searchQuery)}
              {showReadMore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-primary font-semibold hover:underline cursor-pointer ml-1 inline-block"
                >
                  {isExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </p>
          )}
          {msg.isPinned && !hasActiveSearch && (
            <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Pin size={10} /> Pinned
            </span>
          )}

          {/* Timestamps inside the bubble */}
          {msg.type === 'image' || msg.type === 'video' ? (
            msg.content && renderTimestamp(false)
          ) : (
            renderTimestamp(false)
          )}
        </div>
        {reactionMap.size > 0 && (
          <div className={`-mb-1 mt-1 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : ''}`}>
            {Array.from(reactionMap.entries()).map(([emoji, { count, hasMine }]) => (
              <button
                key={emoji}
                onClick={() => onToggleReaction(msg.id, emoji)}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                  hasMine
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-card/50 text-muted-foreground hover:bg-accent/5'
                }`}
              >
                <span className="text-sm">{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
            <button
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                onReactionPickerOpen(msg.id, rect);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent/5"
            >
              <SmilePlus size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleComp);
