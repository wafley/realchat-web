import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, User, ArrowLeft, MessageSquareText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFollowing, getFollowers, getUserFollowing, getUserFollowers, followUser, unfollowUser } from '@/services/friends';
import { findOrCreateConversation } from '@/services/chat';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface FollowListProps {
  type: 'following' | 'followers';
}

export default function FollowList({ type }: FollowListProps) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const targetUserId = userId || currentUser?.id || '';
  const isOwn = !userId || userId === currentUser?.id;
  const isFollowingType = type === 'following';

  const queryFn = isOwn
    ? (isFollowingType ? getFollowing : getFollowers)
    : (isFollowingType
        ? () => getUserFollowing(targetUserId)
        : () => getUserFollowers(targetUserId));

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['follow', type, targetUserId],
    queryFn,
    enabled: !!targetUserId,
  });

  const { data: myFollowing = [] } = useQuery({
    queryKey: ['following'],
    queryFn: getFollowing,
    enabled: isOwn,
  });

  const isFollowing = (uid: string) => myFollowing.some((f) => f.id === uid);

  const invalidateCounts = () => {
    queryClient.invalidateQueries({ queryKey: ['following'] });
    queryClient.invalidateQueries({ queryKey: ['followers'] });
  };

  const followMutation = useMutation({
    mutationFn: (uid: string) => followUser(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow'] });
      invalidateCounts();
    },
    onError: () => toast.error('Failed to follow'),
  });

  const unfollowMutation = useMutation({
    mutationFn: (uid: string) => unfollowUser(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow'] });
      invalidateCounts();
    },
    onError: () => toast.error('Failed to unfollow'),
  });

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (u.fullName ?? '').toLowerCase().includes(search.toLowerCase()) ||
          u.username.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search],
  );

  const handleGoBack = () => {
    if (userId) {
      navigate(`/profile/${userId}`);
    } else {
      navigate('/profile');
    }
  };

  const title = isFollowingType ? 'Following' : 'Followers';

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full flex-1 overflow-y-auto">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={handleGoBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-accent/10"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{users.length} {isFollowingType ? 'following' : 'followers'}</p>
        </div>
        <div className="relative ml-auto max-w-[180px]">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {isFollowingType ? 'Not following anyone yet.' : 'No followers yet.'}
        </p>
      ) : (
        <div>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No results found</p>
          ) : (
            filtered.map((u) => {
              const isMe = u.id === currentUser?.id;
              const isFollowPending = followMutation.isPending && followMutation.variables === u.id;
              const isUnfollowPending = unfollowMutation.isPending && unfollowMutation.variables === u.id;

              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/5"
                >
                  <div
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="relative shrink-0 cursor-pointer"
                  >
                    <Avatar className="h-11 w-11">
                      {u.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                      <AvatarFallback className="font-bold"><User size={18} /></AvatarFallback>
                    </Avatar>
                  </div>
                  <div
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">{u.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.bio || u.username}</p>
                  </div>
                  {!isMe && isOwn && (
                    isFollowingType ? (
                      <button
                        onClick={() => unfollowMutation.mutate(u.id)}
                        disabled={isUnfollowPending}
                        className="shrink-0 rounded-lg border border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
                      >
                        {isUnfollowPending ? '...' : 'Unfollow'}
                      </button>
                    ) : isFollowing(u.id) ? (
                      <button
                        onClick={async () => {
                          try {
                            const dmId = await findOrCreateConversation(u.id);
                            navigate(`/dm/${dmId}`, { state: { name: u.fullName, online: u.status === 'online' } });
                          } catch {
                            toast.error('Failed to open conversation');
                          }
                        }}
                        className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent/10"
                      >
                        <MessageSquareText size={14} className="inline-block" />
                        <span className="ml-1">Message</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => followMutation.mutate(u.id)}
                        disabled={isFollowPending}
                        className="shrink-0 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
                      >
                        {isFollowPending ? '...' : 'Follow Back'}
                      </button>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
