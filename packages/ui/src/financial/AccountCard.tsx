'use client';

import { cn } from '../utils';

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'loan';

export interface AccountCardProps {
  /** Account name */
  name: string;
  /** Account type */
  type: AccountType;
  /** Financial institution name */
  institution?: string;
  /** Account currency */
  currency: string;
  /** Current balance in cents */
  balance: number;
  /** Last sync timestamp */
  lastSynced?: string;
  /** Trend data */
  trend?: {
    amount: number;
    period: string;
  };
  /** Refresh handler */
  onRefresh?: () => void;
  /** Click handler */
  onClick?: () => void;
  /** Whether currently syncing */
  syncing?: boolean;
  /** Additional classes */
  className?: string;
}

const accountTypeIcons: Record<AccountType, string> = {
  checking: '🏦',
  savings: '💰',
  credit: '💳',
  investment: '📈',
  loan: '📋',
};

/**
 * Account summary card component.
 *
 * @example
 * ```tsx
 * <AccountCard
 *   name="Chase Checking"
 *   type="checking"
 *   institution="Chase"
 *   currency="USD"
 *   balance={1254389}
 *   lastSynced="2 minutes ago"
 *   trend={{ amount: 234000, period: "this month" }}
 *   onRefresh={handleRefresh}
 *   onClick={() => navigateToAccount(id)}
 * />
 * ```
 */
export function AccountCard({
  name,
  type,
  institution,
  currency,
  balance,
  lastSynced,
  trend,
  onRefresh,
  onClick,
  syncing = false,
  className,
}: AccountCardProps) {
  const isPositive = balance >= 0;
  const isNegative = balance < 0;

  const formatBalance = (cents: number) => {
    const dollars = Math.abs(cents) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  };

  const formatTrendAmount = (cents: number) => {
    const sign = cents > 0 ? '+' : '';
    const dollars = Math.abs(cents) / 100;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(dollars);
    return sign + formatted;
  };

  return (
    <div
      className={cn(
        'p-4 rounded-[14px]',
        'bg-white/70 backdrop-blur-sm',
        'border border-slate-200/60',
        'shadow-sm',
        'transition-all duration-[180ms]',
        onClick && [
          'cursor-pointer',
          'hover:shadow-md hover:scale-[1.01]',
          'active:scale-[0.99]',
        ],
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
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
      data-testid="account-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl" aria-hidden="true">
            {accountTypeIcons[type]}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{name}</h3>
            {institution && (
              <p className="text-xs text-slate-500 truncate">{institution}</p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-500 uppercase">
          {currency}
        </span>
      </div>

      {/* Balance */}
      <div className="mb-3">
        <div
          className={cn(
            'font-mono text-2xl font-bold tabular-nums',
            isPositive && 'text-slate-900',
            isNegative && 'text-red-600'
          )}
        >
          {isNegative && '−'}
          {formatBalance(balance)}
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={cn(
                'font-mono text-sm tabular-nums',
                trend.amount > 0 ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {trend.amount > 0 && <span aria-hidden="true">↑ </span>}
              {trend.amount < 0 && <span aria-hidden="true">↓ </span>}
              {formatTrendAmount(trend.amount)}
            </span>
            <span className="text-xs text-slate-500">{trend.period}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {lastSynced && (
          <span className="text-slate-500">
            Last synced: {lastSynced}
          </span>
        )}
        {onRefresh && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={syncing}
            className={cn(
              'p-1.5 rounded-md',
              'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
              'transition-colors duration-75',
              'focus:outline-none focus:ring-2 focus:ring-slate-400/50',
              syncing && 'animate-spin'
            )}
            aria-label="Refresh account"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5C4.96243 13.5 2.5 11.0376 2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C9.89949 2.5 11.5705 3.43932 12.5 4.875"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12.5 2V5H9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
