import { type RefObject } from 'react';
import { Send, ImagePlus, Smile, FileText, X } from 'lucide-react';
import type { Message } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { formatFileSize } from '@/lib/chatHelpers';

interface ChatInputProps {
  input: string;
  replyingTo: Message | null;
  imagePreview: string | null;
  selectedImage: File | null;
  selectedFile: File | null;
  showEmojiPicker: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSendImage: () => void;
  onCancelReply: () => void;
  onCancelImage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmojiClick: (emoji: string) => void;
  onEmojiToggle: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  imageInputRef: RefObject<HTMLInputElement | null>;
  emojiPickerRef: RefObject<HTMLDivElement | null>;
  emojiToggleRef: RefObject<HTMLButtonElement | null>;
}

export default function ChatInput({
  input,
  replyingTo,
  imagePreview,
  selectedImage,
  selectedFile,
  showEmojiPicker,
  onInputChange,
  onSend,
  onSendImage,
  onCancelReply,
  onCancelImage,
  onFileSelect,
  onImageSelect,
  onEmojiClick,
  onEmojiToggle,
  fileInputRef,
  imageInputRef,
  emojiPickerRef,
  emojiToggleRef,
}: ChatInputProps) {
  const theme = useThemeStore((s) => s.theme);

  return (
    <div className="relative border-t border-border">
      {replyingTo && (
        <div className="mx-4 mb-2 mt-3 flex items-start gap-3 rounded-xl border border-border bg-card p-2 pr-1 shadow-sm">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <div className="mt-0.5 h-full w-0.5 shrink-0 self-stretch rounded-full bg-accent/60" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground/90 lg:text-sm">Replying to {replyingTo.sender?.fullName ?? 'Unknown'}</p>
              <p className="truncate text-xs text-foreground/70 lg:text-sm">{replyingTo.type === 'image' ? '📷 Photo' : replyingTo.content}</p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 lg:h-8 lg:w-8"
          >
            <X size={14} className="lg:size-4" />
          </button>
        </div>
      )}
      {imagePreview && (
        <div className="mx-4 mb-2 mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-1 shadow-sm">
          <div className="relative shrink-0">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-14 w-14 rounded-lg object-cover ring-1 ring-border lg:h-16 lg:w-16"
            />
            <div className="absolute inset-0 rounded-lg ring-1 ring-black/10" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">Image</p>
            <p className="truncate text-xs text-muted-foreground">{selectedImage?.name}</p>
          </div>
          <button
            onClick={onCancelImage}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {selectedFile && !imagePreview && (
        <div className="mx-4 mb-2 mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-1 shadow-sm">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-border lg:h-16 lg:w-16">
            <FileText size={24} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            onClick={() => onCancelImage()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full left-0 right-0 z-50 mx-4 mb-1">
          <div className="overflow-hidden rounded-xl shadow-lg">
            <EmojiPicker onEmojiClick={(d) => onEmojiClick(d.emoji)} theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT} />
          </div>
        </div>
      )}
      <div className="mx-4 mb-3 mt-3 flex items-center gap-2 rounded-xl border border-input bg-input px-3 py-1.5 lg:px-4 lg:py-2.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 lg:h-10 lg:w-10"
          type="button"
        >
          <FileText size={18} className="lg:size-5" />
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelect} />
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 lg:h-10 lg:w-10"
          type="button"
        >
          <ImagePlus size={18} className="lg:size-5" />
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageSelect} />
        <button
          ref={emojiToggleRef}
          onClick={onEmojiToggle}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors lg:h-10 lg:w-10 ${showEmojiPicker ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'}`}
          type="button"
        >
          <Smile size={18} className="lg:size-5" />
        </button>
        <input
          type="text"
          placeholder={imagePreview ? 'Add a caption...' : 'Type a message...'}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (imagePreview) onSendImage();
              else onSend();
            }
          }}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none lg:text-base"
        />
        <button
          onClick={() => {
            if (imagePreview) onSendImage();
            else onSend();
          }}
          disabled={!input.trim() && !imagePreview && !selectedFile}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10 disabled:opacity-40 lg:h-10 lg:w-10"
        >
          <Send size={18} className="lg:size-5" />
        </button>
      </div>
    </div>
  );
}
