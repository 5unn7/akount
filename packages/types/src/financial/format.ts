/**
 * Currency formatting utilities.
 * Always use these for displaying money to ensure consistency.
 */

import type { Cents } from './money';
import type { Currency } from './currency';
import { CURRENCY_INFO } from './currency';

/**
 * Format cents as a currency string.
 *
 * @example
 * ```typescript
 * formatCents(cents(1050), 'CAD') // "$10.50"
 * formatCents(cents(-500), 'USD') // "-$5.00"
 * ```
 */
export function formatCents(
  amount: Cents,
  currency: Currency,
  options?: Intl.NumberFormatOptions
): string {
  const { decimals, locale } = CURRENCY_INFO[currency];
  const value = decimals > 0 ? amount / Math.pow(10, decimals) : amount;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...options,
  }).format(value);
}

/**
 * Format cents with explicit sign (+ for positive, - for negative).
 * Useful for showing changes or deltas.
 *
 * @example
 * ```typescript
 * formatCentsWithSign(cents(500), 'CAD')  // "+$5.00"
 * formatCentsWithSign(cents(-300), 'CAD') // "-$3.00"
 * ```
 */
export function formatCentsWithSign(amount: Cents, currency: Currency): string {
  const formatted = formatCents(Math.abs(amount) as Cents, currency);
  if (amount === 0) return formatted;
  return amount > 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Format cents as compact number (e.g., $1.2K, $1.5M).
 * Useful for dashboards and summaries.
 *
 * @example
 * ```typescript
 * formatCentsCompact(cents(125000), 'CAD')   // "$1.3K"
 * formatCentsCompact(cents(1500000), 'USD')  // "$15K"
 * ```
 */
export function formatCentsCompact(amount: Cents, currency: Currency): string {
  const { decimals, locale } = CURRENCY_INFO[currency];
  const value = decimals > 0 ? amount / Math.pow(10, decimals) : amount;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format cents as accounting notation (parentheses for negative).
 * Standard for financial statements.
 *
 * @example
 * ```typescript
 * formatCentsAccounting(cents(-500), 'CAD') // "($5.00)"
 * formatCentsAccounting(cents(500), 'CAD')  // "$5.00"
 * ```
 */
export function formatCentsAccounting(
  amount: Cents,
  currency: Currency
): string {
  if (amount >= 0) {
    return formatCents(amount, currency);
  }
  const formatted = formatCents(Math.abs(amount) as Cents, currency);
  return `(${formatted})`;
}

/**
 * Format cents without currency symbol.
 * Useful when currency is shown elsewhere.
 *
 * @example
 * ```typescript
 * formatCentsPlain(cents(1050), 'CAD') // "10.50"
 * ```
 */
export function formatCentsPlain(amount: Cents, currency: Currency): string {
  const { decimals, locale } = CURRENCY_INFO[currency];
  const value = decimals > 0 ? amount / Math.pow(10, decimals) : amount;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Parse a currency string back to cents.
 * Handles common formats but may not cover all edge cases.
 *
 * @example
 * ```typescript
 * parseCents("$10.50", 'CAD') // cents(1050)
 * parseCents("1,234.56", 'USD') // cents(123456)
 * ```
 */
export function parseCents(value: string, currency: Currency): Cents | null {
  const { decimals } = CURRENCY_INFO[currency];

  // Remove currency symbols, spaces, and thousand separators
  const cleaned = value.replace(/[^\d.-]/g, '');

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;

  const multiplier = Math.pow(10, decimals);
  return Math.round(parsed * multiplier) as Cents;
}
