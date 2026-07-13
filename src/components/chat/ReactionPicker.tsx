import { useState, useRef, useEffect } from 'react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}

export default function ReactionPicker({ onReact, onClose, anchorRect }: ReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const top = anchorRect.top - 48;
  const left = Math.min(anchorRect.left, window.innerWidth - 260);

  return (
    <div
      ref={ref}
      className="fixed z-[110] flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1.5 shadow-2xl"
      style={{ top: Math.max(8, top), left: Math.max(8, left) }}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-accent/10"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
