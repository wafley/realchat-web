import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Camera, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { uploadAvatar } from '@/services/user';
import { toast } from 'sonner';
import { editProfileSchema, type EditProfileSchema } from '@/lib/validations';

export default function EditProfile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      bio: user?.bio || '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSave = async (data: EditProfileSchema) => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        fullName: data.fullName,
        bio: data.bio || '',
      };
      if (avatarFile) {
        const avatarUrl = await uploadAvatar(avatarFile);
        payload.avatarUrl = avatarUrl;
      }
      await updateProfile(payload);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
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
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
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
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-card">
            <div className="flex items-center gap-4 border-b border-border/50 px-4 py-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  {(avatarPreview || user?.avatarUrl) && <AvatarImage src={avatarPreview || user?.avatarUrl} />}
                  <AvatarFallback className="text-lg">
                    <User size={20} />
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow transition-colors hover:bg-accent/80"
                >
                  <Camera size={12} />
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Profile Photo</p>
                <p className="text-xs text-muted-foreground">Click to change your avatar</p>
              </div>
            </div>

            <div className="space-y-0">
              <div className="border-b border-border/50 px-4 py-3.5">
                <label className="text-xs text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
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
    </div>
  );
}
