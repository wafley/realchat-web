import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  House,
  Users,
  UserPlus,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { to: '/', icon: House, label: 'Home' },
  { to: '/groups', icon: Users, label: 'Groups' },
  { to: '/friends', icon: UserPlus, label: 'Friends' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="hidden w-16 flex-col items-center border-r border-border bg-background py-3 lg:flex">
      <nav className="flex flex-col items-center gap-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                isActive
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
              )
            }
            title={label}
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-3">
        <Avatar className="h-8 w-8">
          {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
          <AvatarFallback className="text-xs">
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={logout}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
