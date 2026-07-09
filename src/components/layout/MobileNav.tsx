import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { House, Users, UserPlus, User, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: House, label: 'Home' },
  { to: '/groups', icon: Users, label: 'Groups' },
  { to: '/friends', icon: UserPlus, label: 'Friends' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileNav() {
  return (
    <nav className="flex min-h-[68px] items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 px-3 pb-1 text-xs transition-colors',
              isActive
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <Icon size={24} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
