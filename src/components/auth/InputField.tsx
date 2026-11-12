import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  hidePasswordToggle?: boolean;
}

/** Pill-styled auth input supporting an optional left icon, inline error, and password visibility toggle. */
const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className = '', label, error, leftIcon, type = 'text', hidePasswordToggle = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password' && !hidePasswordToggle;
    const resolvedType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="space-y-1">
        {label && (
          <label className="block pl-3 text-xs font-medium text-[var(--auth-muted)]">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--auth-input-icon)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            type={resolvedType}
            aria-invalid={Boolean(error)}
            className={`auth-input-field h-[42px] w-full text-sm md:h-11 ${leftIcon ? 'pl-11' : 'pl-4'} ${isPassword ? 'pr-11' : 'pr-4'} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--auth-subtle)] transition-colors hover:text-[var(--auth-ink)]"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <p className="pl-3.5 text-xs font-medium text-[var(--auth-error-text)]">{error}</p>}
      </div>
    );
  },
);
InputField.displayName = 'InputField';

export { InputField };
