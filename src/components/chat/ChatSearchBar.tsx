import { type RefObject } from 'react';
import { Search, X } from 'lucide-react';

interface ChatSearchBarProps {
  searchQuery: string;
  searchMatches: string[];
  activeMatchIndex: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onPreviousMatch: () => void;
  onNextMatch: () => void;
  onClear: () => void;
}

export default function ChatSearchBar({
  searchQuery,
  searchMatches,
  activeMatchIndex,
  inputRef,
  onSearchChange,
  onPreviousMatch,
  onNextMatch,
  onClear,
}: ChatSearchBarProps) {
  return (
    <div className="border-b border-border bg-sidebar px-3 py-1.5">
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-input py-1 pl-7 pr-16 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {searchQuery && (
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">
              {searchMatches.length > 0
                ? `${activeMatchIndex + 1}/${searchMatches.length}`
                : '0/0'}
            </span>
            <button
              onClick={onPreviousMatch}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              disabled={searchMatches.length === 0}
              aria-label="Previous match"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              onClick={onNextMatch}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              disabled={searchMatches.length === 0}
              aria-label="Next match"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button
              onClick={onClear}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
