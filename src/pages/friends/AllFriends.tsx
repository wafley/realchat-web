import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquareText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  online: boolean;
}

const myFriends: Friend[] = [
  { id: 'dm1', name: 'Alice Johnson', username: 'alicej', online: true },
  { id: 'dm2', name: 'Bob Smith', username: 'bobsmith', online: true },
  { id: 'dm3', name: 'Charlie Brown', username: 'charlieb', online: false },
  { id: 'dm4', name: 'Diana Prince', username: 'dianap', online: false },
  { id: 'dm5', name: 'Eve Adams', username: 'evea', online: true },
];

export default function AllFriends() {
  const [search, setSearch] = useState('');

  const filtered = myFriends.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      <div className="relative mb-4">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search friends..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No friends found</p>
        ) : (
          filtered.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
            >
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12">
                  {friend.avatarUrl && <AvatarImage src={friend.avatarUrl} />}
                  <AvatarFallback className="font-bold">{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {friend.online && (
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{friend.name}</p>
                <p className="text-xs text-muted-foreground">@{friend.username}</p>
              </div>
              <Link
                to={`/dm/${friend.id}`}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
              >
                <MessageSquareText size={18} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
