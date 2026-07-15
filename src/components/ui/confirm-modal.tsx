import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { confirmButton, outlineButton } from '@/lib/styles';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  intent?: 'primary' | 'danger';
  children?: ReactNode;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  intent = 'danger',
  children,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className={outlineButton()}>
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={confirmButton({ intent })}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
