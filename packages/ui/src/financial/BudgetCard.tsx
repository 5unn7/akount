import { cn } from '../utils';

export interface BudgetCardProps {
  /** Budget name/label */
  label: string;
  /** Budget period (e.g., "Q4 2025") */
  period?: string;
  /** Budgeted amount in cents */
  budget: number;
  /** Spent amount in cents */
  spent: number;
  /** Currency code */
  currency: string;
  /** View transactions handler */
  onViewTransactions?: () => void;
  /** Additional classes */
  className?: string;
}

/**
 * Budget progress card component.
 *
 * @example
 * ```tsx
 * <BudgetCard
 *   label="Marketing Budget"
 *   period="Q4 2025"
 *   budget={500000}
 *   spent={320000}
 *   currency="CAD"
 *   onViewTransactions={() => openBudgetDetail(id)}
 * />
 * ```
 */
export function BudgetCard({
  label,
  period,
  budget,
  spent,
  currency,
  onViewTransactions,
  className,
}: BudgetCardProps) {
  const remaining = budget - spent;
  const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const isOverBudget = spent > budget;

  const formatAmount = (cents: number) => {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  };

  // Determine color based on percentage
  const getStatusColor = () => {
    if (isOverBudget) return { bg: 'bg-red-500', text: 'text-red-600' };
    if (percentage >= 90) return { bg: 'bg-red-500', text: 'text-red-600' };
    if (percentage >= 70) return { bg: 'bg-amber-500', text: 'text-amber-600' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const statusColor = getStatusColor();

  return (
    <div
      className={cn(
        'p-4 rounded-[14px]',
        'bg-white/70 backdrop-blur-sm',
        'border border-slate-200/60',
        'shadow-sm',
        className
      )}
      data-testid="budget-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-semibold text-slate-900">{label}</h3>
        {period && (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {period}
          </span>
        )}
      </div>

      {/* Amounts */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Budget:</span>
          <span className="font-mono text-sm font-medium text-slate-900 tabular-nums">
            {formatAmount(budget)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Spent:</span>
          <span
            className={cn(
              'font-mono text-sm font-medium tabular-nums',
              isOverBudget ? 'text-red-600' : 'text-slate-900'
            )}
          >
            {formatAmount(spent)} ({percentage}%)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Remaining:</span>
          <span
            className={cn(
              'font-mono text-sm font-medium tabular-nums',
              remaining < 0 ? 'text-red-600' : 'text-emerald-600'
            )}
          >
            {remaining < 0 && '−'}
            {formatAmount(Math.abs(remaining))}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              statusColor.bg
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentage}% of budget spent`}
          />
        </div>
        {isOverBudget && (
          <p className="mt-1 text-xs text-red-600">
            Over budget by {formatAmount(Math.abs(remaining))}
          </p>
        )}
      </div>

      {/* Action */}
      {onViewTransactions && (
        <button
          onClick={onViewTransactions}
          className={cn(
            'w-full px-3 py-2 text-sm font-medium rounded-lg',
            'text-slate-600 hover:bg-slate-100',
            'transition-colors duration-75',
            'focus:outline-none focus:ring-2 focus:ring-slate-400/50'
          )}
        >
          View transactions
        </button>
      )}
    </div>
  );
}
