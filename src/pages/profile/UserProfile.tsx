import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquareText, Ban, Mail, Info, Calendar, Loader2, AlertCircle, User, UserPlus, UserCheck, Clock, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatLastSeen } from '@/utils/time';
import { shouldShowLastSeen } from '@/utils/privacy';
import { getUser } from '@/services/user';
import { blockUser as blockUserService, findOrCreateConversation } from '@/services/chat';
import { getFriends, getPendingRequests, getSentRequests, sendFriendRequest, cancelFriendRequest, acceptFriendRequest, removeFriend } from '@/services/friends';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const isSelf = currentUser?.id === userId;

  const { data: user, isPending, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    enabled: !!userId && !isSelf,
  });

  const { data: incomingRequests = [] } = useQuery({
    queryKey: ['friendRequests', 'incoming'],
    queryFn: getPendingRequests,
    enabled: !!userId && !isSelf,
  });

  const { data: sentRequests = [] } = useQuery({
    queryKey: ['friendRequests', 'sent'],
    queryFn: getSentRequests,
    enabled: !!userId && !isSelf,
  });

  const isFriend = friends.some((f) => f.id === userId);
  const incomingFromUser = incomingRequests.find((r) => r.sender.id === userId);
  const sentToUser = sentRequests.find((r) => r.receiver.id === userId);

  type FriendStatus = 'self' | 'friend' | 'incoming' | 'sent' | 'none';
  const friendStatus: FriendStatus = isSelf
    ? 'self'
    : isFriend
      ? 'friend'
      : incomingFromUser
        ? 'incoming'
        : sentToUser
          ? 'sent'
          : 'none';

  const sendRequestMutation = useMutation({
    mutationFn: () => sendFriendRequest(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent'] });
      toast.success('Friend request sent!');
    },
    onError: () => toast.error('Failed to send request'),
  });

  const cancelRequestMutation = useMutation({
    mutationFn: () => cancelFriendRequest(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent'] });
      toast.success('Request cancelled');
    },
    onError: () => toast.error('Failed to cancel request'),
  });

  const acceptRequestMutation = useMutation({
    mutationFn: () => acceptFriendRequest(incomingFromUser!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'incoming'] });
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequestCount'] });
      toast.success('Friend request accepted!');
    },
    onError: () => toast.error('Failed to accept request'),
  });

  const unfriendMutation = useMutation({
    mutationFn: () => removeFriend(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success('Removed from friends');
    },
    onError: () => toast.error('Failed to remove friend'),
  });

  const blockMutation = useMutation({
    mutationFn: () => blockUserService(userId!),
    onSuccess: () => {
      toast.success('User blocked');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => toast.error('Failed to block user'),
  });

  const infoItems = user
    ? [
        { label: 'Email', icon: Mail, value: user.email },
        { label: 'Bio', icon: Info, value: user.bio || 'No bio yet' },
        { label: 'Member since', icon: Calendar, value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
      ]
    : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3 p-6 pb-0">
            <button onClick={() => navigate(-1)} className="text-muted-foreground transition-colors hover:text-accent">
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
              <div className="flex flex-col items-center px-6 pb-6 pt-8">
                <Avatar className="h-24 w-24">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback className="text-2xl">
                    <User size={24} />
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold text-foreground">{user.fullName}</h2>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <span
                  className={cn(
                    'mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                    user.status === 'online'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      user.status === 'online' ? 'bg-green-500' : 'bg-muted-foreground',
                    )}
                  />
                  {user.status === 'online' ? 'Online' : 'Offline'}
                </span>
                {user.status !== 'online' && user.lastSeen && shouldShowLastSeen() && (
                  <p className="mt-1.5 text-xs text-muted-foreground">last seen {formatLastSeen(user.lastSeen)}</p>
                )}
              </div>

              <div className="mx-6 mb-4 overflow-hidden rounded-xl bg-card">
                {infoItems.map((item, i) => (
                  <div
                    key={item.label}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5',
                      i < infoItems.length - 1 && 'border-b border-border/50',
                    )}
                  >
                    <item.icon size={18} className="text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="truncate text-sm text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mx-6 mb-8 flex flex-col gap-2">
                {!isSelf && (
                  <>
                    {friendStatus === 'none' && (
                      <button
                        onClick={() => sendRequestMutation.mutate()}
                        disabled={sendRequestMutation.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
                      >
                        {sendRequestMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        {sendRequestMutation.isPending ? 'Sending...' : 'Add Friend'}
                      </button>
                    )}
                    {friendStatus === 'sent' && (
                      <button
                        onClick={() => cancelRequestMutation.mutate()}
                        disabled={cancelRequestMutation.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10 disabled:opacity-50"
                      >
                        {cancelRequestMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                        {cancelRequestMutation.isPending ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}
                    {friendStatus === 'incoming' && (
                      <button
                        onClick={() => acceptRequestMutation.mutate()}
                        disabled={acceptRequestMutation.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
                      >
                        {acceptRequestMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                        {acceptRequestMutation.isPending ? 'Accepting...' : 'Accept Request'}
                      </button>
                    )}
                    {friendStatus === 'friend' && (
                      <button
                        onClick={() => unfriendMutation.mutate()}
                        disabled={unfriendMutation.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        {unfriendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                        {unfriendMutation.isPending ? 'Removing...' : 'Unfriend'}
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={async () => {
                    try {
                      const dmId = await findOrCreateConversation(user.id);
                      navigate(`/dm/${dmId}`, { state: { name: user.fullName, online: user.status === 'online' } });
                    } catch {
                      toast.error('Failed to open conversation');
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
                >
                  <MessageSquareText size={16} />
                  Send Message
                </button>
                <button
                  onClick={() => blockMutation.mutate()}
                  disabled={blockMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10 disabled:opacity-50"
                >
                  {blockMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                  {blockMutation.isPending ? 'Blocking...' : 'Block User'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
