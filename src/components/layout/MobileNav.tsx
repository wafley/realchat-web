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
    <nav className="flex h-16 items-center justify-around border-t border-border bg-background lg:hidden">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
              isActive
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
