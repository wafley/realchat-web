import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { navItems } from '@/lib/navigation';

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="hidden w-16 flex-col items-center border-r border-border bg-sidebar py-3 lg:flex lg:w-20">
      <nav role="navigation" aria-label="Main navigation" className="flex flex-col items-center gap-3 lg:gap-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:scale-110 active:scale-95 lg:h-12 lg:w-12',
              isActive
                ? 'bg-accent/20 text-accent'
                : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
              )
            }
            title={label}
          >
            <Icon size={22} />
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-3 lg:gap-4">
        <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
          {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
          <AvatarFallback className="text-xs lg:text-sm">
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={logout}
          aria-label="Logout"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:scale-110 hover:bg-destructive/10 hover:text-destructive active:scale-95 lg:h-12 lg:w-12"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}
