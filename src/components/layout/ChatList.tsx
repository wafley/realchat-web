import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Search, Plus, MessageSquareText, Users, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListSkeleton } from '@/components/layout/LayoutSkeleton';
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

  const { data: conversations = [], isPending, isError, error, refetch } = useQuery({
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
        <div className="flex items-center gap-2 border-b border-border p-4 lg:px-5 lg:py-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground lg:left-3.5"
            />
            <input
              type="text"
              aria-label="Search chats"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring lg:py-3 lg:pl-10 lg:text-base"
            />
          </div>
          <button
            onClick={() => setModalOpen(true)}
            aria-label="New chat"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:h-11 lg:w-11"
          >
            <Plus size={20} />
          </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Chat">
        <div className="space-y-1">
          <button
            onClick={() => { setModalOpen(false); navigate('/groups/create'); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 lg:gap-3.5 lg:px-4 lg:py-3 lg:text-base"
          >
            <MessageSquareText size={18} className="text-muted-foreground lg:size-5" />
            New Group
          </button>
          <button
            onClick={() => { setModalOpen(false); navigate('/friends'); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 lg:gap-3.5 lg:px-4 lg:py-3 lg:text-base"
          >
            <UserPlus size={18} className="text-muted-foreground lg:size-5" />
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
              'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors lg:gap-2.5 lg:py-4 lg:text-base',
              tab === id
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={16} className="lg:size-[18]" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isPending ? (
          <ListSkeleton count={6} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={40} className="mb-2 text-destructive/60" />
            <p className="text-sm font-medium text-foreground lg:text-base">Failed to load conversations</p>
            <p className="mt-1 text-xs text-muted-foreground lg:text-sm">{error?.message || 'Something went wrong'}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground lg:text-base">
            <MessageSquareText size={40} className="mb-2 opacity-30" />
            <p>
              {search
                ? `No ${tab === 'messages' ? 'chats' : 'groups'} matching "${search}"`
                : tab === 'messages'
                  ? 'No messages yet'
                  : 'No groups yet'}
            </p>
          </div>
        ) : (
          <div role="list">
            {filtered.map((chat) => {
            const linkTo = chat.type === 'dm' ? `/dm/${chat.id}` : `/chat/${chat.id}`;
            const isActive = chat.type === 'dm' ? userId === chat.id : groupId === chat.id;
            return (
              <Link
                key={chat.id}
                to={linkTo}
                state={{ name: chat.name, online: chat.online }}
                role="listitem"
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 border-b border-border px-4 py-3 transition-colors lg:gap-4 lg:px-5 lg:py-4',
                  isActive
                    ? 'bg-accent/10'
                    : 'hover:bg-accent/5',
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="lg:h-12 lg:w-12">
                    {chat.avatarUrl && <AvatarImage src={chat.avatarUrl} />}
                    <AvatarFallback className="lg:text-base">
                      {chat.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500 lg:h-3.5 lg:w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground lg:text-base">
                      {chat.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground lg:text-sm">
                      {chat.lastTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground lg:text-sm">
                      {chat.lastMessage}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      {(chat.members ?? 0) > 0 && (
                        <span className="whitespace-nowrap text-[10px] text-muted-foreground lg:text-xs">
                          {chat.members} members
                        </span>
                      )}
                      {(chat.unread ?? 0) > 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground lg:h-6 lg:w-6 lg:text-xs">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
