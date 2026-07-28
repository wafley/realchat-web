import { MessageSquare, User, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  desktopHidden?: boolean;
  mobileHidden?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', icon: MessageSquare, label: 'Chat', end: true },
  { to: '/profile', icon: User, label: 'Profile', desktopHidden: true },
  { to: '/settings', icon: Settings, label: 'Settings', mobileHidden: true },
];
