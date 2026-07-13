import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/navigation';

export default function MobileNav() {
  return (
    <nav role="navigation" aria-label="Mobile navigation" className="flex min-h-[68px] items-center justify-around gap-1 border-t border-border bg-sidebar px-2 pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
            className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-lg px-3 pb-1.5 pt-1 text-xs transition-colors',
              isActive
                ? 'bg-accent/15 text-accent'
                : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
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
