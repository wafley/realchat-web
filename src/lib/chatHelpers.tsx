import type { ReactNode } from 'react';

export function formatTime(date: Date | string | number) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateSeparator(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function getDateKey(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function highlightText(text: string, query: string): string | ReactNode[] {
  if (!text) return text;

  const escapedQuery = query.trim() ? query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const pattern = escapedQuery
    ? new RegExp(`(${escapedQuery}|@[A-Za-z0-9_.-]+)`, 'gi')
    : /@[A-Za-z0-9_.-]+/g;

  const matches: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const matchedText = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      matches.push(text.slice(lastIndex, start));
    }

    const isMention = /^@[A-Za-z0-9_.-]+$/.test(matchedText);
    matches.push(
      <mark
        key={`${start}-${matchedText}`}
        className={
          isMention
            ? 'rounded bg-accent/20 px-0.5 font-medium text-accent underline decoration-2 underline-offset-2'
            : 'rounded bg-accent/30 px-0.5 text-inherit'
        }
      >
        {matchedText}
      </mark>,
    );

    lastIndex = start + matchedText.length;
  }

  if (lastIndex < text.length) {
    matches.push(text.slice(lastIndex));
  }

  return matches.length > 0 ? matches : text;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
