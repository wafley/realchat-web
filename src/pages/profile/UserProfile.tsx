import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquareText, Ban, Loader2, AlertCircle, User, UserPlus, UserMinus, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatLastSeen } from '@/utils/time';
import { shouldShowLastSeen } from '@/utils/privacy';
import { getUser } from '@/services/user';
import { blockUser as blockUserService, findOrCreateConversation } from '@/services/chat';
import { addContact, removeContact, getContacts } from '@/services/contacts';
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
    },
    onError: () => toast.error('Failed to block user'),
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <button onClick={() => navigate(-1)} className="mb-6 text-muted-foreground transition-colors hover:text-accent">
            <ArrowLeft size={20} />
          </button>

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
                <Avatar className="h-20 w-20 md:h-24 md:w-24">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback className="text-lg md:text-2xl">
                    <User size={22} />
                  </AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 className="text-base font-bold text-foreground">{displayName}</h2>
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                    {contact?.customName && <span className="ml-2 text-muted-foreground/60">• {user.fullName}</span>}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
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
                      <span className="text-xs text-muted-foreground">last seen {formatLastSeen(user.lastSeen)}</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{user.bio || 'No bio yet'}</p>



              <div className="mt-6 flex flex-col gap-2">
                {!isSelf && (
                  isContact ? (
                    <button
                      onClick={() => removeContactMutation.mutate()}
                      disabled={removeContactMutation.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {removeContactMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
                      {removeContactMutation.isPending ? 'Removing...' : 'Remove Contact'}
                    </button>
                  ) : (
                    <button
                      onClick={() => addContactMutation.mutate()}
                      disabled={addContactMutation.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
                    >
                      {addContactMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
                    </button>
                  )
                )}
                <button
                  onClick={async () => {
                    try {
                      const dmId = await findOrCreateConversation(user.id);
                      navigate(`/dm/${dmId}`, { state: { name: displayName, online: user.status === 'online' } });
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
