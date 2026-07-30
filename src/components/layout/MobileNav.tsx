import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/navigation';
import { Plus } from 'lucide-react';

interface MobileNavProps {
  className?: string;
}

export default function MobileNav({ className }: MobileNavProps) {

  return (
    <nav role="navigation" aria-label="Mobile navigation" className={cn('flex min-h-[68px] items-center justify-around gap-1 border-t border-border bg-sidebar px-2 pb-[env(safe-area-inset-bottom,0px)] lg:hidden', className)}>
      {navItems.filter((item) => !item.desktopHidden && !item.mobileHidden).map(({ to, icon: Icon, label }) => (
        to === '/create' ? (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                '-mt-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-accent/80 text-accent-foreground hover:bg-accent',
              )
            }
          >
            <Plus size={28} strokeWidth={3} />
          </NavLink>
        ) : (
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
            {label}
          </NavLink>
        )
      ))}

    </nav>
  );
}
