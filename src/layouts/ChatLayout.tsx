import { Outlet, useParams, useLocation } from 'react-router-dom';
import ChatList from '@/components/layout/ChatList';
import { cn } from '@/lib/utils';

export default function ChatLayout() {
  const { groupId, userId } = useParams();
  const location = useLocation();
  const isStarred = location.pathname === '/starred';
  const hasChat = !!(groupId || userId) || isStarred;

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <aside
        className={cn(
          'w-full min-h-0 border-r border-border bg-sidebar lg:w-[30rem]',
          hasChat && 'hidden lg:flex lg:flex-col',
        )}
      >
        <ChatList />
      </aside>
      <section
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col',
          !hasChat && 'hidden lg:flex',
        )}
      >
        <Outlet />
      </section>
    </div>
  );
}
