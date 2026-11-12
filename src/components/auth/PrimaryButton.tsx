import { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/** Primary blue gradient pill button with built-in loading spinner state. */
export function PrimaryButton({
  children,
  loading,
  disabled,
  className = '',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="submit"
      className={`auth-btn-primary inline-flex w-full items-center justify-center gap-2 px-5 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
