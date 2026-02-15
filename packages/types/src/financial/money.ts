/**
 * Type-safe money handling with branded Cents type.
 * Prevents accidental mixing of cents with other numbers.
 *
 * @example
 * ```typescript
 * const price = cents(1050); // $10.50
 * const tax = cents(84);     // $0.84
 * const total = addCents(price, tax); // $11.34 (1134 cents)
 * ```
 */

declare const CentsBrand: unique symbol;

/**
 * Branded type for money amounts in cents.
 * Prevents accidental mixing of cents with other numbers.
 */
export type Cents = number & { readonly [CentsBrand]: 'cents' };

/**
 * Create a Cents value from an integer.
 * Throws if not an integer.
 */
export function cents(value: number): Cents {
  if (!Number.isInteger(value)) {
    throw new Error(`Cents must be an integer, got: ${value}`);
  }
  return value as Cents;
}

/**
 * Zero cents constant for initialization.
 */
export const ZERO_CENTS = cents(0);

/**
 * Safely add two Cents values.
 */
export function addCents(a: Cents, b: Cents): Cents {
  return cents(a + b);
}

/**
 * Safely subtract Cents values.
 */
export function subtractCents(a: Cents, b: Cents): Cents {
  return cents(a - b);
}

/**
 * Multiply Cents by a factor (for quantity calculations).
 * Result is rounded to nearest integer.
 */
export function multiplyCents(amount: Cents, factor: number): Cents {
  return cents(Math.round(amount * factor));
}

/**
 * Divide Cents by a divisor.
 * Result is rounded to nearest integer.
 */
export function divideCents(amount: Cents, divisor: number): Cents {
  if (divisor === 0) {
    throw new Error('Cannot divide by zero');
  }
  return cents(Math.round(amount / divisor));
}

/**
 * Convert dollars to cents.
 */
export function dollarsToCents(dollars: number): Cents {
  return cents(Math.round(dollars * 100));
}

/**
 * Convert cents to dollars (for display only).
 */
export function centsToDollars(amount: Cents): number {
  return amount / 100;
}

/**
 * Get absolute value of Cents.
 */
export function absCents(amount: Cents): Cents {
  return cents(Math.abs(amount));
}

/**
 * Check if amount is negative.
 */
export function isNegative(amount: Cents): boolean {
  return amount < 0;
}

/**
 * Check if amount is positive.
 */
export function isPositive(amount: Cents): boolean {
  return amount > 0;
}

/**
 * Check if amount is zero.
 */
export function isZero(amount: Cents): boolean {
  return amount === 0;
}

/**
 * Sum an array of Cents values.
 */
export function sumCents(amounts: Cents[]): Cents {
  return cents(amounts.reduce((sum, amount) => sum + amount, 0));
}

/**
 * Negate a Cents value (flip sign).
 */
export function negateCents(amount: Cents): Cents {
  return cents(-amount);
}
