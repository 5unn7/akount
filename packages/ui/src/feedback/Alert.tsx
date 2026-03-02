import { type ReactNode } from 'react';
import { cn } from '../utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  /** Alert variant */
  variant?: AlertVariant;
  /** Alert title */
  title?: string;
  /** Alert content */
  children: ReactNode;
  /** Custom icon */
  icon?: ReactNode;
  /** Whether alert can be dismissed */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Optional action */
  action?: ReactNode;
  /** Additional classes */
  className?: string;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'ℹ',
    iconColor: 'text-blue-600',
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '✓',
    iconColor: 'text-emerald-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: '⚠',
    iconColor: 'text-amber-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: '✕',
    iconColor: 'text-red-600',
  },
};

/**
 * Inline alert component for contextual messages.
 *
 * @example
 * ```tsx
 * <Alert variant="warning" title="Attention">
 *   Your session will expire in 5 minutes.
 * </Alert>
 *
 * <Alert
 *   variant="error"
 *   dismissible
 *   onDismiss={handleDismiss}
 *   action={<Button size="sm">Retry</Button>}
 * >
 *   Failed to save transaction.
 * </Alert>
 * ```
 */
export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  dismissible = false,
  onDismiss,
  action,
  className,
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={cn(
        'rounded-[10px] border p-4',
        styles.bg,
        styles.border,
        className
      )}
      data-testid="alert"
    >
      <div className="flex gap-3">
        <span
          className={cn('shrink-0 text-lg', styles.iconColor)}
          aria-hidden="true"
        >
          {icon || styles.icon}
        </span>

        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              {title}
            </h4>
          )}
          <div className="text-sm text-slate-700">{children}</div>
          {action && <div className="mt-3">{action}</div>}
        </div>

        {dismissible && (
          <button
            onClick={onDismiss}
            className={cn(
              'shrink-0 p-1 rounded-md',
              'text-slate-400 hover:text-slate-600',
              'hover:bg-black/5',
              'transition-colors duration-75',
              'focus:outline-none focus:ring-2 focus:ring-slate-400/50'
            )}
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
