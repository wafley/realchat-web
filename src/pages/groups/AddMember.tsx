import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, UserPlus, Loader2, UserCheck, User, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { searchUsers, addGroupMember, getGroup, getConversations } from '@/services/chat';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function AddMember() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; username: string }[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [dmIds, setDmIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!id) return;
    getGroup(id)
      .then((g) => setMemberIds(new Set(g.members?.map((m) => m.userId) ?? [])))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    getConversations()
      .then((convs) =>
        setDmIds(
          new Set(
            convs
              .filter((c) => c.type === 'dm')
              .map((c) => c.userId)
              .filter((uid): uid is string => !!uid),
          ),
        ),
      )
      .catch(() => {});
  }, []);

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
          users
            .filter((u) => u.id !== currentUser?.id && !memberIds.has(u.id) && dmIds.has(u.id))
            .map((u) => ({ id: u.id, name: u.fullName, username: u.username })),
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
  }, [query, memberIds, dmIds, currentUser?.id]);

  const handleAdd = async (userId: string) => {
    if (!id) return;
    try {
      await addGroupMember(id, userId);
      setAddedIds((prev) => new Set(prev).add(userId));
      toast.success('Member added!');
    } catch {
      toast.error('Failed to add member');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to group
      </button>

      <p className="mb-4 text-sm text-muted-foreground">
        Search for users by name or username to add them to the group.
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
            const isAdded = addedIds.has(user.id);
            const isMe = user.id === currentUser?.id;
            const isMember = memberIds.has(user.id);
            const notContact = !dmIds.has(user.id);
            const canAdd = !isAdded && !isMe && !isMember && !notContact;
            const status = isAdded
              ? { label: 'Added', icon: UserCheck, cls: 'bg-accent/20 text-accent' }
              : isMember
                ? { label: 'Member', icon: UserCheck, cls: 'bg-accent/10 text-muted-foreground' }
                : isMe
                  ? { label: 'You', icon: User, cls: 'bg-accent/10 text-muted-foreground' }
                  : notContact
                    ? { label: 'Not a contact', icon: UserPlus, cls: 'bg-accent/10 text-muted-foreground' }
                    : { label: 'Add Member', icon: UserPlus, cls: 'bg-accent text-accent-foreground hover:bg-accent/80' };
            const StatusIcon = status.icon;
            return (
              <div
                key={user.id}
                className="flex items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="font-bold text-xs">
                    {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <button
                  onClick={() => handleAdd(user.id)}
                  disabled={!canAdd}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${status.cls} ${canAdd ? '' : 'cursor-not-allowed'}`}
                >
                  <StatusIcon size={16} />
                  {status.label}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
