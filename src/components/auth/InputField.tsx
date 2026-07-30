import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-medium" style={{ color: '#9EA5B4' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`auth-input-field w-full px-4 py-3 text-sm ${className}`}
          {...props}
        />
        {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
      </div>
    );
  },
);
InputField.displayName = 'InputField';

export { InputField };
