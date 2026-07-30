import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Reply, Clipboard, Forward, Pin, PinOff, CheckCheck, Trash2, Loader2, CheckSquare, Edit3, UserPlus, UserMinus, LogOut, Shield, Crown, Camera, Users, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Modal from '@/components/ui/modal';
import type { Message, Group, GroupMember, User as UserType } from '@/types';
import { senderName, uploadGroupAvatar } from '@/services/chat';

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
  onUpdateGroup: (data: { name?: string; description?: string; avatarUrl?: string }) => Promise<void>;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onLeaveGroup: () => Promise<void>;
  onDeleteGroup: () => Promise<void>;
  onUpdateMemberRole: (userId: string, role: 'admin' | 'member') => Promise<void>;
  searchUsers: (query: string) => Promise<UserType[]>;
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
  chatId: _chatId,
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
  onUpdateGroup,
  onAddMember,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
  onUpdateMemberRole,
  searchUsers,
}: ChatOverlaysProps) {
  const isAdmin = group?.members?.some((m) => m.userId === currentUserId && m.role === 'admin');
  const isCreator = group?.creatorId === currentUserId;

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editing, setEditing] = useState(false);

  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState<UserType[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<{ userId: string; userName: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const [savingEdit, setSavingEdit] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [_avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setEditName(group?.name ?? '');
    setEditDesc(group?.description ?? '');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setSavingEdit(true);
    let avatarUrl: string | undefined;
    if (_avatarFile && group) {
      avatarUrl = await uploadGroupAvatar(group.id, _avatarFile);
    }
    await onUpdateGroup({ name: editName.trim(), description: editDesc.trim(), avatarUrl: avatarUrl ?? avatarPreview ?? undefined });
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setSavingEdit(false);
    setEditing(false);
  };

  const handleAddSearch = async (q: string) => {
    setAddQuery(q);
    if (!q.trim()) { setAddResults([]); return; }
    setAddSearching(true);
    const users = await searchUsers(q.trim());
    setAddResults(users.filter((u) => u.id !== currentUserId && !group?.members?.some((m) => m.userId === u.id)));
    setAddSearching(false);
  };

  const handleAddUser = async (userId: string) => {
    setAddSearching(true);
    await onAddMember(userId);
    setAddQuery('');
    setAddResults([]);
    setAddSearching(false);
    setAddOpen(false);
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    await onRemoveMember(removeTarget.userId);
    setRemoving(false);
    setRemoveTarget(null);
  };

  const handleLeave = async () => {
    setLeaving(true);
    await onLeaveGroup();
    setLeaving(false);
    setLeaveConfirmOpen(false);
  };

  const handleDeleteGroup = async () => {
    setDeletingGroup(true);
    await onDeleteGroup();
    setDeletingGroup(false);
    setDeleteConfirmOpen(false);
  };

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
            {contextMenu.msg.senderId === currentUserId && contextMenu.msg.type === 'text' && (Date.now() - new Date(contextMenu.msg.createdAt).getTime()) < 15 * 60 * 1000 && (
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

      {groupInfoOpen && group && !editing && !addOpen && (
        <Modal open={groupInfoOpen && !editing && !addOpen} onClose={onCloseGroupInfo} title={group.name}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {group.avatarUrl && <AvatarImage src={group.avatarUrl} />}
                <AvatarFallback className="text-lg"><Users size={24} /></AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-foreground">{group.name}</h3>
                {group.description && (
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                )}
                <p className="text-sm text-muted-foreground">{group.members?.length ?? 0} members</p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Members</h4>
                {isAdmin && (
                  <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80"
                  >
                    <UserPlus size={14} />
                    Add
                  </button>
                )}
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {group.members?.map((m: GroupMember) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                    <Link to={`/profile/${m.userId}`} className="relative">
                      <Avatar className="h-8 w-8">
                        {m.user?.avatarUrl && <AvatarImage src={m.user.avatarUrl} />}
                        <AvatarFallback className="text-xs"><User size={14} /></AvatarFallback>
                      </Avatar>
                      {m.user?.status === 'online' && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                      )}
                    </Link>
                    <Link to={`/profile/${m.userId}`} className="min-w-0 flex-1">
                      <span className="text-sm text-foreground hover:text-accent">{m.user?.fullName ?? m.userId}</span>
                      <div className="flex items-center gap-1">
                        {m.role === 'admin' && m.userId !== group.creatorId && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                            <Shield size={10} />
                            Admin
                          </span>
                        )}
                        {m.userId === group.creatorId && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                            <Crown size={10} />
                            Creator
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-1">
                      {isAdmin && m.userId !== currentUserId && m.userId !== group.creatorId && (
                        <>
                          {roleLoading === m.userId ? (
                            <Loader2 size={14} className="animate-spin text-muted-foreground" />
                          ) : (
                            <button
                              onClick={async () => {
                                setRoleLoading(m.userId);
                                await onUpdateMemberRole(m.userId, m.role === 'admin' ? 'member' : 'admin');
                                setRoleLoading(null);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                              title={m.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                            >
                              <Shield size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => setRemoveTarget({ userId: m.userId, userName: m.user?.fullName ?? m.userId })}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <UserMinus size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {isAdmin && (
                <button
                  onClick={handleStartEdit}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                >
                  <Edit3 size={15} />
                  Edit Group
                </button>
              )}
              {!isCreator && (
                <button
                  onClick={() => setLeaveConfirmOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut size={15} />
                  Leave Group
                </button>
              )}
              {isCreator && (
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 size={15} />
                  Delete Group
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {groupInfoOpen && editing && (
        <Modal open={editing} onClose={() => { setEditing(false); setAvatarPreview(null); setAvatarFile(null); }} title="Edit Group">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {(avatarPreview || group?.avatarUrl) && <AvatarImage src={avatarPreview ?? group?.avatarUrl} />}
                  <AvatarFallback className="text-lg"><Users size={28} /></AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-accent text-accent-foreground shadow transition-colors hover:bg-accent/80"
                >
                  <Camera size={12} />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Group Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim() || savingEdit}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {savingEdit && <Loader2 size={14} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {groupInfoOpen && addOpen && (
        <Modal open={addOpen} onClose={() => { setAddOpen(false); setAddQuery(''); setAddResults([]); }} title="Add Member">
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={addQuery}
                onChange={(e) => handleAddSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {addSearching && (
              <div className="flex justify-center py-3">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            )}
            {addResults.length > 0 && (
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {addResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleAddUser(u.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/10"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs"><User size={14} /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{u.fullName}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                    <UserPlus size={16} className="text-accent" />
                  </button>
                ))}
              </div>
            )}
            {addQuery.trim() && !addSearching && addResults.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No users found</p>
            )}
          </div>
        </Modal>
      )}

      {removeTarget && (
        <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove member">
          <p className="mb-4 text-sm text-muted-foreground">
            Are you sure you want to remove <span className="font-medium text-foreground">{removeTarget.userName}</span> from the group?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setRemoveTarget(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {removing && <Loader2 size={14} className="animate-spin" />}
              Remove
            </button>
          </div>
        </Modal>
      )}

      {leaveConfirmOpen && (
        <Modal open={leaveConfirmOpen} onClose={() => setLeaveConfirmOpen(false)} title="Leave group">
          <p className="mb-4 text-sm text-muted-foreground">
            Are you sure you want to leave <span className="font-medium text-foreground">{group?.name}</span>? You will need to be invited back to rejoin.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setLeaveConfirmOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {leaving && <Loader2 size={14} className="animate-spin" />}
              Leave
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirmOpen && (
        <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete group">
          <p className="mb-4 text-sm text-muted-foreground">
            Are you sure you want to permanently delete <span className="font-medium text-foreground">{group?.name}</span>? This action cannot be undone. All messages will be lost.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteGroup}
              disabled={deletingGroup}
              className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {deletingGroup && <Loader2 size={14} className="animate-spin" />}
              Delete
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
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No read receipts available</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
