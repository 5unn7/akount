'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  /** Unique identifier */
  id: string;
  /** Toast variant */
  variant?: ToastVariant;
  /** Toast title */
  title: string;
  /** Optional description */
  description?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Duration in ms (0 for persistent) */
  duration?: number;
  /** Whether toast can be dismissed */
  dismissible?: boolean;
  /** Close handler */
  onClose?: (id: string) => void;
  /** Optional action */
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: '✕',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: '⚠',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'ℹ',
  },
};

const variantIconColors: Record<ToastVariant, string> = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
};

/**
 * Individual toast notification.
 *
 * @example
 * ```tsx
 * <Toast
 *   id="1"
 *   variant="success"
 *   title="Transaction saved"
 *   description="Your changes have been saved."
 *   onClose={handleClose}
 * />
 * ```
 */
export function Toast({
  id,
  variant = 'info',
  title,
  description,
  icon,
  duration = 5000,
  dismissible = true,
  onClose,
  action,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const styles = variantStyles[variant];

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 180);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'pointer-events-auto w-full max-w-sm',
        'rounded-[10px] border p-4',
        'shadow-lg',
        'transition-all duration-[180ms] ease-[cubic-bezier(0.2,0,0,1)]',
        styles.bg,
        styles.border,
        isVisible && !isExiting
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-4'
      )}
      data-testid="toast"
    >
      <div className="flex gap-3">
        <span
          className={cn('shrink-0 text-lg', variantIconColors[variant])}
          aria-hidden="true"
        >
          {icon || styles.icon}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'mt-2 text-sm font-medium',
                'text-orange-600 hover:text-orange-700',
                'focus:outline-none focus:underline'
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {dismissible && (
          <button
            onClick={handleClose}
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

export interface ToastContainerProps {
  /** Position of toast container */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Toasts to display */
  toasts: ToastProps[];
  /** Close handler */
  onClose: (id: string) => void;
}

/**
 * Container for positioning multiple toasts.
 *
 * @example
 * ```tsx
 * <ToastContainer
 *   position="bottom-right"
 *   toasts={toasts}
 *   onClose={handleClose}
 * />
 * ```
 */
export function ToastContainer({
  position = 'bottom-right',
  toasts,
  onClose,
}: ToastContainerProps) {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-3 pointer-events-none',
        positionStyles[position]
      )}
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
