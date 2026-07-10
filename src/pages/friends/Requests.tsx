import { Check, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface FriendReq {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

const incomingRequests: FriendReq[] = [
  { id: 'f1', name: 'Frank Ocean', username: 'franko' },
  { id: 'f2', name: 'Grace Hopper', username: 'graceh' },
];

export default function Requests() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      {incomingRequests.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No pending requests</p>
      ) : (
        <div className="space-y-3">
          {incomingRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
            >
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="font-bold">{req.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{req.name}</p>
                <p className="text-xs text-muted-foreground">@{req.username}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors hover:bg-accent/80">
                  <Check size={18} />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-input text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
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
