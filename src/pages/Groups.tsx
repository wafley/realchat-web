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
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">Groups</h1>
        <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80">
          <Plus size={16} />
          Create Group
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          {groups.map((g) => (
            <Link
              key={g.id}
              to={`/chat/${g.id}`}
              className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent/5"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback>{g.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-foreground">{g.name}</h3>
                <p className="truncate text-sm text-muted-foreground">{g.description}</p>
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
