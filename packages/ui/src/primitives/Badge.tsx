import { type ReactNode } from 'react';
import { cn } from '../utils';

/**
 * Badge variants for different states and contexts.
 */
export type BadgeVariant =
  | 'default'
  | 'reconciled'
  | 'ai'
  | 'review'
  | 'locked'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';

export interface BadgeProps {
  /** Visual variant */
  variant?: BadgeVariant;
  /** Optional icon before text */
  icon?: ReactNode;
  /** Badge content */
  children: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional classes */
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  reconciled: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ai: 'bg-violet-50 text-violet-700 border border-violet-200',
  review: 'bg-amber-50 text-amber-700 border border-amber-200',
  locked: 'bg-slate-100 text-slate-600 border border-slate-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
};

const variantIcons: Partial<Record<BadgeVariant, string>> = {
  reconciled: '✓',
  ai: '✨',
  review: '⚠',
  locked: '🔒',
  error: '✕',
  success: '✓',
  warning: '⚠',
  info: 'ℹ',
};

const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
};

/**
 * Badge component for status indicators.
 *
 * @example
 * ```tsx
 * <Badge variant="reconciled">Reconciled</Badge>
 * <Badge variant="ai">AI Categorized</Badge>
 * <Badge variant="review" icon={<WarningIcon />}>Review Needed</Badge>
 * ```
 */
export function Badge({
  variant = 'default',
  icon,
  children,
  size = 'md',
  className,
}: BadgeProps) {
  const defaultIcon = variantIcons[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      data-testid="badge"
    >
      {(icon || defaultIcon) && (
        <span className="shrink-0" aria-hidden="true">
          {icon || defaultIcon}
        </span>
      )}
      {children}
    </span>
  );
}
