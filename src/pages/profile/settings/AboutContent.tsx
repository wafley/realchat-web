import { cn } from '@/lib/utils';

const features = [
  'Chat',
  'Group Chat',
  'Contacts',
  'Feed & Posts',
  'File Sharing',
  'Voice & Video Calls',
  'Dark Mode',
  'Notification Preferences',
  'Message Reactions',
  'Message Forwarding',
  'Message Pinning',
  'Read Receipts',
];

const developers = [
  { role: 'fe-dev', name: 'Alif-Kopling', github: 'https://github.com/Alif-Kopling' },
  { role: 'be-dev', name: 'Todzxx', github: 'https://github.com/Todzxx' },
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
        <div className="space-y-1">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs text-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {f}
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
              href={dev.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg px-1 py-1 text-xs text-foreground transition-colors hover:bg-accent/5"
            >
              <img
                src={`https://github.com/${dev.name}.png`}
                alt={dev.name}
                className="h-6 w-6 shrink-0 rounded-full ring-1 ring-border"
              />
              <span className="flex-1 truncate text-foreground group-hover:text-accent">{dev.name}</span>
              <span className="shrink-0 text-muted-foreground">{dev.role}</span>
              <GithubIcon className="text-muted-foreground group-hover:text-accent" />
            </a>
          ))}
        </div>
      </div>
    </div>
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
