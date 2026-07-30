import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquareText, Ban, Loader2, AlertCircle, User, Users, UserPlus, UserMinus, Check, Pencil, X, FileText, Play, ChevronRight, Bell, Shield, Sun, AlertTriangle, LogOut, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Modal from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/chatHelpers';
import { getUser } from '@/services/user';
import { blockUser as blockUserService, unblockUser as unblockUserService, findOrCreateConversation, getSharedMedia, getMutualGroups, getBlockedUsers } from '@/services/chat';
import { addContact, removeContact, getContacts, updateContactCustomName } from '@/services/contacts';
import { useAuthStore } from '@/store/authStore';
import { destroySocket } from '@/services/socket.service';
import { queryClient as appQueryClient } from '@/lib/queryClient';
import { toast } from 'sonner';

function formatFileSize(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function isLinkContent(content?: string): boolean {
  return !!content && /https?:\/\/[^\s]+/.test(content);
}

function extractUrl(content: string): string | null {
  const match = content.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

function urlDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

function MediaThumb({ media, onClickImage }: { media: { id: string; type: string; content?: string; fileUrl?: string; fileName?: string; fileSize?: number; duration?: number }; onClickImage?: (url: string) => void }) {
  const isLink = media.type === 'text';
  const linkUrl = isLink ? extractUrl(media.content || '') : null;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
      {media.type === 'image' ? (
        <img
          src={media.fileUrl}
          alt={media.fileName || 'Shared image'}
          loading="lazy"
          decoding="async"
          className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
          onClick={() => {
            if (media.fileUrl && media.fileUrl !== '#') {
              onClickImage?.(media.fileUrl);
            } else {
              toast.error('Preview not available');
            }
          }}
        />
      ) : media.type === 'video' ? (
        <div
          className="relative flex h-full w-full cursor-pointer items-center justify-center bg-black/10"
          onClick={() => toast.info('Video playback coming soon')}
        >
          {media.fileUrl && media.fileUrl !== '#' ? (
            <img src={media.fileUrl} alt={media.fileName || 'Shared video'} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-70" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Play size={24} className="text-muted-foreground" fill="currentColor" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50">
              <Play size={14} className="text-white" fill="white" />
            </div>
          </div>
          {media.duration && (
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
              {media.duration < 60 ? `${media.duration}s` : `${Math.floor(media.duration / 60)}m`}
            </span>
          )}
        </div>
      ) : isLink && linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 transition-colors hover:bg-accent/10"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <span className="max-w-full truncate text-[10px] font-medium text-foreground">{urlDomain(linkUrl)}</span>
          <span className="max-w-full truncate text-[9px] text-muted-foreground">{linkUrl}</span>
        </a>
      ) : (
        <div className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 p-2 transition-colors hover:bg-accent/10">
          <FileText size={20} className="text-muted-foreground" />
          <span className="max-w-full truncate text-[10px] text-muted-foreground">{media.fileName}</span>
          {media.fileSize && <span className="text-[10px] text-muted-foreground/60">{formatFileSize(media.fileSize)}</span>}
        </div>
      )}
    </div>
  );
}

export default function UserProfile() {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const userId = paramUserId || currentUser?.id;
  const isSelf = currentUser?.id === userId;

  const avatarUrl = isSelf ? (currentUser?.avatarUrl || user?.avatarUrl) : user?.avatarUrl;

  const { data: user, isPending, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
    enabled: !isSelf,
  });

  const contact = userId ? contacts.find((c) => c.userId === userId) : undefined;
  const isContact = !!contact;
  const displayName = contact?.customName || user?.fullName || '';

  const addContactMutation = useMutation({
    mutationFn: () => addContact(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact added!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to add contact'),
  });

  const removeContactMutation = useMutation({
    mutationFn: () => removeContact(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact removed');
    },
    onError: () => toast.error('Failed to remove contact'),
  });

  const blockMutation = useMutation({
    mutationFn: () => blockUserService(userId!),
    onSuccess: () => {
      toast.success('User blocked');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
    onError: () => toast.error('Failed to block user'),
  });

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: getBlockedUsers,
    enabled: !isSelf,
  });

  const isBlocked = blockedUsers.some((b) => b.id === userId);

  const unblockMutation = useMutation({
    mutationFn: () => unblockUserService(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('User unblocked');
    },
    onError: () => toast.error('Failed to unblock user'),
  });

  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<'media' | 'file' | 'link'>('media');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const updateNameMutation = useMutation({
    mutationFn: () => updateContactCustomName(userId!, nameInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEditingName(false);
      toast.success('Contact name updated');
    },
    onError: () => toast.error('Failed to update contact name'),
  });

  const handleStartEdit = () => {
    setNameInput(contact?.customName || user?.fullName || '');
    setEditingName(true);
  };

  const handleSaveEdit = () => {
    if (!nameInput.trim()) return;
    updateNameMutation.mutate();
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNameInput('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const { data: dmId } = useQuery({
    queryKey: ['dm', userId],
    queryFn: () => findOrCreateConversation(userId!),
    enabled: !!userId && !isSelf,
  });

  const { data: sharedMedia = [] } = useQuery({
    queryKey: ['shared-media', dmId],
    queryFn: () => getSharedMedia(dmId!),
    enabled: !!dmId,
  });

  const { data: mutualGroups = [] } = useQuery({
    queryKey: ['mutual-groups', userId],
    queryFn: () => getMutualGroups(userId!),
    enabled: !!userId && !isSelf,
  });

  const actionsBar = !isSelf ? (
    <div className="grid grid-cols-3 gap-2">
      {isContact ? (
        <button
          onClick={() => removeContactMutation.mutate()}
          disabled={removeContactMutation.isPending}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-2 py-2.5 text-sm text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          {removeContactMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
          <span className="hidden sm:inline">{removeContactMutation.isPending ? 'Removing...' : 'Remove'}</span>
        </button>
      ) : (
        <button
          onClick={() => addContactMutation.mutate()}
          disabled={addContactMutation.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-2 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
        >
          {addContactMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          <span className="hidden sm:inline">{addContactMutation.isPending ? 'Adding...' : 'Add'}</span>
        </button>
      )}
      <button
        onClick={async () => {
          try {
            const dmId = await findOrCreateConversation(user?.id ?? userId!);
            navigate(`/dm/${dmId}`, { state: { name: displayName, online: user?.status === 'online' } });
          } catch {
            toast.error('Failed to open conversation');
          }
        }}
        className="flex items-center justify-center gap-2 rounded-lg bg-accent px-2 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
      >
        <MessageSquareText size={16} />
        <span className="hidden sm:inline">Chat</span>
      </button>
      <button
        onClick={() => {
          if (isBlocked) {
            unblockMutation.mutate();
          } else {
            blockMutation.mutate();
          }
        }}
        disabled={blockMutation.isPending || unblockMutation.isPending}
        className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-sm transition-colors disabled:opacity-50 ${
          isBlocked
            ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
            : 'border-border text-foreground hover:bg-accent/10'
        }`}
      >
        {blockMutation.isPending || unblockMutation.isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Ban size={16} />
        )}
        <span className="hidden sm:inline">
          {blockMutation.isPending
            ? 'Blocking...'
            : unblockMutation.isPending
              ? 'Unblocking...'
              : isBlocked
                ? 'Unblock'
                : 'Block'}
        </span>
      </button>
    </div>
  ) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => (isSelf ? navigate('/') : navigate(-1))} className="text-muted-foreground transition-colors hover:text-accent">
              <ArrowLeft size={20} />
            </button>
          </div>

          {isPending ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : isError || !user ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle size={40} className="mb-2 text-destructive/60" />
              <p className="text-sm font-medium text-foreground">User not found</p>
              <p className="mt-1 text-xs text-muted-foreground">The user you're looking for doesn't exist</p>
            </div>
          ) : (
            <>
              <div className="flex flex-row items-center gap-4 md:gap-12">
                <div onClick={() => isSelf && navigate('/profile/edit')} className={cn(isSelf && 'cursor-pointer')}>
                  <Avatar className="h-20 w-20 md:h-24 md:w-24">
                    {avatarUrl && <AvatarImage src={avatarUrl} />}
                    <AvatarFallback className="text-lg md:text-2xl">
                      <User size={22} />
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  {isContact && editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={handleNameKeyDown}
                        className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1 text-base font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateNameMutation.isPending || !nameInput.trim()}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10 disabled:opacity-30"
                      >
                        {updateNameMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-base font-bold text-foreground">{displayName}</h2>
                      {isContact && (
                        <button
                          onClick={handleStartEdit}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                    {contact?.customName && <span className="ml-2 text-muted-foreground/60">• {user.fullName}</span>}
                  </p>

                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{user.bio || 'No bio yet'}</p>

              {isSelf && (
                <>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => navigate('/profile/edit')}
                      className="flex-1 rounded-lg border border-border px-6 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        if (user?.id) {
                          navigator.clipboard.writeText(`${window.location.origin}/profile/${user.id}`);
                          toast.success('Profile link copied!');
                        }
                      }}
                      className="flex items-center justify-center gap-2 flex-1 rounded-lg border border-border px-6 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10"
                    >
                      <Share2 size={16} />
                      Share Profile
                    </button>
                  </div>

                  <hr className="my-6 border-border" />
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground/65">Settings</p>
                    <div className="overflow-hidden rounded-xl border border-border">
                      <Link
                        to="/settings/notifications"
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/5"
                      >
                        <Bell size={20} className="text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">Notifications</p>
                          <p className="text-xs text-muted-foreground">Message, group, and sound preferences</p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground/40" />
                      </Link>
                      <hr className="border-border" />
                      <Link
                        to="/settings/privacy"
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/5"
                      >
                        <Shield size={20} className="text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">Privacy</p>
                          <p className="text-xs text-muted-foreground">Last seen, read receipts, blocked users</p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground/40" />
                      </Link>
                      <hr className="border-border" />
                      <Link
                        to="/settings/appearance"
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/5"
                      >
                        <Sun size={20} className="text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">Appearance</p>
                          <p className="text-xs text-muted-foreground">Theme preferences</p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground/40" />
                      </Link>
                      <hr className="border-border" />
                      <Link
                        to="/settings/account"
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/5"
                      >
                        <AlertTriangle size={20} className="text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">Account</p>
                          <p className="text-xs text-muted-foreground">Danger zone and account management</p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground/40" />
                      </Link>
                      <hr className="border-border" />
                      <button
                        onClick={() => {
                          appQueryClient.clear();
                          destroySocket();
                          useAuthStore.getState().logout();
                          navigate('/login', { replace: true });
                        }}
                        className="flex w-full items-center gap-4 p-4 text-destructive transition-colors hover:bg-destructive/5"
                      >
                        <LogOut size={20} />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-sm font-medium">Logout</p>
                          <p className="text-xs text-muted-foreground">Sign out of your account</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!isSelf && <hr className="my-3 border-border" />}

              {!isSelf && sharedMedia.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-medium text-muted-foreground/65">Media, Links and Docs</h3>
                    <button onClick={() => setMediaModalOpen(true)} className="mt-0.5 flex items-center gap-0.5 text-xs text-accent transition-colors hover:text-accent/80">
                      View all ({sharedMedia.length})
                      <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
                    {sharedMedia.slice(0, 8).map((media, i) => (
                      <div key={media.id} className={i >= 5 ? 'hidden sm:block' : ''}>
                        <MediaThumb media={media} onClickImage={(url) => setPreviewUrl(url)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isSelf && mutualGroups.length > 0 && (
                <div className="mt-3">
                  <h3 className="mb-2 text-xs font-medium text-muted-foreground/65">Groups in Common ({mutualGroups.length})</h3>
                  <div className="max-h-[290px] space-y-1.5 overflow-y-auto md:max-h-none md:overflow-visible">
                    {mutualGroups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => navigate(`/chat/${g.id}`)}
                        className="flex w-full items-center gap-2.5 rounded-lg border border-border/50 px-3 py-2 text-left transition-colors hover:bg-accent/5"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            <Users size={14} />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{g.name}</p>
                          <p className="text-xs text-muted-foreground">{g.members} members</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Modal open={mediaModalOpen} onClose={() => setMediaModalOpen(false)} className="max-w-4xl" hideClose>
                <div className="mb-4 flex items-center gap-0.5 rounded-xl bg-accent/10 p-1">
                  {(['media', 'file', 'link'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setMediaTab(tab)}
                      className={`flex-1 rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                        mediaTab === tab
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'media' ? 'Media' : tab === 'file' ? 'Docs' : 'Links'}
                    </button>
                  ))}
                  <button
                    onClick={() => setMediaModalOpen(false)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="h-[420px] overflow-y-auto">
                  {mediaTab === 'link' || mediaTab === 'file' ? (
                    <div className="space-y-2">
                      {sharedMedia.filter((m) => mediaTab === 'link' ? (m.type === 'text' && isLinkContent(m.content)) : m.type === 'file').map((item) => {
                        if (mediaTab === 'link') {
                          const msg = item;
                          const url = extractUrl(msg.content || '');
                          const caption = msg.content?.replace(/https?:\/\/[^\s]+/g, '').trim();
                          return (
                            <a
                              key={msg.id}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/5"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{urlDomain(url || '')}</p>
                                {caption && <p className="mt-0.5 truncate text-xs text-muted-foreground">{caption}</p>}
                                <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                                  {formatTime(msg.createdAt)} &middot; {msg.sender?.fullName || 'Unknown'}
                                </p>
                              </div>
                            </a>
                          );
                        }
                        const msg = item;
                        return (
                          <div
                            key={msg.id}
                            className="flex items-start gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/5"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
                              <FileText size={16} className="text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{msg.fileName || 'File'}</p>
                              {msg.content && <p className="mt-0.5 truncate text-xs text-muted-foreground">{msg.content}</p>}
                              <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                                {msg.fileSize ? formatFileSize(msg.fileSize) : null}{msg.fileSize ? ' · ' : ''}{formatTime(msg.createdAt)} &middot; {msg.sender?.fullName || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {sharedMedia.filter((m) => mediaTab === 'link' ? (m.type === 'text' && isLinkContent(m.content)) : m.type === 'file').length === 0 && (
                        <p className="py-10 text-center text-xs text-muted-foreground">{mediaTab === 'link' ? 'No links' : 'No documents'}</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {sharedMedia.filter((m) => m.type === 'image' || m.type === 'video').map((media) => (
                        <MediaThumb key={media.id} media={media} onClickImage={(url) => setPreviewUrl(url)} />
                      ))}
                      {sharedMedia.filter((m) => m.type === 'image' || m.type === 'video').length === 0 && (
                        <p className="col-span-full py-10 text-center text-xs text-muted-foreground">No media</p>
                      )}
                    </div>
                  )}
                </div>
              </Modal>

              {!isSelf && <hr className="my-3 border-border hidden md:block" />}
              {!isSelf && <div className="hidden md:block">{actionsBar}</div>}

            </>
          )}
        </div>
      </div>

      {!isSelf && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background p-3">
          {actionsBar}
        </div>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            <X size={22} />
          </button>
          <img
            src={previewUrl}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
