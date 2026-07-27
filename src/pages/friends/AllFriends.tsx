import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MessageSquareText, Loader2, User, UserMinus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFollowing, unfollowUser } from '@/services/friends';
import { findOrCreateConversation } from '@/services/chat';
import { toast } from 'sonner';

export default function AllFriends() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['following'],
    queryFn: getFollowing,
  });

  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['following'] });
      const prev = queryClient.getQueryData(['following']);
      queryClient.setQueryData(['following'], (old: any[]) => old?.filter((f: any) => f.id !== userId) ?? []);
      return { prev };
    },
    onError: (_err, _userId, context) => {
      if (context?.prev) queryClient.setQueryData(['following'], context.prev);
      toast.error('Failed to unfollow');
    },
    onSuccess: (_data, _userId) => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const filtered = friends.filter(
    (f) =>
      (f.fullName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleMessage = async (friendId: string, name: string, online: boolean) => {
    try {
      const dmId = await findOrCreateConversation(friendId);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/dm/${dmId}`, { state: { name, online } });
    } catch {
      toast.error('Failed to open conversation');
    }
  };

  const handleUnfollow = (userId: string, name: string) => {
    unfollowMutation.mutate(userId, {
      onSuccess: () => toast.success(`Unfollowed ${name}`),
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      {friends.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No mutual follows yet. Use Find People to follow someone.
        </p>
      ) : (
        <>
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
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No results found</p>
            ) : (
              filtered.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
                >
                  <div
                    onClick={() => navigate(`/profile/${friend.id}`)}
                    className="relative shrink-0 cursor-pointer"
                  >
                    <Avatar className="h-12 w-12">
                      {friend.avatarUrl && <AvatarImage src={friend.avatarUrl} />}
                      <AvatarFallback className="font-bold"><User size={18} /></AvatarFallback>
                    </Avatar>
                    {friend.status === 'online' && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500" />
                    )}
                  </div>
                  <div
                    onClick={() => navigate(`/profile/${friend.id}`)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <p className="truncate text-sm font-medium text-foreground hover:text-accent">{friend.fullName}</p>
                    <p className="text-xs text-muted-foreground">@{friend.username}</p>
                  </div>
                  <button
                    onClick={() => handleMessage(friend.id, friend.fullName, friend.status === 'online')}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    <MessageSquareText size={18} />
                  </button>
                  <button
                    onClick={() => handleUnfollow(friend.id, friend.fullName)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-destructive transition-colors hover:bg-destructive/10"
                    title="Unfollow"
                  >
                    <UserMinus size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
