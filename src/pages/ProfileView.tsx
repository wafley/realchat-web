import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Share2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { getFollowing, getFollowers } from '@/services/friends';
import { getUserPosts } from '@/services/posts';
import type { Post } from '@/types';
import PostDetailModal from '@/components/post/PostDetailModal';

export default function ProfileView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { data: following = [] } = useQuery({
    queryKey: ['following'],
    queryFn: getFollowing,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers'],
    queryFn: getFollowers,
  });

  const { data: myPosts = [] } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: () => getUserPosts(user!.id),
    enabled: !!user?.id,
  });

  function copyProfileLink() {
    if (!user?.id) return;
    navigator.clipboard.writeText(`${window.location.origin}/profile/${user.id}`);
    toast.success('Profile link copied!');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex items-center justify-between md:hidden">
            <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent/10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>

          <div className="relative flex flex-row items-center gap-4 md:gap-12">
            <button
              onClick={() => navigate('/settings')}
              className="absolute right-0 top-0 hidden h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent/10 md:flex"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>

            <div
              onClick={() => navigate('/profile/edit')}
              className="shrink-0 cursor-pointer"
            >
              <Avatar className="h-20 w-20 md:h-24 md:w-24">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                <AvatarFallback className="text-lg md:text-2xl">
                  <User size={22} />
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <h2 className="text-base font-bold text-foreground">{user?.fullName || 'Your Name'}</h2>
              <p className="text-sm text-muted-foreground">@{user?.username || 'username'}</p>
            </div>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{user?.bio || 'No bio yet'}</p>
          <div className="mt-4 flex items-center gap-8">
            <button onClick={() => navigate('/profile/followers')} className="text-sm text-foreground">
              <span className="font-semibold">{followers.length}</span>
              <span className="ml-1 text-muted-foreground">followers</span>
            </button>
            <button onClick={() => navigate('/profile/following')} className="text-sm text-foreground">
              <span className="font-semibold">{following.length}</span>
              <span className="ml-1 text-muted-foreground">following</span>
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => navigate('/profile/edit')}
              className="flex-1 rounded-lg border border-border px-6 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10"
            >
              Edit Profile
            </button>
            <button
              onClick={copyProfileLink}
              className="flex-1 rounded-lg border border-border px-6 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/10"
            >
              <span className="flex items-center justify-center gap-2">
                <Share2 size={16} />
                Share Profile
              </span>
            </button>
          </div>
          <hr className="my-6 border-border" />

          {myPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {myPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="group relative aspect-square overflow-hidden rounded-md bg-muted"
                >
                  <img
                    src={post.imageUrl}
                    alt={post.caption || 'Post'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Heart size={18} className="fill-white text-white" />
                    <span className="text-sm font-bold text-white">{post.likes}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No posts yet</p>
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
