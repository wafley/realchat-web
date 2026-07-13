import { Pin, X } from 'lucide-react';
import type { Message } from '@/types';

interface PinnedBannerProps {
  pinnedMessages: Message[];
  onUnpin: (msgId: string) => void;
}

export default function PinnedBanner({ pinnedMessages, onUnpin }: PinnedBannerProps) {
  const [first, ...rest] = pinnedMessages;
  if (!first) return null;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-sidebar/80 px-4 py-1.5 text-xs text-muted-foreground">
      <Pin size={12} className="shrink-0" />
      <span className="truncate font-medium">{first.content}</span>
      {rest.length > 0 && (
        <span className="shrink-0 text-accent">+{rest.length} more</span>
      )}
      <button
        onClick={() => onUnpin(first.id)}
        className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-accent/10 hover:text-foreground"
      >
        <X size={12} />
      </button>
    </div>
  );
}
