import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil } from 'lucide-react';

export default function Profile() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-md">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                <AvatarFallback className="text-2xl">
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow transition-colors hover:bg-accent/80">
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
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-lg border border-border p-4">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <p className="mt-1 text-sm text-foreground">{user?.email || 'email@example.com'}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <label className="text-xs font-medium text-muted-foreground">Bio</label>
              <p className="mt-1 text-sm text-foreground">
                {user?.bio || 'No bio yet'}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <label className="text-xs font-medium text-muted-foreground">Member Since</label>
              <p className="mt-1 text-sm text-foreground">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
