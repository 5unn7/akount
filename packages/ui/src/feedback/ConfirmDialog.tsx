'use client';

import { type ReactNode } from 'react';
import { Modal } from './Modal';
import { cn } from '../utils';

export interface ConfirmDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Confirm handler */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: ReactNode;
  /** Confirm button text */
  confirmLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Variant (affects confirm button) */
  variant?: 'default' | 'danger';
  /** Loading state for confirm button */
  loading?: boolean;
  /** Custom icon */
  icon?: ReactNode;
}

/**
 * Confirmation dialog for actions that require user verification.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showDeleteConfirm}
 *   onClose={() => setShowDeleteConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete transaction?"
 *   description="This will permanently delete this transaction and cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const defaultIcon = variant === 'danger' ? '⚠' : 'ℹ';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4',
            variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'
          )}
          aria-hidden="true"
        >
          {icon || defaultIcon}
        </div>

        {/* Title */}
        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
          {title}
        </h3>

        {/* Description */}
        <div className="text-sm text-slate-600 mb-6">{description}</div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(
              'flex-1 px-4 py-2 rounded-[10px]',
              'border border-slate-300 text-slate-700 font-medium',
              'hover:bg-slate-50 active:bg-slate-100',
              'transition-colors duration-[120ms]',
              'focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'flex-1 px-4 py-2 rounded-[10px] font-semibold',
              'transition-all duration-[120ms]',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:cursor-not-allowed',
              variant === 'danger'
                ? [
                    'bg-red-500 text-white',
                    'hover:bg-red-600 active:bg-red-700',
                    'focus:ring-red-500/50',
                    'disabled:bg-red-300',
                  ].join(' ')
                : [
                    'bg-orange-500 text-white',
                    'hover:bg-orange-600 active:bg-orange-700',
                    'focus:ring-orange-500/50',
                    'disabled:bg-orange-300',
                  ].join(' ')
            )}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
