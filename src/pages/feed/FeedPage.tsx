import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFeed } from '@/services/posts';
import type { Post } from '@/types';
import PostDetailModal from '@/components/post/PostDetailModal';

export default function FeedPage() {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { data: posts, isPending } = useQuery({
    queryKey: ['feed'],
    queryFn: getFeed,
  });

  return (
    <>
      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto py-4 pt-safe-top">
        {isPending ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-muted-foreground">No posts yet. Follow some people to see their posts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl border border-border bg-card">
                <button
                  onClick={() => navigate(`/profile/${post.userId}`)}
                  className="flex w-full items-center gap-3 px-4 pb-3 pt-3 text-left"
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
                  onClick={() => setSelectedPost(post)}
                  className="w-full"
                >
                  <img
                    src={post.imageUrl}
                    alt={post.caption || 'Post image'}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                </button>

                <div className="flex items-center gap-1.5 px-4 pb-2 pt-3">
                  <Heart size={18} className="text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">{post.likes} likes</span>
                </div>

                {post.caption && (
                  <div className="px-4 pb-3">
                    <span className="text-sm font-semibold text-foreground">{post.user?.fullName}</span>
                    <span className="ml-1.5 text-sm text-foreground">{post.caption}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </>
  );
}
