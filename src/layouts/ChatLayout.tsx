import { Outlet, useParams } from 'react-router-dom';
import ChatList from '@/components/layout/ChatList';
import { cn } from '@/lib/utils';

export default function ChatLayout() {
  const { groupId } = useParams();

  return (
    <div className="flex flex-1">
      <aside
        className={cn(
          'w-full border-r border-border bg-background lg:w-96',
          groupId && 'hidden lg:flex lg:flex-col',
        )}
      >
        <ChatList />
      </aside>
      <section
        className={cn(
          'flex flex-1 flex-col',
          !groupId && 'hidden lg:flex',
        )}
      >
        <Outlet />
      </section>
    </div>
  );
}
