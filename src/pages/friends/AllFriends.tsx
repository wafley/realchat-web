import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquareText, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getFriends } from '@/services/friends';
import { DM_USER_MAP } from '@/services/chat';
import { toast } from 'sonner';

const USER_DM_REVERSE: Record<string, string> = {};
for (const [dmId, userId] of Object.entries(DM_USER_MAP)) {
  USER_DM_REVERSE[userId] = dmId;
}

export default function AllFriends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<{ id: string; name: string; username: string; online: boolean }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getFriends();
        setFriends(
          data.map((u) => ({ id: u.id, name: u.fullName, username: u.username, online: u.status === 'online' })),
        );
      } catch {
        toast.error('Failed to load friends');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleMessage = (friendId: string, name: string, online: boolean, lastSeen?: Date) => {
    const dmId = USER_DM_REVERSE[friendId];
    if (dmId) {
      navigate(`/dm/${dmId}`, { state: { name, online, lastSeen } });
    } else {
      toast.error('No conversation with this user');
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
      {friends.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No friends yet. Use the Add Friend tab to find people.
        </p>
      ) : (
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
                  <div
                    onClick={() => navigate(`/profile/${friend.id}`)}
                    className="relative shrink-0 cursor-pointer"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="font-bold">{friend.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {friend.online && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500" />
                    )}
                  </div>
                  <div
                    onClick={() => navigate(`/profile/${friend.id}`)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <p className="truncate text-sm font-medium text-foreground hover:text-accent">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">@{friend.username}</p>
                  </div>
                  <button
                    onClick={() => handleMessage(friend.id, friend.name, friend.online)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    <MessageSquareText size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
