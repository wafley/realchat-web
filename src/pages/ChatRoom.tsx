import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
  avatarUrl?: string;
}

const chatMessages: Record<string, ChatMessage[]> = {
  '1': [
    { id: 'm1', sender: 'Alice', content: 'Hey everyone!', time: '10:30', isOwn: false },
    { id: 'm2', sender: 'You', content: 'Hi Alice! How are you?', time: '10:31', isOwn: true },
    { id: 'm3', sender: 'Bob', content: 'Good morning team 👋', time: '10:32', isOwn: false },
    { id: 'm4', sender: 'You', content: 'Did anyone see the new update?', time: '10:33', isOwn: true },
    { id: 'm5', sender: 'Alice', content: 'Yes! The UI looks much cleaner now', time: '10:34', isOwn: false },
    { id: 'm6', sender: 'Bob', content: 'I just deployed the fix for the login bug', time: '10:35', isOwn: false },
    { id: 'm7', sender: 'You', content: 'Awesome, thanks Bob! I\'ll review it', time: '10:36', isOwn: true },
    { id: 'm8', sender: 'Alice', content: 'Should we have a quick standup?', time: '10:37', isOwn: false },
  ],
  '2': [
    { id: 'n1', sender: 'Charlie', content: 'Anyone free for lunch?', time: '12:00', isOwn: false },
    { id: 'n2', sender: 'You', content: 'I\'m in! Where to?', time: '12:05', isOwn: true },
  ],
  '3': [
    { id: 'p1', sender: 'Deploy Bot', content: 'Deploy is done ✅', time: '15:00', isOwn: false },
    { id: 'p2', sender: 'You', content: 'Great! Any issues?', time: '15:02', isOwn: true },
    { id: 'p3', sender: 'Deploy Bot', content: 'All green, no errors', time: '15:03', isOwn: false },
  ],
  '4': [
    { id: 'd1', sender: 'Diana', content: 'New mockups uploaded', time: 'Yesterday', isOwn: false },
    { id: 'd2', sender: 'You', content: 'Looks great! Love the new color scheme', time: 'Yesterday', isOwn: true },
  ],
};

const chatNames: Record<string, string> = {
  '1': 'General',
  '2': 'Random',
  '3': 'Project Alpha',
  '4': 'Design Team',
};

export default function ChatRoom() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = groupId ? chatMessages[groupId] ?? [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupId, messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    setInput('');
  };

  const name = groupId ? chatNames[groupId] ?? 'Unknown' : '';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={() => navigate('/')}
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-foreground lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">{name}</h2>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((msg) => (
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
                      ? 'bg-accent/15 text-foreground rounded-br-md'
                      : 'bg-secondary text-foreground rounded-bl-md'
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
