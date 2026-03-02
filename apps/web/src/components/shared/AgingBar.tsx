import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';

/**
 * AgingBar Component
 *
 * Displays AR/AP aging with segmented bar and legend.
 * Uses semantic tokens for colors (NEVER hardcoded values).
 *
 * Usage:
 * ```tsx
 * <AgingBar
 *   buckets={[
 *     { label: 'Current', amount: 300000, percentage: 60, color: 'green' },
 *     { label: '1-30 days', amount: 100000, percentage: 20, color: 'amber' },
 *     { label: '31-60 days', amount: 75000, percentage: 15, color: 'red' },
 *     { label: '60+ days', amount: 25000, percentage: 5, color: 'darkred' },
 *   ]}
 *   totalAmount={500000}
 *   totalLabel="Total Outstanding AR"
 *   currency="CAD"
 * />
 * ```
 */

interface AgingBucket {
  label: string;
  amount: number; // Integer cents
  percentage: number; // 0-100
  color: 'green' | 'amber' | 'red' | 'darkred';
}

interface AgingBarProps {
  buckets: AgingBucket[];
  totalLabel?: string;
  totalAmount: number; // Integer cents
  currency?: string;
  className?: string;
}

// Semantic token classes (NEVER hardcode colors)
const colorClasses = {
  green: 'bg-ak-green',
  amber: 'bg-primary',
  red: 'bg-ak-red',
  darkred: 'bg-destructive',
} as const;

const dotClasses = {
  green: 'bg-ak-green',
  amber: 'bg-primary',
  red: 'bg-ak-red',
  darkred: 'bg-destructive',
} as const;

export function AgingBar({
  buckets,
  totalLabel = 'Total Outstanding',
  totalAmount,
  currency = 'CAD',
  className,
}: AgingBarProps) {
  return (
    <div className={cn('glass rounded-xl p-5 space-y-4', className)}>
      {/* Title + Total */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground font-medium">
          {totalLabel}
        </h3>
        <p className="font-mono text-xl font-semibold">
          {formatCurrency(totalAmount, currency)}
        </p>
      </div>

      {/* Segmented Bar */}
      <div className="h-12 rounded-lg overflow-hidden flex">
        {buckets.map((bucket, i) => {
          // Only render if percentage > 0 to avoid invisible segments
          if (bucket.percentage === 0) return null;

          return (
            <div
              key={bucket.label}
              className={cn(
                colorClasses[bucket.color],
                'transition-all hover:opacity-80'
              )}
              style={{ width: `${bucket.percentage}%` }}
              title={`${bucket.label}: ${formatCurrency(bucket.amount, currency)} (${bucket.percentage}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex items-center gap-2">
            <div
              className={cn('w-1.5 h-1.5 rounded-full', dotClasses[bucket.color])}
            />
            <div className="min-w-0">
              <p className="text-micro uppercase tracking-wide text-muted-foreground">
                {bucket.label}
              </p>
              <p className="font-mono text-xs font-medium truncate">
                {formatCurrency(bucket.amount, currency)}
              </p>
              <p className="text-micro text-muted-foreground">
                {bucket.percentage}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
