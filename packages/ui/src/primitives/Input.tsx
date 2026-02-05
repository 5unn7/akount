'use client';

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from 'react';
import { cn } from '../utils';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text displayed above input */
  label?: string;
  /** Helper text displayed below input */
  helperText?: string;
  /** Error message (also sets error state) */
  error?: string;
  /** Icon displayed at the start of input */
  icon?: ReactNode;
  /** Icon displayed at the end of input */
  endIcon?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width of container */
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: {
    input: 'h-8 text-sm px-3',
    icon: 'left-2.5',
    endIcon: 'right-2.5',
    iconPadding: 'pl-8',
    endIconPadding: 'pr-8',
  },
  md: {
    input: 'h-10 text-base px-3',
    icon: 'left-3',
    endIcon: 'right-3',
    iconPadding: 'pl-10',
    endIconPadding: 'pr-10',
  },
  lg: {
    input: 'h-12 text-lg px-4',
    icon: 'left-3.5',
    endIcon: 'right-3.5',
    iconPadding: 'pl-12',
    endIconPadding: 'pr-12',
  },
};

/**
 * Input component with label, helper text, and error states.
 *
 * @example
 * ```tsx
 * <Input label="Email" type="email" placeholder="you@example.com" />
 * <Input label="Amount" error="Invalid amount" />
 * <Input icon={<SearchIcon />} placeholder="Search..." />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      icon,
      endIcon,
      size = 'md',
      fullWidth = false,
      disabled,
      required,
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const hasError = Boolean(error);
    const styles = sizeStyles[size];

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-medium text-slate-700',
              disabled && 'text-slate-400'
            )}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none',
                styles.icon
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              // Base styles
              'w-full rounded-[10px] border bg-white font-sans',
              'placeholder:text-slate-400',
              'transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)]',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              // Size styles
              styles.input,
              // Icon padding
              icon && styles.iconPadding,
              endIcon && styles.endIconPadding,
              // State styles
              hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                : 'border-slate-300 focus:border-orange-500 focus:ring-orange-500/30',
              disabled &&
                'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200',
              // Custom classes
              className
            )}
            data-testid="input"
            {...props}
          />

          {endIcon && (
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none',
                styles.endIcon
              )}
              aria-hidden="true"
            >
              {endIcon}
            </span>
          )}
        </div>

        {hasError && (
          <p id={errorId} className="text-sm text-red-500 flex items-center gap-1">
            <span aria-hidden="true">!</span>
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p id={helperId} className="text-sm text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
