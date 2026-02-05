import { type ReactNode } from 'react';
import { cn } from '../utils';

export interface EmptyStateProps {
  /** Icon or illustration */
  icon?: ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
}

const sizeStyles = {
  sm: {
    container: 'py-8 px-4',
    icon: 'text-3xl mb-2',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12 px-6',
    icon: 'text-5xl mb-4',
    title: 'text-lg',
    description: 'text-base',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'text-6xl mb-6',
    title: 'text-xl',
    description: 'text-base',
  },
};

const defaultIcons: Record<string, string> = {
  transactions: '📊',
  invoices: '📄',
  accounts: '🏦',
  entities: '🏢',
  reports: '📈',
  default: '📭',
};

/**
 * Empty state component for when there's no data to display.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="📊"
 *   title="No transactions yet"
 *   description="Import your first bank statement to see transactions here."
 *   action={{
 *     label: "Import Statement",
 *     onClick: handleImport
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
      data-testid="empty-state"
    >
      {icon && (
        <div className={cn('text-slate-300', styles.icon)} aria-hidden="true">
          {typeof icon === 'string' ? icon : icon}
        </div>
      )}

      <h3
        className={cn(
          'font-heading font-semibold text-slate-900',
          styles.title
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-slate-500 mt-2 max-w-sm',
            styles.description
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'px-4 py-2 rounded-[10px]',
                'bg-orange-500 text-white font-semibold',
                'hover:bg-orange-600 active:bg-orange-700',
                'transition-colors duration-[120ms]',
                'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2'
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cn(
                'px-4 py-2 rounded-[10px]',
                'text-slate-600 font-medium',
                'hover:bg-slate-100 active:bg-slate-200',
                'transition-colors duration-[120ms]',
                'focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:ring-offset-2'
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

/**
 * Preset empty states for common scenarios.
 */
export const emptyStatePresets = {
  transactions: {
    icon: '📊',
    title: 'No transactions yet',
    description: 'Import your first bank statement to see transactions here.',
  },
  invoices: {
    icon: '📄',
    title: 'No invoices',
    description: 'Create your first invoice to start tracking receivables.',
  },
  accounts: {
    icon: '🏦',
    title: 'No accounts connected',
    description: 'Connect a bank account to automatically import transactions.',
  },
  entities: {
    icon: '🏢',
    title: 'No entities',
    description: 'Add your first business entity to get started.',
  },
  search: {
    icon: '🔍',
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
} as const;
