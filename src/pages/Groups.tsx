import { Link } from 'react-router-dom';
import { Search, Users, Plus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface GroupItem {
  id: string;
  name: string;
  description: string;
  members: number;
  online: number;
}

const groups: GroupItem[] = [
  { id: '1', name: 'General', description: 'Team-wide announcements and general chat', members: 12, online: 4 },
  { id: '2', name: 'Random', description: 'Off-topic conversations and water cooler talk', members: 10, online: 2 },
  { id: '3', name: 'Project Alpha', description: 'Alpha project coordination and updates', members: 6, online: 3 },
  { id: '4', name: 'Design Team', description: 'Design discussions, feedback, and mockups', members: 5, online: 1 },
];

export default function Groups() {
  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-background pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">Groups</h1>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-colors hover:bg-accent/80">
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
        {/* Search input */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Group list - 16px below search */}
        <div className="mt-4 space-y-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              to={`/chat/${g.id}`}
              className="flex min-h-[88px] items-center gap-4 rounded-2xl border border-border px-4 py-3.5 transition-colors hover:bg-accent/5"
            >
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="font-bold">{g.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-foreground">{g.name}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={14} />
                <span>{g.members}</span>
                <span className="ml-1 text-green-500">● {g.online}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
