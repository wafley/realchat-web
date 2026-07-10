import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Send, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
}

const groupMessages: Record<string, ChatMessage[]> = {
  '1': [
    { id: 'm1', sender: 'Alice', content: 'Hey everyone!', time: '10:30', isOwn: false },
    { id: 'm2', sender: 'You', content: 'Hi Alice! How are you?', time: '10:31', isOwn: true },
    { id: 'm3', sender: 'Bob', content: 'Good morning team 👋', time: '10:32', isOwn: false },
    { id: 'm4', sender: 'You', content: 'Did anyone see the new update?', time: '10:33', isOwn: true },
    { id: 'm5', sender: 'Alice', content: 'Yes! The UI looks much cleaner now', time: '10:34', isOwn: false },
    { id: 'm6', sender: 'Bob', content: 'I just deployed the fix for the login bug', time: '10:35', isOwn: false },
    { id: 'm7', sender: 'You', content: "Awesome, thanks Bob! I'll review it", time: '10:36', isOwn: true },
    { id: 'm8', sender: 'Alice', content: 'Should we have a quick standup?', time: '10:37', isOwn: false },
  ],
  '2': [
    { id: 'n1', sender: 'Charlie', content: 'Anyone free for lunch?', time: '12:00', isOwn: false },
    { id: 'n2', sender: 'You', content: "I'm in! Where to?", time: '12:05', isOwn: true },
  ],
  '3': [
    { id: 'p1', sender: 'Deploy Bot', content: 'Deploy is done ✅', time: '15:00', isOwn: false },
    { id: 'p2', sender: 'You', content: 'Great! Any issues?', time: '15:02', isOwn: true },
    { id: 'p3', sender: 'Deploy Bot', content: 'All green, no errors', time: '15:03', isOwn: false },
  ],
  '4': [
    { id: 'd1', sender: 'Diana', content: 'New mockups uploaded', time: 'Yesterday', isOwn: false },
    { id: 'd2', sender: 'You', content: "Looks great! Love the new color scheme", time: 'Yesterday', isOwn: true },
  ],
};

const dmMessages: Record<string, ChatMessage[]> = {
  'dm1': [
    { id: 'da1', sender: 'Alice Johnson', content: 'Hey, can you check the latest design?', time: '10:15', isOwn: false },
    { id: 'da2', sender: 'You', content: 'Sure, let me check that', time: '10:17', isOwn: true },
    { id: 'da3', sender: 'Alice Johnson', content: 'Thanks! The file is in the shared folder', time: '10:18', isOwn: false },
  ],
  'dm2': [
    { id: 'db1', sender: 'Bob Smith', content: 'The server migration is complete', time: '09:00', isOwn: false },
    { id: 'db2', sender: 'You', content: 'Great work! Any downtime?', time: '09:05', isOwn: true },
    { id: 'db3', sender: 'Bob Smith', content: 'None at all, smooth transition', time: '09:06', isOwn: false },
    { id: 'db4', sender: 'You', content: 'Thanks for the update!', time: '09:10', isOwn: true },
  ],
  'dm3': [
    { id: 'dc1', sender: 'Charlie Brown', content: "I'll be out tomorrow", time: '16:00', isOwn: false },
    { id: 'dc2', sender: 'You', content: 'No problem, noted', time: '16:05', isOwn: true },
    { id: 'dc3', sender: 'Charlie Brown', content: 'See you tomorrow', time: '16:06', isOwn: false },
  ],
  'dm4': [
    { id: 'dd1', sender: 'Diana Prince', content: 'The deadline has been extended', time: '14:00', isOwn: false },
    { id: 'dd2', sender: 'You', content: 'Perfect, that gives us more time', time: '14:05', isOwn: true },
    { id: 'dd3', sender: 'Diana Prince', content: 'Got it 👍', time: '14:06', isOwn: false },
  ],
  'dm5': [
    { id: 'de1', sender: 'Eve Adams', content: 'I submitted my PR for review', time: '11:00', isOwn: false },
    { id: 'de2', sender: 'You', content: "I'll take a look after standup", time: '11:05', isOwn: true },
    { id: 'de3', sender: 'Eve Adams', content: 'Can you review my PR?', time: '11:06', isOwn: false },
  ],
};

const chatNames: Record<string, string> = {
  '1': 'General', '2': 'Random', '3': 'Project Alpha', '4': 'Design Team',
  'dm1': 'Alice Johnson', 'dm2': 'Bob Smith', 'dm3': 'Charlie Brown',
  'dm4': 'Diana Prince', 'dm5': 'Eve Adams',
};

export default function ChatRoom() {
  const { groupId, userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [input, setInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDM = location.pathname.startsWith('/dm/');
  const chatId = (isDM ? userId : groupId) || '';
  const messages = isDM ? dmMessages[chatId] ?? [] : groupMessages[chatId] ?? [];

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
  }, [chatId, messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    setInput('');
  };

  const name = chatId ? chatNames[chatId] ?? 'Unknown' : '';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button
          onClick={() => navigate(isDM ? '/' : '/')}
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-foreground lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="truncate text-sm font-semibold text-foreground">{name}</h2>
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
        <div className="border-b border-border bg-background px-4 py-2">
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
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
            >
              {!msg.isOwn && (
                <Avatar className="mt-1 h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {msg.sender.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] ${msg.isOwn ? 'items-end' : ''}`}>
                {!msg.isOwn && (
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {msg.sender}
                  </p>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 text-sm ${
                    msg.isOwn
                      ? 'bg-chat-outgoing-bg text-chat-outgoing-foreground rounded-br-md'
                      : 'bg-chat-incoming-bg text-chat-incoming-foreground rounded-bl-md'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
                <p className={`mt-0.5 text-[10px] text-muted-foreground ${msg.isOwn ? 'text-right' : ''}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
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
