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
  default: 'bg-ak-bg-3 text-muted-foreground border border-ak-border',
  reconciled: 'bg-ak-green/10 text-ak-green border border-ak-green/20',
  ai: 'bg-ak-purple/10 text-ak-purple border border-ak-purple/20',
  review: 'bg-primary/10 text-primary border border-primary/20',
  locked: 'bg-ak-bg-3 text-muted-foreground border border-ak-border',
  error: 'bg-ak-red/10 text-ak-red border border-ak-red/20',
  success: 'bg-ak-green/10 text-ak-green border border-ak-green/20',
  warning: 'bg-primary/10 text-primary border border-primary/20',
  info: 'bg-ak-blue/10 text-ak-blue border border-ak-blue/20',
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
