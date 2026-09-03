import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Camera, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { uploadAvatar, uploadBanner } from '@/services/user';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { resolveFileUrl } from '@/lib/url';
import { editProfileSchema, type EditProfileSchema } from '@/lib/validations';
import { isSupportedImage, SUPPORTED_IMAGE_LABEL, IMAGE_ACCEPT } from '@/utils/imageValidation';
import ImageCropModal from '@/components/common/ImageCropModal';

export default function EditProfile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<'avatar' | 'banner'>('avatar');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      bio: user?.bio || '',
    },
  });

  const fullNameValue = watch('fullName');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedImage(file)) {
      toast.error(`Unsupported image format. Please upload ${SUPPORTED_IMAGE_LABEL}.`);
      e.target.value = '';
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCropTarget('avatar');
    setCropModalOpen(true);
    e.target.value = '';
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedImage(file)) {
      toast.error(`Unsupported image format. Please upload ${SUPPORTED_IMAGE_LABEL}.`);
      e.target.value = '';
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCropTarget('banner');
    setCropModalOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
    if (cropTarget === 'banner') {
      setBannerFile(croppedFile);
      setBannerPreview(croppedPreviewUrl);
    } else {
      setAvatarFile(croppedFile);
      setAvatarPreview(croppedPreviewUrl);
    }
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  };

  const onSave = async (data: EditProfileSchema) => {
    setSaving(true);
    try {
      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }
      if (bannerFile) {
        await uploadBanner(bannerFile);
      }
      await updateProfile({ fullName: data.fullName, bio: data.bio || '' });
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      toast.success('Profile updated');
      navigate('/profile');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-4 md:hidden pt-safe-top">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hidden text-muted-foreground transition-colors hover:text-accent md:flex">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
              <p className="text-sm text-muted-foreground">Update your profile header and personal info</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-card border border-border/50 shadow-md">
            {/* Banner Preview Box */}
            <div className="relative h-36 sm:h-44 w-full overflow-hidden">
              {(bannerPreview || user?.bannerUrl) ? (
                <img src={resolveFileUrl(bannerPreview || user?.bannerUrl)} alt="Cover Banner" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="relative flex h-full w-full items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  }}
                >
                  <div
                    className="absolute -top-16 -right-16 h-64 w-64 rounded-full opacity-40 blur-3xl"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                  <span className="relative z-10 text-xs text-white/80 font-medium drop-shadow">Default Accent Cover Banner</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white shadow transition-all hover:bg-black/80 hover:scale-105"
              >
                <Camera size={14} />
                <span>{bannerPreview || user?.bannerUrl ? 'Change Cover' : 'Upload Cover'}</span>
              </button>

              <input
                ref={bannerInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                className="hidden"
                onChange={handleBannerFileChange}
              />
            </div>

            {/* Avatar & Photo Section */}
            <div className="px-4 pb-4">
              <div className="flex items-end justify-between -mt-10 mb-3">
                <div className="relative">
                  <Avatar key={avatarPreview || user?.avatarUrl || 'fallback'} className="h-20 w-20 ring-4 ring-card shadow-lg">
                    {(avatarPreview || user?.avatarUrl) && <AvatarImage src={avatarPreview || user?.avatarUrl} className="object-cover" />}
                    <AvatarFallback className="text-xl font-bold">
                      <User size={24} />
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow transition-colors hover:bg-accent/80"
                  >
                    <Camera size={12} />
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

            <div className="space-y-0">
              <div className="border-b border-border/50 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Full Name</label>
                  <p className={cn('text-xs', (fullNameValue?.length || 0) >= 50 ? 'text-destructive' : 'text-muted-foreground/50')}>{fullNameValue?.length || 0}/50</p>
                </div>
                <input
                  type="text"
                  placeholder="Your full name"
                  maxLength={50}
                  {...register('fullName')}
                  className="mt-1 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>
              <div className="px-4 py-3.5">
                <label className="text-xs text-muted-foreground">Bio</label>
                <textarea
                  placeholder="Tell us about yourself"
                  rows={3}
                  {...register('bio')}
                  className="mt-1 w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {errors.bio && (
                  <p className="mt-1 text-xs text-destructive">{errors.bio.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

          <button
            onClick={handleSubmit(onSave)}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={cropTarget === 'banner' ? 3 : 1}
        outputWidth={cropTarget === 'banner' ? 1200 : 512}
        outputHeight={cropTarget === 'banner' ? 400 : 512}
        title={cropTarget === 'banner' ? 'Crop Cover Banner' : 'Crop Profile Photo'}
        fileName={cropTarget === 'banner' ? 'cropped-banner.jpg' : 'cropped-avatar.jpg'}
      />
    </div>
  );
}
