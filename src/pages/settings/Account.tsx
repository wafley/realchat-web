import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Ban, Trash2, Key, Loader2, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changePassword, deleteAccount, parseAuthError } from '@/services/auth';
import Modal from '@/components/ui/modal';
import { changePasswordSchema, type changePasswordSchema as ChangePasswordSchema } from '@/lib/validations';

export default function SettingsAccount() {
  const navigate = useNavigate();

  const [showPw, setShowPw] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePwMutation = useMutation({
    mutationFn: (data: ChangePasswordSchema) => changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
      reset();
    },
    onError: (err) => toast.error(parseAuthError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccount(deletePassword),
    onSuccess: () => {
      localStorage.removeItem('token');
      navigate('/login');
    },
    onError: (err) => toast.error(parseAuthError(err)),
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Account</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hidden text-muted-foreground transition-colors hover:text-accent md:flex">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">Account</h2>
              <p className="text-sm text-muted-foreground">Manage your account</p>
            </div>
          </div>

          <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
              <Key size={18} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Change Password</span>
            </div>
            <form onSubmit={handleSubmit((data) => changePwMutation.mutate(data))} className="space-y-3 p-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Current Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    {...register('currentPassword')}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-9 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-xs text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">New Password</label>
                <input
                  type="password"
                  {...register('newPassword')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Enter new password"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Confirm New Password</label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={changePwMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {changePwMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Change Password
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-card p-4">
            <div className="flex items-center gap-3">
              <Ban size={18} className="text-destructive" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Danger Zone</h3>
                <p className="text-xs text-muted-foreground">
                  Irreversible actions for your account
                </p>
              </div>
            </div>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <Modal open={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); setDeleteInput(''); setDeletePassword(''); }} title="Delete Account">
        <p className="mb-2 text-sm text-muted-foreground">
          This action is <strong className="text-destructive">irreversible</strong>. Your account, messages, and all data will be permanently deleted.
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Type <strong className="text-foreground">DELETE</strong> to confirm, then enter your password.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder='Type "DELETE"'
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={() => { setDeleteConfirmOpen(false); setDeleteInput(''); setDeletePassword(''); }}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteInput !== 'DELETE' || !deletePassword || deleteMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Delete Account
          </button>
        </div>
      </Modal>
    </div>
  );
}
