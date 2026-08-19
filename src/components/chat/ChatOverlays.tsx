import { useState, useRef, useLayoutEffect } from 'react';
import { X, Reply, Clipboard, Forward, Pin, PinOff, Star, StarOff, CheckCheck, Trash2, Loader2, CheckSquare, Edit3, Users, User, BellOff, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Modal from '@/components/ui/modal';
import type { Message } from '@/types';
import { senderName } from '@/services/chat';

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
}

export default function ChatOverlays({
  deleteTarget,
  deleteLoading,
  contextMenu,
  forwardTarget,
  forwardSearch,
  forwardableConversations,
  lightboxUrl,
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
}: ChatOverlaysProps) {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

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
            {deleteTarget.senderId === currentUserId && (
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
            className="absolute w-48 origin-top-left animate-scale-in max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-2xl"
            style={{ left: menuPos?.x ?? contextMenu.x, top: menuPos?.y ?? contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
            role="menu"
            aria-label="Message actions"
          >
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
            {contextMenu.msg.senderId === currentUserId && contextMenu.msg.readBy && contextMenu.msg.readBy.length > 0 && (
              <button
                onClick={() => onContextMenuAction('read-receipts')}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                role="menuitem"
              >
                <CheckCheck size={15} className="text-muted-foreground" />
                Read by
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onCloseLightbox}
        >
          <button
            onClick={onCloseLightbox}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            <X size={22} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
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
        <Modal open={!!readReceiptTarget} onClose={onCloseReadReceipts} title="Read by">
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
    </>
  );
}
