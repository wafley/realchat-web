import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Users, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getGroups } from '@/services/chat';

export default function Groups() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: groups = [], isPending, isError } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const filtered = search.trim()
    ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5 pt-safe-top">
      <button
        onClick={() => navigate('/')}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="mt-4 space-y-3">
        {isPending ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle size={32} className="mb-2 text-destructive/60" />
            <p className="text-sm text-muted-foreground">Failed to load groups</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center py-10">
            <p className="text-sm text-muted-foreground">{search ? 'No groups found' : 'No groups yet'}</p>
          </div>
        ) : filtered.map((g) => (
          <Link
            key={g.id}
            to={`/groups/${g.id}`}
            className="flex min-h-[88px] items-center gap-4 rounded-2xl border border-border px-4 py-3.5 transition-colors hover:bg-accent/5"
          >
            <Avatar className="h-12 w-12 shrink-0">
              {g.avatarUrl && <AvatarImage src={g.avatarUrl} alt={g.name} />}
              <AvatarFallback className="font-bold text-sm">
                {g.name ? g.name.charAt(0).toUpperCase() : 'G'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-foreground">{g.name}</h3>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Users size={14} />
              <span>{g.members ?? 0}</span>
              {g.online && <span className="ml-1 text-green-500">● Online</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
