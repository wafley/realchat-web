import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Key, Eye, EyeOff, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { useAuthStore } from '@/store/authStore';
import { destroySocket } from '@/services/socket.service';
import { changePassword, deleteAccount, parseAuthError, setPassword } from '@/services/auth';
import { changePasswordSchema, type ChangePasswordSchema, setPasswordSchema, type SetPasswordSchema } from '@/lib/validations';
import { toast } from 'sonner';

export default function AccountContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [showPw, setShowPw] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDelPw, setShowDelPw] = useState(false);

  const needsPassword = user?.provider === 'google' && !user?.hasPassword;

  const {
    register: registerChange,
    handleSubmit: handleSubmitChange,
    reset: resetChange,
    formState: { errors: errorsChange },
  } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  const {
    register: registerSet,
    handleSubmit: handleSubmitSet,
    formState: { errors: errorsSet },
  } = useForm<SetPasswordSchema>({
    resolver: zodResolver(setPasswordSchema),
  });

  const changePwMutation = useMutation({
    mutationFn: (data: ChangePasswordSchema) => changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('Password changed');
      resetChange();
    },
    onError: (err) => toast.error(parseAuthError(err)),
  });

  const setPwMutation = useMutation({
    mutationFn: (data: SetPasswordSchema) => setPassword(data.password),
    onSuccess: async () => {
      toast.success('Password set successfully');
      await useAuthStore.getState().refreshUser();
    },
    onError: (err) => toast.error(parseAuthError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccount(deletePassword),
    onSuccess: async () => {
      queryClient.clear();
      useAuthStore.getState().logout();
      destroySocket();
      toast.success('Account deleted');
      navigate('/login');
    },
    onError: (err) => toast.error(parseAuthError(err)),
  });

  return (
    <div className="space-y-3">
      {needsPassword ? (
        <>
          <p className="text-xs font-medium text-muted-foreground">Set Password</p>
          <p className="text-xs text-muted-foreground">You signed up with Google. Set a password to manage your account settings.</p>
          <form onSubmit={handleSubmitSet((data) => setPwMutation.mutate(data))} className="space-y-3">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                {...registerSet('password')}
                placeholder="New password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errorsSet.password && (
              <p className="text-xs text-destructive">{errorsSet.password.message}</p>
            )}

            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                {...registerSet('confirmPassword')}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {errorsSet.confirmPassword && (
              <p className="text-xs text-destructive">{errorsSet.confirmPassword.message}</p>
            )}

            <button
              type="submit"
              disabled={setPwMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
            >
              {setPwMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
              {setPwMutation.isPending ? 'Setting...' : 'Set Password'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-xs font-medium text-muted-foreground">Change Password</p>
          <form onSubmit={handleSubmitChange((data) => changePwMutation.mutate(data))} className="space-y-3">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                {...registerChange('currentPassword')}
                placeholder="Current password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errorsChange.currentPassword && (
              <p className="text-xs text-destructive">{errorsChange.currentPassword.message}</p>
            )}

            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                {...registerChange('newPassword')}
                placeholder="New password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {errorsChange.newPassword && (
              <p className="text-xs text-destructive">{errorsChange.newPassword.message}</p>
            )}

            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                {...registerChange('confirmPassword')}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {errorsChange.confirmPassword && (
              <p className="text-xs text-destructive">{errorsChange.confirmPassword.message}</p>
            )}

            <button
              type="submit"
              disabled={changePwMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
            >
              {changePwMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
              {changePwMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </>
      )}

      <hr className="border-border" />
      <p className="text-xs font-medium text-destructive">Delete Account</p>
      <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
      <button
        onClick={() => setDeleteOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5"
      >
        <Trash2 size={14} />Delete Account
      </button>
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteInput(''); setDeletePassword(''); }} hideClose>
        <div className="p-6">
          <h3 className="mb-2 text-lg font-bold text-foreground">Delete Account</h3>
          <p className="mb-4 text-sm text-muted-foreground">Type <strong className="text-foreground">delete</strong> to confirm and enter your password.</p>
          <input
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder='Type "delete"'
            className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="relative mb-4">
            <input
              type={showDelPw ? 'text' : 'password'}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowDelPw(!showDelPw)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showDelPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setDeleteOpen(false); setDeleteInput(''); setDeletePassword(''); }}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/5"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteInput !== 'delete' || !deletePassword || deleteMutation.isPending}
              className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/80 disabled:opacity-50"
            >
              {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
