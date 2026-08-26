import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Pause, Play, Save, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { Message } from '@/types';
import { resolveFileUrl } from '@/lib/url';

interface SharedMediaLightboxProps {
  media: Message[];
  url: string;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function SharedMediaLightbox({ media, url, onClose, onSelect }: SharedMediaLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [moreOpen, setMoreOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const activeIndex = Math.max(0, media.findIndex((item) => item.fileUrl === url));
  const active = media[activeIndex];
  const mediaUrl = resolveFileUrl(active?.fileUrl || url) || url;

  useEffect(() => {
    setZoom(1);
    setMoreOpen(false);
    setPlaying(false);
  }, [url]);

  const select = (index: number) => {
    const next = media[index];
    if (next?.fileUrl) onSelect(next.fileUrl);
  };

  const save = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = active?.fileName || (active?.type === 'video' ? 'video' : 'photo');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/60 text-white" onClick={onClose}>
      <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-black/60 px-4 pb-1 pt-[calc(env(safe-area-inset-top)+24px)] shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#667781] text-sm font-semibold">
          {active?.sender?.avatarUrl ? <img src={resolveFileUrl(active.sender.avatarUrl)} alt={active.sender.fullName || 'Sender'} className="h-full w-full object-cover" /> : (active?.sender?.fullName?.charAt(0).toUpperCase() || 'U')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{active?.sender?.fullName || active?.sender?.username || 'Unknown'}</p>
          <p className="text-[11px] text-white/55">{active?.fileName || (active?.type === 'video' ? 'Video' : 'Photo')}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setZoom((value) => Math.max(0.75, value - 0.25)); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Zoom out" title="Zoom out"><ZoomOut size={19} /></button>
          <button onClick={(e) => { e.stopPropagation(); setZoom((value) => Math.min(3, value + 0.25)); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Zoom in" title="Zoom in"><ZoomIn size={19} /></button>
          <button onClick={(e) => { e.stopPropagation(); save(); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Save as" title="Save as"><Save size={19} /></button>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setMoreOpen((value) => !value); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="More options" title="More options"><MoreVertical size={19} /></button>
            {moreOpen && <div className="absolute right-0 top-12 z-20 w-40 overflow-hidden rounded-md bg-[#233138] py-1 text-sm shadow-2xl" onClick={(e) => e.stopPropagation()}><button onClick={() => { setZoom(1); setMoreOpen(false); }} className="w-full px-4 py-2.5 text-left hover:bg-white/10">Reset zoom</button><button onClick={onClose} className="w-full px-4 py-2.5 text-left hover:bg-white/10">Close preview</button></div>}
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Close preview" title="Close preview"><X size={21} /></button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/60 p-3 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => select((activeIndex - 1 + media.length) % media.length)} className="absolute left-5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 disabled:opacity-30" aria-label="Previous media" disabled={media.length < 2}><ChevronLeft size={24} /></button>
        {active?.type === 'video' ? (
          <div className="group relative flex items-center justify-center" style={{ width: 'min(94vw, 1200px)', height: 'min(82vh, 820px)' }}>
            <video src={mediaUrl} controls autoPlay playsInline onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} className="h-full w-full rounded-sm object-contain shadow-2xl" style={{ transform: `scale(${zoom})` }} />
            <button onClick={(e) => { e.stopPropagation(); const video = e.currentTarget.previousElementSibling as HTMLVideoElement; void (video.paused ? video.play() : video.pause()); }} className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition-opacity hover:bg-black/75 ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`} aria-label={playing ? 'Pause video' : 'Play video'} title={playing ? 'Pause video' : 'Play video'}>{playing ? <Pause size={27} fill="currentColor" /> : <Play size={27} fill="currentColor" className="ml-1" />}</button>
          </div>
        ) : (
          <img src={mediaUrl} alt={active?.fileName || 'Full size'} className="rounded-sm object-contain shadow-2xl" style={{ width: 'min(94vw, 1200px)', height: 'min(82vh, 820px)', transform: `scale(${zoom})` }} />
        )}
        <button onClick={() => select((activeIndex + 1) % media.length)} className="absolute right-5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 disabled:opacity-30" aria-label="Next media" disabled={media.length < 2}><ChevronRight size={24} /></button>
      </div>
      <div className="flex min-h-20 shrink-0 items-center gap-2 overflow-x-auto border-t border-white/10 bg-black/60 px-4 pb-[env(safe-area-inset-bottom)]">
        {media.map((item, index) => <button key={item.id} onClick={(e) => { e.stopPropagation(); select(index); }} className={`h-14 w-14 shrink-0 rounded bg-black/30 p-0.5 ${index === activeIndex ? 'border-2 border-[#00a884]' : 'border border-transparent opacity-70 hover:opacity-100'}`} aria-label={`Open ${item.fileName || item.type}`}>
          {item.type === 'video' ? (
            <video src={resolveFileUrl(item.fileUrl)} muted playsInline preload="metadata" className="h-full w-full rounded object-cover" />
          ) : (
            <img src={resolveFileUrl(item.fileUrl)} alt={item.fileName || item.type} className="h-full w-full rounded object-cover" />
          )}
        </button>)}
      </div>
    </div>
  );
}
