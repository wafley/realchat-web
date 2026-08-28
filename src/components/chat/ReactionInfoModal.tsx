import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { X, User, SmilePlus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { resolveFileUrl } from '@/lib/url';
import { useCustomNames } from '@/hooks/useCustomNames';
import type { Message, Reaction } from '@/types';

interface ReactionInfoModalProps {
  open: boolean;
  onClose: () => void;
  msg: Message | null;
  anchorRect?: DOMRect | null;
  currentUserId?: string;
  onRemoveMyReaction: (msgId: string, emoji: string) => void;
  onOpenReactionPicker?: (msgId: string, rect: DOMRect) => void;
  onUserClick?: (userId: string) => void;
}

export default function ReactionInfoModal({
  open,
  onClose,
  msg,
  anchorRect,
  currentUserId,
  onRemoveMyReaction,
  onOpenReactionPicker,
  onUserClick,
}: ReactionInfoModalProps) {
  const customNames = useCustomNames();
  const [selectedEmoji, setSelectedEmoji] = useState<string>('ALL');
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const reactions: Reaction[] = useMemo(() => msg?.reactions ?? [], [msg?.reactions]);

  // Group reactions by emoji to show in tabs
  const emojiGroups = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reactions) {
      map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
  }, [reactions]);

  // Filter reactions based on active tab
  const filteredReactions = useMemo(() => {
    if (selectedEmoji === 'ALL') return reactions;
    return reactions.filter((r) => r.emoji === selectedEmoji);
  }, [reactions, selectedEmoji]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Calculate Popover Position
  useLayoutEffect(() => {
    if (!open || !anchorRect) return;

    const popoverWidth = Math.min(320, window.innerWidth - 24);
    const popoverHeight = popoverRef.current?.offsetHeight || 260;
    const padding = 12;

    // Calculate vertical position (prefer above the pill, fallback to below)
    let top = anchorRect.top - popoverHeight - 8;
    if (top < padding) {
      // Not enough space above, place below
      top = anchorRect.bottom + 8;
      // If also overflows bottom, clamp
      if (top + popoverHeight > window.innerHeight - padding) {
        top = Math.max(padding, window.innerHeight - popoverHeight - padding);
      }
    }

    // Calculate horizontal position
    let left = anchorRect.left - 20;
    if (left + popoverWidth > window.innerWidth - padding) {
      left = window.innerWidth - popoverWidth - padding;
    }
    left = Math.max(padding, left);

    setPosition({ top, left });
  }, [open, anchorRect, reactions.length, selectedEmoji]);

  if (!open || !msg || reactions.length === 0) {
    return null;
  }

  const totalCount = reactions.length;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Reaction details"
      className="fixed z-[130] w-[min(320px,calc(100vw-24px))] rounded-2xl border border-border/80 bg-card/95 text-foreground shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#202c33] animate-in fade-in zoom-in-95 duration-150 overflow-hidden select-none"
      style={{
        top: Math.max(8, position.top),
        left: Math.max(8, position.left),
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 dark:border-white/10">
        <h3 className="text-sm font-semibold text-foreground">
          {totalCount} {totalCount === 1 ? 'reaction' : 'reactions'}
        </h3>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* Filter Tabs & Add Reaction Button */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/40 px-3.5 py-2 scrollbar-none dark:border-white/5">
        {/* Add Reaction Button */}
        <button
          type="button"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            if (onOpenReactionPicker) {
              onOpenReactionPicker(msg.id, rect);
            }
          }}
          title="Add reaction"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card/60 text-muted-foreground transition-all hover:bg-accent/15 hover:text-foreground active:scale-95 dark:border-white/15 dark:bg-white/5"
        >
          <SmilePlus size={15} />
        </button>

        {/* Emoji Pills */}
        {emojiGroups.map(({ emoji, count }) => {
          const hasMine = reactions.some((r) => r.userId === currentUserId && r.emoji === emoji);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onRemoveMyReaction(msg.id, emoji);
                if (hasMine && reactions.length <= 1) {
                  onClose();
                }
              }}
              title={hasMine ? `Click to remove your ${emoji} reaction` : `Click to react with ${emoji}`}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all select-none cursor-pointer ${
                hasMine
                  ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/50 dark:bg-[#005c4b] dark:text-emerald-200 dark:border-emerald-500/60 shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
              }`}
            >
              <span className="text-sm leading-none">{emoji}</span>
              <span className="text-[11px] font-semibold opacity-90">{count}</span>
            </button>
          );
        })}
      </div>

      {/* User Reaction List */}
      <div className="max-h-64 overflow-y-auto px-1.5 py-1.5 space-y-0.5 scrollbar-thin">
        {filteredReactions.map((r, idx) => {
          const isMe = r.userId === currentUserId;
          const displayName = isMe
            ? 'You'
            : customNames.get(r.userId) || r.fullName || r.username || r.userName || 'User';
          const username = r.username || r.userName;
          const avatarUrl = r.avatarUrl;

          return (
            <div
              key={`${r.userId}-${r.emoji}-${idx}`}
              onClick={() => {
                onRemoveMyReaction(msg.id, r.emoji);
                if (isMe && reactions.length <= 1) {
                  onClose();
                }
              }}
              title={isMe ? 'Click to remove reaction' : `Click to react with ${r.emoji}`}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors cursor-pointer ${
                isMe
                  ? 'hover:bg-rose-500/10 group/row'
                  : 'hover:bg-accent/10 dark:hover:bg-white/5'
              }`}
            >
              <div
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                onClick={(e) => {
                  if (!isMe && onUserClick) {
                    e.stopPropagation();
                    onUserClick(r.userId);
                  }
                }}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  {avatarUrl && <AvatarImage src={resolveFileUrl(avatarUrl)} alt={displayName} />}
                  <AvatarFallback className="bg-muted text-[11px] font-semibold text-muted-foreground">
                    {displayName.charAt(0).toUpperCase() || <User size={13} />}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-medium ${isMe ? 'text-foreground font-semibold' : 'text-foreground hover:underline'}`}>
                    {displayName}
                  </p>
                  {isMe ? (
                    <p className="truncate text-[10px] text-muted-foreground group-hover/row:text-rose-500 transition-colors">
                      Click to remove
                    </p>
                  ) : username && username !== displayName ? (
                    <p className="truncate text-[10px] text-muted-foreground">
                      @{username}
                    </p>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveMyReaction(msg.id, r.emoji);
                  if (isMe && reactions.length <= 1) {
                    onClose();
                  }
                }}
                title={isMe ? 'Click to remove reaction' : `Add reaction ${r.emoji}`}
                className="shrink-0 flex items-center p-1 rounded-full transition-transform hover:scale-125 active:scale-95 cursor-pointer"
              >
                <span className="text-xl select-none leading-none">{r.emoji}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
