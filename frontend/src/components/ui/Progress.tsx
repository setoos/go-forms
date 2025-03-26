import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    { className, value, max = 100, showValue = false, size = 'md', ...props },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const sizes = {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6',
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn('w-full bg-gray-200 rounded-full overflow-hidden', className)}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-in-out',
            'bg-primary',
            sizes[size]
          )}
          style={{ width: `${percentage}%` }}
        >
          {showValue && size !== 'sm' && (
            <div className="h-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {Math.round(percentage)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };