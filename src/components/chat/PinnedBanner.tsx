import { Pin } from 'lucide-react';
import type { Message } from '@/types';

interface PinnedBannerProps {
  pinnedMessages: Message[];
}

export default function PinnedBanner({ pinnedMessages }: PinnedBannerProps) {
  if (pinnedMessages.length === 0) return null;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-sidebar/80 px-4 py-1.5 text-xs text-muted-foreground">
      <Pin size={12} className="shrink-0" />
      <span className="truncate font-medium">Pinned: {pinnedMessages[0].content}</span>
      {pinnedMessages.length > 1 && (
        <span className="shrink-0">+{pinnedMessages.length - 1} more</span>
      )}
    </div>
  );
}
