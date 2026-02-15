import { cn } from '../utils';

export interface ProgressBarProps {
  /** Current value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Animate the progress bar */
  animated?: boolean;
  /** Additional classes */
  className?: string;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const colorStyles = {
  primary: 'bg-orange-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

/**
 * Linear progress bar component.
 *
 * @example
 * ```tsx
 * <ProgressBar value={45} showLabel />
 * <ProgressBar value={90} color="warning" label="Almost there!" />
 * ```
 */
export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  color = 'primary',
  animated = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-slate-600">{label}</span>}
          {showLabel && (
            <span className="text-sm font-medium text-slate-700 tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-slate-200 rounded-full overflow-hidden',
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full',
            colorStyles[color],
            animated && 'transition-all duration-300 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export interface ProgressCircleProps {
  /** Current value (0-100) */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show percentage in center */
  showLabel?: boolean;
  /** Custom center content */
  children?: React.ReactNode;
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Additional classes */
  className?: string;
}

const circleColors = {
  primary: 'stroke-orange-500',
  success: 'stroke-emerald-500',
  warning: 'stroke-amber-500',
  error: 'stroke-red-500',
};

/**
 * Circular progress indicator.
 *
 * @example
 * ```tsx
 * <ProgressCircle value={75} showLabel />
 * <ProgressCircle value={100} color="success">
 *   <span className="text-emerald-600">✓</span>
 * </ProgressCircle>
 * ```
 */
export function ProgressCircle({
  value,
  size = 48,
  strokeWidth = 4,
  showLabel = false,
  children,
  color = 'primary',
  className,
}: ProgressCircleProps) {
  const percentage = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            circleColors[color],
            'transition-all duration-300 ease-out'
          )}
        />
      </svg>
      {/* Center content */}
      {(showLabel || children) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children || (
            <span className="text-xs font-semibold text-slate-700 tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export interface IndeterminateProgressProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  color?: 'primary' | 'secondary';
  /** Additional classes */
  className?: string;
}

/**
 * Indeterminate progress indicator (no known completion %).
 *
 * @example
 * ```tsx
 * <IndeterminateProgress />
 * ```
 */
export function IndeterminateProgress({
  size = 'md',
  color = 'primary',
  className,
}: IndeterminateProgressProps) {
  return (
    <div
      className={cn(
        'w-full bg-slate-200 rounded-full overflow-hidden',
        sizeStyles[size],
        className
      )}
      role="progressbar"
      aria-busy="true"
    >
      <div
        className={cn(
          'h-full w-1/3 rounded-full',
          color === 'primary' ? 'bg-orange-500' : 'bg-violet-500',
          'animate-[indeterminate_1.5s_ease-in-out_infinite]'
        )}
      />
      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
