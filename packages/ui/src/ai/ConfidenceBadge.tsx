import { cn } from '../utils';

export interface ConfidenceBadgeProps {
  /** Confidence value (0-100) */
  confidence: number;
  /** Display variant */
  variant?: 'full' | 'compact' | 'text';
  /** Show label (High/Medium/Low) */
  showLabel?: boolean;
  /** Additional classes */
  className?: string;
}

type ConfidenceLevel = 'high' | 'medium' | 'low';

const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence >= 75) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
};

const levelStyles: Record<ConfidenceLevel, { color: string; bg: string; label: string }> = {
  high: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-500',
    label: 'High confidence',
  },
  medium: {
    color: 'text-amber-600',
    bg: 'bg-amber-500',
    label: 'Medium confidence',
  },
  low: {
    color: 'text-red-500',
    bg: 'bg-red-500',
    label: 'Low confidence',
  },
};

/**
 * Visual confidence indicator for AI suggestions.
 *
 * @example
 * ```tsx
 * <ConfidenceBadge confidence={87} />
 * <ConfidenceBadge confidence={65} variant="compact" />
 * <ConfidenceBadge confidence={42} variant="text" />
 * ```
 */
export function ConfidenceBadge({
  confidence,
  variant = 'full',
  showLabel = true,
  className,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence);
  const styles = levelStyles[level];
  const normalizedValue = Math.min(100, Math.max(0, confidence));

  if (variant === 'text') {
    return (
      <span className={cn('text-sm', styles.color, className)}>
        {Math.round(normalizedValue)}% confident
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        variant === 'compact' && 'gap-1.5',
        className
      )}
      role="meter"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${styles.label}: ${normalizedValue}%`}
    >
      {/* Progress bar */}
      <div
        className={cn(
          'h-1.5 bg-slate-200 rounded-full overflow-hidden',
          variant === 'full' ? 'w-20' : 'w-12'
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', styles.bg)}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>

      {/* Percentage */}
      <span
        className={cn(
          'font-mono tabular-nums font-medium',
          variant === 'full' ? 'text-sm' : 'text-xs',
          styles.color
        )}
      >
        {Math.round(normalizedValue)}%
      </span>

      {/* Label (full variant only) */}
      {variant === 'full' && showLabel && (
        <span className="text-xs text-slate-500">{styles.label}</span>
      )}
    </div>
  );
}
