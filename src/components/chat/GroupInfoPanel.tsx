import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  X, ArrowLeft, Users, User, UserPlus, UserMinus, Shield, Camera, 
  Pencil, Check, Search, Bell, BellOff, LogOut, Trash2, Loader2, 
  MoreVertical, MessageSquare, Image as ImageIcon, ChevronRight 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Modal from '@/components/ui/modal';
import { toast } from 'sonner';
import { isSupportedImage, SUPPORTED_IMAGE_LABEL, IMAGE_ACCEPT } from '@/utils/imageValidation';
import type { Group, GroupMember, User as UserType } from '@/types';
import { uploadGroupAvatar } from '@/services/chat';
import { getContacts } from '@/services/contacts';
import { getUser } from '@/services/user';
import { usePresenceStore } from '@/store/presenceStore';

function formatDate(date?: Date | string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface MemberRowProps {
  member: GroupMember;
  currentUserId?: string;
  creatorId?: string;
  isAdmin: boolean;
  activeMenuMemberId: string | null;
  setActiveMenuMemberId: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  roleLoading: string | null;
  onRoleToggle: (userId: string, currentRole: 'admin' | 'member') => void;
  onSetRemoveTarget: (target: { userId: string; userName: string }) => void;
  customNameMap?: Map<string, string>;
}

function MemberRow({
  member,
  currentUserId,
  creatorId,
  isAdmin,
  activeMenuMemberId,
  setActiveMenuMemberId,
  menuRef,
  roleLoading,
  onRoleToggle,
  onSetRemoveTarget,
  customNameMap,
}: MemberRowProps) {
  const navigate = useNavigate();
  const isMe = member.userId === currentUserId;
  const isMemberAdmin = member.role === 'admin';
  const isMemberCreator = member.userId === creatorId;

  // Fallback query if member.user is missing or fullName equals member.userId (UUID)
  const isUuidName = !member.user?.fullName || member.user.fullName === member.userId;
  const { data: fetchedUser } = useQuery({
    queryKey: ['user', member.userId],
    queryFn: () => getUser(member.userId),
    enabled: isUuidName && !!member.userId,
    staleTime: 5 * 60 * 1000,
  });

  const displayUser = fetchedUser || member.user;
  const presence = usePresenceStore((s) => s.presenceMap[member.userId]);
  const isOnline = presence ? presence.isOnline : displayUser?.status === 'online';
  const customName = customNameMap?.get(member.userId);
  const displayName = isMe
    ? 'You'
    : (customName || displayUser?.fullName || displayUser?.username || member.userId);
  const username = displayUser?.username;
  const avatarUrl = displayUser?.avatarUrl;

  return (
    <div className="group relative flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-accent/10">
      {/* Clickable Avatar & User Info -> Links to Profile */}
      <Link
        to={`/profile/${member.userId}`}
        className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
      >
        <div className="relative shrink-0">
          <Avatar className="h-9 w-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-accent/10 text-accent font-semibold text-xs">
              {(displayName || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
            {isMe && <span className="text-[10px] text-muted-foreground">(You)</span>}
          </div>
          {username && (
            <p className="truncate text-[11px] text-muted-foreground">@{username}</p>
          )}
        </div>
      </Link>

      {/* Role Text & Popover Action Menu */}
      <div className="flex items-center gap-1 shrink-0">
        {isMemberCreator && (
          <span className="text-[11px] text-muted-foreground mr-0.5">
            Group Creator
          </span>
        )}
        {!isMemberCreator && isMemberAdmin && (
          <span className="text-[11px] text-muted-foreground mr-0.5">
            Group Admin
          </span>
        )}

        {/* Popover Action Menu (Rendered for all rows to keep alignment & interactions consistent) */}
        <div className="relative" ref={activeMenuMemberId === member.userId ? (menuRef as any) : undefined}>
          <button
            onClick={() => setActiveMenuMemberId(activeMenuMemberId === member.userId ? null : member.userId)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/20 hover:text-foreground transition-colors"
            title="Member actions"
          >
            <MoreVertical size={14} />
          </button>

          {activeMenuMemberId === member.userId && (
            <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-border bg-popover p-1 shadow-xl animate-in fade-in-50 zoom-in-95">
              {/* View Profile */}
              <Link
                to={`/profile/${member.userId}`}
                onClick={() => setActiveMenuMemberId(null)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent/10"
              >
                <User size={13} className="text-muted-foreground" />
                View profile
              </Link>

              {/* Send DM (Only for other members) */}
              {!isMe && (
                <button
                  onClick={() => {
                    setActiveMenuMemberId(null);
                    navigate(`/dm/${member.userId}`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent/10"
                >
                  <MessageSquare size={13} className="text-muted-foreground" />
                  Message {displayName.split(' ')[0]}
                </button>
              )}

              {/* Promote / Demote (Only if admin & target is not creator & not self) */}
              {isAdmin && !isMe && !isMemberCreator && (
                <button
                  onClick={() => onRoleToggle(member.userId, member.role)}
                  disabled={roleLoading === member.userId}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent/10 disabled:opacity-50"
                >
                  {roleLoading === member.userId ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Shield size={13} className="text-muted-foreground" />
                  )}
                  {isMemberAdmin ? 'Demote to Member' : 'Promote to Admin'}
                </button>
              )}

              {/* Remove Member (Only if admin & target is not creator & not self) */}
              {isAdmin && !isMe && !isMemberCreator && (
                <button
                  onClick={() => {
                    setActiveMenuMemberId(null);
                    onSetRemoveTarget({
                      userId: member.userId,
                      userName: displayName,
                    });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  <UserMinus size={13} />
                  Remove from group
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GroupInfoPanelProps {
  group: Group | null;
  currentUserId: string | undefined;
  onClose: () => void;
  onUpdateGroup: (data: { name?: string; description?: string }) => Promise<void>;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onLeaveGroup: () => Promise<void>;
  onDeleteGroup: () => Promise<void>;
  onUpdateMemberRole: (userId: string, role: 'admin' | 'member') => Promise<void>;
  searchUsers: (query: string) => Promise<UserType[]>;
  muted?: boolean;
  onToggleMute?: () => void;
}

export default function GroupInfoPanel({
  group,
  currentUserId,
  onClose,
  onUpdateGroup,
  onAddMember,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
  onUpdateMemberRole,
  searchUsers,
  muted = false,
  onToggleMute,
}: GroupInfoPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Member search inside group
  const [memberSearch, setMemberSearch] = useState('');

  // Editing state
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Avatar uploading
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Add Member Modal State
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState<UserType[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [addLoadingUserId, setAddLoadingUserId] = useState<string | null>(null);

  // Member Actions popover state
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Confirm Modals State
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; userName: string } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);

  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const isAdmin = group?.members?.some((m) => m.userId === currentUserId && m.role === 'admin');
  const isCreator = group?.creatorId === currentUserId;

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });
  const customNameMap = new Map(contacts.map((c) => [c.userId, c.customName]).filter((pair): pair is [string, string] => !!pair[1]));
  // Sync state when group prop updates
  useEffect(() => {
    if (group) {
      setNameValue(group.name);
      setDescValue(group.description || '');
    }
  }, [group]);

  // Click outside to close member popover menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuMemberId(null);
      }
    }
    if (activeMenuMemberId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuMemberId]);

  if (!group) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-muted-foreground">
        <Loader2 size={24} className="animate-spin mb-2" />
        <p className="text-sm">Loading group info...</p>
      </div>
    );
  }

  // Filter & sort members (Admins & Creator always on top)
  const filteredMembers = (group.members || [])
    .filter((m) => {
      if (!memberSearch.trim()) return true;
      const query = memberSearch.toLowerCase();
      const custom = customNameMap.get(m.userId)?.toLowerCase() || '';
      const name = m.user?.fullName?.toLowerCase() || '';
      const username = m.user?.username?.toLowerCase() || '';
      const userId = m.userId.toLowerCase();
      return custom.includes(query) || name.includes(query) || username.includes(query) || userId.includes(query);
    })
    .sort((a, b) => {
      const aIsCreator = a.userId === group.creatorId;
      const bIsCreator = b.userId === group.creatorId;
      const aIsAdmin = a.role === 'admin' || aIsCreator;
      const bIsAdmin = b.role === 'admin' || bIsCreator;

      // 1. Admins & Creator on top of regular members
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;

      // 2. Creator first among admins
      if (aIsCreator && !bIsCreator) return -1;
      if (!aIsCreator && bIsCreator) return 1;

      // 3. Current user ("You") higher priority within same role
      const aIsMe = a.userId === currentUserId;
      const bIsMe = b.userId === currentUserId;
      if (aIsMe && !bIsMe) return -1;
      if (!aIsMe && bIsMe) return 1;

      // 4. Alphabetical fallback by display name (customName > fullName)
      const nameA = customNameMap.get(a.userId) || a.user?.fullName || a.userId;
      const nameB = customNameMap.get(b.userId) || b.user?.fullName || b.userId;
      return nameA.localeCompare(nameB);
    });

  // Avatar Upload Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupportedImage(file)) {
      toast.error(`Unsupported image format. Please upload ${SUPPORTED_IMAGE_LABEL}.`);
      return;
    }

    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadGroupAvatar(group.id, file);
      toast.success('Group photo updated');
      queryClient.setQueryData<Group>(['group', group.id], (prev) =>
        prev ? { ...prev, avatarUrl } : prev,
      );
      queryClient.setQueryData<{ id: string; avatarUrl?: string }[]>(['conversations'], (prev) =>
        (prev ?? []).map((c) => (c.id === group.id ? { ...c, avatarUrl } : c)),
      );
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    } catch {
      toast.error('Failed to update group photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Name Save Handler
  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue === group.name) {
      setEditingName(false);
      setNameValue(group.name);
      return;
    }
    setSavingEdit(true);
    try {
      await onUpdateGroup({ name: nameValue.trim() });
      toast.success('Group name updated');
      setEditingName(false);
    } catch {
      toast.error('Failed to update group name');
    } finally {
      setSavingEdit(false);
    }
  };

  // Description Save Handler
  const handleSaveDesc = async () => {
    if (descValue === (group.description || '')) {
      setEditingDesc(false);
      return;
    }
    setSavingEdit(true);
    try {
      await onUpdateGroup({ description: descValue.trim() });
      toast.success('Group description updated');
      setEditingDesc(false);
    } catch {
      toast.error('Failed to update group description');
    } finally {
      setSavingEdit(false);
    }
  };

  // Add Member Search
  const handleAddSearch = async (q: string) => {
    setAddQuery(q);
    if (!q.trim()) {
      setAddResults([]);
      return;
    }
    setAddSearching(true);
    try {
      const users = await searchUsers(q.trim());
      setAddResults(
        users.filter((u) => u.id !== currentUserId && !group.members?.some((m) => m.userId === u.id))
      );
    } catch {
      setAddResults([]);
    } finally {
      setAddSearching(false);
    }
  };

  const handleAddUser = async (userId: string) => {
    setAddLoadingUserId(userId);
    try {
      await onAddMember(userId);
      toast.success('Member added successfully');
      setAddQuery('');
      setAddResults([]);
      setAddOpen(false);
    } catch {
      toast.error('Failed to add member');
    } finally {
      setAddLoadingUserId(null);
    }
  };

  // Role toggle
  const handleRoleToggle = async (userId: string, currentRole: 'admin' | 'member') => {
    setActiveMenuMemberId(null);
    setRoleLoading(userId);
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await onUpdateMemberRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error('Failed to update member role');
    } finally {
      setRoleLoading(null);
    }
  };

  // Remove member
  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await onRemoveMember(removeTarget.userId);
      toast.success('Member removed');
      setRemoveTarget(null);
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setRemoving(false);
    }
  };

  // Leave group
  const handleLeave = async () => {
    setLeaving(true);
    try {
      await onLeaveGroup();
      toast.success('Left group');
      onClose();
      navigate('/');
    } catch {
      toast.error('Failed to leave group');
    } finally {
      setLeaving(false);
      setLeaveConfirmOpen(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    setDeletingGroup(true);
    try {
      await onDeleteGroup();
      toast.success('Group deleted');
      onClose();
      navigate('/');
    } catch {
      toast.error('Failed to delete group');
    } finally {
      setDeletingGroup(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-foreground overflow-y-auto custom-scrollbar border-l border-border">
      {/* 1. Header (WhatsApp Style) */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-sidebar/95 px-4 py-3.5 backdrop-blur pt-safe-top">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
          aria-label="Close group info"
        >
          <X size={18} className="hidden lg:block" />
          <ArrowLeft size={20} className="lg:hidden" />
        </button>
        <h2 className="text-base font-semibold text-foreground">Group info</h2>
      </div>

      <div className="flex-1 space-y-3 pb-8">
        {/* 2. Group Avatar & Basic Info Card */}
        <div className="flex flex-col items-center bg-card/40 px-6 py-6 text-center shadow-xs border-b border-border">
          <div className="relative group mb-4">
            <Avatar className="h-28 w-28 shadow-lg ring-4 ring-background/60">
              {group.avatarUrl && <AvatarImage src={group.avatarUrl} alt={group.name} className="object-cover" />}
              <AvatarFallback className="bg-accent/15 text-accent text-3xl font-bold">
                <Users size={44} />
              </AvatarFallback>
            </Avatar>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                  title="Change group picture"
                >
                  {uploadingAvatar ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      <Camera size={22} />
                      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider">Change</span>
                    </>
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          {/* Group Name (Inline Edit & Perfectly Centered) */}
          <div className="w-full max-w-sm px-2">
            {editingName ? (
              <div className="flex items-center justify-center gap-1.5">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="w-full rounded-lg border border-ring bg-background px-3 py-1.5 text-center text-base font-semibold text-foreground focus:outline-none"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingEdit}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {savingEdit ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameValue(group.name);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="group/name relative flex items-center justify-center min-h-[32px] px-8">
                <h3 className="text-center text-lg font-bold text-foreground leading-snug break-words">
                  {group.name}
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="absolute right-0 flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover/name:opacity-100 text-muted-foreground hover:bg-accent/10 hover:text-accent"
                    title="Edit group name"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Group · {group.members?.length || 0} members
          </p>
          {group.createdAt && (
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">
              Created {formatDate(group.createdAt)}
            </p>
          )}
        </div>

        {/* 3. Description Card */}
        <div className="border-b border-border bg-card/30 px-5 py-3.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
            {isAdmin && !editingDesc && (
              <button
                onClick={() => setEditingDesc(true)}
                className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>

          {editingDesc ? (
            <div className="space-y-2 mt-2">
              <textarea
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                rows={3}
                placeholder="Add group description..."
                autoFocus
                className="w-full resize-none rounded-lg border border-ring bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingDesc(false);
                    setDescValue(group.description || '');
                  }}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDesc}
                  disabled={savingEdit}
                  className="flex items-center gap-1 rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/90"
                >
                  {savingEdit && <Loader2 size={13} className="animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {group.description || <span className="italic text-muted-foreground">No description provided</span>}
            </p>
          )}
        </div>

        {/* 4. Settings & Media Summary Cards (WhatsApp Web Style) */}
        <div className="border-b border-border bg-card/30 py-1">
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-accent/5"
            >
              <div className="flex items-center gap-3">
                {muted ? <BellOff size={18} className="text-accent" /> : <Bell size={18} className="text-muted-foreground" />}
                <span className="text-xs font-medium text-foreground">Mute notifications</span>
              </div>
              <span className="text-xs text-muted-foreground">{muted ? 'Muted' : 'Off'}</span>
            </button>
          )}

          <div className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-accent/5 cursor-pointer">
            <div className="flex items-center gap-3">
              <ImageIcon size={18} className="text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Media, links and docs</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* 5. Member Management Section */}
        <div className="border-b border-border bg-card/30 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Members ({group.members?.length || 0})
              </span>
            </div>

            {isAdmin && (
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/25 transition-colors"
              >
                <UserPlus size={14} />
                Add Member
              </button>
            )}
          </div>

          {/* Member Search Bar */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background/80 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {memberSearch && (
              <button
                onClick={() => setMemberSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Member List */}
          <div className="space-y-1">
            {filteredMembers.map((member: GroupMember) => (
              <MemberRow
                key={member.id}
                member={member}
                currentUserId={currentUserId}
                creatorId={group.creatorId}
                isAdmin={isAdmin ?? false}
                activeMenuMemberId={activeMenuMemberId}
                setActiveMenuMemberId={setActiveMenuMemberId}
                menuRef={menuRef}
                roleLoading={roleLoading}
                onRoleToggle={handleRoleToggle}
                onSetRemoveTarget={setRemoveTarget}
                customNameMap={customNameMap}
              />
            ))}

            {filteredMembers.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No members found</p>
            )}
          </div>
        </div>

        {/* 6. Danger Zone Actions */}
        <div className="bg-card/30 px-5 pb-6 pt-8 space-y-2">
          {!isCreator && (
            <button
              onClick={() => setLeaveConfirmOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15"
            >
              <LogOut size={15} />
              Exit Group
            </button>
          )}

          {isCreator && (
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
            >
              <Trash2 size={15} />
              Delete Group
            </button>
          )}
        </div>
      </div>

      {/* --- MODALS FOR ACTIONS --- */}

      {/* Add Member Modal */}
      {addOpen && (
        <Modal
          open={addOpen}
          onClose={() => {
            setAddOpen(false);
            setAddQuery('');
            setAddResults([]);
          }}
          title="Add Member to Group"
        >
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or username..."
                value={addQuery}
                onChange={(e) => handleAddSearch(e.target.value)}
                autoFocus
                className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {addSearching && (
              <div className="flex justify-center py-4">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {addResults.length > 0 && (
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {addResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleAddUser(u.id)}
                    disabled={addLoadingUserId === u.id}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent/10 disabled:opacity-50"
                  >
                    <Avatar className="h-8 w-8">
                      {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.fullName} />}
                      <AvatarFallback className="bg-accent/10 text-accent font-semibold text-xs">
                        {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">{u.fullName || u.username}</p>
                      <p className="text-[11px] text-muted-foreground">@{u.username}</p>
                    </div>
                    {addLoadingUserId === u.id ? (
                      <Loader2 size={15} className="animate-spin text-accent" />
                    ) : (
                      <UserPlus size={15} className="text-accent" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {addQuery.trim() && !addSearching && addResults.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No eligible users found</p>
            )}
          </div>
        </Modal>
      )}

      {/* Confirm Remove Member */}
      {removeTarget && (
        <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove Member">
          <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to remove <span className="font-semibold text-foreground">{removeTarget.userName}</span> from this group?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRemoveTarget(null)}
              className="rounded-lg border border-border px-3.5 py-1.5 text-xs text-foreground hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              {removing && <Loader2 size={13} className="animate-spin" />}
              Remove
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm Leave Group */}
      {leaveConfirmOpen && (
        <Modal open={leaveConfirmOpen} onClose={() => setLeaveConfirmOpen(false)} title="Exit Group">
          <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to exit <span className="font-semibold text-foreground">{group.name}</span>? You will no longer be able to send or receive messages in this group.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setLeaveConfirmOpen(false)}
              className="rounded-lg border border-border px-3.5 py-1.5 text-xs text-foreground hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              {leaving && <Loader2 size={13} className="animate-spin" />}
              Exit Group
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Group */}
      {deleteConfirmOpen && (
        <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete Group">
          <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to permanently delete <span className="font-semibold text-foreground">{group.name}</span>? This action cannot be undone and will delete all messages for all members.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-lg border border-border px-3.5 py-1.5 text-xs text-foreground hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteGroup}
              disabled={deletingGroup}
              className="flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              {deletingGroup && <Loader2 size={13} className="animate-spin" />}
              Delete Group
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
