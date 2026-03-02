import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils';

export type CardVariant = 'default' | 'elevated' | 'flat' | 'glass';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Make card interactive (hover effects) */
  interactive?: boolean;
  /** Card header content */
  header?: ReactNode;
  /** Card footer content */
  footer?: ReactNode;
  /** Card content */
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: [
    'bg-white/70 backdrop-blur-sm',
    'border border-slate-200/60',
    'shadow-sm',
  ].join(' '),
  elevated: [
    'bg-white/80 backdrop-blur-md',
    'border border-slate-200/40',
    'border-t-white/30',
    'shadow-lg',
  ].join(' '),
  flat: [
    'bg-white',
    'border border-slate-200',
    'shadow-none',
  ].join(' '),
  glass: [
    'bg-white/50 backdrop-blur-xl',
    'border border-white/30',
    'border-t-white/50 border-l-white/50',
    'shadow-md',
  ].join(' '),
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Card component with glassmorphism variants.
 *
 * @example
 * ```tsx
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 *
 * <Card variant="glass" padding="lg" interactive onClick={handleClick}>
 *   <KPIContent />
 * </Card>
 *
 * <Card
 *   header={<CardHeader title="Users" action={<Button>Add</Button>} />}
 *   footer={<Pagination />}
 * >
 *   <UserList />
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      interactive = false,
      header,
      footer,
      children,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        className={cn(
          'rounded-[14px]',
          'transition-all duration-[180ms] ease-[cubic-bezier(0.2,0,0,1)]',
          variantStyles[variant],
          interactive && [
            'cursor-pointer',
            'hover:shadow-lg hover:scale-[1.01]',
            'active:scale-[0.99] active:shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2',
          ].join(' '),
          className
        )}
        data-testid="card"
        {...props}
      >
        {header && (
          <div
            className={cn(
              'border-b border-slate-200/50',
              padding !== 'none' && paddingStyles[padding]
            )}
          >
            {header}
          </div>
        )}
        <div className={paddingStyles[padding]}>{children}</div>
        {footer && (
          <div
            className={cn(
              'border-t border-slate-200/50',
              padding !== 'none' && paddingStyles[padding]
            )}
          >
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card header with title and optional action.
 */
export interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="font-heading text-lg font-semibold text-slate-900 truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
