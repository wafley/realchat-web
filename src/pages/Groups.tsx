import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Users, MessageSquareText, AlertCircle, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getGroups } from '@/services/chat';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function Groups() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const maxNameChars = isDesktop ? 50 : 25;
  const { data: groups = [], isPending, isError } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const filtered = search.trim()
    ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups;

  const sorted = useMemo(() => {
    const time = (s?: string) => {
      const n = Date.parse(s ?? '');
      return Number.isNaN(n) ? -Infinity : n;
    };
    return [...filtered].sort((a, b) => time(b.lastTime) - time(a.lastTime));
  }, [filtered]);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5 pt-safe-top">
      <button
        onClick={() => navigate('/')}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">All Groups</h1>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {groups.length} {groups.length === 1 ? 'group' : 'groups'}
        </span>
      </div>

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
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex min-h-[88px] animate-pulse items-center gap-4 rounded-2xl border border-border px-4 py-3.5"
              >
                <div className="h-12 w-12 shrink-0 rounded-full bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={40} className="mb-2 opacity-30 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Failed to load groups</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquareText size={40} className="mb-2 opacity-30 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{search ? 'No groups found' : 'No groups yet'}</p>
            {!search && (
              <Link to="/groups/create" className="mt-3 text-sm font-medium text-accent hover:underline">
                Create a group
              </Link>
            )}
          </div>
        ) : sorted.map((g) => (
          <Link
            key={g.id}
            to={`/chat/${g.id}`}
            state={{ name: g.name, members: g.members }}
            title={g.name}
            className="flex min-h-[88px] items-center gap-4 rounded-2xl border border-border px-4 py-3.5 transition-colors hover:bg-accent/5"
          >
            <Avatar className="h-12 w-12 shrink-0">
              {g.avatarUrl && <AvatarImage src={g.avatarUrl} alt={g.name} />}
              <AvatarFallback className="font-bold text-sm">
                {g.name ? g.name.charAt(0).toUpperCase() : 'G'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
                {g.name.length > maxNameChars ? `${g.name.slice(0, maxNameChars)}...` : g.name}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={14} />
                {g.members ?? 0}
              </span>
              {(g.unread ?? 0) > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-medium leading-none text-accent-foreground">
                  {g.unread}
                </span>
              )}
              {g.online && <span className="text-green-500">● Online</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}