import { House, Users, UserPlus, User, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', icon: House, label: 'Home', end: true },
  { to: '/groups', icon: Users, label: 'Groups' },
  { to: '/friends', icon: UserPlus, label: 'Friends' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];
