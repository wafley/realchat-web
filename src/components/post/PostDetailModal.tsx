import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Post } from '@/types';

interface Props {
  post: Post;
  onClose: () => void;
}

export default function PostDetailModal({ post, onClose }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            onClick={() => navigate(`/profile/${post.userId}`)}
            className="flex items-center gap-3 text-left"
          >
            <Avatar className="h-8 w-8">
              {post.user?.avatarUrl && <AvatarImage src={post.user.avatarUrl} />}
              <AvatarFallback className="text-xs font-bold">
                {post.user?.fullName?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-semibold text-foreground">{post.user?.fullName}</p>
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <img
            src={post.imageUrl}
            alt={post.caption || 'Post image'}
            className="w-full object-cover"
            loading="lazy"
          />

          <div className="flex items-center gap-1.5 px-4 pb-2 pt-3">
            <Heart size={18} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{post.likes} likes</span>
          </div>

          {post.caption && (
            <div className="px-4 pb-4">
              <span className="text-sm font-semibold text-foreground">{post.user?.fullName}</span>
              <span className="ml-1.5 text-sm text-foreground">{post.caption}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
