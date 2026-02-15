import { type ReactNode } from 'react';
import { cn } from '../utils';

export interface CriticalAlertProps {
  /** Alert title */
  title: string;
  /** Alert description */
  description: ReactNode;
  /** Primary action */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom icon */
  icon?: ReactNode;
  /** Additional classes */
  className?: string;
}

/**
 * Critical alert for serious issues requiring immediate action.
 * Use sparingly - only for tax law changes, compliance deadlines, material risks.
 *
 * @example
 * ```tsx
 * <CriticalAlert
 *   title="New US tax law affects your LLC"
 *   description="Review required before next filing to avoid penalties."
 *   primaryAction={{
 *     label: "Learn More",
 *     onClick: handleLearnMore
 *   }}
 *   secondaryAction={{
 *     label: "Connect with CPA",
 *     onClick: handleConnectCPA
 *   }}
 * />
 * ```
 */
export function CriticalAlert({
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  className,
}: CriticalAlertProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'rounded-[14px] border-2 border-red-500',
        'bg-red-50/80 backdrop-blur-sm',
        'p-5',
        'shadow-lg shadow-red-500/10',
        className
      )}
      data-testid="critical-alert"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
          aria-hidden="true"
        >
          {icon || <span className="text-xl">⚠</span>}
        </div>
        <h3 className="font-heading font-bold text-red-800 uppercase tracking-wide text-sm">
          Critical Alert
        </h3>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h4 className="font-semibold text-slate-900 mb-2">{title}</h4>
        <div className="text-sm text-slate-700">{description}</div>
      </div>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center gap-3">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className={cn(
                'px-4 py-2 rounded-lg font-semibold text-sm',
                'bg-red-600 text-white',
                'hover:bg-red-700 active:bg-red-800',
                'transition-colors duration-75',
                'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2'
              )}
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm',
                'text-red-700 hover:bg-red-100',
                'transition-colors duration-75',
                'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2'
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
