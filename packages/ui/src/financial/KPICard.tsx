import { type ReactNode } from 'react';
import { cn } from '../utils';

export interface KPICardProps {
  /** KPI label */
  label: string;
  /** Main value (number) */
  value: number;
  /** Currency code */
  currency?: string;
  /** Previous value for comparison */
  previousValue?: number;
  /** Trend context label (e.g., "vs. last month") */
  trendLabel?: string;
  /** Is increasing good or bad? */
  trendContext?: 'positive' | 'negative';
  /** Sparkline data points */
  sparklineData?: number[];
  /** Custom icon */
  icon?: ReactNode;
  /** Additional classes */
  className?: string;
}

/**
 * KPI card component for displaying key metrics.
 *
 * @example
 * ```tsx
 * <KPICard
 *   label="Revenue"
 *   value={4520000}
 *   currency="CAD"
 *   previousValue={4000000}
 *   trendLabel="vs. last month"
 *   trendContext="positive"
 * />
 * ```
 */
export function KPICard({
  label,
  value,
  currency,
  previousValue,
  trendLabel = 'vs. previous period',
  trendContext = 'positive',
  sparklineData,
  icon,
  className,
}: KPICardProps) {
  // Calculate trend
  const hasTrend = previousValue !== undefined && previousValue !== 0;
  const change = hasTrend ? value - previousValue : 0;
  const changePercent = hasTrend ? Math.round((change / previousValue) * 100) : 0;
  const isIncrease = change > 0;
  const isDecrease = change < 0;

  // Determine trend color based on context
  const getTrendColor = () => {
    if (change === 0) return 'text-slate-500';
    if (trendContext === 'positive') {
      return isIncrease ? 'text-emerald-600' : 'text-red-500';
    } else {
      return isIncrease ? 'text-red-500' : 'text-emerald-600';
    }
  };

  // Format value
  const formatValue = (val: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: currency ? 'currency' : 'decimal',
      currency: currency || undefined,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(val / 100); // Convert cents to dollars
  };

  const formatChange = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return sign + formatValue(Math.abs(val));
  };

  return (
    <div
      className={cn(
        'p-5 rounded-[14px]',
        'bg-white/70 backdrop-blur-sm',
        'border border-slate-200/60',
        'shadow-sm',
        className
      )}
      data-testid="kpi-card"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <span className="text-slate-400" aria-hidden="true">
            {icon}
          </span>
        )}
        <h3 className="font-heading text-lg font-semibold text-slate-600">
          {label}
        </h3>
      </div>

      {/* Value */}
      <div className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
        {formatValue(value)}
        {currency && (
          <span className="ml-2 text-lg font-normal text-slate-500">
            {currency}
          </span>
        )}
      </div>

      {/* Trend */}
      {hasTrend && (
        <div className={cn('flex items-center gap-2 mt-3', getTrendColor())}>
          <span className="inline-flex items-center gap-1 font-mono text-sm tabular-nums">
            {isIncrease && <span aria-hidden="true">↑</span>}
            {isDecrease && <span aria-hidden="true">↓</span>}
            {change === 0 && <span aria-hidden="true">→</span>}
            {formatChange(change)}
            {changePercent !== 0 && (
              <span className="text-slate-500">
                ({isIncrease ? '+' : ''}
                {changePercent}%)
              </span>
            )}
          </span>
          <span className="text-xs text-slate-500">{trendLabel}</span>
        </div>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-4">
          <Sparkline data={sparklineData} />
        </div>
      )}
    </div>
  );
}

interface SparklineProps {
  data: number[];
  height?: number;
  className?: string;
}

function Sparkline({ data, height = 32, className }: SparklineProps) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        className="text-orange-500"
      />
    </svg>
  );
}
