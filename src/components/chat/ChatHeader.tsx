import { Search, Bell, BellOff, Ban, Flag, Info, ArrowLeft } from 'lucide-react';
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
}: ChatHeaderProps) {
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
    </div>
  );
}
