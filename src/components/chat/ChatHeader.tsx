import { useState, useRef, useEffect } from 'react';
import { Search, Bell, BellOff, Ban, Flag, Info, ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatHeaderProps {
  chatName: string;
  chatOnline: boolean;
  otherTyping: boolean;
  isDM: boolean;
  muted: boolean;
  onBack: () => void;
  onSearchToggle: () => void;
  onToggleMute: () => void;
  onBlockClick: () => void;
  onReportClick: () => void;
  onGroupInfoClick: () => void;
  onClearChat: () => void;
}

export default function ChatHeader({
  chatName,
  chatOnline,
  otherTyping,
  isDM,
  muted,
  onBack,
  onSearchToggle,
  onToggleMute,
  onBlockClick,
  onReportClick,
  onGroupInfoClick,
  onClearChat,
}: ChatHeaderProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  return (
    <div className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3">
      <button
        onClick={onBack}
        aria-label="Back to chats"
        className="-ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-foreground lg:hidden"
      >
        <ArrowLeft size={20} />
      </button>
      <Avatar className="h-9 w-9 lg:h-11 lg:w-11">
        <AvatarFallback className="lg:text-base">{chatName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h2 className="truncate text-sm font-semibold text-foreground lg:text-base">{chatName}</h2>
        {otherTyping ? (
          <p className="flex items-center gap-1 text-xs text-accent">
            <span className="flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
            </span>
            typing
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{chatOnline ? 'Online' : 'Offline'}</p>
        )}
      </div>
      <button
        onClick={onSearchToggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:h-10 lg:w-10"
      >
        <Search size={18} className="lg:size-5" />
      </button>
      {isDM ? (
        <>
          <button
            onClick={onToggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:h-10 lg:w-10"
          >
            {muted ? <BellOff size={16} /> : <Bell size={16} />}
          </button>
          <button
            onClick={onBlockClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:h-10 lg:w-10"
          >
            <Ban size={16} />
          </button>
          <button
            onClick={onReportClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:h-10 lg:w-10"
          >
            <Flag size={16} />
          </button>
        </>
      ) : (
        <button
          onClick={onGroupInfoClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:h-10 lg:w-10"
        >
          <Info size={18} />
        </button>
      )}
      <div ref={moreRef} className="relative">
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:h-10 lg:w-10"
        >
          <MoreVertical size={18} />
        </button>
        {moreOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg">
            <button
              onClick={() => { setMoreOpen(false); onClearChat(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10"
            >
              <Trash2 size={15} className="text-muted-foreground" />
              Clear Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
