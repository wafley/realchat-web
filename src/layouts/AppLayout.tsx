import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/dm/') || location.pathname.startsWith('/chat/');

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />
      <main id="main-content" className="flex flex-1 overflow-hidden pt-[env(safe-area-inset-top,0px)] lg:pt-0 animate-[fade-in-up_0.3s_ease-out]">
        <Outlet />
      </main>
      <MobileNav className={cn(isChatRoute && 'hidden')} />
    </div>
  );
}
