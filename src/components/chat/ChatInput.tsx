import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

import {
  Send,
  ImagePlus,
  Smile,
  FileText,
  X,
  Check,
} from 'lucide-react';

import type { Message } from '@/types';

import { useThemeStore } from '@/store/themeStore';

import EmojiPicker, {
  Theme as EmojiTheme,
} from 'emoji-picker-react';

import { formatFileSize } from '@/lib/chatHelpers';

import { IMAGE_ACCEPT } from '@/utils/imageValidation';

interface ChatInputProps {
  input: string;
  replyingTo: Message | null;
  editingMsg: Message | null;
  imagePreview: string | null;
  selectedImage: File | null;
  selectedFile: File | null;
  showEmojiPicker: boolean;
  disabled?: boolean;

  onInputChange: (value: string) => void;
  onSend: () => void;
  onSendImage: () => void;
  onUpdateEdit: () => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onCancelImage: () => void;

  onFileSelect: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

  onImageSelect: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

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
  editingMsg,
  imagePreview,
  selectedImage,
  selectedFile,
  showEmojiPicker,
  disabled = false,
  onInputChange,
  onSend,
  onSendImage,
  onUpdateEdit,
  onCancelReply,
  onCancelEdit,
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

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  const animationFrameRef = useRef<number | null>(
    null
  );

  const [isMultiline, setIsMultiline] =
    useState(false);

  useEffect(() => {
    const el = textareaRef.current;

    if (!el) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
    }

    const previousHeight = el.offsetHeight;

    // Hilangkan height sementara supaya browser
    // bisa menghitung tinggi konten sebenarnya
    el.style.height = 'auto';

    const nextHeight = Math.min(
      el.scrollHeight,
      160
    );

    // Kembalikan ke tinggi sebelumnya dulu
    // supaya transition bisa berjalan
    el.style.height = `${previousHeight}px`;

    // Force reflow agar browser membaca
    // perubahan sebelum animasi dimulai
    void el.offsetHeight;

    animationFrameRef.current =
      requestAnimationFrame(() => {
        el.style.height = `${nextHeight}px`;
      });

    setIsMultiline(nextHeight > 44);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }
    };
  }, [input]);

  const handleSend = () => {
    if (disabled) return;

    if (editingMsg) {
      onUpdateEdit();
      return;
    }

    if (imagePreview) {
      onSendImage();
      return;
    }

    onSend();
  };

  const canSend =
    input.trim().length > 0 ||
    imagePreview !== null ||
    selectedFile !== null;

  return (
    <div className="relative">
      {/* Editing message */}
      {editingMsg ? (
        <div className="mx-3 mb-2 mt-3 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-2 pr-1 shadow-sm lg:mx-4">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <div className="mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full bg-accent/60" />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground/90">
                Editing message
              </p>

              <p className="truncate text-xs text-foreground/70">
                {editingMsg.content}
              </p>
            </div>
          </div>

          <button
            onClick={onCancelEdit}
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        replyingTo && (
          <div className="mx-3 mb-2 mt-3 flex items-start gap-3 rounded-2xl border border-border bg-card p-2 pr-1 shadow-sm lg:mx-4">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div className="mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full bg-accent/60" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground/90 lg:text-sm">
                  Replying to{' '}
                  {replyingTo.sender?.fullName ??
                    'Unknown'}
                </p>

                <p className="truncate text-xs text-foreground/70 lg:text-sm">
                  {replyingTo.type === 'image'
                    ? '📷 Photo'
                    : replyingTo.content}
                </p>
              </div>
            </div>

            <button
              onClick={onCancelReply}
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
        )
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="mx-3 mb-2 mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-1 shadow-sm lg:mx-4">
          <div className="relative shrink-0">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-14 w-14 rounded-xl object-cover ring-1 ring-border lg:h-16 lg:w-16"
            />

            <div className="absolute inset-0 rounded-xl ring-1 ring-black/10" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              Image
            </p>

            <p className="truncate text-xs text-muted-foreground">
              {selectedImage?.name}
            </p>
          </div>

          <button
            onClick={onCancelImage}
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* File preview */}
      {selectedFile && !imagePreview && (
        <div className="mx-3 mb-2 mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-1 shadow-sm lg:mx-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-border lg:h-16 lg:w-16">
            <FileText
              size={24}
              className="text-accent"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {selectedFile.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>

          <button
            onClick={onCancelImage}
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-0 right-0 z-50 mx-3 mb-2 lg:mx-4"
        >
          <div className="overflow-hidden rounded-2xl shadow-xl [&_.EmojiPickerReact]:!border-0 [&_.EmojiPickerReact]:h-[320px] [&_.EmojiPickerReact]:w-full">
            <EmojiPicker
              onEmojiClick={(data) =>
                onEmojiClick(data.emoji)
              }
              theme={
                theme === 'dark'
                  ? EmojiTheme.DARK
                  : EmojiTheme.LIGHT
              }
              width="100%"
              height={320}
            />
          </div>
        </div>
      )}

      {/* Chat input */}
      <div className="mx-3 mb-3 mt-3 flex items-end gap-2 lg:mx-4">
        {/* Main input */}
        <div
          className={`flex min-w-0 flex-1 items-end gap-1 border border-input bg-input px-2 py-[3px] shadow-sm transition-[border-radius,height] duration-200 ease-out focus-within:ring-2 focus-within:ring-accent/20 ${
            isMultiline
              ? 'rounded-2xl'
              : 'rounded-full'
          }`}
        >
          {/* File */}
          <button
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={disabled}
            type="button"
            className="mb-[1px] flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText size={18} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onFileSelect}
          />

          {/* Image */}
          <button
            onClick={() =>
              imageInputRef.current?.click()
            }
            disabled={disabled}
            type="button"
            className="mb-[1px] flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ImagePlus size={18} />
          </button>

          <input
            ref={imageInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={onImageSelect}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            disabled={disabled}
            placeholder={
              disabled
                ? 'You blocked this contact'
                : imagePreview
                  ? 'Add a caption...'
                  : 'Type a message...'
            }
            value={input}
            onChange={(e) =>
              onInputChange(e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();

                if (canSend) {
                  handleSend();
                }
              }
            }}
            className="block min-h-9 max-h-40 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-[7px] text-[16px] leading-[22px] text-foreground placeholder:text-muted-foreground transition-[height] duration-200 ease-out focus:outline-none disabled:cursor-not-allowed"
          />

          {/* Emoji */}
          <button
            ref={emojiToggleRef}
            onClick={onEmojiToggle}
            disabled={disabled}
            type="button"
            className={`mb-[1px] flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              showEmojiPicker
                ? 'bg-accent/15 text-accent'
                : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
            }`}
          >
            <Smile size={18} />
          </button>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !canSend}
          type="button"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
            canSend && !disabled
              ? 'bg-accent text-accent-foreground shadow-md hover:scale-105 hover:shadow-lg active:scale-95'
              : 'bg-muted text-muted-foreground opacity-50'
          }`}
        >
          {editingMsg ? (
            <Check size={20} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
}