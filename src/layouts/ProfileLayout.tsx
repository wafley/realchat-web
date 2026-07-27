import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { User, UserCheck, Users } from 'lucide-react';

const menuItems = [
  { to: '/profile', icon: User, label: 'Profile', end: true },
  { to: '/profile/following', icon: UserCheck, label: 'Following' },
  { to: '/profile/followers', icon: Users, label: 'Followers' },
];

export default function ProfileLayout() {
  return (
    <div className="flex flex-1">
      <aside className="hidden w-56 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="border-b border-border px-4 py-4">
          <h1 className="text-base font-bold text-foreground">Profile</h1>
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
        <Outlet />
      </section>
    </div>
  );
}
