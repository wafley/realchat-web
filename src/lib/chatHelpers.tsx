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

const URL_TOKEN = 'https?:\\/\\/[^\\s]+';
const TRAILING_PUNCT = '.,;:!?]}\'"';
const urlPattern = /^https?:\/\/[^\s]+$/i;

function cleanUrl(raw: string): string {
  let url = raw;
  while (url.length > 4) {
    const last = url[url.length - 1];
    if (last === ')') {
      const opens = (url.match(/\(/g) || []).length;
      const closes = (url.match(/\)/g) || []).length;
      if (opens >= closes) break;
    } else if (!TRAILING_PUNCT.includes(last)) {
      break;
    }
    url = url.slice(0, -1);
  }
  return url;
}

export function highlightText(text: string, query: string, isOwn = false, onMentionClick?: (username: string) => void): string | ReactNode[] {
  if (!text) return text;

  const escapedQuery = query.trim() ? query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const pattern = escapedQuery
    ? new RegExp(`(${URL_TOKEN}|${escapedQuery}|@[A-Za-z0-9_.-]+)`, 'gi')
    : new RegExp(`(${URL_TOKEN}|@[A-Za-z0-9_.-]+)`, 'gi');

  const matches: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const matchedText = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      matches.push(text.slice(lastIndex, start));
    }

    const isMention = /^@[A-Za-z0-9_.-]+$/.test(matchedText);
    if (isMention && onMentionClick) {
      const username = matchedText.slice(1);
      matches.push(
        <button
          key={`${start}-${matchedText}`}
          type="button"
          onClick={(e) => { e.stopPropagation(); onMentionClick(username); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`rounded px-0.5 font-medium underline decoration-2 underline-offset-2 transition-opacity hover:opacity-80 ${isOwn ? 'bg-white/20 text-white' : 'bg-accent/20 text-accent'}`}
        >
          {matchedText}
        </button>,
      );
    } else if (urlPattern.test(matchedText)) {
      const url = cleanUrl(matchedText);
      matches.push(
        <a
          key={`url-${start}-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`break-all underline decoration-2 underline-offset-2 transition-opacity hover:opacity-80 ${isOwn ? 'text-white' : 'text-accent'}`}
        >
          {url}
        </a>,
      );
      if (url.length < matchedText.length) {
        matches.push(matchedText.slice(url.length));
      }
    } else {
      matches.push(
        <mark
          key={`${start}-${matchedText}`}
          className={
            isMention
              ? `rounded px-0.5 font-medium underline decoration-2 underline-offset-2 ${isOwn ? 'bg-white/20 text-white' : 'bg-accent/20 text-accent'}`
              : 'rounded bg-accent/30 px-0.5 text-inherit'
          }
        >
          {matchedText}
        </mark>,
      );
    }

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
