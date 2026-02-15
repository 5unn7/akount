'use client';

import { useState, useCallback, useId } from 'react';
import type { Cents, Currency } from '@akount/types';
import { CURRENCY_INFO } from '@akount/types';
import { cn } from '../utils';

export interface MoneyInputProps {
  /**
   * Current value in cents, or null if empty.
   */
  value: Cents | null;
  /**
   * Callback when value changes.
   */
  onChange: (value: Cents | null) => void;
  /**
   * Currency for symbol display.
   */
  currency: Currency;
  /**
   * Placeholder text when empty.
   */
  placeholder?: string;
  /**
   * Disable the input.
   */
  disabled?: boolean;
  /**
   * Error message to display.
   */
  error?: string;
  /**
   * Label for the input (accessibility).
   */
  label?: string;
  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * Input component for entering monetary values.
 * Handles conversion between display dollars and stored cents.
 *
 * @example
 * ```tsx
 * const [amount, setAmount] = useState<Cents | null>(null);
 *
 * <MoneyInput
 *   value={amount}
 *   onChange={setAmount}
 *   currency="CAD"
 *   label="Invoice Amount"
 * />
 * ```
 */
export function MoneyInput({
  value,
  onChange,
  currency,
  placeholder = '0.00',
  disabled = false,
  error,
  label,
  className,
}: MoneyInputProps) {
  const id = useId();
  const { symbol, decimals } = CURRENCY_INFO[currency];

  // Display value as dollars (for user input)
  const [displayValue, setDisplayValue] = useState(() =>
    value !== null ? (value / Math.pow(10, decimals)).toFixed(decimals) : ''
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow only numbers, decimal point, and minus sign
      const input = e.target.value.replace(/[^\d.-]/g, '');
      setDisplayValue(input);

      if (input === '' || input === '-') {
        onChange(null);
        return;
      }

      const parsed = parseFloat(input);
      if (!isNaN(parsed)) {
        // Convert to cents
        const multiplier = Math.pow(10, decimals);
        const cents = Math.round(parsed * multiplier);
        onChange(cents as Cents);
      }
    },
    [onChange, decimals]
  );

  const handleBlur = useCallback(() => {
    // Format on blur for consistent display
    if (value !== null) {
      const divisor = Math.pow(10, decimals);
      setDisplayValue((value / divisor).toFixed(decimals));
    } else {
      setDisplayValue('');
    }
  }, [value, decimals]);

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {symbol}
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'w-full rounded-md border bg-background px-3 py-2 pl-8 font-mono',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            error && 'border-destructive focus:ring-destructive',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          data-testid="money-input"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
