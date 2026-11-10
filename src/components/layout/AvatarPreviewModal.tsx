import { X, Users, MessageSquareText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resolveFileUrl } from '@/lib/url';
import type { ChatConversation } from '@/services/chat';

interface AvatarPreviewModalProps {
  chat: ChatConversation;
  onClose: () => void;
}

export default function AvatarPreviewModal({ chat, onClose }: AvatarPreviewModalProps) {
  const navigate = useNavigate();
  const isGroup = chat.type === 'group';
  const avatarUrl = chat.avatarUrl ? resolveFileUrl(chat.avatarUrl) : undefined;
  const initial = chat.name ? chat.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-[320px] overflow-hidden rounded-2xl bg-card shadow-2xl animate-[scale-in_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image with name overlay on top */}
        <div className="relative flex aspect-square w-full items-center justify-center bg-muted overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={chat.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-accent/15">
              {isGroup ? (
                <Users size={80} className="text-accent/60" />
              ) : (
                <span className="text-7xl font-bold text-accent">{initial}</span>
              )}
            </div>
          )}
          {/* Top bar: name inside photo */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent px-3 py-3">
            <p className="truncate text-[15px] font-semibold text-white drop-shadow">{chat.name}</p>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60 transition-colors"
              aria-label="Close preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Actions: chat only */}
        <div className="flex border-t border-border bg-card">
          <button
            onClick={() => {
              onClose();
              if (isGroup) navigate(`/chat/${chat.id}`);
              else navigate(`/dm/${chat.id}`, { state: { name: chat.name } });
            }}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
          >
            <MessageSquareText size={16} />
            chat
          </button>
        </div>
      </div>
    </div>
  );
}
