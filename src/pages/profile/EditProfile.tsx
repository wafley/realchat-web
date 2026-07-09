import { Camera } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function EditProfile() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4 md:hidden">
        <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <h2 className="mb-1 text-lg font-bold text-foreground">Edit Profile</h2>
          <p className="mb-6 text-sm text-muted-foreground">Update your personal information</p>

          <div className="overflow-hidden rounded-xl bg-card">
            <div className="flex items-center gap-4 border-b border-border/50 px-4 py-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">U</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow transition-colors hover:bg-accent/80">
                  <Camera size={12} />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Profile Photo</p>
                <p className="text-xs text-muted-foreground">Click to change your avatar</p>
              </div>
            </div>

            <div className="space-y-0">
              <div className="border-b border-border/50 px-4 py-3.5">
                <label className="text-xs text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  className="mt-1 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <div className="border-b border-border/50 px-4 py-3.5">
                <label className="text-xs text-muted-foreground">Username</label>
                <input
                  type="text"
                  placeholder="username"
                  className="mt-1 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <div className="px-4 py-3.5">
                <label className="text-xs text-muted-foreground">Bio</label>
                <textarea
                  placeholder="Tell us about yourself"
                  rows={3}
                  className="mt-1 w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
