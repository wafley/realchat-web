import { useState, useRef, useEffect, useMemo, useLayoutEffect, type ElementType } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Search, Plus, MessageSquareText, MessageSquarePlus, Users, AlertCircle, RefreshCw, Trash2, Check, X, Loader2, Star, BellOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListSkeleton } from '@/components/layout/LayoutSkeleton';
import Modal from '@/components/ui/modal';
import ContactPopover from '@/components/layout/ContactPopover';
import { useTypingStore, formatTypingLabel } from '@/store/typingStore';
import { usePresenceStore } from '@/store/presenceStore';
import { getConversations, bulkDeleteConversations, searchAllMessages, DM_USER_MAP, type ChatConversation } from '@/services/chat';
import { formatLastSeen } from '@/utils/time';
import { shouldShowLastSeen } from '@/utils/privacy';
import { useDebounce } from '@/hooks/useDebounce';
import { isChatCleared } from '@/lib/chatCleared';
import { useNow } from '@/hooks/useNow';
import { useAuthStore } from '@/store/authStore';
import type { Conversation, SearchMessageResult } from '@/types';

function formatTime(time?: string): string {
  if (!time) return '';
  const date = new Date(time);
  if (isNaN(date.getTime())) return time;
  return formatLastSeen(date) ?? time;
}

function clampText(s?: string, max = 50): string {
  if (!s) return s ?? '';
  return s.length > max ? `${s.slice(0, max).trimEnd()}...` : s;
}

function ChatPreview({ chat }: { chat: ChatConversation }) {
  return (
    <>
      {chat.type === 'group' && chat.lastSenderName && (
        <span className="text-muted-foreground">{chat.lastSenderName}: </span>
      )}
      {clampText(chat.lastMessage)}
    </>
  );
}

export default function ChatList() {
  const navigate = useNavigate();
  const { groupId, userId } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'groups' | 'unread'>('all');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null);

  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useNow(30000);

  const typingMap = useTypingStore((s) => s.typingMap);
  const presenceMap = usePresenceStore((s) => s.presenceMap);

  const presenceOf = (chat: ChatConversation) => {
    const uid = chat.userId || (chat.type === 'dm' ? DM_USER_MAP[chat.id] : undefined);
    const presence = uid ? presenceMap[uid] : undefined;
    return presence
      ? { online: presence.isOnline, lastSeen: presence.lastSeen }
      : { online: chat.online, lastSeen: chat.lastSeen };
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteConversations(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const prev = queryClient.getQueryData<Conversation[]>(['conversations']);
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
        if (!old) return old;
        return old.filter((c) => !ids.includes(c.id));
      });
      return { prev };
    },
    onError: (_err, _ids, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['conversations'], context.prev);
      }
      setToast({ message: 'Failed to delete chats. Please try again.' });
    },
    onSuccess: () => {
      setToast({ message: pendingDeleteIds.length > 1 ? 'Chats deleted' : 'Chat deleted' });
    },
    onSettled: () => {
      setDeleteConfirmOpen(false);
      setDeleteLoading(false);
      exitSelectionMode();
    },
  });

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const conversations = Array.isArray(data) ? data : [];

  const filtered = conversations.filter((c) => {
    if (category === 'groups' && c.type !== 'group') return false;
    if (category === 'unread' && (c.unread ?? 0) <= 0) return false;
    if (!c.name.toLowerCase().includes(search.toLowerCase())) return false;
    const clearedAt = isChatCleared(c.id);
    if (clearedAt) {
      const lastTimeMs = c.lastTime ? Date.parse(c.lastTime) : NaN;
      if (Number.isNaN(lastTimeMs) || lastTimeMs <= Date.parse(clearedAt)) return false;
    }
    return true;
  });

  const debouncedSearch = useDebounce(search, 300);

  const messageResults: SearchMessageResult[] = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    return searchAllMessages(debouncedSearch);
  }, [debouncedSearch]);

  const showSearchResults = search.trim().length > 0;

  const handleLongPressStart = (chatId: string, e: React.MouseEvent) => {
    longPressStartPos.current = { x: e.clientX, y: e.clientY };
    longPressTriggered.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setIsSelectionMode(true);
      setSelectedChatIds((prev) => {
        const next = new Set(prev);
        next.add(chatId);
        return next;
      });
    }, 500);
  };
  const handleLongPressEnd = () => {
    clearTimeout(longPressTimer.current ?? undefined);
  };
  const handleLongPressMove = (e: React.MouseEvent) => {
    if (!longPressStartPos.current) return;
    const dx = e.clientX - longPressStartPos.current.x;
    const dy = e.clientY - longPressStartPos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      clearTimeout(longPressTimer.current ?? undefined);
      longPressStartPos.current = null;
    }
  };

  const handleTouchStart = (chatId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressTriggered.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setIsSelectionMode(true);
      setSelectedChatIds((prev) => {
        const next = new Set(prev);
        next.add(chatId);
        return next;
      });
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!longPressStartPos.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - longPressStartPos.current.x;
    const dy = touch.clientY - longPressStartPos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      clearTimeout(longPressTimer.current ?? undefined);
      longPressStartPos.current = null;
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current ?? undefined);
    longPressStartPos.current = null;
  };

  useEffect(() => {
    return () => {
      clearTimeout(longPressTimer.current ?? undefined);
      longPressStartPos.current = null;
    };
  }, []);

  const handleSelectToggle = (chatId: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      if (next.size === 0) setIsSelectionMode(false);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedChatIds(new Set());
  };

  const handleBulkDelete = () => {
    const ids = pendingDeleteIds;
    setDeleteLoading(true);

    const activeChatId = location.pathname.startsWith('/dm/') ? userId : groupId;
    if (activeChatId && ids.includes(activeChatId)) {
      navigate('/');
    }

    deleteMutation.mutate(ids);
  };

  const openBulkDeleteConfirm = () => {
    setPendingDeleteIds(Array.from(selectedChatIds));
    setDeleteConfirmOpen(true);
  };

  const openSingleDeleteConfirm = (chatId: string) => {
    setPendingDeleteIds([chatId]);
    setDeleteConfirmOpen(true);
  };

  useEffect(() => {
    if (!toast) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, [toast]);

  return (
    <div className="flex h-full flex-col">
      {isSelectionMode ? (
        <div className="flex items-center gap-3 border-b border-border px-3 py-2 lg:px-4 lg:py-3 pt-safe-top">
          <button
            onClick={exitSelectionMode}
            aria-label="Cancel selection"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:h-10 lg:w-10"
          >
            <X size={20} />
          </button>
          <span className="flex-1 text-sm font-medium text-foreground lg:text-base">
            {selectedChatIds.size} selected
          </span>
          <button
            onClick={openBulkDeleteConfirm}
            disabled={selectedChatIds.size === 0}
            aria-label="Delete selected chats"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30 lg:h-10 lg:w-10"
          >
            <Trash2 size={20} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col pt-safe-top">
          <div className="flex items-center justify-between gap-2 p-4 pb-2 lg:px-5 lg:pb-3 lg:pt-5">
            <h1 className="text-2xl font-bold text-foreground lg:text-2xl">Hallo Wok</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/starred')}
                aria-label="Starred messages"
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors lg:h-11 lg:w-11',
                  location.pathname === '/starred'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Star className="h-5 w-5 lg:h-[18px] lg:w-[18px]" />
              </button>
              <button
                onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}
                aria-label="New chat"
                className="hidden shrink-0 lg:flex h-11 w-11 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="h-5 w-5" />
              </button>
              <Link to="/profile" className="lg:hidden">
                <Avatar className="h-9 w-9">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback className="text-xs font-semibold">
                    {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
          <div className="px-4 pb-4 lg:px-5 lg:pb-4">
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground lg:h-[18px] lg:w-[18px]"
              />
              <input
                type="text"
                aria-label="Search chats"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-muted bg-muted py-3 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring lg:py-3 lg:pl-10 lg:pr-3 lg:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 px-4 pb-4 lg:px-5 lg:pb-4">
            {(
              [
                { id: 'all', label: 'Chat' },
                { id: 'groups', label: 'Groups' },
                { id: 'unread', label: 'Unread' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setCategory(id); setSearch(''); }}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors lg:text-sm',
                  category === id
                    ? 'bg-accent text-accent-foreground'
                    : 'border border-border text-muted-foreground hover:bg-accent/10 hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ContactPopover anchorEl={anchorEl} onClose={() => setAnchorEl(null)} />

      <div className="flex-1 overflow-y-auto">
        {isPending ? (
          <ListSkeleton count={6} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={40} className="mb-2 text-destructive/60" />
            <p className="text-sm font-medium text-foreground lg:text-base">Failed to load conversations</p>
            <p className="mt-1 text-xs text-muted-foreground lg:text-sm">{error?.message || 'Something went wrong'}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : showSearchResults ? (
          <>
            {filtered.length > 0 && (
              <div role="list">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground lg:px-5 lg:py-2.5">
                  Conversations
                </div>
                {filtered.map((chat) => {
                  const linkTo = chat.type === 'dm' ? `/dm/${chat.id}` : `/chat/${chat.id}`;
                  const { online, lastSeen } = presenceOf(chat);
                  return (
                    <Link
                      key={chat.id}
                      to={linkTo}
                      state={{ name: chat.name, online, lastSeen, members: chat.members }}
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/5 lg:gap-4 lg:px-5 lg:py-4"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="lg:h-12 lg:w-12">
                          {chat.avatarUrl && <AvatarImage src={chat.avatarUrl} />}
                          <AvatarFallback className="font-semibold text-xs lg:text-base">
                            {chat.type === 'group' ? <Users size={18} /> : (chat.name ? chat.name.charAt(0).toUpperCase() : 'U')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground lg:text-base">{chat.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground lg:text-sm">{formatTime(chat.lastTime)}</span>
                        </div>
                        <p className="line-clamp-1 text-xs text-muted-foreground lg:text-sm"><ChatPreview chat={chat} /></p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            {messageResults.length > 0 && (
              <div role="list" className="border-t border-border">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                  Messages
                </div>
                {messageResults.map((msg) => (
                  <Link
                    key={msg.messageId}
                    to={msg.conversationType === 'dm' ? `/dm/${msg.conversationId}` : `/chat/${msg.conversationId}`}
                    state={{ name: msg.conversationName }}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/5 lg:gap-4 lg:px-5 lg:py-4"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="lg:h-12 lg:w-12">
                        <AvatarFallback className="font-semibold text-xs lg:text-base">
                          {msg.conversationType === 'group' ? <Users size={18} /> : (msg.conversationName ? msg.conversationName.charAt(0).toUpperCase() : 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground lg:text-base">{msg.conversationName}</span>
                        <span className="shrink-0 text-xs text-muted-foreground lg:text-sm">{formatLastSeen(msg.createdAt)}</span>
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground lg:text-sm">
                        <span className="text-foreground/70">{msg.senderName}: </span>
                        {clampText(msg.content)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {filtered.length === 0 && messageResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground lg:text-base">
                <Search size={40} className="mb-2 opacity-30" />
                <p>No results for "{search}"</p>
              </div>
            )}
          </>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground lg:text-base">
            <MessageSquareText size={40} className="mb-2 opacity-30" />
            <p>No chats yet</p>
          </div>
        ) : (
          <div role="list">
            {filtered.map((chat) => {
              const linkTo = chat.type === 'dm' ? `/dm/${chat.id}` : `/chat/${chat.id}`;
              const isActive = chat.type === 'dm' ? userId === chat.id : groupId === chat.id;
              const isSelected = selectedChatIds.has(chat.id);
              const { online, lastSeen } = presenceOf(chat);
              const ItemTag = (isSelectionMode ? 'div' : Link) as ElementType;
              return (
                <ItemTag
                  key={chat.id}
                  {...(!isSelectionMode ? { to: linkTo, state: { name: chat.name, online, lastSeen, members: chat.members } } : {})}
                  role="listitem"
                  aria-current={isActive && !isSelectionMode ? 'page' : undefined}
                  onMouseDown={(e: React.MouseEvent) => {
                    if (e.button !== 0) return;
                    handleLongPressStart(chat.id, e);
                  }}
                  onMouseUp={handleLongPressEnd}
                  onMouseMove={handleLongPressMove}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={(e: React.TouchEvent) => handleTouchStart(chat.id, e)}
                  onTouchMove={(e: React.TouchEvent) => handleTouchMove(e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onContextMenu={(e: React.MouseEvent) => {
                    e.preventDefault();
                    handleLongPressEnd();
                    setContextMenu({ chatId: chat.id, x: e.clientX, y: e.clientY });
                  }}
                  onClick={(e: React.MouseEvent) => {
                    handleLongPressEnd();
                    if (longPressTriggered.current) {
                      longPressTriggered.current = false;
                      e.preventDefault();
                      return;
                    }
                    if (isSelectionMode) {
                      e.preventDefault();
                      handleSelectToggle(chat.id);
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors lg:gap-4 lg:px-5 lg:py-4',
                    isActive && !isSelectionMode
                      ? 'bg-accent/10'
                      : 'hover:bg-accent/5',
                    isSelected && 'bg-accent/10',
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="lg:h-12 lg:w-12">
                      {chat.avatarUrl && <AvatarImage src={chat.avatarUrl} />}
                      <AvatarFallback className="font-semibold text-xs lg:text-base">
                        {chat.type === 'group' ? <Users size={18} /> : (chat.name ? chat.name.charAt(0).toUpperCase() : 'U')}
                      </AvatarFallback>
                    </Avatar>
                    {online && !isSelectionMode && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500 lg:h-3.5 lg:w-3.5" />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-accent/60">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground lg:text-base">
                        {chat.name}
                      </span>
                      {chat.muted && !isSelectionMode && (
                        <BellOff size={13} className="shrink-0 text-muted-foreground/60" aria-label="Muted" />
                      )}
                      <span className="shrink-0 text-xs text-muted-foreground lg:text-sm">
                        {formatTime(chat.lastTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-1 min-w-0 flex-1 text-xs text-muted-foreground lg:text-sm">
                        {typingMap[chat.id]?.length ? (
                          <span className="text-accent">
                            {chat.type === 'dm' ? 'typing...' : formatTypingLabel(typingMap[chat.id]!.map((t) => t.name))}
                          </span>
                        ) : online ? (
                          <ChatPreview chat={chat} />
                        ) : lastSeen && shouldShowLastSeen() ? (
                          <span className="text-muted-foreground">last seen {formatLastSeen(lastSeen)}</span>
                        ) : (
                          <ChatPreview chat={chat} />
                        )}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        {(chat.unread ?? 0) > 0 && !isSelectionMode && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground lg:h-6 lg:w-6 lg:text-xs">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </ItemTag>
              );
            })}
          </div>
        )}
      </div>

      {contextMenu && (
        <div className="fixed inset-0 z-50" onMouseDown={() => setContextMenu(null)}>
          <div
            ref={contextMenuRef}
            className="absolute w-48 rounded-lg border border-border bg-popover py-1 shadow-lg"
            style={{ left: menuPos?.x ?? contextMenu.x, top: menuPos?.y ?? contextMenu.y }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                openSingleDeleteConfirm(contextMenu.chatId);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              <Trash2 size={16} className="text-muted-foreground" />
              Delete Chat
            </button>
          </div>
        </div>
      )}

      <Modal open={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); }} title="Delete Chat">
        <p className="mb-4 text-sm text-muted-foreground">
          {pendingDeleteIds.length === 1
            ? 'This chat will be deleted from your chat list. This action cannot be undone.'
            : `${pendingDeleteIds.length} chats will be deleted from your chat list. This action cannot be undone.`}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => { setDeleteConfirmOpen(false); }}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={deleteLoading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {deleteLoading && <Loader2 size={14} className="animate-spin" />}
            {pendingDeleteIds.length === 1 ? 'Delete Chat' : `Delete ${pendingDeleteIds.length} Chats`}
          </button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[200] -translate-x-1/2 animate-fade-in-up" role="alert" aria-live="polite">
          <div className="flex items-center gap-3 rounded-xl bg-foreground/90 px-5 py-3 text-sm font-medium text-background shadow-xl backdrop-blur-sm">
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <button
        onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}
        aria-label="New chat"
        className="fixed bottom-8 right-7 z-50 flex h-13 w-13 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg transition-all hover:bg-accent/90 active:scale-95 lg:hidden"
      >
        <MessageSquarePlus size={28} strokeWidth={2} />
      </button>
    </div>
  );
}
