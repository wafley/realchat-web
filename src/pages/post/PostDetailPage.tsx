import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPost } from '@/services/posts';
import type { Post } from '@/types';

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const statePost = (location.state as { post?: Post })?.post;

  const { data: post, isPending } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId!),
    enabled: !statePost,
  });

  const resolved = statePost || post;

  if (isPending && !statePost) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto py-4 pt-safe-top">
      <button
        onClick={() => navigate(-1)}
        className="mb-3 flex items-center gap-2 px-4 text-sm text-muted-foreground"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="rounded-xl border border-border bg-card">
        <button
          onClick={() => navigate(`/profile/${resolved.userId}`)}
          className="flex w-full items-center gap-3 px-4 pb-3 pt-3 text-left"
        >
          <Avatar className="h-8 w-8">
            {resolved.user?.avatarUrl && <AvatarImage src={resolved.user.avatarUrl} />}
            <AvatarFallback className="text-xs font-bold">
              {resolved.user?.fullName?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold text-foreground">{resolved.user?.fullName}</p>
        </button>

        <img
          src={resolved.imageUrl}
          alt={resolved.caption || 'Post image'}
          className="w-full object-cover"
          loading="lazy"
        />

        <div className="flex items-center gap-1.5 px-4 pb-2 pt-3">
          <Heart size={18} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">{resolved.likes} likes</span>
        </div>

        {resolved.caption && (
          <div className="px-4 pb-4">
            <span className="text-sm font-semibold text-foreground">{resolved.user?.fullName}</span>
            <span className="ml-1.5 text-sm text-foreground">{resolved.caption}</span>
          </div>
        )}
      </div>
    </div>
  );
}
