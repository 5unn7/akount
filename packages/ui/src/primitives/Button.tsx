import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils';

/**
 * Button variants following Akount design system.
 * - primary: Orange CTA for main actions
 * - secondary: Violet for alternative actions
 * - ghost: Transparent with border for tertiary
 * - danger: Red for destructive actions
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Button sizes with consistent padding and heights.
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Show loading spinner and disable interactions */
  loading?: boolean;
  /** Icon to display */
  icon?: ReactNode;
  /** Position of the icon */
  iconPosition?: 'left' | 'right';
  /** Expand to full width of container */
  fullWidth?: boolean;
  /** Button content */
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-orange-500 text-white',
    'hover:bg-orange-600',
    'active:bg-orange-700 active:scale-[0.98]',
    'focus-visible:ring-orange-500/50',
    'disabled:bg-slate-300 disabled:text-slate-500',
    'shadow-sm hover:shadow-md active:shadow-none',
  ].join(' '),
  secondary: [
    'bg-violet-100 text-violet-700',
    'hover:bg-violet-200',
    'active:bg-violet-300 active:scale-[0.98]',
    'focus-visible:ring-violet-500/50',
    'disabled:bg-slate-100 disabled:text-slate-400',
  ].join(' '),
  ghost: [
    'bg-transparent text-slate-700 border border-slate-300',
    'hover:bg-slate-100',
    'active:bg-slate-200 active:scale-[0.98]',
    'focus-visible:ring-slate-500/50',
    'disabled:bg-transparent disabled:text-slate-400 disabled:border-slate-200',
  ].join(' '),
  danger: [
    'bg-red-500 text-white',
    'hover:bg-red-600',
    'active:bg-red-700 active:scale-[0.98]',
    'focus-visible:ring-red-500/50',
    'disabled:bg-slate-300 disabled:text-slate-500',
    'shadow-sm hover:shadow-md active:shadow-none',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-base gap-2',
  lg: 'h-12 px-5 text-lg gap-2.5',
};

/**
 * Button component with skeuomorphic press effect.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleSave}>Save</Button>
 * <Button variant="ghost" icon={<PlusIcon />}>Add Item</Button>
 * <Button variant="danger" loading>Deleting...</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-semibold',
          'rounded-[10px]', // radius-md
          'transition-all duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-70',
          // Variant styles
          variantStyles[variant],
          // Size styles
          sizeStyles[size],
          // Full width
          fullWidth && 'w-full',
          // Custom classes
          className
        )}
        aria-busy={loading}
        data-testid="button"
        {...props}
      >
        {loading && (
          <span
            className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            aria-hidden="true"
          />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{children}</span>
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
