import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, Mail, Info, Calendar, User, Settings } from 'lucide-react';
import { getFollowing, getFollowers } from '@/services/friends';
import { cn } from '@/lib/utils';

const infoItems = [
  { label: 'Email', icon: Mail, value: (u: ReturnType<typeof useAuthStore.getState>['user']) => u?.email || 'email@example.com' },
  { label: 'Bio', icon: Info, value: (u: ReturnType<typeof useAuthStore.getState>['user']) => u?.bio || 'No bio yet' },
  { label: 'Member since', icon: Calendar, value: (u: ReturnType<typeof useAuthStore.getState>['user']) =>
    u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
  },
];

export default function ProfileView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: following = [] } = useQuery({
    queryKey: ['following'],
    queryFn: getFollowing,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers'],
    queryFn: getFollowers,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 md:hidden">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
        <button
          onClick={() => navigate('/settings')}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <Settings size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center px-6 pb-6 pt-8">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                <AvatarFallback className="text-2xl">
                  <User size={24} />
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => navigate('/profile/edit')}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow transition-colors hover:bg-accent/80"
              >
                <Pencil size={14} />
              </button>
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">
              {user?.fullName || 'Your Name'}
            </h2>
            <p className="text-sm text-muted-foreground">
              @{user?.username || 'username'}
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Online
            </span>

            <div className="mt-5 flex items-center gap-6">
              <button
                onClick={() => navigate('/profile/following')}
                className="text-center transition-opacity hover:opacity-70"
              >
                <p className="text-base font-bold text-foreground">{following.length}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </button>
              <button
                onClick={() => navigate('/profile/followers')}
                className="text-center transition-opacity hover:opacity-70"
              >
                <p className="text-base font-bold text-foreground">{followers.length}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </button>
            </div>
          </div>

          <div className="mx-6 mb-8 overflow-hidden rounded-xl bg-card">
            {infoItems.map((item, i) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5',
                  i < infoItems.length - 1 && 'border-b border-border/50',
                )}
              >
                <item.icon size={18} className="text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="truncate text-sm text-foreground">{item.value(user)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
