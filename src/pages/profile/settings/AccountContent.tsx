import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Key, Eye, EyeOff, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { useAuthStore } from '@/store/authStore';
import { destroySocket } from '@/services/socket.service';
import { changePassword, deleteAccount, parseAuthError } from '@/services/auth';
import { changePasswordSchema, type ChangePasswordSchema } from '@/lib/validations';
import { toast } from 'sonner';

export default function AccountContent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDelPw, setShowDelPw] = useState(false);

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
      toast.success('Password changed');
      reset();
    },
    onError: (err) => toast.error(parseAuthError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccount(deletePassword),
    onSuccess: () => {
      queryClient.clear();
      useAuthStore.getState().logout();
      destroySocket();
      navigate('/login');
    },
    onError: (err) => toast.error(parseAuthError(err)),
  });

  const onSubmit = (data: ChangePasswordSchema) => {
    changePwMutation.mutate(data);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Change Password</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            {...register('currentPassword')}
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
        {errors.currentPassword && (
          <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
        )}

        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            {...register('newPassword')}
            placeholder="New password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword.message}</p>
        )}

        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder="Confirm new password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}

        <button
          type="submit"
          disabled={changePwMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
        >
          {changePwMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
          {changePwMutation.isPending ? 'Changing...' : 'Change Password'}
        </button>

        <Link
          to="/forgot-password"
          className="block text-center text-xs text-accent hover:text-accent/80"
        >
          Forgot password?
        </Link>
      </form>

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
              onClick={handleDelete}
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
