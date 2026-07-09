import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, X, Check, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  online: boolean;
}

interface FriendReq {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

const myFriends: Friend[] = [
  { id: 'dm1', name: 'Alice Johnson', username: 'alicej', online: true },
  { id: 'dm2', name: 'Bob Smith', username: 'bobsmith', online: true },
  { id: 'dm3', name: 'Charlie Brown', username: 'charlieb', online: false },
  { id: 'dm4', name: 'Diana Prince', username: 'dianap', online: false },
  { id: 'dm5', name: 'Eve Adams', username: 'evea', online: true },
];

const incomingRequests: FriendReq[] = [
  { id: 'f1', name: 'Frank Ocean', username: 'franko' },
  { id: 'f2', name: 'Grace Hopper', username: 'graceh' },
];

const suggestedUsers = [
  { id: 's1', name: 'Hank Miller', username: 'hankm' },
  { id: 's2', name: 'Ivy Chen', username: 'ivyc' },
  { id: 's3', name: 'Jack Wilson', username: 'jackw' },
];

type FriendsTab = 'all' | 'add' | 'requests';

export default function Friends() {
  const [tab, setTab] = useState<FriendsTab>('all');
  const [search, setSearch] = useState('');

  const filtered = myFriends.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="bg-background pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto w-full max-w-2xl px-5 pb-0 pt-4">
          <h1 className="text-xl font-bold text-foreground">Friends</h1>
        </div>

        <div className="flex border-b border-border">
          <div className="mx-auto flex w-full max-w-2xl px-5">
            {[
              { id: 'all' as const, label: 'All Friends', count: myFriends.length },
              { id: 'add' as const, label: 'Add Friend' },
              { id: 'requests' as const, label: 'Requests', count: incomingRequests.length },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  tab === id
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
                {count != null && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-4">
        {tab === 'all' && (
          <>
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
          </>
        )}

        {tab === 'add' && (
          <>
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
          </>
        )}

        {tab === 'requests' && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
