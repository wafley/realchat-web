export function ListSkeleton({ count = 4 }: { count?: number }) {
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
