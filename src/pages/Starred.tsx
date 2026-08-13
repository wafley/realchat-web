import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Star, Users, User, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListSkeleton } from '@/components/layout/LayoutSkeleton';
import { getStarredMessages, getConversations, unstarMessage, type StarredMessage } from '@/services/chat';
import { useAuthStore } from '@/store/authStore';
import type { Message, PaginatedResponse } from '@/types';

function clockTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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
    let name = msg.conversationName ?? found?.name;
    if (msg.senderId === me) {
      name = 'You';
    } else if (!name && isDM && msg.senderId !== me) {
      name = msg.sender?.fullName || msg.sender?.username || '';
    }
    return {
      name: name || (isDM ? 'Direct message' : 'Group'),
      type: isDM ? 'dm' : 'group',
      avatarUrl: msg.senderId === me ? myAvatar : msg.conversationAvatarUrl ?? found?.avatarUrl,
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
          <div role="list">
            {rows.map((msg) => {
              const meta = convMetaOf(msg);
              const isOwn = msg.senderId === me;
              const linkTo = meta.type === 'dm' ? `/dm/${msg.groupId}` : `/chat/${msg.groupId}`;
              return (
                <div
                  key={msg.id}
                  role="listitem"
                  className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-accent/5 lg:gap-4 lg:px-5 lg:py-4"
                  onClick={() => navigate(linkTo, { state: { name: meta.name } })}
                >
                  <div className="flex w-full items-start gap-2.5">
                    <Avatar className="mt-0.5 h-6 w-6 shrink-0">
                      {meta.avatarUrl && <AvatarImage src={meta.avatarUrl} />}
                      <AvatarFallback className="text-[9px]">
                        {meta.type === 'group' ? <Users size={12} /> : <User size={12} />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 truncate text-xs font-medium text-foreground lg:text-sm">
                          {meta.name}
                        </span>
                      </div>
                      <span className={`inline-flex max-w-full rounded-2xl px-2.5 py-1.5 text-sm lg:px-3 lg:py-2 lg:text-base ${
                        isOwn
                          ? 'bg-chat-outgoing-bg text-chat-outgoing-foreground rounded-br-md border border-white/10'
                          : 'bg-chat-incoming-bg text-chat-incoming-foreground rounded-bl-md border border-black/5'
                      }`}>
                        <span className="flex min-w-0 items-end gap-1.5">
                          <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] pb-0.5">
                            {msg.content || (msg.type === 'image' ? '📷 Photo' : msg.type === 'video' ? '🎬 Video' : msg.type === 'file' ? (msg.fileName ?? '📎 Document') : '')}
                          </span>
                          <span className={`inline-flex select-none items-center gap-1 shrink-0 pb-0.5 text-[9px] lg:text-[10px] ${
                            isOwn ? 'text-white/60' : 'text-muted-foreground/75'
                          }`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                unstarMutation.mutate({ convId: msg.groupId, msgId: msg.id });
                              }}
                              disabled={unstarMutation.isPending}
                              aria-label="Unstar message"
                              title="Unstar"
                              className="transition-opacity hover:opacity-70 disabled:opacity-50"
                            >
                              {unstarMutation.isPending && unstarMutation.variables?.msgId === msg.id ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <Star size={10} className="fill-current" />
                              )}
                            </button>
                            {clockTime(msg.createdAt)}
                          </span>
                        </span>
                      </span>
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
