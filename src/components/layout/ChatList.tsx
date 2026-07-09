import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search, Plus, MessageSquareText, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Conversation } from '@/types';

const tabs = [
  { id: 'messages', label: 'Messages', icon: MessageSquareText },
  { id: 'groups', label: 'Groups', icon: Users },
] as const;

const conversations: Conversation[] = [
  { id: 'dm1', name: 'Alice Johnson', type: 'dm', lastMessage: 'Sure, let me check that', lastTime: '2m', unread: 2, online: true },
  { id: 'dm2', name: 'Bob Smith', type: 'dm', lastMessage: 'Thanks for the update!', lastTime: '1h', online: true },
  { id: 'dm3', name: 'Charlie Brown', type: 'dm', lastMessage: 'See you tomorrow', lastTime: '3h', online: false },
  { id: 'dm4', name: 'Diana Prince', type: 'dm', lastMessage: 'Got it 👍', lastTime: 'Yesterday', online: false },
  { id: 'dm5', name: 'Eve Adams', type: 'dm', lastMessage: 'Can you review my PR?', lastTime: 'Yesterday', unread: 1, online: true },
  { id: '1', name: 'General', type: 'group', lastMessage: 'Hey everyone!', lastTime: '2m', unread: 3, online: true, members: 12 },
  { id: '2', name: 'Random', type: 'group', lastMessage: 'Anyone free for lunch?', lastTime: '1h', online: false, members: 10 },
  { id: '3', name: 'Project Alpha', type: 'group', lastMessage: 'Deploy is done ✅', lastTime: '3h', unread: 1, online: true, members: 6 },
  { id: '4', name: 'Design Team', type: 'group', lastMessage: 'New mockups uploaded', lastTime: 'Yesterday', online: false, members: 5 },
];

export default function ChatList() {
  const { groupId, userId } = useParams();
  const [tab, setTab] = useState<'messages' | 'groups'>('messages');
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) => {
    if (tab === 'messages' && c.type !== 'dm') return false;
    if (tab === 'groups' && c.type !== 'group') return false;
    return c.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <Plus size={18} />
        </button>
      </div>

      <div className="flex border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setSearch(''); }}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
              tab === id
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
            <MessageSquareText size={32} className="mb-2 opacity-30" />
            <p>{tab === 'messages' ? 'No messages yet' : 'No groups yet'}</p>
          </div>
        ) : (
          filtered.map((chat) => {
            const linkTo = chat.type === 'dm' ? `/dm/${chat.id}` : `/chat/${chat.id}`;
            const isActive = chat.type === 'dm' ? userId === chat.id : groupId === chat.id;
            return (
              <Link
                key={chat.id}
                to={linkTo}
                className={cn(
                  'flex items-center gap-3 border-b border-border px-4 py-3 transition-colors',
                  isActive
                    ? 'bg-accent/10'
                    : 'hover:bg-accent/5',
                )}
              >
                <div className="relative shrink-0">
                  <Avatar>
                    {chat.avatarUrl && <AvatarImage src={chat.avatarUrl} />}
                    <AvatarFallback>
                      {chat.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {chat.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {chat.lastTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                      {chat.lastMessage}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      {chat.members && (
                        <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                          {chat.members} members
                        </span>
                      )}
                      {chat.unread && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
