import { useState, useEffect, useCallback } from 'react';
import { Check, X, Loader2, User, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPendingRequests, getSentRequests, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest } from '@/services/friends';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FriendRequest } from '@/types';

type Tab = 'incoming' | 'sent';

export default function Requests() {
  const [tab, setTab] = useState<Tab>('incoming');
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [incomingData, sentData] = await Promise.all([
        getPendingRequests(),
        getSentRequests(),
      ]);
      setIncoming(incomingData);
      setSent(sentData);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAccept = async (reqId: string) => {
    try {
      await acceptFriendRequest(reqId);
      setIncoming((prev) => prev.filter((r) => r.id !== reqId));
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequestCount'] });
      toast.success('Friend request accepted!');
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await rejectFriendRequest(reqId);
      setIncoming((prev) => prev.filter((r) => r.id !== reqId));
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequestCount'] });
      toast.success('Request rejected');
    } catch {
      toast.error('Failed to reject request');
    }
  };

  const handleCancel = async (userId: string) => {
    try {
      await cancelFriendRequest(userId);
      setSent((prev) => prev.filter((r) => r.receiver.id !== userId));
      toast.success('Request cancelled');
    } catch {
      toast.error('Failed to cancel request');
    }
  };

  const list = tab === 'incoming' ? incoming : sent;

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      <div className="mb-4 flex gap-2">
        {(['incoming', 'sent'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/10',
            )}
          >
            {t === 'incoming' ? 'Masuk' : 'Terkirim'}
            {t === 'incoming' && incoming.length > 0 && (
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            )}
            {t === 'sent' && sent.length > 0 && (
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
            )}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tab === 'incoming' ? 'No pending requests' : 'No sent requests'}
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((req) => {
            const user = tab === 'incoming' ? req.sender : req.receiver;
            return (
              <div
                key={req.id}
                className="flex items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback className="font-bold"><User size={18} /></AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">@{user.username}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {tab === 'incoming' ? (
                    <>
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors hover:bg-accent/80"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-input text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleCancel(user.id)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-input px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X size={14} />
                      Batal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
