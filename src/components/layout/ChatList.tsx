import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Search, Plus, MessageSquareText, Users, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Modal from '@/components/ui/modal';
import { getConversations } from '@/services/chat';

const tabs = [
  { id: 'messages', label: 'Messages', icon: MessageSquareText },
  { id: 'groups', label: 'Groups', icon: Users },
] as const;

export default function ChatList() {
  const navigate = useNavigate();
  const { groupId, userId } = useParams();
  const [tab, setTab] = useState<'messages' | 'groups'>('messages');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

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
            aria-label="Search chats"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          aria-label="New chat"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Plus size={18} />
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Chat">
        <div className="space-y-1">
          <button
            onClick={() => { setModalOpen(false); navigate('/groups/create'); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            <MessageSquareText size={18} className="text-muted-foreground" />
            New Group
          </button>
          <button
            onClick={() => { setModalOpen(false); navigate('/friends'); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            <UserPlus size={18} className="text-muted-foreground" />
            New Direct Message
          </button>
        </div>
      </Modal>

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
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground">
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
                state={{ name: chat.name }}
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
