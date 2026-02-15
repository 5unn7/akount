'use client';

import { cn } from '../utils';
import type { ReactNode } from 'react';

export type TransactionStatus = 'pending' | 'reconciled' | 'locked' | 'error';

export interface TransactionEntity {
  name: string;
  flag: string;
}

export interface TransactionAccount {
  id: string;
  name: string;
  code?: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  entity?: TransactionEntity;
  account?: TransactionAccount;
  category?: TransactionCategory;
  counterparty?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  aiCategorized?: boolean;
}

export interface TransactionRowProps {
  /** Transaction data */
  transaction: Transaction;
  /** Whether row is selected */
  selected?: boolean;
  /** Selection handler */
  onSelect?: (id: string) => void;
  /** Category change handler */
  onCategoryChange?: (categoryId: string) => void;
  /** Row click handler */
  onClick?: () => void;
  /** AI suggestion chip */
  aiSuggestion?: ReactNode;
  /** Additional classes */
  className?: string;
}

const statusConfig: Record<
  TransactionStatus,
  { icon: string; color: string; label: string }
> = {
  pending: {
    icon: '○',
    color: 'text-slate-400',
    label: 'Pending',
  },
  reconciled: {
    icon: '✓',
    color: 'text-emerald-600',
    label: 'Reconciled',
  },
  locked: {
    icon: '🔒',
    color: 'text-slate-500',
    label: 'Locked',
  },
  error: {
    icon: '✕',
    color: 'text-red-500',
    label: 'Error',
  },
};

/**
 * Transaction row component for transaction tables.
 *
 * @example
 * ```tsx
 * <TransactionRow
 *   transaction={{
 *     id: '1',
 *     date: '2025-12-15',
 *     description: 'Amazon AWS',
 *     entity: { name: 'Canadian Corp', flag: '🇨🇦' },
 *     account: { id: '1', name: 'Chase Checking' },
 *     category: { id: '5100', name: 'Cloud Services' },
 *     counterparty: 'AWS',
 *     amount: -120000,
 *     currency: 'CAD',
 *     status: 'reconciled',
 *     aiCategorized: true
 *   }}
 *   selected={selectedIds.has('1')}
 *   onSelect={handleSelect}
 *   onClick={() => openDetail('1')}
 * />
 * ```
 */
export function TransactionRow({
  transaction,
  selected = false,
  onSelect,
  onCategoryChange,
  onClick,
  aiSuggestion,
  className,
}: TransactionRowProps) {
  const {
    id,
    date,
    description,
    entity,
    account,
    category,
    counterparty,
    amount,
    currency,
    status,
    aiCategorized,
  } = transaction;

  const isPositive = amount >= 0;
  const statusInfo = statusConfig[status];

  const formatAmount = (cents: number) => {
    const dollars = Math.abs(cents) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(id);
  };

  return (
    <div
      className={cn(
        'grid grid-cols-[40px_100px_1fr_80px_120px_140px_100px_120px_50px_60px] items-center',
        'px-2 py-3 border-b border-slate-100',
        'transition-colors duration-75',
        onClick && 'cursor-pointer',
        selected && 'bg-orange-50',
        !selected && 'hover:bg-slate-50',
        status === 'locked' && 'opacity-60',
        status === 'error' && 'bg-red-50/50',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : 'row'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      data-testid="transaction-row"
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center">
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            onClick={handleCheckboxClick}
            disabled={status === 'locked'}
            className={cn(
              'h-4 w-4 rounded border-slate-300',
              'text-orange-500 focus:ring-orange-500/50'
            )}
            aria-label={`Select transaction ${description}`}
          />
        )}
      </div>

      {/* Date */}
      <div className="text-sm text-slate-600">{date}</div>

      {/* Description */}
      <div className="min-w-0 pr-2">
        <div className="text-sm font-medium text-slate-900 truncate">
          {description}
        </div>
        {aiSuggestion && <div className="mt-1">{aiSuggestion}</div>}
      </div>

      {/* Entity */}
      <div className="text-sm">
        {entity ? (
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true">{entity.flag}</span>
            <span className="truncate text-slate-600">{entity.name}</span>
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>

      {/* Account */}
      <div className="text-sm text-slate-600 truncate">
        {account?.name || <span className="text-slate-400">—</span>}
      </div>

      {/* Category */}
      <div className="text-sm">
        <div className="flex items-center gap-1">
          {aiCategorized && (
            <span
              className="text-violet-500"
              title="Categorized by AI"
              aria-label="AI categorized"
            >
              ✨
            </span>
          )}
          <span className={cn(category ? 'text-slate-700' : 'text-slate-400')}>
            {category?.name || 'Uncategorized'}
          </span>
        </div>
      </div>

      {/* Counterparty */}
      <div className="text-sm text-slate-600 truncate">
        {counterparty || <span className="text-slate-400">—</span>}
      </div>

      {/* Amount */}
      <div
        className={cn(
          'font-mono text-sm font-medium tabular-nums text-right',
          isPositive ? 'text-emerald-600' : 'text-red-600'
        )}
      >
        {!isPositive && '−'}
        {formatAmount(amount)}
      </div>

      {/* Currency */}
      <div className="text-xs text-slate-500 text-center font-medium">
        {currency}
      </div>

      {/* Status */}
      <div className="flex items-center justify-center">
        <span
          className={cn('text-sm', statusInfo.color)}
          title={statusInfo.label}
          aria-label={statusInfo.label}
        >
          {statusInfo.icon}
        </span>
      </div>
    </div>
  );
}

/**
 * Transaction table header component.
 */
export function TransactionTableHeader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-[40px_100px_1fr_80px_120px_140px_100px_120px_50px_60px] items-center',
        'px-2 py-2 border-b border-slate-200 bg-slate-50/50',
        'text-xs font-semibold text-slate-500 uppercase tracking-wider',
        className
      )}
      role="row"
    >
      <div></div>
      <div>Date</div>
      <div>Description</div>
      <div>Entity</div>
      <div>Account</div>
      <div>Category</div>
      <div>Counterparty</div>
      <div className="text-right">Amount</div>
      <div className="text-center">Ccy</div>
      <div className="text-center">Status</div>
    </div>
  );
}
