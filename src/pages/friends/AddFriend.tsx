import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { searchUsers } from '@/services/chat';
import { toast } from 'sonner';

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(query.trim());
        setResults(
          users.map((u) => ({ id: u.id, name: u.fullName, username: u.username })),
        );
      } catch {
        toast.error('Failed to search users');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const displayUsers = query.trim() ? results : suggestedUsers;

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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {loading && (
          <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="space-y-3">
        {displayUsers.length === 0 && query.trim() ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No users found</p>
        ) : (
          displayUsers.map((user) => (
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
          ))
        )}
      </div>
    </div>
  );
}
