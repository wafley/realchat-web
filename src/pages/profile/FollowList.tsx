import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, User, MessageSquareText, UserMinus, UserPlus, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFollowing, getFollowers, getUserFollowing, getUserFollowers, followUser, unfollowUser } from '@/services/friends';
import { useAuthStore } from '@/store/authStore';
import { findOrCreateConversation } from '@/services/chat';
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

  const followMutation = useMutation({
    mutationFn: (uid: string) => followUser(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow'] });
      toast.success('Followed!');
    },
    onError: () => toast.error('Failed to follow'),
  });

  const unfollowMutation = useMutation({
    mutationFn: (uid: string) => unfollowUser(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow'] });
      toast.success('Unfollowed');
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

  const handleMessage = async (friendId: string, name: string) => {
    try {
      const dmId = await findOrCreateConversation(friendId);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/dm/${dmId}`, { state: { name } });
    } catch {
      toast.error('Failed to open conversation');
    }
  };

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
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={handleGoBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{users.length} {isFollowingType ? 'following' : 'followers'}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {isFollowingType ? 'Not following anyone yet.' : 'No followers yet.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No results found</p>
          ) : (
            filtered.map((u) => {
              const isMe = u.id === currentUser?.id;
              const isPendingFollow = followMutation.isPending && followMutation.variables === u.id;
              const isPendingUnfollow = unfollowMutation.isPending && unfollowMutation.variables === u.id;

              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
                >
                  <div
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="relative shrink-0 cursor-pointer"
                  >
                    <Avatar className="h-12 w-12">
                      {u.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                      <AvatarFallback className="font-bold"><User size={18} /></AvatarFallback>
                    </Avatar>
                    {u.status === 'online' && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500" />
                    )}
                  </div>
                  <div
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <p className="truncate text-sm font-medium text-foreground hover:text-accent">{u.fullName}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                  {!isMe && isOwn && (
                    <>
                      <button
                        onClick={() => handleMessage(u.id, u.fullName)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                      >
                        <MessageSquareText size={18} />
                      </button>
                      {isFollowingType ? (
                        <button
                          onClick={() => unfollowMutation.mutate(u.id)}
                          disabled={isPendingUnfollow}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                          title="Unfollow"
                        >
                          {isPendingUnfollow ? <Loader2 size={18} className="animate-spin" /> : <UserMinus size={18} />}
                        </button>
                      ) : (
                        <button
                          onClick={() => followMutation.mutate(u.id)}
                          disabled={isPendingFollow}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                          title="Follow back"
                        >
                          {isPendingFollow ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                        </button>
                      )}
                    </>
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
