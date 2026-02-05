import type { Cents, Currency } from '@akount/types';
import { formatCents, formatCentsCompact } from '@akount/types';
import { cn } from '../utils';

export interface MoneyAmountProps {
  /**
   * Amount in cents (integer).
   */
  amount: Cents;
  /**
   * Currency code for formatting.
   */
  currency: Currency;
  /**
   * Show sign prefix (+/-) for non-zero amounts.
   */
  showSign?: boolean;
  /**
   * Use compact notation (e.g., $1.2K, $1.5M).
   */
  compact?: boolean;
  /**
   * Apply semantic color based on sign.
   * Positive = income (green), Negative = expense (red), Zero = neutral.
   */
  colorize?: boolean;
  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * Display a monetary amount with consistent formatting.
 *
 * @example
 * ```tsx
 * <MoneyAmount amount={cents(1050)} currency="CAD" />
 * // "$10.50"
 *
 * <MoneyAmount amount={cents(-500)} currency="USD" colorize />
 * // "-$5.00" in red
 *
 * <MoneyAmount amount={cents(150000)} currency="CAD" compact />
 * // "$1.5K"
 * ```
 */
export function MoneyAmount({
  amount,
  currency,
  showSign = false,
  compact = false,
  colorize = false,
  className,
}: MoneyAmountProps) {
  const formatted = compact
    ? formatCentsCompact(amount, currency)
    : formatCents(amount, currency);

  const displayValue = showSign && amount > 0 ? `+${formatted}` : formatted;

  const colorClass = colorize
    ? amount > 0
      ? 'text-finance-income'
      : amount < 0
        ? 'text-finance-expense'
        : 'text-finance-neutral'
    : '';

  return (
    <span
      className={cn('font-mono tabular-nums', colorClass, className)}
      data-testid="money-amount"
    >
      {displayValue}
    </span>
  );
}
