import { Search, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
}

const suggestedUsers: SuggestedUser[] = [
  { id: 's1', name: 'Hank Miller', username: 'hankm' },
  { id: 's2', name: 'Ivy Chen', username: 'ivyc' },
  { id: 's3', name: 'Jack Wilson', username: 'jackw' },
];

export default function AddFriend() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      <p className="mb-4 text-sm text-muted-foreground">
        Search for people by name or username to add them as a friend.
      </p>
      <div className="relative mb-4">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="space-y-3">
        {suggestedUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
          >
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="font-bold">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
            <button className="flex shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80">
              <UserPlus size={16} />
              Add Friend
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
