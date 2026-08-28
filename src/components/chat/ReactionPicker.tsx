import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Plus } from 'lucide-react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useThemeStore } from '@/store/themeStore';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  onClose: () => void;
  anchorRect: DOMRect;
  initialFull?: boolean;
}

export default function ReactionPicker({ onReact, onClose, anchorRect, initialFull = false }: ReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const [showFullPicker, setShowFullPicker] = useState(initialFull);

  useEffect(() => {
    setShowFullPicker(initialFull);
  }, [initialFull]);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const pickerWidth = showFullPicker ? 330 : 290;
    const pickerHeight = showFullPicker ? 390 : 48;
    const padding = 12;

    // Vertical positioning
    let top = anchorRect.top - pickerHeight - 8;
    if (top < padding) {
      top = anchorRect.bottom + 8;
      if (top + pickerHeight > window.innerHeight - padding) {
        top = Math.max(padding, window.innerHeight - pickerHeight - padding);
      }
    }

    // Horizontal positioning
    let left = anchorRect.left - (showFullPicker ? 40 : 20);
    if (left + pickerWidth > window.innerWidth - padding) {
      left = window.innerWidth - pickerWidth - padding;
    }
    left = Math.max(padding, left);

    setPosition({ top, left });
  }, [anchorRect, showFullPicker]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Reaction picker"
      className={`fixed z-[140] transition-all duration-200 ${
        showFullPicker
          ? 'flex flex-col gap-2 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#202c33]'
          : 'flex items-center gap-1 rounded-full border border-border/80 bg-card/95 px-2 py-1.5 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#202c33]'
      }`}
      style={{ top: Math.max(8, position.top), left: Math.max(8, position.left) }}
    >
      {/* Quick Emojis Strip */}
      <div className="flex items-center gap-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-accent/15 active:scale-95 cursor-pointer"
          >
            {emoji}
          </button>
        ))}

        {/* Plus (+) Button to toggle Full Emoji Picker */}
        <button
          type="button"
          onClick={() => setShowFullPicker((v) => !v)}
          title="More reactions"
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer ${
            showFullPicker
              ? 'border-accent bg-accent/20 text-accent dark:border-emerald-500/50 dark:bg-[#005c4b] dark:text-emerald-200'
              : 'border-border/80 text-muted-foreground hover:bg-accent/10 hover:text-foreground dark:border-white/15 dark:bg-white/5'
          }`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Full Emoji Picker Popover */}
      {showFullPicker && (
        <div className="w-[310px] overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-150 [&_.EmojiPickerReact]:!border-0 [&_.EmojiPickerReact]:h-[320px] [&_.EmojiPickerReact]:w-full">
          <EmojiPicker
            onEmojiClick={(data) => {
              onReact(data.emoji);
            }}
            theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            width="100%"
            height={320}
            searchPlaceHolder="Search reaction"
            lazyLoadEmojis={true}
          />
        </div>
      )}
    </div>
  );
}
