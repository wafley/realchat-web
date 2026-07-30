import { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SectionItem({ icon: Icon, label, desc, expanded, onToggle, children }: { icon: any; label: string; desc: string; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div>
      <button onClick={onToggle} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-accent/5">
        <Icon size={20} className="shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ChevronRight size={16} className={cn('shrink-0 text-muted-foreground/40 transition-transform', expanded && 'rotate-90')} />
      </button>
      <div className={cn('overflow-hidden transition-all', expanded ? 'max-h-[500px]' : 'max-h-0')}>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
