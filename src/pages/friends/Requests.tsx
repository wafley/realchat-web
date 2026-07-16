import { useState, useEffect } from 'react';
import { Check, X, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getPendingRequests, acceptFriendRequest, rejectFriendRequest } from '@/services/friends';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';

interface RequestItem {
  id: string;
  name: string;
  username: string;
}

export default function Requests() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await getPendingRequests();
      setRequests(data.map((r) => ({ id: r.id, name: r.sender.fullName, username: r.sender.username })));
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleAccept = async (reqId: string) => {
    try {
      await acceptFriendRequest(reqId);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequestCount'] });
      toast.success('Friend request accepted!');
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await rejectFriendRequest(reqId);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequestCount'] });
      toast.success('Request rejected');
    } catch {
      toast.error('Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      {requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No pending requests</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
            >
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="font-bold"><User size={18} /></AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{req.name}</p>
                <p className="text-xs text-muted-foreground">@{req.username}</p>
              </div>
              <div className="flex shrink-0 gap-2">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
