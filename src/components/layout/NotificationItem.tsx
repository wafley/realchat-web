import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, UserMinus, MessageCircle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useMarkNotificationRead } from '@/hooks/useNotifications';
import { acceptFriendRequest, rejectFriendRequest } from '@/services/friends';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';
import type { Notification } from '@/types';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
}

const typeIcon: Record<Notification['type'], typeof UserPlus> = {
  follow_request: UserPlus,
  follow_accepted: UserCheck,
  unfollow: UserMinus,
  message: MessageCircle,
  group: Users,
};

export default function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);

  const Icon = typeIcon[notification.type];

  const handleClick = () => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }

    if (notification.type === 'follow_accepted' && notification.sender) {
      navigate(`/profile/${notification.sender.id}`);
    } else if (notification.type === 'message' && notification.conversationId) {
      navigate(`/dm/${notification.conversationId}`);
    } else if (notification.type === 'group' && notification.conversationId) {
      navigate(`/chat/${notification.conversationId}`);
    }
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.followRequestId) return;
    setActionLoading('accept');
    try {
      await acceptFriendRequest(notification.followRequestId);
      markRead.mutate(notification.id);
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success('Follow request accepted!');
    } catch {
      toast.error('Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.followRequestId) return;
    setActionLoading('reject');
    try {
      await rejectFriendRequest(notification.followRequestId);
      markRead.mutate(notification.id);
      toast.success('Request rejected');
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/5 cursor-pointer',
        !notification.read && 'bg-accent/10',
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          {notification.sender?.avatarUrl && <AvatarImage src={notification.sender.avatarUrl} />}
          <AvatarFallback className="text-xs">
            <Icon size={16} />
          </AvatarFallback>
        </Avatar>
        {!notification.read && (
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', notification.read ? 'text-muted-foreground' : 'text-foreground')}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(notification.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {notification.type === 'follow_request' && !notification.read && (
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={handleAccept}
            disabled={actionLoading !== null}
            className="flex h-8 items-center justify-center rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
          >
            {actionLoading === 'accept' ? <Loader2 size={14} className="animate-spin" /> : 'Terima'}
          </button>
          <button
            onClick={handleReject}
            disabled={actionLoading !== null}
            className="flex h-8 items-center justify-center rounded-lg border border-input px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            {actionLoading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : 'Tolak'}
          </button>
        </div>
      )}
    </div>
  );
}
