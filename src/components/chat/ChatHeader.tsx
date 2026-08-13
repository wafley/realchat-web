import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, BellOff, Ban, Flag, Info, ArrowLeft, MoreVertical, Trash2, Users, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatLastSeen } from '@/utils/time';
import { shouldShowLastSeen } from '@/utils/privacy';
import { useNow } from '@/hooks/useNow';

interface ChatHeaderProps {
  chatName: string;
  chatOnline: boolean;
  typingLabel?: string | null;
  isDM: boolean;
  muted: boolean;
  userId?: string;
  lastSeen?: Date | null;
  memberCount?: number | null;
  avatarUrl?: string;
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
  typingLabel,
  isDM,
  muted,
  userId,
  lastSeen,
  memberCount,
  avatarUrl,
  onBack,
  onSearchToggle,
  onToggleMute,
  onBlockClick,
  onReportClick,
  onGroupInfoClick,
  onClearChat,
}: ChatHeaderProps) {
  const navigate = useNavigate();
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

  useNow(30000);

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
        {avatarUrl && <AvatarImage src={avatarUrl} alt={chatName} />}
        <AvatarFallback className="lg:text-base">
          {isDM ? <User size={18} /> : <Users size={18} />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        {isDM && userId ? (
          <button onClick={() => navigate(`/profile/${userId}`)} className="truncate text-sm font-semibold text-foreground hover:text-accent lg:text-base">{chatName}</button>
        ) : (
          <button onClick={onGroupInfoClick} className="truncate text-sm font-semibold text-foreground hover:text-accent lg:text-base">{chatName}</button>
        )}
        {typingLabel ? (
          <p className="flex items-center gap-1 text-xs text-accent">
            <span className="flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
            </span>
            {typingLabel}
          </p>
        ) : isDM ? (
          <p className="text-xs text-muted-foreground">
            {chatOnline ? 'Online' : lastSeen && shouldShowLastSeen() ? `last seen ${formatLastSeen(lastSeen)}` : 'Offline'}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {memberCount != null ? `${memberCount} members` : 'Group'}
          </p>
        )}
      </div>
      <button
        onClick={onSearchToggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:h-10 lg:w-10"
      >
        <Search size={18} className="lg:size-5" />
      </button>
      <div ref={moreRef} className="relative">
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:h-10 lg:w-10"
        >
          <MoreVertical size={18} />
        </button>
        {moreOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg">
            <div className="border-b border-border pb-1">
              {isDM ? (
                <>
                  <button onClick={() => { setMoreOpen(false); onToggleMute(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10">
                    {muted ? <BellOff size={15} className="text-muted-foreground" /> : <Bell size={15} className="text-muted-foreground" />}
                    {muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button onClick={() => { setMoreOpen(false); onBlockClick(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10">
                    <Ban size={15} className="text-muted-foreground" />
                    Block
                  </button>
                  <button onClick={() => { setMoreOpen(false); onReportClick(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10">
                    <Flag size={15} className="text-muted-foreground" />
                    Report
                  </button>
                </>
              ) : (
                <button onClick={() => { setMoreOpen(false); onGroupInfoClick(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10">
                  <Info size={15} className="text-muted-foreground" />
                  Group Info
                </button>
              )}
            </div>
            <div className="pt-1">
              <button onClick={() => { setMoreOpen(false); onClearChat(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent/10">
                <Trash2 size={15} className="text-muted-foreground" />
                Clear Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
