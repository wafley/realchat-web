import { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionItemProps {
  icon: any;
  label: string;
  desc: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export default function SectionItem({ icon: Icon, label, desc, expanded, onToggle, children }: SectionItemProps) {
  return (
    <div className={cn(
      "group overflow-hidden rounded-xl border border-border/50 bg-card/60 transition-all duration-200 hover:border-border hover:bg-card/90 shadow-sm",
      expanded && "border-border bg-card shadow-md"
    )}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3.5 p-3.5 text-left transition-all duration-200"
      >
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-all duration-200 group-hover:scale-105 group-hover:bg-muted group-hover:text-foreground",
          expanded && "bg-muted text-foreground shadow-sm"
        )}>
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground transition-colors">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>

        <div className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-all duration-200 group-hover:text-foreground",
          expanded && "rotate-90 bg-muted text-foreground"
        )}>
          <ChevronRight size={14} />
        </div>
      </button>

      <div className={cn('overflow-hidden transition-all duration-300 ease-in-out', expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0')}>
        <div className="border-t border-border/40 bg-background/50 p-4">{children}</div>
      </div>
    </div>
  );
}

