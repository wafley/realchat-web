import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Loader2, UserCheck, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { searchPeople, sendFriendRequest } from '@/services/friends';
import { toast } from 'sonner';

export default function AddFriend() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; username: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
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
        const users = await searchPeople(query.trim());
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

  const handleAdd = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      setSentIds((prev) => new Set(prev).add(userId));
      toast.success('Friend request sent!');
    } catch {
      toast.error('Failed to send request');
    }
  };

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
        {results.length === 0 && query.trim() ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No users found</p>
        ) : (
          results.map((user) => {
            const isSent = sentIds.has(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="font-bold"><User size={18} /></AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <button
                  onClick={() => handleAdd(user.id)}
                  disabled={isSent}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    isSent
                      ? 'bg-accent/20 text-accent'
                      : 'bg-accent text-accent-foreground hover:bg-accent/80'
                  }`}
                >
                  {isSent ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  {isSent ? 'Sent' : 'Add Friend'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
