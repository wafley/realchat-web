import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, Loader2, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getBlockedUsers, unblockUser } from '@/services/chat';
import Modal from '@/components/ui/modal';

export default function BlockedUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: users = [], isPending } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: getBlockedUsers,
  });

  const [unblockTarget, setUnblockTarget] = useState<string | null>(null);

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      setUnblockTarget(null);
      toast.success('User unblocked');
    },
    onError: () => {
      toast.error('Failed to unblock user');
    },
  });

  const targetUser = users.find((u) => u.id === unblockTarget);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Blocked Users</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hidden text-muted-foreground transition-colors hover:text-accent md:flex">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">Blocked Users</h2>
              <p className="text-sm text-muted-foreground">Manage users you've blocked</p>
            </div>
          </div>

          {isPending ? (
            <div className="flex justify-center py-12">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-card py-12 text-center">
              <Ban size={36} className="mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No blocked users</p>
              <p className="mt-1 text-xs text-muted-foreground">Users you block will appear here</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-card">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <User size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <button
                    onClick={() => setUnblockTarget(user.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/10"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!unblockTarget}
        onClose={() => setUnblockTarget(null)}
        title="Unblock User"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          {targetUser ? `Unblock ${targetUser.fullName}? They will be able to send you messages again.` : ''}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setUnblockTarget(null)}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            Cancel
          </button>
          <button
            onClick={() => unblockTarget && unblockMutation.mutate(unblockTarget)}
            disabled={unblockMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {unblockMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Unblock
          </button>
        </div>
      </Modal>
    </div>
  );
}
