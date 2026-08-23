import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquareText, Ban, Loader2, AlertCircle, Users, UserPlus, UserMinus, Check, Pencil, X, FileText, Play, ChevronRight, Bell, Shield, Sun, AlertTriangle, LogOut, Share2, Info, Star, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Modal from '@/components/ui/modal';

import { cn } from '@/lib/utils';
import { resolveFileUrl } from '@/lib/url';
import { formatTime } from '@/lib/chatHelpers';
import { getUser } from '@/services/user';
import { blockUser as blockUserService, unblockUser as unblockUserService, findOrCreateConversation, getSharedMedia, getMutualGroups, getBlockedUsers, getConversations, muteConversation, unmuteConversation } from '@/services/chat';
import { addContact, removeContact, getContacts, updateContactCustomName } from '@/services/contacts';
import { useAuthStore } from '@/store/authStore';
import { usePresenceStore } from '@/store/presenceStore';
import { destroySocket } from '@/services/socket.service';
import { queryClient as appQueryClient } from '@/lib/queryClient';
import { toast } from 'sonner';

import SectionItem from './settings/SectionItem';
import NotificationsContent from './settings/NotificationsContent';
import PrivacyContent from './settings/PrivacyContent';
import AppearanceContent from './settings/AppearanceContent';
import AccountContent from './settings/AccountContent';
import AboutContent from './settings/AboutContent';

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
          src={resolveFileUrl(media.fileUrl)}
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
            <img src={resolveFileUrl(media.fileUrl)} alt={media.fileName || 'Shared video'} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-70" />
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

  const effectiveUser = isSelf && currentUser ? { ...user, ...currentUser } : user;
  const contact = userId ? contacts.find((c) => c.userId === userId) : undefined;
  const isContact = !!contact;

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };
  const displayName = contact?.customName || effectiveUser?.fullName || '';

  const addContactMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('User not found');
      return addContact(user.username);
    },
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
      usePresenceStore.getState().clearPresence(userId!);
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
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
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

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const dmId = useMemo(
    () => conversations.find((c) => c.type === 'dm' && c.userId === userId)?.id ?? null,
    [conversations, userId],
  );

  const { data: sharedMedia = [] } = useQuery({
    queryKey: ['shared-media', dmId],
    queryFn: () => getSharedMedia(dmId!),
    enabled: !!dmId,
    staleTime: 60_000,
  });

  const { data: mutualGroups = [] } = useQuery({
    queryKey: ['mutual-groups', userId],
    queryFn: () => getMutualGroups(userId!),
    enabled: !!userId && !isSelf,
    staleTime: 300_000,
  });

  const dmConversation = useMemo(
    () => conversations.find((c) => c.id === dmId) ?? null,
    [conversations, dmId],
  );

  const muteMutation = useMutation({
    mutationFn: async () => {
      if (!dmId) throw new Error('Conversation not found');
      return dmConversation?.muted ? unmuteConversation(dmId) : muteConversation(dmId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(dmConversation?.muted ? 'Notifications unmuted' : 'Notifications muted');
    },
    onError: () => toast.error('Failed to update notification settings'),
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
      <div className={cn('flex-1 overflow-y-auto md:pb-0', !isSelf && 'pb-24')}>
        <div className="mx-auto max-w-4xl px-6 py-4 pt-safe-top">
          <div className="relative mb-4 flex items-center">
            <button onClick={() => (isSelf ? navigate('/') : navigate(-1))} className="text-muted-foreground transition-colors hover:text-accent">
              <ArrowLeft size={20} />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-foreground">Profile</span>
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
              {/* Profile Cover Banner */}
              <div className="relative h-36 sm:h-44 md:h-52 w-full overflow-hidden rounded-2xl border border-border/40 shadow-md group">
                {effectiveUser?.bannerUrl ? (
                  <img
                    src={resolveFileUrl(effectiveUser.bannerUrl)}
                    alt="Cover Banner"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="relative h-full w-full overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    }}
                  >
                    <div
                      className="absolute -top-16 -right-16 h-64 w-64 rounded-full opacity-40 blur-3xl"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                    <div
                      className="absolute -bottom-12 -left-12 h-56 w-56 rounded-full opacity-20 blur-2xl"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
                  </div>
                )}
              </div>

              {/* Avatar & Header Details */}
              <div className="relative px-2 sm:px-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-3">
                  {/* Avatar with Overlap */}
                  <div className="relative shrink-0">
                    <Avatar
                      className={cn(
                        "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 ring-4 ring-background shadow-2xl bg-card transition-transform hover:scale-105",
                        effectiveUser?.avatarUrl && "cursor-pointer"
                      )}
                      onClick={() => effectiveUser?.avatarUrl && setPreviewUrl(effectiveUser.avatarUrl)}
                    >
                      {effectiveUser?.avatarUrl && <AvatarImage src={effectiveUser?.avatarUrl} className="object-cover" />}
                      <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-muted text-foreground">
                        {(effectiveUser?.fullName || effectiveUser?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Header Actions for self (Desktop) */}
                  {isSelf && (
                    <div className="hidden sm:flex items-center gap-2 mb-1">
                      <button
                        onClick={() => navigate('/profile/edit')}
                        className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-accent/10 hover:border-accent/40"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          if (user?.id) {
                            navigator.clipboard.writeText(`${window.location.origin}/profile/${effectiveUser?.id}`);
                            toast.success('Profile link copied!');
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-accent/10 hover:border-accent/40"
                      >
                        <Share2 size={14} />
                        Share Profile
                      </button>
                    </div>
                  )}
                </div>

                {/* Name, Handle & Bio */}
                <div className="space-y-1">
                  {isContact && editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={handleNameKeyDown}
                        className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1 text-lg font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                      <h2 className="truncate text-lg sm:text-xl font-bold text-foreground">{displayName}</h2>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    @{effectiveUser?.username}
                    {contact?.customName && <span className="ml-2 text-muted-foreground/60">• {effectiveUser?.fullName}</span>}
                  </p>

                  <p className="pt-2 whitespace-pre-wrap text-sm text-foreground/90">{effectiveUser?.bio || 'No bio yet'}</p>
                </div>

                {/* Mobile action buttons for isSelf */}
                {isSelf && (
                  <div className="mt-4 flex sm:hidden items-center gap-2">
                    <button
                      onClick={() => navigate('/profile/edit')}
                      className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent/10"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        if (user?.id) {
                          navigator.clipboard.writeText(`${window.location.origin}/profile/${effectiveUser?.id}`);
                          toast.success('Profile link copied!');
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 flex-1 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent/10"
                    >
                      <Share2 size={14} />
                      Share Profile
                    </button>
                  </div>
                )}
              </div>

              {isSelf && (
                <>
                  <hr className="my-6 border-border/50" />
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Settings & Preferences</p>
                    <div className="space-y-2.5">
                      <SectionItem
                        icon={Bell}
                        label="Notifications"
                        desc="Message, group, and sound preferences"
                        expanded={expandedSection === 'notifications'}
                        onToggle={() => toggleSection('notifications')}
                      >
                        <NotificationsContent />
                      </SectionItem>
                      <SectionItem
                        icon={Shield}
                        label="Privacy"
                        desc="Last seen, read receipts, blocked users"
                        expanded={expandedSection === 'privacy'}
                        onToggle={() => toggleSection('privacy')}
                      >
                        <PrivacyContent />
                      </SectionItem>
                      <SectionItem
                        icon={Sun}
                        label="Appearance"
                        desc="Theme preferences"
                        expanded={expandedSection === 'appearance'}
                        onToggle={() => toggleSection('appearance')}
                      >
                        <AppearanceContent />
                      </SectionItem>
                      <SectionItem
                        icon={AlertTriangle}
                        label="Account"
                        desc="Password and account management"
                        expanded={expandedSection === 'account'}
                        onToggle={() => toggleSection('account')}
                      >
                        <AccountContent />
                      </SectionItem>
                      <SectionItem
                        icon={Info}
                        label="About"
                        desc="App info and credits"
                        expanded={expandedSection === 'about'}
                        onToggle={() => toggleSection('about')}
                      >
                        <AboutContent />
                      </SectionItem>
                    </div>

                    <div className="mt-4 pt-1">
                      <button
                        onClick={() => {
                          appQueryClient.clear();
                          destroySocket();
                          useAuthStore.getState().logout();
                          navigate('/login', { replace: true });
                        }}
                        className="group flex w-full items-center gap-3.5 rounded-xl border border-border/50 bg-card/60 p-3.5 text-left transition-all duration-200 hover:border-destructive/40 hover:bg-destructive/10 shadow-sm"
                      >
                        <LogOut size={20} className="shrink-0 text-muted-foreground transition-colors group-hover:text-destructive" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground group-hover:text-destructive transition-colors">Logout</p>
                          <p className="text-xs text-muted-foreground">Sign out of your account</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!isSelf && <hr className="my-4 border-border/40" />}

              {!isSelf && (
                <div className="space-y-4 px-1">
                  {/* 1. Media, links and docs */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="shrink-0 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">Media, links and docs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">{sharedMedia.length}</span>
                        {sharedMedia.length > 0 && (
                          <button onClick={() => setMediaModalOpen(true)} className="flex items-center text-muted-foreground hover:text-foreground">
                            <ChevronRight size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {sharedMedia.length > 0 ? (
                      <div className="flex items-center gap-2.5 overflow-x-auto py-1 no-scrollbar">
                        {sharedMedia.map((media) => (
                          <div key={media.id} className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <MediaThumb media={media} onClickImage={(url) => setPreviewUrl(url)} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-1 text-xs text-muted-foreground/60 pl-8">
                        No shared media yet
                      </div>
                    )}
                  </div>

                  <hr className="border-border/30" />

                  {/* 2. WhatsApp-style Chat Options List */}
                  <div className="space-y-1">
                    {/* Starred Messages */}
                    <button
                      onClick={() => navigate('/starred')}
                      className="flex w-full items-center gap-3.5 py-2.5 px-2 text-left transition-colors hover:bg-accent/5 rounded-lg group"
                    >
                      <Star size={20} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">Starred messages</p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-muted-foreground/40" />
                    </button>

                    {/* Mute Notifications */}
                    <button
                      onClick={() => {
                        if (!dmId) toast.info('Start a chat with this person first');
                        else muteMutation.mutate();
                      }}
                      disabled={muteMutation.isPending}
                      className="flex w-full items-center gap-3.5 py-2.5 px-2 text-left transition-colors hover:bg-accent/5 rounded-lg group disabled:opacity-50"
                    >
                      {muteMutation.isPending ? (
                        <Loader2 size={20} className="shrink-0 text-muted-foreground animate-spin" />
                      ) : (
                        <Bell size={20} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">Mute notifications</p>
                        <p className="text-xs text-muted-foreground">{dmConversation?.muted ? 'Muted' : 'On'}</p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-muted-foreground/40" />
                    </button>

                    {/* Disappearing Messages */}
                    <button
                      onClick={() => toast.info('Disappearing messages feature coming soon')}
                      className="flex w-full items-center gap-3.5 py-2.5 px-2 text-left transition-colors hover:bg-accent/5 rounded-lg group"
                    >
                      <Clock size={20} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">Disappearing messages</p>
                        <p className="text-xs text-muted-foreground">Off</p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-muted-foreground/40" />
                    </button>
                  </div>

                  <hr className="border-border/30" />

                  {/* 3. Groups in Common */}
                  <div>
                    <div className="mb-2 flex items-center gap-3 px-2">
                      <Users size={20} className="shrink-0 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">Groups in common</span>
                      <span className="ml-auto text-xs font-medium text-muted-foreground">{mutualGroups.length}</span>
                    </div>

                    {mutualGroups.length > 0 ? (
                      <div className="space-y-1 pt-1">
                        {mutualGroups.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => navigate(`/chat/${g.id}`)}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/5"
                          >
                            <Avatar className="h-8 w-8">
                              {g.avatarUrl && <AvatarImage src={g.avatarUrl} alt={g.name} />}
                              <AvatarFallback className="bg-muted text-foreground text-xs">
                                <Users size={14} />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{g.name}</p>
                              <p className="text-xs text-muted-foreground">{g.members} members</p>
                            </div>
                            <ChevronRight size={14} className="text-muted-foreground/40" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-1 text-xs text-muted-foreground/60 pl-8">
                        No mutual groups
                      </div>
                    )}
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
                          if (!url) return null;
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
            src={resolveFileUrl(previewUrl)}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
