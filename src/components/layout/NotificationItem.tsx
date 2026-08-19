import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useMarkNotificationRead } from '@/hooks/useNotifications';
import type { Notification } from '@/types';

interface NotificationItemProps {
  notification: Notification;
}



export default function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();

  const sender = notification.sender || (notification as any).user || (notification as any).data?.sender || (notification as any).data?.user;
  const actorId = notification.actorId || (notification as any).data?.actorId;
  const avatarUrl = sender?.avatarUrl || (notification as any).avatarUrl || (notification as any).data?.avatarUrl;
  const senderName = sender?.fullName || sender?.username || (notification as any).senderName || (notification as any).data?.senderName;
  const isContactNotif = notification.type === 'contact_added' || notification.type === 'new_contact';

  const handleClick = () => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }

    if (isContactNotif) {
      navigate(`/profile/${sender?.id ?? actorId}`);
    } else if (notification.type === 'message' && notification.conversationId) {
      navigate(`/dm/${notification.conversationId}`);
    } else if (
      (notification.type === 'group' || notification.type === 'group_invite' || notification.type === 'mention') &&
      notification.conversationId
    ) {
      navigate(`/chat/${notification.conversationId}`);
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
          <AvatarFallback className="text-xs font-semibold">
            {senderName ? senderName.charAt(0).toUpperCase() : 'N'}
          </AvatarFallback>
        </Avatar>
        {!notification.read && (
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', notification.read ? 'text-muted-foreground' : 'text-foreground')}>
          {isContactNotif && senderName ? `${senderName} added you as contact` : notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{notification.body}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(notification.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
        </p>
      </div>
    </div>
  );
}
