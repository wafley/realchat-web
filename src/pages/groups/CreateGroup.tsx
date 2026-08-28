import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Search, X, Check, Loader2, Camera, UserIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createGroup, searchUsers } from '@/services/chat';
import { resolveFileUrl } from '@/lib/url';
import { toast } from 'sonner';
import type { User } from '@/types';
import { createGroupSchema, type CreateGroupSchema } from '@/lib/validations';
import { isSupportedImage, SUPPORTED_IMAGE_LABEL, IMAGE_ACCEPT } from '@/utils/imageValidation';
import { getApiErrorMessage } from '@/utils/errors';
import ImageCropModal from '@/components/common/ImageCropModal';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateGroupSchema>({
    resolver: zodResolver(createGroupSchema),
  });

  const groupName = watch('name');

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchUsers(q),
    onSuccess: (data) => setSearchResults(data.filter((u) => u.id !== 'dev-user-1')),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateGroupSchema) =>
      createGroup(
        data.name,
        data.description || '',
        selectedUsers.map((u) => u.id),
        croppedFile ?? undefined,
      ),
    onSuccess: (group) => navigate(`/chat/${group.id}`),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleSearch = (q: string) => {
    setUserSearch(q);
    if (q.trim()) searchMutation.mutate(q.trim());
    else setSearchResults([]);
  };

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedImage(file)) {
      toast.error(`Unsupported image format. Please upload ${SUPPORTED_IMAGE_LABEL}.`);
      e.target.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    setRawImageSrc(url);
    setCropModalOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
    setCroppedFile(croppedFile);
    setAvatarPreview(croppedPreviewUrl);
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 md:px-6 pt-safe-top">
        <button
          onClick={() => navigate('/')}
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-foreground lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-foreground">Create Group</h1>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-accent/5 transition-colors hover:border-accent/50 hover:bg-accent/10"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <Camera size={20} className="text-muted-foreground group-hover:text-accent" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Group Photo</p>
              <p className="text-xs text-muted-foreground">Optional — click to upload</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Group Name</label>
            <input
              type="text"
              placeholder="Enter group name..."
              {...register('name')}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              placeholder="Describe what this group is about..."
              rows={3}
              {...register('description')}
              className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Add Members</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {searchMutation.isPending && (
              <div className="mt-2 flex justify-center py-3">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 rounded-xl border border-border p-2">
                {searchResults.map((u) => {
                  const isSelected = selectedUsers.some((x) => x.id === u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        isSelected ? 'bg-accent/10' : 'hover:bg-accent/5'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        {u.avatarUrl && <AvatarImage src={resolveFileUrl(u.avatarUrl)} alt={u.fullName} />}
                        <AvatarFallback className="text-xs font-semibold">
                          {u.fullName?.charAt(0).toUpperCase() || <UserIcon size={14} />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <Check size={12} strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/30 px-2.5 py-1 text-xs font-medium text-foreground transition-all"
                  >
                    <Avatar className="h-4 w-4 shrink-0">
                      {u.avatarUrl && <AvatarImage src={resolveFileUrl(u.avatarUrl)} alt={u.fullName} />}
                      <AvatarFallback className="text-[9px] bg-accent text-accent-foreground font-bold">
                        {u.fullName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[140px]">{u.fullName || u.username}</span>
                    <button
                      type="button"
                      onClick={() => toggleUser(u)}
                      title="Remove member"
                      className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-black/10 hover:text-foreground dark:hover:bg-white/10"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {selectedUsers.length > 0 && selectedUsers.length < 2 && (
              <p className="mt-2 text-xs text-destructive">Select at least 2 members to create a group</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!groupName?.trim() || selectedUsers.length < 2 || createMutation.isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Create Group
          </button>
        </form>
      </div>

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
