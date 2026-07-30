import { useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';
import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';

export default function NotificationBell() {
  const isOpen = useNotificationStore((s) => s.isOpen);
  const toggleOpen = useNotificationStore((s) => s.toggleOpen);
  const setOpen = useNotificationStore((s) => s.setOpen);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.notifications);
  const panelRef = useRef<HTMLDivElement>(null);

  useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (target instanceof Element && target.closest('[data-notification-bell]')) {
        return;
      }
      setOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setOpen]);

  const badgeText = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : '';

  return (
    <div className="relative" ref={panelRef} data-notification-bell>
      <button
        onClick={toggleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:h-12 lg:w-12 lg:border-none lg:hover:bg-accent/10 lg:hover:text-foreground"
        title="Notifications"
      >
        <Bell size={20} className="lg:size-[22px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[9px] font-bold text-white lg:h-5 lg:min-w-5 lg:border-sidebar lg:text-[10px]">
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <div data-notification-bell className="fixed top-0 left-0 max-lg:bottom-0 lg:left-20 z-50 flex h-screen w-full lg:w-[30rem] flex-col border-r border-border bg-card shadow-2xl animate-in slide-in-from-left-2 duration-200">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-base font-bold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground lg:hidden"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/30">
                  <Bell size={24} className="text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No notifications yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  When someone interacts with you, you'll see it here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
