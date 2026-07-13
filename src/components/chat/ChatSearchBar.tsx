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
    <div className="border-b border-border bg-sidebar px-4 py-2">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-input py-2 pl-9 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {searchQuery && (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {searchMatches.length > 0
                ? `${activeMatchIndex + 1}/${searchMatches.length}`
                : '0/0'}
            </span>
            <button
              onClick={onPreviousMatch}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              disabled={searchMatches.length === 0}
              aria-label="Previous match"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              onClick={onNextMatch}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              disabled={searchMatches.length === 0}
              aria-label="Next match"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button
              onClick={onClear}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
