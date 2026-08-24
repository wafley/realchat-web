import { memo, useState, type PointerEvent, type TouchEvent } from 'react';
import { Pin, Star, Check, CheckCheck, Clock, FileText, SmilePlus, CheckSquare, Square, Ban, Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveFileUrl } from '@/lib/url';
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
  onClickImage: (url: string, fileName?: string, mimeType?: string) => void;
  onReplyClick: (messageId: string) => void;
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
  onReplyClick,
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
  const replyText = msg.replyTo?.content || '';
  const displayedReplyText = replyText.length > 120 ? `${replyText.slice(0, 120)}...` : replyText;

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
        <Avatar className="mt-0.5 h-9 w-9 shrink-0">
          {msg.sender?.avatarUrl && (
            <AvatarImage src={msg.sender.avatarUrl} alt={msg.sender.fullName || name || 'User avatar'} />
          )}
          <AvatarFallback className="bg-muted text-[length:var(--fs-bubble-sm,12px)] font-semibold text-muted-foreground">
            {(msg.sender?.fullName || msg.sender?.username || name || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : showSpacer ? (
        <div className="mt-0.5 h-9 w-9 shrink-0" aria-hidden="true" />
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
          className={`chat-bubble cursor-pointer relative transition-all duration-700 ${
            msg.type === 'image' || msg.type === 'video' ? 'overflow-hidden rounded-xl' : 'rounded-xl px-[9px] py-[6px] text-[length:var(--fs-bubble,16px)]'
          } ${isOwn
            ? `bg-chat-outgoing-bg text-chat-outgoing-foreground border border-white/10 ${isFirstInRun ? 'chat-bubble-tail-own rounded-tr-xs' : ''}`
            : `bg-chat-incoming-bg text-chat-incoming-foreground border border-black/5 ${isFirstInRun ? 'chat-bubble-tail-other rounded-tl-xs' : ''}`
          } ${hasActiveSearch && searchMatchIds.includes(msg.id) && searchMatchIds[activeMatchIndex] === msg.id ? 'ring-2 ring-accent' : ''} ${isSelected ? 'ring-2 ring-accent' : ''} ${isHighlighted ? 'ring-2 ring-accent shadow-lg shadow-accent/40 bg-accent/30 dark:bg-accent/40' : ''}`}
        >
          {!isOwn && name && (
            <div className="mb-1 flex items-center justify-between gap-3 text-[length:var(--fs-bubble-sm,12px)] font-semibold">
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
            <button onClick={() => onReplyClick(msg.replyTo!.id)} className={`mb-1.5 block w-full min-w-0 max-w-full overflow-hidden rounded-lg border-l-4 px-2.5 py-1.5 text-left text-[length:var(--fs-bubble-sm,12px)] transition-colors hover:bg-black/30 ${
              isOwn ? 'border-white/50 bg-black/20' : 'border-rose-500/80 bg-black/20 dark:bg-black/30'
            }`}>
              <p className={`truncate text-[length:var(--fs-bubble-sm,12px)] font-semibold ${isOwn ? 'text-white/90' : getSenderColor(msg.replyTo.senderName)}`}>
                ~ {msg.replyTo.senderName}
              </p>
              {msg.replyTo.fileUrl && (msg.replyTo.type === 'image' || msg.replyTo.type === 'video') ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickImage(resolveFileUrl(msg.replyTo!.fileUrl)!, msg.replyTo!.fileName, msg.replyTo!.type === 'video' ? 'video/mp4' : 'image/*');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onClickImage(resolveFileUrl(msg.replyTo!.fileUrl)!, msg.replyTo!.fileName, msg.replyTo!.type === 'video' ? 'video/mp4' : 'image/*');
                    }
                  }}
                  className="mt-1 flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-md text-left transition-opacity hover:opacity-80"
                >
                  <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded bg-black/30">
                    {msg.replyTo.type === 'video' ? (
                      <video src={resolveFileUrl(msg.replyTo.fileUrl)} muted preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <img src={resolveFileUrl(msg.replyTo.fileUrl)} alt="Replied photo" className="h-full w-full object-cover" />
                    )}
                    {msg.replyTo.type === 'video' && <Play size={15} fill="currentColor" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />}
                  </span>
                  <span className="min-w-0 break-words text-foreground/80">{msg.replyTo.type === 'image' ? '📷 Photo' : '🎥 Video'}</span>
                </span>
              ) : (
                <p className="min-w-0 max-w-full whitespace-normal break-all [overflow-wrap:anywhere] text-foreground/80">{msg.replyTo.type === 'image' ? '📷 Photo' : msg.replyTo.type === 'video' ? '🎥 Video' : displayedReplyText}</p>
              )}
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
                  <p className="px-[9px] pb-[6px] pt-[6px] text-[length:var(--fs-bubble,16px)] [overflow-wrap:anywhere]">
                    {highlightText(displayedContent, searchQuery)}
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
                  <div className="group relative">
                    <video
                      src={msg.fileUrl}
                      preload="metadata"
                      className="block w-full cursor-pointer rounded-t-2xl"
                      style={{ maxHeight: '400px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClickImage(resolveFileUrl(msg.fileUrl)!, msg.fileName, msg.mimeType);
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClickImage(resolveFileUrl(msg.fileUrl)!, msg.fileName, msg.mimeType);
                      }}
                      className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition hover:bg-black/75"
                      aria-label="Play video"
                      title="Play video"
                    >
                      <Play size={25} fill="currentColor" className="ml-1" />
                    </button>
                  </div>
                  <p className="px-[9px] pb-[6px] pt-[6px] text-[length:var(--fs-bubble,16px)] [overflow-wrap:anywhere]">
                    {highlightText(displayedContent, searchQuery)}
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
                <div className="relative">
                  <div className="group relative">
                    <video
                      src={msg.fileUrl}
                      preload="metadata"
                      className="block w-full cursor-pointer rounded-xl"
                      style={{ maxHeight: '400px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClickImage(resolveFileUrl(msg.fileUrl)!, msg.fileName, msg.mimeType);
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClickImage(resolveFileUrl(msg.fileUrl)!, msg.fileName, msg.mimeType);
                      }}
                      className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition hover:bg-black/75"
                      aria-label="Play video"
                      title="Play video"
                    >
                      <Play size={25} fill="currentColor" className="ml-1" />
                    </button>
                  </div>
                  {renderMetaOverlay()}
                </div>
              )}
            </div>
          ) : msg.fileUrl ? (
            <div className="flex w-full min-w-[250px] max-w-[360px] flex-col gap-1">
              <a
                href={resolveFileUrl(msg.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                download={msg.fileName || true}
                className={`group flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  isOwn
                    ? 'border-white/10 bg-black/15 hover:bg-black/25'
                    : 'border-white/5 bg-black/20 hover:bg-black/30'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                  isOwn ? 'bg-indigo-500/20' : 'bg-slate-700/70'
                }`}>
                  <FileText size={21} strokeWidth={1.8} className={isOwn ? 'text-indigo-300' : 'text-slate-300'} />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="truncate text-[13px] font-medium leading-5 text-white">
                    {msg.fileName || 'Document'}
                  </p>
                  {msg.fileSize && (
                    <p className="text-[11px] leading-4 text-white/55">{formatFileSize(msg.fileSize)}</p>
                  )}
                </div>
              </a>
              <div className="flex justify-end pr-1 leading-none">{renderMetaInline()}</div>
            </div>
          ) : msg.isDeleted ? (
            <p className="[overflow-wrap:anywhere] text-[length:var(--fs-bubble-md,14px)] italic opacity-50">
              <Ban size={13} className="mr-1 inline-block shrink-0 align-[-2px]" />
              <span>{msg.content}</span>
              {renderMetaInline()}
            </p>
          ) : (
            <p className="min-w-0 [overflow-wrap:anywhere]">
              {highlightText(displayedContent, searchQuery)}
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