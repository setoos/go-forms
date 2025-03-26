import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2 rounded-lg transition-colors',
            'border border-border',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-red-500 focus:ring-red-500/50'
              : 'focus:ring-primary/50',
            'placeholder:text-gray-400',
            className
          )}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              'text-sm',
              error ? 'text-red-500' : 'text-gray-500'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };