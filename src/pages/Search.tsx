import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Users, MessageSquare, FileText, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { searchUsers, searchGroups, searchMessages } from '@/services/search';
import type { User, Group } from '@/types';
import { cn } from '@/lib/utils';

type Tab = 'users' | 'groups' | 'messages';

interface MessageResult {
  id: string;
  groupId: string;
  senderId: string;
  senderName?: string;
  content: string;
  type: 'text';
  createdAt: Date;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<MessageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUsers([]);
      setGroups([]);
      setMessages([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const [u, g, m] = await Promise.all([
        searchUsers(q),
        searchGroups(q),
        searchMessages(q) as Promise<MessageResult[]>,
      ]);
      setUsers(u);
      setGroups(g);
      setMessages(m);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const tabs: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: 'users', label: 'Users', icon: Users, count: users.length },
    { key: 'groups', label: 'Groups', icon: MessageSquare, count: groups.length },
    { key: 'messages', label: 'Messages', icon: FileText, count: messages.length },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      <div className="relative mb-4">
        <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users, groups, or messages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {query.trim() && (
        <div className="mb-4 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
              )}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] justify-center px-1 text-[10px]">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : !query.trim() ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchIcon size={40} className="mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Search for users, groups, or messages</p>
        </div>
      ) : !hasSearched ? null : activeTab === 'users' ? (
        users.length === 0 ? (
          <EmptyState text="No users found" />
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => navigate(`/profile/${user.id}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-accent/5"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm font-bold">{user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {user.status === 'online' && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </button>
            ))}
          </div>
        )
      ) : activeTab === 'groups' ? (
        groups.length === 0 ? (
          <EmptyState text="No groups found" />
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-accent/5"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="text-sm font-bold">{group.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{group.name}</p>
                  {group.description && (
                    <p className="truncate text-xs text-muted-foreground">{group.description}</p>
                  )}
                </div>
                {group.isPrivate && (
                  <Badge variant="warning" className="shrink-0 text-[10px]">Private</Badge>
                )}
              </button>
            ))}
          </div>
        )
      ) : messages.length === 0 ? (
        <EmptyState text="No messages found" />
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => navigate('/chat/' + msg.groupId)}
              className="flex w-full items-start gap-3 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-accent/5"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs font-bold">
                  {(msg.senderName ?? '?').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{msg.senderName ?? 'Unknown'}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{msg.content}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex justify-center py-10">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
