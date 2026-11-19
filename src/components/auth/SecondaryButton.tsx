import { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/** Secondary white pill button for alternative auth actions. */
export function SecondaryButton({
  children,
  loading,
  disabled,
  className = '',
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      type="submit"
      className={`auth-btn-secondary inline-flex w-full items-center justify-center gap-2 px-5 ${className}`}
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
