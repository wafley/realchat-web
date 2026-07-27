import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, UserMinus, MessageCircle, Users, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useMarkNotificationRead } from '@/hooks/useNotifications';
import { followUser } from '@/services/friends';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';
import type { Notification } from '@/types';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
}

const typeIcon: Record<string, typeof UserPlus> = {
  follow_request: UserPlus,
  friend_request: UserPlus,
  FRIEND_REQUEST: UserPlus,
  new_follower: UserPlus,
  follow_accepted: UserCheck,
  friend_accepted: UserCheck,
  FRIEND_ACCEPTED: UserCheck,
  unfollow: UserMinus,
  UNFOLLOW: UserMinus,
  message: MessageCircle,
  MESSAGE: MessageCircle,
  group: Users,
  GROUP: Users,
};

export default function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);

  const Icon = (notification?.type && typeIcon[notification.type]) || Bell;

  const sender = notification.sender || (notification as any).user || (notification as any).data?.sender || (notification as any).data?.user;
  const avatarUrl = sender?.avatarUrl || (notification as any).avatarUrl || (notification as any).data?.avatarUrl;
  const senderName = sender?.fullName || sender?.username || (notification as any).senderName || (notification as any).data?.senderName;

  const isFollowNotif = /friend.*request|follow.*request|new_follower/i.test(notification?.type ?? '');

  const requestId =
    notification.followRequestId ||
    (notification as any).requestId ||
    (notification as any).friendRequestId ||
    (notification as any).data?.requestId ||
    (notification as any).data?.followRequestId ||
    (notification as any).data?.id;

  const handleClick = () => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }

    if ((notification.type === 'follow_accepted' || notification.type === 'friend_accepted') && sender) {
      navigate(`/profile/${sender.id}`);
    } else if (notification.type === 'message' && notification.conversationId) {
      navigate(`/dm/${notification.conversationId}`);
    } else if (notification.type === 'group' && notification.conversationId) {
      navigate(`/chat/${notification.conversationId}`);
    }
  };

  const handleFollowBack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sender?.id) {
      toast.error('Missing user');
      return;
    }
    setActionLoading('accept');
    try {
      await followUser(sender.id);
      markRead.mutate(notification.id);
      queryClient.invalidateQueries({ queryKey: ['follow'] });
      toast.success('Followed back!');
    } catch {
      toast.error('Failed to follow back');
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
          {avatarUrl && <AvatarImage src={avatarUrl} />}
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
          {senderName ? `${senderName} wants to follow you` : notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{notification.body}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(notification.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
        </p>
      </div>
      {isFollowNotif && !notification.read && sender?.id && (
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={handleFollowBack}
            disabled={actionLoading !== null}
            className="flex h-8 items-center justify-center rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
          >
            {actionLoading === 'accept' ? <Loader2 size={14} className="animate-spin" /> : 'Follow Back'}
          </button>
        </div>
      )}
    </div>
  );
}
