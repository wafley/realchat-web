import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function AppLayout() {
  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="flex flex-1 overflow-hidden pt-[env(safe-area-inset-top,0px)] lg:pt-0">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
