import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquareText, Ban, Loader2, AlertCircle, User, Users, UserPlus, UserMinus, Check, Pencil, X, FileText, Play, ChevronRight, Bell, Shield, Sun, AlertTriangle, LogOut, Share2, Info, Moon, Monitor, Volume2, Key, Eye, EyeOff, ExternalLink, Trash2 } from 'lucide-react';
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
import { loadPrefs, savePrefs } from '@/services/notification';
import { usePrivacyStore } from '@/store/privacyStore';
import { useThemeStore } from '@/store/themeStore';
import { changePassword, deleteAccount, parseAuthError } from '@/services/auth';

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

function SectionItem({ icon: Icon, label, desc, expanded, onToggle, children }: { icon: any; label: string; desc: string; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div>
      <button onClick={onToggle} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-accent/5">
        <Icon size={20} className="shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ChevronRight size={16} className={cn('shrink-0 text-muted-foreground/40 transition-transform', expanded && 'rotate-90')} />
      </button>
      <div className={cn('overflow-hidden transition-all', expanded ? 'max-h-[500px]' : 'max-h-0')}>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

function NotificationsContent() {
  const [prefs, setPrefs] = useState(loadPrefs);
  useEffect(() => { savePrefs(prefs); }, [prefs]);
  const toggle = (key: 'messages' | 'groups' | 'sound') => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  return (
    <div className="space-y-3">
      {[
        { key: 'messages' as const, label: 'Message notifications' },
        { key: 'groups' as const, label: 'Group notifications' },
        { key: 'sound' as const, label: 'Sound' },
      ].map(({ key, label }) => (
        <label key={key} className="flex items-center justify-between">
          <span className="text-sm text-foreground">{label}</span>
          <button
            onClick={() => toggle(key)}
            className={cn(
              'relative h-5 w-9 rounded-full transition-colors',
              prefs[key] ? 'bg-accent' : 'bg-muted-foreground/30',
            )}
          >
            <span className={cn(
              'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
              prefs[key] && 'translate-x-4',
            )} />
          </button>
        </label>
      ))}
    </div>
  );
}

function PrivacyContent() {
  const navigate = useNavigate();
  const { lastSeen, readReceipts, setLastSeen, setReadReceipts } = usePrivacyStore();
  const { data: blockedUsers = [] } = useQuery({ queryKey: ['blockedUsers'], queryFn: getBlockedUsers });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">Last Seen</span>
        <select value={lastSeen} onChange={(e) => setLastSeen(e.target.value as any)} className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="everyone">Everyone</option>
          <option value="contacts">My Contacts</option>
          <option value="nobody">Nobody</option>
        </select>
      </div>
      <label className="flex items-center justify-between">
        <span className="text-sm text-foreground">Read Receipts</span>
        <button onClick={() => setReadReceipts(!readReceipts)} className={cn('relative h-5 w-9 rounded-full transition-colors', readReceipts ? 'bg-accent' : 'bg-muted-foreground/30')}>
          <span className={cn('absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform', readReceipts && 'translate-x-4')} />
        </button>
      </label>
      <button onClick={() => navigate('/settings/privacy/blocked')} className="flex w-full items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-left transition-colors hover:bg-accent/5">
        <span className="text-sm text-foreground">Blocked Users</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">{blockedUsers.length}<ExternalLink size={12} /></div>
      </button>
    </div>
  );
}

function AppearanceContent() {
  const { mode, setMode, fontSize, setFontSize } = useThemeStore();
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Theme</p>
        <div className="flex gap-1.5 rounded-lg bg-muted/50 p-1">
          {[{ id: 'dark' as const, label: 'Dark', icon: Moon }, { id: 'light' as const, label: 'Light', icon: Sun }, { id: 'system' as const, label: 'System', icon: Monitor }].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setMode(id)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors', mode === id ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Font Size</p>
        <div className="flex gap-1.5 rounded-lg bg-muted/50 p-1">
          {[{ id: 'small' as const, label: 'Small' }, { id: 'default' as const, label: 'Default' }, { id: 'large' as const, label: 'Large' }].map(({ id, label }) => (
            <button key={id} onClick={() => setFontSize(id)} className={cn('flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors', fontSize === id ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountContent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [changing, setChanging] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDelPw, setShowDelPw] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChangePw = async () => {
    if (!pwCurrent || !pwNew) { toast.error('Fill in all fields'); return; }
    if (pwNew.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setChanging(true);
    try { await changePassword(pwCurrent, pwNew); toast.success('Password changed'); setPwCurrent(''); setPwNew(''); }
    catch (err) { toast.error(parseAuthError(err)); }
    finally { setChanging(false); }
  };

  const handleDelete = async () => {
    if (!deletePassword) { toast.error('Enter your password'); return; }
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      queryClient.clear();
      useAuthStore.getState().logout();
      destroySocket();
      navigate('/login');
    } catch (err) { toast.error(parseAuthError(err)); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Change Password</p>
      <div className="relative">
        <input type={showPw ? 'text' : 'password'} value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} placeholder="Current password" className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        <button onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
      </div>
      <div className="relative">
        <input type={showPw ? 'text' : 'password'} value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="New password" className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <button onClick={handleChangePw} disabled={changing} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50">
        {changing ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
        {changing ? 'Changing...' : 'Change Password'}
      </button>
      <hr className="border-border" />
      <p className="text-xs font-medium text-destructive">Delete Account</p>
      <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
      <button onClick={() => setDeleteOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5">
        <Trash2 size={14} />Delete Account
      </button>
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteInput(''); setDeletePassword(''); }} hideClose>
        <div className="p-6">
          <h3 className="mb-2 text-lg font-bold text-foreground">Delete Account</h3>
          <p className="mb-4 text-sm text-muted-foreground">Type <strong className="text-foreground">delete</strong> to confirm and enter your password.</p>
          <input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder='Type "delete"' className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="relative mb-4">
            <input type={showDelPw ? 'text' : 'password'} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Your password" className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            <button onClick={() => setShowDelPw(!showDelPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{showDelPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setDeleteOpen(false); setDeleteInput(''); setDeletePassword(''); }} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/5">Cancel</button>
            <button onClick={handleDelete} disabled={deleteInput !== 'delete' || !deletePassword || deleting} className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/80 disabled:opacity-50">
              {deleting ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AboutContent() {
  const features = [
    { name: 'Chat', status: 'active' as const },
    { name: 'Group Chat', status: 'active' as const },
    { name: 'Contacts', status: 'active' as const },
    { name: 'Feed & Posts', status: 'active' as const },
    { name: 'File Sharing', status: 'active' as const },
    { name: 'Voice & Video Calls', status: 'coming' as const },
    { name: 'Dark Mode', status: 'active' as const },
    { name: 'Online Status', status: 'active' as const },
    { name: 'Notification Preferences', status: 'active' as const },
    { name: 'End-to-End Encryption', status: 'coming' as const },
    { name: 'Message Reactions', status: 'active' as const },
    { name: 'Message Forwarding', status: 'active' as const },
    { name: 'Message Pinning', status: 'active' as const },
    { name: 'Read Receipts', status: 'active' as const },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
        <div>
          <p className="text-sm font-bold text-foreground">Hallo Wok</p>
          <p className="text-xs text-muted-foreground">Version 0.0.1</p>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">All Features</p>
        <div className="space-y-1">
          {features.map((f) => (
            <div key={f.name} className="flex items-center gap-2">
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', f.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground/40')} />
              <span className={cn('text-xs', f.status === 'active' ? 'text-foreground' : 'text-muted-foreground/50')}>
                {f.name}{f.status === 'coming' && <span className="ml-1 text-[10px] text-muted-foreground/40">(Coming Soon)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-0.5 text-xs font-medium text-muted-foreground">Developer</p>
        <p className="text-xs text-foreground">@wafley</p>
      </div>
    </div>
  );
}
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

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const displayName = contact?.customName || effectiveUser?.fullName || '';

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
      <div className={cn('flex-1 overflow-y-auto md:pb-0', !isSelf && 'pb-24')}>
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="relative mb-6 flex items-center">
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
              <div className="flex flex-row items-center gap-4 md:gap-12">
                <div onClick={() => isSelf && navigate('/profile/edit')} className={cn(isSelf && 'cursor-pointer')}>
                  <Avatar className="h-20 w-20 md:h-24 md:w-24">
                    {effectiveUser?.avatarUrl && <AvatarImage src={effectiveUser?.avatarUrl} />}
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
                    @{effectiveUser?.username}
                    {contact?.customName && <span className="ml-2 text-muted-foreground/60">• {effectiveUser?.fullName}</span>}
                  </p>

                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{effectiveUser?.bio || 'No bio yet'}</p>

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
                          navigator.clipboard.writeText(`${window.location.origin}/profile/${effectiveUser?.id}`);
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
                    <div className="overflow-hidden rounded-xl border border-border divide-y divide-border">
                      <SectionItem
                        icon={Bell}
                        label="Notifications"
                        desc="Message, group, and sound preferences"
                        expanded={expandedSections.has('notifications')}
                        onToggle={() => toggleSection('notifications')}
                      >
                        <NotificationsContent />
                      </SectionItem>
                      <SectionItem
                        icon={Shield}
                        label="Privacy"
                        desc="Last seen, read receipts, blocked users"
                        expanded={expandedSections.has('privacy')}
                        onToggle={() => toggleSection('privacy')}
                      >
                        <PrivacyContent />
                      </SectionItem>
                      <SectionItem
                        icon={Sun}
                        label="Appearance"
                        desc="Theme preferences"
                        expanded={expandedSections.has('appearance')}
                        onToggle={() => toggleSection('appearance')}
                      >
                        <AppearanceContent />
                      </SectionItem>
                      <SectionItem
                        icon={AlertTriangle}
                        label="Account"
                        desc="Password and account management"
                        expanded={expandedSections.has('account')}
                        onToggle={() => toggleSection('account')}
                      >
                        <AccountContent />
                      </SectionItem>
                      <SectionItem
                        icon={Info}
                        label="About"
                        desc="App info and credits"
                        expanded={expandedSections.has('about')}
                        onToggle={() => toggleSection('about')}
                      >
                        <AboutContent />
                      </SectionItem>
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
