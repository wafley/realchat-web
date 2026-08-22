import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { useAuthStore } from '@/store/authStore';
import { usePrivacyStore } from '@/store/privacyStore';
import { initSocket, destroySocket } from '@/services/socket.service';


export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    initSocket();
    void usePrivacyStore.getState().syncFromServer();
    return () => {
      destroySocket();
    };
  }, [isAuthenticated]);

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />
      <main id="main-content" className="flex flex-1 overflow-hidden pt-[env(safe-area-inset-top,0px)] lg:pt-0 animate-[fade-in-up_0.3s_ease-out]">
        <Outlet />
      </main>
      <MobileNav className="hidden" />
    </div>
  );
}
