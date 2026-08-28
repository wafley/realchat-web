import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Reply, Clipboard, Forward, Pin, PinOff, Star, StarOff, CheckCheck, Check, Trash2, Loader2, CheckSquare, Edit3, Users, User, BellOff, Clock, Save, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MoreVertical, Play, Pause, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Modal from '@/components/ui/modal';
import ReactionInfoModal from './ReactionInfoModal';
import type { Message } from '@/types';
import { senderName, getMessageReaders } from '@/services/chat';
import { resolveFileUrl } from '@/lib/url';

type SaveFilePicker = (options: {
  suggestedName: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function GroupReadersList({ chatId, msg }: { chatId: string; msg: Message }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['message-readers', chatId, msg.id],
    queryFn: () => getMessageReaders(chatId, msg.id),
    staleTime: 30_000,
  });

  if (isPending) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Failed to load delivery info</p>;
  }

  const readers = data ?? [];
  const sections = [
    { label: 'Seen', items: readers.filter((r) => r.status === 'seen') },
    { label: 'Delivered', items: readers.filter((r) => r.status === 'delivered') },
    { label: 'Sent', items: readers.filter((r) => r.status === 'sent') },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No delivery info yet</p>;
  }

  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <div key={s.label}>
          <p className="mb-1 px-2 text-xs font-semibold text-muted-foreground">{s.label}</p>
          <div className="space-y-0.5">
            {s.items.map((r) => (
              <div key={r.userId} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <Avatar className="h-8 w-8">
                  {r.avatarUrl && <AvatarImage src={resolveFileUrl(r.avatarUrl)} alt={r.fullName} />}
                  <AvatarFallback className="text-xs"><User size={14} /></AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{r.fullName}</p>
                  {r.username && <p className="truncate text-[11px] text-muted-foreground">@{r.username}</p>}
                </div>
                {r.seenAt ? (
                  <span className="shrink-0 text-xs text-muted-foreground">{formatTime(r.seenAt)}</span>
                ) : s.label === 'Delivered' ? (
                  <CheckCheck size={14} className="shrink-0 text-muted-foreground" />
                ) : (
                  <Check size={14} className="shrink-0 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ContextMenuData {
  msg: Message;
  x: number;
  y: number;
}

interface ChatOverlaysProps {
  deleteTarget: Message | null;
  deleteLoading: boolean;
  contextMenu: ContextMenuData | null;
  forwardTarget: Message | null;
  forwardSearch: string;
  forwardableConversations: { id: string; name: string; type: string; avatarUrl?: string }[];
  lightboxUrl: string | null;
  previewMedia: { id: string; url: string; fileName?: string; mimeType?: string; label: string; kind: 'image' | 'video'; senderName: string; senderAvatarUrl?: string }[];
  blockConfirmOpen: boolean;
  reportConfirmOpen: boolean;
  clearConfirmOpen: boolean;
  readReceiptTarget: Message | null;
  chatName: string;
  currentUserId?: string | undefined;
  onCloseDelete: () => void;
  onDeleteMessage: (delForAll: boolean) => void;
  onCloseContextMenu: () => void;
  onContextMenuAction: (action: string) => void;
  onCloseForward: () => void;
  onForwardSearchChange: (value: string) => void;
  onForward: (targetChatId: string, msg: Message) => void;
  onCloseLightbox: () => void;
  onSelectLightbox: (url: string, fileName?: string, mimeType?: string) => void;
  onCloseBlock: () => void;
  onBlock: () => void;
  onCloseReport: () => void;
  onReport: () => void;
  onCloseClear: () => void;
  onClear: () => void;
  muteDialogOpen: boolean;
  muted: boolean;
  onCloseMute: () => void;
  onMute: (option: 'unmute' | 'forever' | string) => Promise<void> | void;
  onCloseReadReceipts: () => void;
  isGroupChat?: boolean;
  isGroupAdmin?: boolean;
  chatId?: string | null;
  reactionInfoMsg?: Message | null;
  reactionInfoRect?: DOMRect | null;
  onCloseReactionInfo?: () => void;
  onToggleReaction?: (msgId: string, emoji: string) => void;
  onReactionPickerOpen?: (msgId: string, rect: DOMRect, initialFull?: boolean) => void;
  onSenderClick?: (userId: string) => void;
}

export default function ChatOverlays({
  deleteTarget,
  deleteLoading,
  contextMenu,
  forwardTarget,
  forwardSearch,
  forwardableConversations,
  lightboxUrl,
  previewMedia,
  blockConfirmOpen,
  reportConfirmOpen,
  clearConfirmOpen,
  readReceiptTarget,
  chatName,
  currentUserId,
  onCloseDelete,
  onDeleteMessage,
  onCloseContextMenu,
  onContextMenuAction,
  onCloseForward,
  onForwardSearchChange,
  onForward,
  onCloseLightbox,
  onSelectLightbox,
  onCloseBlock,
  onBlock,
  onCloseReport,
  onReport,
  onCloseClear,
  onClear,
  muteDialogOpen,
  muted,
  onCloseMute,
  onMute,
  onCloseReadReceipts,
  isGroupChat = false,
  isGroupAdmin = false,
  chatId,
  reactionInfoMsg,
  reactionInfoRect,
  onCloseReactionInfo,
  onToggleReaction,
  onReactionPickerOpen,
  onSenderClick,
}: ChatOverlaysProps) {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [moreOpen, setMoreOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const lightboxVideoRef = useRef<HTMLVideoElement>(null);
  const activeLightboxUrl = lightboxUrl?.split('#')[0];
  const activeMediaIndex = Math.max(0, previewMedia.findIndex((media) => media.url === activeLightboxUrl));
  const activeMedia = previewMedia[activeMediaIndex];
  const selectMedia = (index: number) => {
    const media = previewMedia[index];
    if (media) onSelectLightbox(media.url, media.fileName, media.mimeType);
  };

  useEffect(() => {
    setLightboxZoom(1);
    setMoreOpen(false);
    setVideoPlaying(false);
  }, [lightboxUrl]);

  useLayoutEffect(() => {
    if (!contextMenu) {
      setMenuPos(null);
      return;
    }
    const el = contextMenuRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const MARGIN = 8;
    let x = contextMenu.x;
    let y = contextMenu.y;
    if (x + w > window.innerWidth - MARGIN) x = Math.max(MARGIN, window.innerWidth - w - MARGIN);
    if (y + h > window.innerHeight - MARGIN) y = Math.max(MARGIN, window.innerHeight - h - MARGIN);
    setMenuPos({ x, y });
  }, [contextMenu]);

  return (
    <>
      {deleteTarget && (
        <Modal open={!!deleteTarget} onClose={() => { if (!deleteLoading) onCloseDelete(); }} title="Delete message?">
          <div className="space-y-2" role="dialog" aria-modal="true" aria-label="Delete message options">
            <button
              onClick={() => onDeleteMessage(false)}
              disabled={deleteLoading}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 disabled:opacity-50"
            >
              {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} className="text-muted-foreground" />}
              Delete for me
            </button>
            {(deleteTarget.senderId === currentUserId || (isGroupChat && isGroupAdmin)) && (
              <button
                onClick={() => onDeleteMessage(true)}
                disabled={deleteLoading}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete for all
              </button>
            )}
          </div>
        </Modal>
      )}

      {contextMenu && (
        <div className="fixed inset-0 z-[90]" onClick={onCloseContextMenu}>
          <div
            ref={contextMenuRef}
            className="absolute w-72 max-w-[calc(100vw-24px)] origin-top-left animate-scale-in max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-md dark:bg-[#202c33] dark:border-white/10 py-1.5 shadow-2xl"
            style={{ left: menuPos?.x ?? contextMenu.x, top: menuPos?.y ?? contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
            role="menu"
            aria-label="Message actions"
          >
            {/* WhatsApp-style Reaction Strip on Long-Press / Right-Click */}
            {!contextMenu.msg.isDeleted && (
              <div className="flex items-center justify-between gap-1 border-b border-border/60 px-2.5 pb-2 pt-1 dark:border-white/10">
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onToggleReaction?.(contextMenu.msg.id, emoji);
                      onCloseContextMenu();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-accent/15 active:scale-95 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    onCloseContextMenu();
                    onReactionPickerOpen?.(contextMenu.msg.id, rect, true);
                  }}
                  title="More reactions"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 text-muted-foreground hover:bg-accent/15 hover:text-foreground dark:border-white/15 dark:bg-white/5 cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
            <button
              onClick={() => onContextMenuAction('reply')}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
              role="menuitem"
            >
              <Reply size={15} className="text-muted-foreground" />
              Reply
            </button>
            {contextMenu.msg.senderId === currentUserId &&
              contextMenu.msg.type === 'text' &&
              !contextMenu.msg.isDeleted &&
              (Date.now() - new Date(contextMenu.msg.createdAt).getTime()) < 15 * 60 * 1000 && (
                <button
                  onClick={() => onContextMenuAction('edit')}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                  role="menuitem"
                >
                  <Edit3 size={15} className="text-muted-foreground" />
                  Edit
                </button>
              )}
            <button
              onClick={() => onContextMenuAction('copy')}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
              role="menuitem"
            >
              <Clipboard size={15} className="text-muted-foreground" />
              Copy
            </button>
            <button
              onClick={() => onContextMenuAction('select')}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
              role="menuitem"
            >
              <CheckSquare size={15} className="text-muted-foreground" />
              Select
            </button>
            {!contextMenu.msg.isDeleted && (
              <button
                onClick={() => onContextMenuAction('forward')}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                role="menuitem"
              >
                <Forward size={15} className="text-muted-foreground" />
                Forward
              </button>
            )}
            {!contextMenu.msg.isDeleted &&
              (contextMenu.msg.isStarred ? (
                <button
                  onClick={() => onContextMenuAction('unstar')}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                  role="menuitem"
                >
                  <StarOff size={15} className="text-muted-foreground" />
                  Unstar
                </button>
              ) : (
                <button
                  onClick={() => onContextMenuAction('star')}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                  role="menuitem"
                >
                  <Star size={15} className="text-muted-foreground" />
                  Star
                </button>
              ))}
            {!contextMenu.msg.isDeleted &&
              (contextMenu.msg.isPinned ? (
                <button
                  onClick={() => onContextMenuAction('unpin')}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                  role="menuitem"
                >
                  <PinOff size={15} className="text-muted-foreground" />
                  Unpin
                </button>
              ) : (
                <button
                  onClick={() => onContextMenuAction('pin')}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                  role="menuitem"
                >
                  <Pin size={15} className="text-muted-foreground" />
                  Pin
                </button>
              ))}
            {contextMenu.msg.senderId === currentUserId && !contextMenu.msg.isDeleted && contextMenu.msg.type !== 'system' && (isGroupChat || (contextMenu.msg.readBy && contextMenu.msg.readBy.length > 0)) && (
              <button
                onClick={() => onContextMenuAction('read-receipts')}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                role="menuitem"
              >
                {isGroupChat ? <Users size={15} className="text-muted-foreground" /> : <CheckCheck size={15} className="text-muted-foreground" />}
                {isGroupChat ? 'Message info' : 'Read by'}
              </button>
            )}
            <div className="my-1 border-t border-border" />
            {!contextMenu.msg.isDeleted && (
              <button
                onClick={() => onContextMenuAction('delete')}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                role="menuitem"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {forwardTarget && (
        <Modal open={!!forwardTarget} onClose={onCloseForward} title="Forward message">
          <input
            type="text"
            placeholder="Search conversations..."
            value={forwardSearch}
            onChange={(e) => onForwardSearchChange(e.target.value)}
            className="mb-3 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {forwardableConversations
              .filter((c) => c.name.toLowerCase().includes(forwardSearch.toLowerCase()))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => forwardTarget && onForward(c.id, forwardTarget)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                >
                    <Avatar className="h-8 w-8">
                      {c.avatarUrl && <AvatarImage src={c.avatarUrl} />}
                      <AvatarFallback className="text-xs">{c.type === 'group' ? <Users size={14} /> : <User size={14} />}</AvatarFallback>
                    </Avatar>
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {c.type === 'group' ? 'Group' : 'DM'}
                  </span>
                </button>
              ))}
            {forwardableConversations.filter((c) => c.name.toLowerCase().includes(forwardSearch.toLowerCase())).length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No conversations found</p>
            )}
          </div>
        </Modal>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/60 text-white"
          onClick={onCloseLightbox}
        >
          <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-black/60 px-4 pb-1 pt-[calc(env(safe-area-inset-top)+24px)] shadow-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#667781] text-sm font-semibold">
              {activeMedia?.senderAvatarUrl ? <img src={resolveFileUrl(activeMedia.senderAvatarUrl)} alt={activeMedia.senderName} className="h-full w-full object-cover" /> : (activeMedia?.senderName.charAt(0).toUpperCase() || 'Y')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{activeMedia?.senderName || 'Photo'}</p>
              <p className="text-[11px] text-white/55">{activeMedia?.label || 'Photo'}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); setLightboxZoom((value) => Math.max(0.75, value - 0.25)); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Zoom out" title="Zoom out"><ZoomOut size={19} /></button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxZoom((value) => Math.min(3, value + 0.25)); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Zoom in" title="Zoom in"><ZoomIn size={19} /></button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const metadata = new URLSearchParams(lightboxUrl.split('#')[1] || '');
                  const fileName = metadata.get('downloadName') || 'photo';
                  const mimeType = metadata.get('mimeType') || 'application/octet-stream';
                  const extension = fileName.includes('.') ? `.${fileName.split('.').pop()}` : undefined;
                  const downloadUrl = `${lightboxUrl.split('#')[0]}?downloadName=${encodeURIComponent(fileName)}`;
                  const saveFilePicker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
                  if (saveFilePicker) {
                    try {
                      const response = await fetch(downloadUrl);
                      const blob = await response.blob();
                      const handle = await saveFilePicker({ suggestedName: fileName, ...(extension && { types: [{ description: mimeType, accept: { [mimeType]: [extension] } }] }) });
                      const writable = await handle.createWritable();
                      await writable.write(blob);
                      await writable.close();
                      return;
                    } catch (error) {
                      if ((error as DOMException).name === 'AbortError') return;
                    }
                  }
                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = fileName;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Save as"
                title="Save as"
              ><Save size={19} /></button>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setMoreOpen((value) => !value); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="More options" title="More options"><MoreVertical size={19} /></button>
                {moreOpen && (
                  <div className="absolute right-0 top-12 z-20 w-40 overflow-hidden rounded-md bg-[#233138] py-1 text-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setLightboxZoom(1); setMoreOpen(false); }} className="w-full px-4 py-2.5 text-left hover:bg-white/10">Reset zoom</button>
                    <button onClick={onCloseLightbox} className="w-full px-4 py-2.5 text-left hover:bg-white/10">Close preview</button>
                  </div>
                )}
              </div>
              <button onClick={onCloseLightbox} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Close preview" title="Close preview"><X size={21} /></button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/60 p-3 sm:p-5" onClick={(e) => e.stopPropagation()}>
            <button onClick={(e) => { e.stopPropagation(); selectMedia((activeMediaIndex - 1 + previewMedia.length) % previewMedia.length); }} className="absolute left-5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 disabled:opacity-30" aria-label="Previous photo" title="Previous photo" disabled={previewMedia.length < 2}><ChevronLeft size={24} /></button>
            {activeMedia?.kind === 'video' ? (
              <div className="group relative flex items-center justify-center" style={{ width: 'min(94vw, 1200px)', height: 'min(82vh, 820px)' }}>
                <video
                  ref={lightboxVideoRef}
                  src={lightboxUrl.split('#')[0]}
                  controls
                  autoPlay
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                  className="h-full w-full rounded-sm object-contain shadow-2xl transition-transform duration-200"
                  style={{ transform: `scale(${lightboxZoom})` }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = lightboxVideoRef.current;
                    if (video) void (video.paused ? video.play() : video.pause());
                  }}
                  className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition-opacity duration-200 hover:bg-black/75 focus-visible:opacity-100 ${videoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                  aria-label={videoPlaying ? 'Pause video' : 'Play video'}
                  title={videoPlaying ? 'Pause video' : 'Play video'}
                >
                  {videoPlaying ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" className="ml-1" />}
                </button>
              </div>
            ) : (
              <img
                src={lightboxUrl.split('#')[0]}
                alt="Full size"
                className="rounded-sm object-contain shadow-2xl transition-transform duration-200"
                style={{ width: 'min(94vw, 1200px)', height: 'min(82vh, 820px)', transform: `scale(${lightboxZoom})` }}
              />
            )}
            <button onClick={(e) => { e.stopPropagation(); selectMedia((activeMediaIndex + 1) % previewMedia.length); }} className="absolute right-5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 disabled:opacity-30" aria-label="Next photo" title="Next photo" disabled={previewMedia.length < 2}><ChevronRight size={24} /></button>
          </div>
          <div className="flex min-h-20 shrink-0 items-center gap-2 overflow-x-auto border-t border-white/10 bg-black/60 px-4 pb-[env(safe-area-inset-bottom)]">
            {previewMedia.map((media, index) => (
              <button key={media.id} onClick={(e) => { e.stopPropagation(); selectMedia(index); }} className={`h-14 w-14 shrink-0 rounded bg-black/30 p-0.5 ${index === activeMediaIndex ? 'border-2 border-[#00a884]' : 'border border-transparent opacity-70 hover:opacity-100'}`} aria-label={`Open ${media.label}`} title={media.label}>
                {media.kind === 'video' ? (
                  <video src={media.url} muted preload="metadata" className="h-full w-full rounded object-cover" />
                ) : (
                  <img src={media.url} alt={media.label} className="h-full w-full rounded object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {blockConfirmOpen && (
        <Modal open={blockConfirmOpen} onClose={onCloseBlock} title="Block user">
          <p className="mb-4 text-sm text-muted-foreground">
            Are you sure you want to block {chatName}? You will no longer receive messages from this user.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCloseBlock}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={onBlock}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90"
            >
              Block
            </button>
          </div>
        </Modal>
      )}

      {reportConfirmOpen && (
        <Modal open={reportConfirmOpen} onClose={onCloseReport} title="Report user">
          <p className="mb-4 text-sm text-muted-foreground">
            Report {chatName} for inappropriate behavior? Our team will review this report.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCloseReport}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={onReport}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90"
            >
              Report
            </button>
          </div>
        </Modal>
      )}

      {clearConfirmOpen && (
        <Modal open={clearConfirmOpen} onClose={onCloseClear} title="Clear chat">
          <p className="mb-4 text-sm text-muted-foreground">
            Are you sure you want to clear this chat? Messages will only be cleared on your side.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCloseClear}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={onClear}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90"
            >
              Clear
            </button>
          </div>
        </Modal>
      )}


      {readReceiptTarget && (
        <Modal open={!!readReceiptTarget} onClose={onCloseReadReceipts} title={isGroupChat ? 'Message info' : 'Read by'}>
          {isGroupChat && chatId ? (
            <GroupReadersList chatId={chatId} msg={readReceiptTarget} />
          ) : (
            <div className="space-y-2">
              {readReceiptTarget.readBy?.length ? (
                readReceiptTarget.readBy.map((userId) => (
                  <div key={userId} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs"><User size={14} /></AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">{senderName(userId)}</span>
                    <CheckCheck size={14} className="ml-auto text-accent" />
                  </div>
                ))
              ) : readReceiptTarget.status === 'read' && readReceiptTarget.lastReadAt ? (
                <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs"><User size={14} /></AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground">Seen at {formatTime(readReceiptTarget.lastReadAt)}</span>
                  <CheckCheck size={14} className="ml-auto text-accent" />
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No read receipts available</p>
              )}
            </div>
          )}
        </Modal>
      )}
    {muteDialogOpen && (
        <Modal open={muteDialogOpen} onClose={onCloseMute} title="Mute notifications">
          <div className="space-y-1.5">
            {muted && (
              <button
                onClick={() => { onCloseMute(); onMute('unmute'); }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
              >
                <span className="font-medium">Unmute</span>
                <BellOff size={15} className="text-muted-foreground" />
              </button>
            )}
            {[
              { label: '15 minutes', ms: 15 * 60 * 1000 },
              { label: '1 hour', ms: 60 * 60 * 1000 },
              { label: '8 hours', ms: 8 * 60 * 60 * 1000 },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => { onCloseMute(); onMute(new Date(Date.now() + opt.ms).toISOString()); }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
              >
                <span>{opt.label}</span>
                <Clock size={15} className="text-muted-foreground" />
              </button>
            ))}
            <button
              onClick={() => { onCloseMute(); onMute('forever'); }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              <span>Forever</span>
              <BellOff size={15} className="text-muted-foreground" />
            </button>
          </div>
        </Modal>
      )}
      {reactionInfoMsg && (
        <ReactionInfoModal
          open={Boolean(reactionInfoMsg)}
          onClose={onCloseReactionInfo ?? (() => {})}
          msg={reactionInfoMsg}
          anchorRect={reactionInfoRect}
          currentUserId={currentUserId}
          onRemoveMyReaction={onToggleReaction ?? (() => {})}
          onOpenReactionPicker={onReactionPickerOpen}
          onUserClick={onSenderClick}
        />
      )}
    </>
  );
}
