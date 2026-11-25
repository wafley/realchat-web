import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  name: string;
  comingSoon?: boolean;
}

const features: Feature[] = [
  { name: 'Chat' },
  { name: 'Group Chat' },
  { name: 'Contacts' },
  { name: 'Feed & Posts' },
  { name: 'File Sharing', comingSoon: true },
  { name: 'Voice & Video Calls', comingSoon: true },
  { name: 'Dark Mode' },
  { name: 'Notification Preferences' },
  { name: 'Message Reactions' },
  { name: 'Message Forwarding' },
  { name: 'Message Pinning' },
  { name: 'Read Receipts' },
];

interface Developer {
  role: string;
  name: string;
  url: string;
  avatar?: string;
  type?: 'github' | 'instagram';
}

const developers: Developer[] = [
  {
    role: 'fe-dev',
    name: 'Alif-Kopling',
    url: 'https://github.com/Alif-Kopling',
    avatar: 'https://github.com/Alif-Kopling.png',
    type: 'github',
  },
  {
    role: 'be-dev',
    name: 'Todzxx',
    url: 'https://github.com/Todzxx',
    avatar: 'https://github.com/Todzxx.png',
    type: 'github',
  },
  {
    role: 'tester',
    name: 'Aisyah',
    url: 'https://www.instagram.com/aisyah_nur_aziza?hvrq=MTV3b3dtbW9lZjN3Mw==',
    type: 'instagram',
  },
];

export default function AboutContent() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
        <div>
          <p className="text-sm font-bold text-foreground">Hallo Wok</p>
          <p className="text-xs text-muted-foreground">v1.0.0</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Features</p>
        <div className="space-y-1.5">
          {features.map((f) => (
            <div key={f.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    f.comingSoon ? 'bg-muted-foreground/30' : 'bg-accent',
                  )}
                />
                <span className={cn(f.comingSoon ? 'text-muted-foreground' : 'text-foreground')}>
                  {f.name}
                </span>
              </div>
              {f.comingSoon && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  Coming Soon
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Developers</p>
        <div className="space-y-1">
          {developers.map((dev) => (
            <a
              key={dev.name}
              href={dev.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg px-1 py-1 text-xs text-foreground transition-colors hover:bg-accent/5"
            >
              <DeveloperAvatar dev={dev} />
              <span className="flex-1 truncate text-foreground group-hover:text-accent">{dev.name}</span>
              <span className="shrink-0 text-muted-foreground">{dev.role}</span>
              {dev.type === 'instagram' || dev.url.includes('instagram.com') ? (
                <InstagramIcon className="text-muted-foreground group-hover:text-accent" />
              ) : (
                <GithubIcon className="text-muted-foreground group-hover:text-accent" />
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeveloperAvatar({ dev }: { dev: Developer }) {
  const [error, setError] = useState(false);

  if (!dev.avatar || error) {
    return (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
        <User size={13} />
      </div>
    );
  }

  return (
    <img
      src={dev.avatar}
      alt={dev.name}
      onError={() => setError(true)}
      className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-border"
    />
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
