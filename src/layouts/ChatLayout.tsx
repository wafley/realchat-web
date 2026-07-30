import { Outlet, useParams } from 'react-router-dom';
import ChatList from '@/components/layout/ChatList';
import { cn } from '@/lib/utils';

export default function ChatLayout() {
  const { groupId, userId } = useParams();
  const hasChat = !!(groupId || userId);

  return (
    <div className="flex flex-1">
      <aside
        className={cn(
          'w-full border-r border-border bg-sidebar lg:w-[30rem]',
          hasChat && 'hidden lg:flex lg:flex-col',
        )}
      >
        <ChatList />
      </aside>
      <section
        className={cn(
          'flex flex-1 flex-col',
          !hasChat && 'hidden lg:flex',
        )}
      >
        <Outlet />
      </section>
    </div>
  );
}
