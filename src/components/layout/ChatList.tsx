import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatItem {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  online?: boolean;
}

const chats: ChatItem[] = [
  {
    id: '1',
    name: 'General',
    lastMessage: 'Hey everyone!',
    lastTime: '2m',
    unread: 3,
    online: true,
  },
  {
    id: '2',
    name: 'Random',
    lastMessage: 'Anyone free for lunch?',
    lastTime: '1h',
    online: false,
  },
  {
    id: '3',
    name: 'Project Alpha',
    lastMessage: 'Deploy is done ✅',
    lastTime: '3h',
    unread: 1,
    online: true,
  },
  {
    id: '4',
    name: 'Design Team',
    lastMessage: 'New mockups uploaded',
    lastTime: 'Yesterday',
    online: false,
  },
];

export default function ChatList() {
  const { groupId } = useParams();
  const [search, setSearch] = useState('');

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

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

      <div className="flex-1 overflow-y-auto">
        {filtered.map((chat) => {
          const isActive = groupId === chat.id;
          return (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}`}
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
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-foreground">
                    {chat.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {chat.lastTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs text-muted-foreground">
                    {chat.lastMessage}
                  </span>
                  {chat.unread && (
                    <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
