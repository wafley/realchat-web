import { House, Users, UserPlus, User, Settings, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', icon: House, label: 'Home', end: true },
  { to: '/friends', icon: UserPlus, label: 'Following' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];
