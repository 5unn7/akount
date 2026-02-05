/**
 * Financial types and utilities for Akount.
 *
 * @example
 * ```typescript
 * import {
 *   cents,
 *   addCents,
 *   formatCents,
 *   type Cents,
 *   type Currency,
 * } from '@akount/types/financial';
 *
 * const price = cents(1050);
 * const tax = cents(84);
 * const total = addCents(price, tax);
 *
 * console.log(formatCents(total, 'CAD')); // "$11.34"
 * ```
 */

export * from './money';
export * from './currency';
export * from './format';
