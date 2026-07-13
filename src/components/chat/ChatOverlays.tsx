import { X, Reply, Clipboard, Forward, Pin, PinOff, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Modal from '@/components/ui/modal';
import type { Message, Group, GroupMember } from '@/types';

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
  groupInfoOpen: boolean;
  readReceiptTarget: Message | null;
  group: Group | null;
  chatName: string;
  chatId: string;
  currentUserId: string | undefined;
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
  onCloseGroupInfo: () => void;
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
  groupInfoOpen,
  readReceiptTarget,
  group,
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
  onCloseGroupInfo,
  onCloseReadReceipts,
}: ChatOverlaysProps) {
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
            className="absolute w-48 origin-top-left animate-scale-in overflow-hidden rounded-xl border border-border bg-card py-1 shadow-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
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
            <button
              onClick={() => onContextMenuAction('copy')}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
              role="menuitem"
            >
              <Clipboard size={15} className="text-muted-foreground" />
              Copy
            </button>
            <button
              onClick={() => onContextMenuAction('forward')}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
              role="menuitem"
            >
              <Forward size={15} className="text-muted-foreground" />
              Forward
            </button>
            {contextMenu.msg.isPinned ? (
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
            )}
            {contextMenu.msg.readBy && contextMenu.msg.readBy.length > 0 && (
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
            <button
              onClick={() => onContextMenuAction('delete')}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              role="menuitem"
            >
              <Trash2 size={15} />
              Delete
            </button>
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
                    <AvatarImage src={c.avatarUrl} />
                    <AvatarFallback className="text-xs">{c.name[0]}</AvatarFallback>
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

      {groupInfoOpen && group && (
        <Modal open={groupInfoOpen} onClose={onCloseGroupInfo} title={group.name}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={group.avatarUrl} />
                <AvatarFallback className="text-lg">{group.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{group.name}</h3>
                <p className="text-sm text-muted-foreground">{group.members?.length ?? 0} members</p>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Members</h4>
              <div className="space-y-2">
                {group.members?.map((m: GroupMember) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.user?.avatarUrl} />
                      <AvatarFallback className="text-xs">{(m.user?.fullName ?? m.userId)[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">{m.user?.fullName ?? m.userId}</span>
                  </div>
                ))}
              </div>
            </div>
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
                    <AvatarFallback className="text-xs">{userId[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground">{userId}</span>
                  <CheckCheck size={14} className="ml-auto text-accent" />
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No read receipts available</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
