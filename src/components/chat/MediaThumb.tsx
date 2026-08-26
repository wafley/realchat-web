import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { resolveFileUrl } from '@/lib/url';

export function isLinkContent(content?: string): boolean {
  return !!content && /https?:\/\/[^\s]+/.test(content);
}

export function extractUrl(content: string): string | null {
  const match = content.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

export function urlDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

interface MediaThumbProps {
  media: {
    id: string;
    type: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
  };
  onClickImage?: (url: string) => void;
}

export function MediaThumb({ media, onClickImage }: MediaThumbProps) {
  const isLink = media.type === 'text';
  const linkUrl = isLink ? extractUrl(media.content || '') : null;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
      {media.type === 'image' ? (
        <img
          src={resolveFileUrl(media.fileUrl)}
          alt={media.fileName || 'Shared image'}
          loading="lazy"
          decoding="async"
          className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
          onClick={() => {
            if (media.fileUrl && media.fileUrl !== '#') {
              onClickImage?.(media.fileUrl);
            } else {
              toast.error('Preview not available');
            }
          }}
        />
      ) : media.type === 'video' ? (
        <div
          className="relative flex h-full w-full cursor-pointer items-center justify-center bg-black/10"
          onClick={() => {
            if (media.fileUrl && media.fileUrl !== '#') {
              onClickImage?.(media.fileUrl);
            } else {
              toast.error('Preview not available');
            }
          }}
        >
          {media.fileUrl && media.fileUrl !== '#' ? (
            <video
              src={resolveFileUrl(media.fileUrl)}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover opacity-70"
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Play size={24} className="text-muted-foreground" fill="currentColor" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50">
              <Play size={14} className="text-white" fill="white" />
            </div>
          </div>
          {media.duration && (
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
              {media.duration < 60 ? `${media.duration}s` : `${Math.floor(media.duration / 60)}m`}
            </span>
          )}
        </div>
      ) : isLink && linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 transition-colors hover:bg-accent/10"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <span className="max-w-full truncate text-[10px] font-medium text-foreground">{urlDomain(linkUrl)}</span>
          <span className="max-w-full truncate text-[9px] text-muted-foreground">{linkUrl}</span>
        </a>
      ) : (
        <div className="flex h-full w-full items-center justify-center p-2">
          <span className="max-w-full truncate text-[10px] text-muted-foreground">No preview</span>
        </div>
      )}
    </div>
  );
}
