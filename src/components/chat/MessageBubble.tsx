import { memo, useState, type PointerEvent, type TouchEvent } from 'react';
import { Pin, Star, Check, CheckCheck, Clock, FileText, SmilePlus, CheckSquare, Square, Ban } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Message } from '@/types';
import { formatTime, formatFileSize, highlightText } from '@/lib/chatHelpers';

interface MessageBubbleProps {
  isHighlighted?: boolean;
  msg: Message;
  isOwn: boolean;
  isFirstInRun?: boolean;
  name?: string;
  showAvatar: boolean;
  showSpacer: boolean;
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

const SENDER_COLORS = [
  'text-rose-400',
  'text-amber-400',
  'text-emerald-400',
  'text-sky-400',
  'text-indigo-400',
  'text-pink-400',
  'text-teal-400',
  'text-purple-400',
];

function getSenderColor(nameStr?: string) {
  if (!nameStr) return SENDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

function MessageBubbleComp({
  isHighlighted = false,
  msg,
  isOwn,
  isFirstInRun = true,
  name,
  showAvatar,
  showSpacer,
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

  const renderMeta = (isOverlay = false) => {
    return (
      <span className={`inline-flex items-center gap-1 select-none ${
        isOverlay
          ? 'text-[9px] lg:text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-[1px] absolute bottom-2 right-2 font-medium'
          : `pb-0.5 text-[9px] lg:text-[10px] ${isOwn ? 'text-white/60' : 'text-muted-foreground/75'}`
      }`}>
        {msg.isPinned && <Pin size={10} className={`shrink-0 ${isOverlay ? 'text-white' : 'text-foreground/80'}`} aria-label="Pinned" />}
        {msg.isStarred && <Star size={10} className="shrink-0 fill-current" aria-label="Starred" />}
        {formatTime(msg.createdAt)}
        {isOwn && msg.status && (
          (msg.status === 'pending' || msg.status === 'sending') ? <Clock size={13} className={`${isOverlay ? 'text-white' : 'text-white/70'} lg:size-3.5`} />
          : msg.status === 'sent' ? <Check size={13} className={`${isOverlay ? 'text-white' : 'text-chat-status-unread'} lg:size-3.5`} />
          : msg.status === 'delivered' ? <CheckCheck size={13} className={`${isOverlay ? 'text-white' : 'text-chat-status-unread'} lg:size-3.5`} />
          : msg.status === 'read' ? <CheckCheck size={13} strokeWidth={3} className={`${isOverlay ? 'text-white' : 'text-chat-status-read'} lg:size-3.5`} />
          : null
        )}
      </span>
    );
  };

  return (
    <div
      className={`flex items-start gap-2 transition-all duration-700 rounded-xl ${isOwn ? 'flex-row-reverse' : ''} ${inSelectionMode && !isSelected ? 'opacity-50' : ''} ${isHighlighted ? 'bg-accent/15 py-1 px-1.5' : ''}`}
      onClick={() => { if (inSelectionMode) toggleSelect(msg.id); }}
    >
      {inSelectionMode ? (
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelect(msg.id); }}
          className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center"
        >
          {isSelected ? <CheckSquare size={18} className="text-accent" /> : <Square size={18} className="text-muted-foreground" />}
        </button>
      ) : showAvatar ? (
        <Avatar className="mt-0.5 h-8 w-8 shrink-0 lg:h-9 lg:w-9">
          {msg.sender?.avatarUrl && (
            <AvatarImage src={msg.sender.avatarUrl} alt={msg.sender.fullName || name || 'User avatar'} />
          )}
          <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground lg:text-sm">
            {(msg.sender?.fullName || msg.sender?.username || name || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : showSpacer ? (
        <div className="mt-0.5 h-8 w-8 shrink-0 lg:h-9 lg:w-9" aria-hidden="true" />
      ) : null}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col min-w-0`}>
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu(msg, e.clientX, e.clientY);
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
          className={`cursor-pointer relative transition-all duration-700 ${
            msg.type === 'image' || msg.type === 'video' ? 'overflow-hidden rounded-2xl' : 'rounded-2xl px-3 py-2 text-sm lg:px-3.5 lg:py-2 lg:text-base'
          } ${isOwn
            ? `bg-chat-outgoing-bg text-chat-outgoing-foreground border border-white/10 ${isFirstInRun ? 'rounded-tr-xs' : ''}`
            : `bg-chat-incoming-bg text-chat-incoming-foreground border border-black/5 ${isFirstInRun ? 'rounded-tl-xs' : ''}`
          } ${hasActiveSearch && searchMatchIds.includes(msg.id) && searchMatchIds[activeMatchIndex] === msg.id ? 'ring-2 ring-accent' : ''} ${isSelected ? 'ring-2 ring-accent' : ''} ${isHighlighted ? 'ring-2 ring-accent shadow-lg shadow-accent/40 bg-accent/30 dark:bg-accent/40' : ''}`}
        >
          {!isOwn && name && (
            <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold">
              <span className={`truncate ${getSenderColor(name)}`}>
                ~ {name}
              </span>
              {msg.sender?.username && (
                <span className="shrink-0 text-[10px] font-normal opacity-60">
                  @{msg.sender.username}
                </span>
              )}
            </div>
          )}
          {msg.replyTo && (
            <div className={`mb-1.5 rounded-lg border-l-4 px-2.5 py-1.5 text-xs ${
              isOwn ? 'border-white/50 bg-black/20' : 'border-rose-500/80 bg-black/20 dark:bg-black/30'
            }`}>
              <p className={`text-[11px] font-semibold ${isOwn ? 'text-white/90' : getSenderColor(msg.replyTo.senderName)} lg:text-xs`}>
                ~ {msg.replyTo.senderName}
              </p>
              <p className="truncate text-foreground/80">{msg.replyTo.type === 'image' ? '📷 Photo' : msg.replyTo.content}</p>
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
                      decoding="async"
                    />
                  </div>
                  <div className="mx-4 h-px bg-black/10" />
                  <div className="flex w-full items-end justify-between gap-3">
                    <p className={`px-3 pb-0.5 pt-1.5 text-sm lg:px-4 lg:pb-1 lg:pt-2 lg:text-base whitespace-pre-wrap [overflow-wrap:anywhere]`}>
                      {highlightText(displayedContent, searchQuery)}
                      {showReadMore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                          }}
                          className="text-white font-semibold hover:underline cursor-pointer ml-1 inline"
                        >
                          {isExpanded ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </p>
                    <div className="shrink-0 pb-0.5 pr-1">
                      {renderMeta(false)}
                    </div>
                  </div>
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
                    decoding="async"
                  />
                  {renderMeta(true)}
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
                  <div className="flex w-full items-end justify-between gap-3">
                    <p className={`px-3 pb-0.5 pt-1.5 text-sm lg:px-4 lg:pb-1 lg:pt-2 lg:text-base whitespace-pre-wrap [overflow-wrap:anywhere]`}>
                      {highlightText(displayedContent, searchQuery)}
                      {showReadMore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                          }}
                          className="text-white font-semibold hover:underline cursor-pointer ml-1 inline"
                        >
                          {isExpanded ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </p>
                    <div className="shrink-0 pb-0.5 pr-1">
                      {renderMeta(false)}
                    </div>
                  </div>
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
                  {renderMeta(true)}
                </div>
              )}
            </div>
          ) : msg.fileUrl ? (
            <div className="flex w-full items-end justify-between gap-3 pb-0.5">
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-1 items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-2 min-w-0 transition-colors hover:bg-card`}
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
              <div className="shrink-0">
                {renderMeta(false)}
              </div>
            </div>
          ) : msg.isDeleted ? (
            <div className="flex w-full items-end justify-between gap-3">
              <p className="whitespace-pre-wrap [overflow-wrap:anywhere] pb-0.5 text-sm italic opacity-50">
                <Ban size={13} className="mr-1 inline-block shrink-0 align-[-2px]" />
                <span>{msg.content}</span>
              </p>
              <div className="shrink-0">
                {renderMeta(false)}
              </div>
            </div>
          ) : (
            <div className="flex w-full min-w-0 items-end justify-between gap-3">
              <p className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] pb-0.5">
                {highlightText(displayedContent, searchQuery)}
                {showReadMore && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-white font-semibold hover:underline cursor-pointer ml-1 inline"
                  >
                    {isExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </p>
              <div className="shrink-0 self-end">
                {renderMeta(false)}
              </div>
            </div>
          )}
        </div>
        {msg.edited && (
          <span className={`mt-0.5 text-[10px] italic text-muted-foreground/60 ${isOwn ? 'text-right' : ''}`}>
            edited
          </span>
        )}
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
