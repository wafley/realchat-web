import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Users, UserPlus } from 'lucide-react';

const menuItems = [
  { to: '/friends', icon: Users, label: 'All Friends', end: true },
  { to: '/friends/add', icon: UserPlus, label: 'Find People' },
];

export default function FriendsLayout() {
  return (
    <div className="flex flex-1">
      <aside className="hidden w-56 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="border-b border-border px-4 py-4">
          <h1 className="text-base font-bold text-foreground">Friends</h1>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {menuItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="flex flex-1 flex-col">
        <div className="flex border-b border-border bg-background lg:hidden">
          {menuItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </section>
    </div>
  );
}
