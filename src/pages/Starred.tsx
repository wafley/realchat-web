import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Star, AlertCircle, RefreshCw, Loader2, Users, ChevronRight, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListSkeleton } from '@/components/layout/LayoutSkeleton';
import { getStarredMessages, getConversations, unstarMessage, type StarredMessage } from '@/services/chat';
import { useAuthStore } from '@/store/authStore';
import type { Message, PaginatedResponse } from '@/types';
import { cn } from '@/lib/utils';

function clockTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateHeader(d: Date): string {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'long' });
  }

  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Starred() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user?.id);
  const myAvatar = useAuthStore((s) => s.user?.avatarUrl);

  const { data: convData } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const conversations = Array.isArray(convData) ? convData : [];

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['starred'],
    queryFn: () => getStarredMessages(),
  });

  const starred = Array.isArray(data) ? data : [];

  const convMetaOf = (msg: StarredMessage) => {
    const found = conversations?.find((c) => c.id === msg.groupId);
    const isDM = (msg.conversationType ?? found?.type) === 'dm';
    const isOwn = msg.senderId === me;

    const senderName = isOwn
      ? 'You'
      : (msg.sender?.fullName || msg.sender?.username || 'User');

    let targetName = 'Chat';
    if (isDM) {
      targetName = isOwn
        ? (found?.name || msg.conversationName || 'User')
        : 'You';
    } else {
      targetName = msg.conversationName || found?.name || 'Group';
    }

    const avatarUrl = isOwn
      ? myAvatar
      : (msg.sender?.avatarUrl || msg.conversationAvatarUrl || found?.avatarUrl);

    return {
      senderName,
      targetName,
      type: isDM ? 'dm' : 'group',
      avatarUrl,
      navName: isDM ? (isOwn ? targetName : senderName) : targetName,
    };
  };

  const unstarMutation = useMutation({
    mutationFn: ({ convId, msgId }: { convId: string; msgId: string }) =>
      unstarMessage(convId, msgId),
    onSuccess: (_d, { msgId }) => {
      queryClient.invalidateQueries({ queryKey: ['starred'] });
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Message>>>(
        { queryKey: ['messages'] },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              data: page.data.map((m) =>
                m.id === msgId ? { ...m, isStarred: false, starredAt: null } : m,
              ),
            })),
          };
        },
      );
      toast.success('Message unstarred');
    },
    onError: () => toast.error('Failed to unstar message'),
  });

  const rows = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return [...list].sort(
      (a, b) => (b.starredAt ?? b.createdAt).getTime() - (a.starredAt ?? a.createdAt).getTime(),
    );
  }, [data]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-sidebar px-3 py-2 lg:px-4 lg:py-3">
        <button
          onClick={() => navigate('/')}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:h-10 lg:w-10"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-medium text-foreground lg:text-base">Starred Messages</h1>
          <p className="text-xs text-muted-foreground lg:text-sm">{starred.length} starred</p>
        </div>
        <Star size={18} className="text-amber-400" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isPending ? (
          <ListSkeleton count={6} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={40} className="mb-2 text-destructive/60" />
            <p className="text-sm font-medium text-foreground lg:text-base">Failed to load starred messages</p>
            <p className="mt-1 text-xs text-muted-foreground lg:text-sm">{error?.message || 'Something went wrong'}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground lg:text-base">
            <Star size={40} className="mb-2 opacity-30" />
            <p>No starred messages yet</p>
            <p className="mt-1 text-xs opacity-80">Long-press or right-click a message and choose Star</p>
          </div>
        ) : (
          <div role="list" className="mx-auto max-w-4xl divide-y divide-border/30">
            {rows.map((msg) => {
              const meta = convMetaOf(msg);
              const isOwn = msg.senderId === me;
              const linkTo = meta.type === 'dm' ? `/dm/${msg.groupId}` : `/chat/${msg.groupId}`;
              const isUnstarringThis = unstarMutation.isPending && unstarMutation.variables?.msgId === msg.id;

              return (
                <div
                  key={msg.id}
                  role="listitem"
                  className="group flex cursor-pointer flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-accent/5 lg:px-6 lg:py-4"
                  onClick={() => navigate(linkTo, { state: { name: meta.navName, highlightMessageId: msg.id } })}
                >
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-7 w-7 shrink-0 lg:h-8 lg:w-8">
                        {meta.avatarUrl && <AvatarImage src={meta.avatarUrl} alt={meta.senderName} />}
                        <AvatarFallback className="text-xs font-semibold">
                          {meta.type === 'group' && meta.senderName !== 'You' ? <Users size={14} /> : meta.senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-foreground lg:text-sm">
                        <span className="truncate">{meta.senderName}</span>
                        <span className="text-muted-foreground/60 shrink-0">▸</span>
                        <span className="truncate text-foreground/80">{meta.targetName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground/80">
                      <span>{formatDateHeader(msg.createdAt)}</span>
                      <ChevronRight size={16} className="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  {/* Message Bubble Container */}
                  <div className="pl-9.5 lg:pl-10.5 flex flex-col items-start">
                    <div
                      className={cn(
                        'inline-flex max-w-[85%] flex-col rounded-2xl px-3.5 py-2 text-sm shadow-xs border',
                        isOwn
                          ? 'bg-chat-outgoing-bg text-chat-outgoing-foreground border-white/10 rounded-tr-xs'
                          : 'bg-chat-incoming-bg text-chat-incoming-foreground border-black/5 rounded-tl-xs'
                      )}
                    >
                      {msg.replyTo && (
                        <div className="mb-2 rounded-lg border-l-4 border-emerald-500 bg-black/20 p-2 text-xs">
                          <p className="font-semibold text-emerald-400">~ {msg.replyTo.senderName}</p>
                          <p className="truncate text-foreground/80">{msg.replyTo.type === 'image' ? '📷 Photo' : msg.replyTo.content}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-end justify-between gap-3 min-w-0">
                        <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">
                          {msg.content || (
                            msg.type === 'image' ? '📷 Photo' : 
                            msg.type === 'video' ? '🎬 Video' : 
                            msg.type === 'file' ? (msg.fileName ?? '📎 Document') : ''
                          )}
                        </span>

                        <span
                          className={cn(
                            'inline-flex select-none items-center gap-1 shrink-0 text-[10px] pb-0.5 ml-auto',
                            isOwn ? 'text-white/70' : 'text-muted-foreground/80'
                          )}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unstarMutation.mutate({ convId: msg.groupId, msgId: msg.id });
                            }}
                            disabled={unstarMutation.isPending}
                            aria-label="Unstar message"
                            title="Unstar message"
                            className="flex items-center gap-0.5 transition-opacity hover:opacity-70 disabled:opacity-50"
                          >
                            {isUnstarringThis ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Star size={11} className="fill-current text-amber-400" />
                            )}
                          </button>
                          <span>{clockTime(msg.createdAt)}</span>
                          {isOwn && (
                            <CheckCheck size={13} className={msg.status === 'read' ? 'text-sky-400' : 'text-white/60'} />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
