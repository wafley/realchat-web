import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/navigation';
import { usePendingFriendRequestCount } from '@/hooks/usePendingFriendRequestCount';

interface MobileNavProps {
  className?: string;
}

export default function MobileNav({ className }: MobileNavProps) {
  const { data: pendingCount } = usePendingFriendRequestCount();

  return (
    <nav role="navigation" aria-label="Mobile navigation" className={cn('flex min-h-[68px] items-center justify-around gap-1 border-t border-border bg-sidebar px-2 pb-[env(safe-area-inset-bottom,0px)] lg:hidden', className)}>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
            className={({ isActive }) =>
            cn(
              'relative flex flex-col items-center gap-1 rounded-lg px-3 pb-1.5 pt-1 text-xs transition-colors',
              isActive
                ? 'bg-accent/15 text-accent'
                : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
            )
          }
        >
          <Icon size={24} />
          {to === '/friends' && pendingCount != null && pendingCount > 0 && (
            <span
              className="absolute right-1.5 top-0 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-destructive"
              title={`${pendingCount} pending friend request(s)`}
            />
          )}
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
