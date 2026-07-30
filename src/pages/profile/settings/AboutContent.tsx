import { cn } from '@/lib/utils';

const features = [
  { name: 'Chat', status: 'active' as const },
  { name: 'Group Chat', status: 'active' as const },
  { name: 'Contacts', status: 'active' as const },
  { name: 'Feed & Posts', status: 'active' as const },
  { name: 'File Sharing', status: 'active' as const },
  { name: 'Voice & Video Calls', status: 'coming' as const },
  { name: 'Dark Mode', status: 'active' as const },
  { name: 'Online Status', status: 'active' as const },
  { name: 'Notification Preferences', status: 'active' as const },
  { name: 'End-to-End Encryption', status: 'coming' as const },
  { name: 'Message Reactions', status: 'active' as const },
  { name: 'Message Forwarding', status: 'active' as const },
  { name: 'Message Pinning', status: 'active' as const },
  { name: 'Read Receipts', status: 'active' as const },
];

export default function AboutContent() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
        <div>
          <p className="text-sm font-bold text-foreground">Hallo Wok</p>
          <p className="text-xs text-muted-foreground">Version 0.0.1</p>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">All Features</p>
        <div className="space-y-1">
          {features.map((f) => (
            <div key={f.name} className="flex items-center gap-2">
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', f.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground/40')} />
              <span className={cn('text-xs', f.status === 'active' ? 'text-foreground' : 'text-muted-foreground/50')}>
                {f.name}{f.status === 'coming' && <span className="ml-1 text-[10px] text-muted-foreground/40">(Coming Soon)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Developer</p>
        <div className="space-y-0.5">
          <p className="text-xs text-foreground"><span className="text-muted-foreground/60">Frontend:</span> Alif-Kopling</p>
          <p className="text-xs text-foreground"><span className="text-muted-foreground/60">Backend:</span> Todzxx</p>
        </div>
      </div>
    </div>
  );
}
