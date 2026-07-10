import { cn } from '@/lib/utils';

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 border-b border-border px-4 py-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-3/5 rounded bg-muted" />
            <div className="h-2.5 w-4/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-1/4 rounded bg-muted" />
          <div className="h-2.5 w-1/3 rounded bg-muted" />
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn('flex animate-pulse', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
            <div className={cn('h-10 w-3/5 rounded-lg bg-muted', i % 2 === 1 && 'rounded-br-sm')} />
          </div>
        ))}
      </div>
    </div>
  );
}
