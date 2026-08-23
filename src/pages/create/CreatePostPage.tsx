import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Loader2, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { createPost } from '@/services/posts';
import { toast } from 'sonner';
import { isSupportedImage, SUPPORTED_IMAGE_LABEL, IMAGE_ACCEPT } from '@/utils/imageValidation';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState('');

  const mutation = useMutation({
    mutationFn: () => createPost(imageUrl, caption || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', user?.id] });
      toast.success('Post created!');
      navigate('/feed');
    },
    onError: () => toast.error('Failed to create post'),
  });

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedImage(file)) {
      toast.error(`Unsupported image format. Please upload ${SUPPORTED_IMAGE_LABEL}.`);
      e.target.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setImageUrl(url);
  }

  function clearImage() {
    setPreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-y-auto py-6 pt-safe-top">
      <div className="flex items-center justify-between px-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-foreground">
          Cancel
        </button>
        <h1 className="text-base font-bold text-foreground">New Post</h1>
        <button
          onClick={() => mutation.mutate()}
          disabled={!imageUrl || mutation.isPending}
          className="text-sm font-semibold text-accent transition-colors hover:text-accent/80 disabled:opacity-40"
        >
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Post'}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {preview ? (
          <div className="relative w-full">
            <button
              onClick={clearImage}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <X size={16} />
            </button>
            <img
              src={preview}
              alt="Preview"
              className="max-h-[60vh] w-full rounded-xl object-contain"
            />
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border px-12 py-16 text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
          >
            <Image size={48} strokeWidth={1.5} />
            <p className="text-sm">Click to upload an image</p>
          </button>
        )}

        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          maxLength={2200}
          className="mt-4 w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
}
