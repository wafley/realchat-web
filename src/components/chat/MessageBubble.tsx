import { memo, useState, type PointerEvent, type TouchEvent } from 'react';
import { Pin, Star, Check, CheckCheck, Clock, SmilePlus, CheckSquare, Square, Ban } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveFileUrl } from '@/lib/url';
import { useCustomNames } from '@/hooks/useCustomNames';
import type { Message } from '@/types';
import { formatTime, highlightText } from '@/lib/chatHelpers';

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
  onClickImage: (url: string, fileName?: string, mimeType?: string) => void;
  onReplyClick: (messageId: string) => void;
  onSenderClick: (userId: string) => void;
  onMentionClick?: (username: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onReactionPickerOpen: (msgId: string, rect: DOMRect) => void;
  onOpenReactionInfo?: (msg: Message, rect: DOMRect) => void;
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
  onReplyClick,
  onSenderClick,
  onMentionClick,
  onToggleReaction,
  onReactionPickerOpen,
  onOpenReactionInfo,
  selectedIds,
  toggleSelect,
}: MessageBubbleProps) {
  const isSelected = selectedIds.includes(msg.id);
  const inSelectionMode = selectedIds.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);
  const customNames = useCustomNames();
  const senderName = customNames.get(msg.senderId) || msg.sender?.fullName;

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
  let totalReactions = 0;
  let myReactionEmoji: string | null = null;

  if (msg.reactions) {
    for (const r of msg.reactions) {
      const entry = reactionMap.get(r.emoji) ?? { count: 0, hasMine: false };
      entry.count++;
      totalReactions++;
      if (r.userId === currentUserId) {
        entry.hasMine = true;
        myReactionEmoji = r.emoji;
      }
      reactionMap.set(r.emoji, entry);
    }
  }

  const topEmojis = Array.from(reactionMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([emoji]) => emoji);

  const hasMine = myReactionEmoji !== null;

  const showReadMore = (msg.content || '').length > 500;
  const displayedContent = showReadMore && !isExpanded
    ? (msg.content || '').slice(0, 500) + '...'
    : (msg.content || '');

  // WhatsApp-style ticks: rendered without the extra bubble/backdrop wrapper
  // since it now sits inline with the text, floated to the right.
  const renderTicks = () => {
    if (!isOwn || !msg.status) return null;
    if (msg.status === 'pending' || msg.status === 'sending') {
      return <Clock size={13} className="text-white/70" />;
    }
    if (msg.status === 'sent') {
      return <Check size={15} className="text-white/70" />;
    }
    if (msg.status === 'delivered') {
      return <CheckCheck size={15} className="text-white/70" />;
    }
    if (msg.status === 'read') {
      return <CheckCheck size={15} strokeWidth={2.5} className="text-chat-status-read" />;
    }
    return null;
  };

  // Used for the overlay variant on media without a caption (image/video with no text),
  // where the meta still needs its little pill background to stay legible over the photo.
  const renderMetaOverlay = () => (
    <span className="inline-flex items-center gap-1 select-none text-[9px] lg:text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-[1px] absolute bottom-2 right-2 font-medium">
      {msg.isPinned && <Pin size={10} className="shrink-0 text-white" aria-label="Pinned" />}
      {msg.isStarred && <Star size={10} className="shrink-0 fill-current" aria-label="Starred" />}
      {formatTime(msg.createdAt)}
      {renderTicks()}
    </span>
  );

  // The WhatsApp trick: this span is floated right so short captions wrap
  // beside it on the same line, and long captions push it to wrap onto its
  // own trailing line naturally, matching native WA bubble behavior.
  const renderMetaInline = () => (
    <span
      className={`float-right ml-2 mt-1.5 inline-flex translate-y-0.5 items-center gap-1 select-none whitespace-nowrap text-[12px] lg:text-[13px] ${
        isOwn ? 'text-white/60' : 'text-muted-foreground/75'
      }`}
    >
      {msg.isPinned && <Pin size={11} className="shrink-0 text-foreground/80" aria-label="Pinned" />}
      {msg.isStarred && <Star size={11} className="shrink-0 fill-current" aria-label="Starred" />}
      {formatTime(msg.createdAt)}
      {renderTicks()}
    </span>
  );

  return (
    <div
      className={`group flex items-start gap-2 transition-all duration-700 rounded-xl ${isOwn ? 'flex-row-reverse' : ''} ${inSelectionMode && !isSelected ? 'opacity-50' : ''} ${isHighlighted ? 'bg-accent/15 py-1 px-1.5' : ''}`}
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
        <Avatar className="mt-0.5 h-9 w-9 shrink-0">
          {msg.sender?.avatarUrl && (
            <AvatarImage src={msg.sender.avatarUrl} alt={senderName || name || 'User avatar'} />
          )}
          <AvatarFallback className="bg-muted text-[length:var(--fs-bubble-sm,12px)] font-semibold text-muted-foreground">
            {(senderName || msg.sender?.username || name || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : showSpacer ? (
        <div className="mt-0.5 h-9 w-9 shrink-0" aria-hidden="true" />
      ) : null}
      <div className={`relative w-fit max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex min-w-0 flex-col ${totalReactions > 0 ? 'mb-3.5' : ''}`}>
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
          className={`chat-bubble relative max-w-full cursor-pointer transition-all duration-700 ${
            msg.type === 'image' || msg.type === 'video' ? 'overflow-hidden rounded-xl' : 'rounded-xl px-[9px] py-[6px] text-[length:var(--fs-bubble,16px)]'
          } ${isOwn
            ? `bg-chat-outgoing-bg text-chat-outgoing-foreground border border-white/10 ${isFirstInRun ? 'chat-bubble-tail-own rounded-tr-xs' : ''}`
            : `bg-chat-incoming-bg text-chat-incoming-foreground border border-black/5 ${isFirstInRun ? 'chat-bubble-tail-other rounded-tl-xs' : ''}`
          } ${msg.type === 'image' || msg.type === 'video' ? 'w-[min(75vw,420px)]' : ''} ${hasActiveSearch && searchMatchIds.includes(msg.id) && searchMatchIds[activeMatchIndex] === msg.id ? 'ring-2 ring-accent' : ''} ${isSelected ? 'ring-2 ring-accent' : ''} ${isHighlighted ? 'ring-2 ring-accent shadow-lg shadow-accent/40 bg-accent/30 dark:bg-accent/40' : ''}`}
        >
          {!isOwn && name && (
            <div className="mb-1 flex items-center justify-between gap-3 text-[length:var(--fs-bubble-sm,12px)] font-semibold">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSenderClick(msg.senderId);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`truncate text-left hover:underline ${getSenderColor(name)}`}
                aria-label={`Open ${name}'s profile`}
              >
                ~ {name}
              </button>
              {msg.sender?.username && (
                <span className="shrink-0 text-[10px] font-normal opacity-60">
                  @{msg.sender.username}
                </span>
              )}
            </div>
          )}
          {msg.replyTo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReplyClick(msg.replyTo!.id);
              }}
              className={`mb-1.5 w-full rounded-lg border-l-4 px-2.5 py-1.5 text-left text-[length:var(--fs-bubble-sm,12px)] transition-opacity hover:opacity-90 ${
                isOwn ? 'border-white/50 bg-black/20' : 'border-rose-500/80 bg-black/20 dark:bg-black/30'
              }`}
            >
              <p className={`text-[length:var(--fs-bubble-sm,12px)] font-semibold ${isOwn ? 'text-white/90' : getSenderColor(msg.replyTo.senderName)}`}>
                ~ {customNames.get(msg.replyTo.senderId) || msg.replyTo.senderName}
              </p>
              <p className="truncate text-foreground/80">{msg.replyTo.type === 'image' ? '📷 Photo' : msg.replyTo.content}</p>
            </button>
          )}
          {msg.type === 'image' && msg.fileUrl ? (
            <div className="flex flex-col">
              {msg.content ? (
                <>
                  <div className="overflow-hidden">
                    <img
                      src={resolveFileUrl(msg.fileUrl)}
                      alt={msg.content || 'Image'}
                      className="block w-full cursor-pointer object-cover transition-transform duration-200 hover:scale-[1.03]"
                      style={{ maxHeight: '300px' }}
                      onClick={(e) => { e.stopPropagation(); onClickImage(resolveFileUrl(msg.fileUrl)!, msg.fileName, msg.mimeType); }}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p className="whitespace-pre-wrap px-[9px] pb-[6px] pt-[6px] text-[length:var(--fs-bubble,16px)] [overflow-wrap:anywhere]">
                    {highlightText(displayedContent, searchQuery, isOwn, onMentionClick)}
                    {showReadMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(!isExpanded);
                        }}
                        className="text-white font-semibold hover:underline cursor-pointer ml-1"
                      >
                        {isExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                    {renderMetaInline()}
                  </p>
                </>
              ) : (
                <div className="relative overflow-hidden">
                  <img
                    src={resolveFileUrl(msg.fileUrl)}
                    alt="Image"
                    className="block w-full cursor-pointer object-cover transition-transform duration-200 hover:scale-[1.03]"
                    style={{ maxHeight: '300px' }}
                    onClick={(e) => { e.stopPropagation(); onClickImage(resolveFileUrl(msg.fileUrl)!, msg.fileName, msg.mimeType); }}
                    loading="lazy"
                    decoding="async"
                  />
                  {renderMetaOverlay()}
                </div>
              )}
            </div>
          ) : msg.type === 'video' && msg.fileUrl ? (
            <div className="flex flex-col">
              {msg.content ? (
                <>
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <video
                      src={resolveFileUrl(msg.fileUrl)}
                      playsInline
                      controls={false}
                      onPlay={(e) => e.currentTarget.pause()}
                      onClick={(e) => { e.stopPropagation(); onClickImage(resolveFileUrl(msg.fileUrl)!, msg.fileName, msg.mimeType); }}
                      className="block w-full cursor-pointer"
                      style={{ maxHeight: '400px' }}
                      preload="metadata"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 shadow-lg backdrop-blur-sm">
                        <span className="ml-1 text-2xl text-white">▶</span>
                      </div>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap px-[9px] pb-[6px] pt-[6px] text-[length:var(--fs-bubble,16px)] [overflow-wrap:anywhere]">
                    {highlightText(displayedContent, searchQuery, isOwn, onMentionClick)}
                    {showReadMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(!isExpanded);
                        }}
                        className="text-white font-semibold hover:underline cursor-pointer ml-1"
                      >
                        {isExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                    {renderMetaInline()}
                  </p>
                </>
              ) : (
                <div className="relative overflow-hidden rounded-xl">
                  <video
                    src={resolveFileUrl(msg.fileUrl)}
                    playsInline
                    controls={false}
                    onPlay={(e) => e.currentTarget.pause()}
                    onClick={(e) => { e.stopPropagation(); onClickImage(resolveFileUrl(msg.fileUrl)!, msg.fileName, msg.mimeType); }}
                    className="block w-full cursor-pointer"
                    style={{ maxHeight: '400px' }}
                    preload="metadata"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 shadow-lg backdrop-blur-sm">
                      <span className="ml-1 text-2xl text-white">▶</span>
                    </div>
                  </div>
                  {renderMetaOverlay()}
                </div>
              )}
            </div>
          ) : msg.isDeleted ? (
            <p className="[overflow-wrap:anywhere] text-[length:var(--fs-bubble-md,14px)] italic opacity-50">
              <Ban size={13} className="mr-1 inline-block shrink-0 align-[-2px]" />
              <span>{msg.content}</span>
              {renderMetaInline()}
            </p>
          ) : (
            <p className="whitespace-pre-wrap min-w-0 max-w-full [overflow-wrap:anywhere]">
              {highlightText(displayedContent, searchQuery, isOwn, onMentionClick)}
              {showReadMore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-white font-semibold hover:underline cursor-pointer ml-1"
                >
                  {isExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
              {renderMetaInline()}
            </p>
          )}
        </div>
        {msg.edited && (
          <span className={`mt-0.5 text-[10px] italic text-muted-foreground/60 ${isOwn ? 'text-right' : ''}`}>
            edited
          </span>
        )}
        {totalReactions > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              if (onOpenReactionInfo) {
                onOpenReactionInfo(msg, rect);
              } else {
                onReactionPickerOpen(msg.id, rect);
              }
            }}
            title="View reactions"
            className={`absolute -bottom-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs shadow-md transition-all duration-200 hover:scale-105 active:scale-95 select-none ${
              isOwn ? 'right-2' : 'left-2'
            } ${
              hasMine
                ? 'border border-accent/40 bg-card text-accent dark:bg-[#1f2c34] dark:border-accent/50 shadow-accent/10'
                : 'border border-border/80 bg-card text-muted-foreground dark:bg-[#1f2c34] dark:border-white/15'
            }`}
          >
            <span className="flex items-center -space-x-1">
              {topEmojis.map((emoji) => (
                <span key={emoji} className="text-sm sm:text-[15px] leading-none">
                  {emoji}
                </span>
              ))}
            </span>
            {totalReactions > 1 && (
              <span className={`text-xs font-semibold leading-none pl-0.5 ${hasMine ? 'text-accent' : 'text-muted-foreground'}`}>
                {totalReactions}
              </span>
            )}
          </button>
        )}
        {!inSelectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onReactionPickerOpen(msg.id, rect);
            }}
            aria-label="Add reaction"
            className={`pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 absolute z-[1] flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-border bg-card/80 text-muted-foreground opacity-100 transition-opacity hover:bg-accent/5 ${
              isOwn ? 'right-full top-1/2 mr-2 -translate-y-1/2' : 'left-full top-1/2 ml-2 -translate-y-1/2'
            }`}
          >
            <SmilePlus size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleComp);