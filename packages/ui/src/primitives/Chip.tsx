'use client';

import { type ReactNode } from 'react';
import { cn } from '../utils';

/**
 * Chip variants for different interaction patterns.
 */
export type ChipVariant = 'filter' | 'suggestion' | 'action';

export interface ChipProps {
  /** Visual variant */
  variant?: ChipVariant;
  /** Chip content */
  children: ReactNode;
  /** Optional icon */
  icon?: ReactNode;
  /** Whether chip is selected/active */
  selected?: boolean;
  /** Show remove button */
  removable?: boolean;
  /** Remove handler */
  onRemove?: () => void;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional classes */
  className?: string;
}

const variantStyles: Record<ChipVariant, { base: string; selected: string }> = {
  filter: {
    base: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100',
    selected: 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100',
  },
  suggestion: {
    base: 'bg-violet-50/50 border-violet-200 text-violet-700 hover:bg-violet-50',
    selected: 'bg-violet-100 border-violet-300 text-violet-800 hover:bg-violet-100',
  },
  action: {
    base: 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800',
    selected: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-100',
  },
};

/**
 * Chip component for filters, suggestions, and actions.
 *
 * @example
 * ```tsx
 * // Filter chip
 * <Chip variant="filter" selected removable onRemove={handleRemove}>
 *   Date: This Month
 * </Chip>
 *
 * // AI suggestion chip
 * <Chip variant="suggestion" onClick={handleApply}>
 *   ✨ Cloud Services (87%)
 * </Chip>
 *
 * // Action chip
 * <Chip variant="action" icon={<EditIcon />} onClick={handleEdit}>
 *   Edit
 * </Chip>
 * ```
 */
export function Chip({
  variant = 'filter',
  children,
  icon,
  selected = false,
  removable = false,
  onRemove,
  onClick,
  disabled = false,
  className,
}: ChipProps) {
  const styles = variantStyles[variant];
  const isInteractive = Boolean(onClick) && !disabled;

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <span
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5',
        'text-sm font-medium rounded-lg border',
        'transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)]',
        selected ? styles.selected : styles.base,
        isInteractive && 'cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      data-testid="chip"
    >
      {icon && (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={handleRemoveClick}
          disabled={disabled}
          className={cn(
            'shrink-0 ml-0.5 p-0.5 rounded-full',
            'hover:bg-black/10 active:bg-black/20',
            'transition-colors duration-75',
            'focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-current'
          )}
          aria-label="Remove"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-current"
          >
            <path
              d="M3 3L9 9M9 3L3 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
