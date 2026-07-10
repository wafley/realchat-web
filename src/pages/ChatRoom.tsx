import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Send, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { getMessages, sendMessage } from '@/services/chat';

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatRoom() {
  const { groupId, userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDM = location.pathname.startsWith('/dm/');
  const chatId = (isDM ? userId : groupId) || '';
  const chatName = location.state?.name || 'Chat';

  useEffect(() => {
    if (!chatId) return;
    setMessages([]);
    getMessages(chatId, isDM).then(setMessages);
  }, [chatId, isDM]);

  const filteredMessages = showSearch && searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : messages;

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const sent = await sendMessage(chatId, text, isDM);
    setMessages((prev) => [...prev, sent]);
  }, [input, chatId, isDM]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3">
        <button
          onClick={() => navigate(isDM ? '/' : '/')}
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-foreground lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarFallback>{chatName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="truncate text-sm font-semibold text-foreground">{chatName}</h2>
          <p className="text-xs text-muted-foreground">{isDM ? 'Online' : 'Online'}</p>
        </div>
        <button
          onClick={() => {
            if (showSearch) { setSearchQuery(''); setShowSearch(false); }
            else { setShowSearch(true); }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <Search size={18} />
        </button>
      </div>

      {showSearch && (
        <div className="border-b border-border bg-sidebar px-4 py-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-input py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-chat-tile-overlay px-4 py-4">
        <div className="space-y-3">
          {filteredMessages.map((msg) => {
            const isOwn = msg.sender?.id === currentUser?.id || msg.senderId === currentUser?.id;
            const name = isOwn ? 'You' : (msg.sender?.fullName ?? 'Unknown');
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {!isOwn && (
                  <Avatar className="mt-1 h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                  {!isOwn && (
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      {name}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm ${
                      isOwn
                        ? 'bg-chat-outgoing-bg text-chat-outgoing-foreground rounded-br-md'
                        : 'bg-chat-incoming-bg text-chat-incoming-foreground rounded-bl-md'
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                  <p className={`mt-0.5 text-[10px] text-muted-foreground ${isOwn ? 'text-right' : ''}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-input px-3 py-1.5">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
