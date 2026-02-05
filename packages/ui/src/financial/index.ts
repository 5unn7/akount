/**
 * Financial UI components for Akount.
 *
 * These components handle money display and input with proper
 * formatting, currency support, and semantic coloring.
 *
 * @example
 * ```tsx
 * import { MoneyAmount, MoneyInput, EntityBadge } from '@akount/ui/financial';
 * import { cents } from '@akount/types';
 *
 * // Display formatted money
 * <MoneyAmount amount={cents(1050)} currency="CAD" colorize />
 *
 * // Input money values
 * <MoneyInput value={amount} onChange={setAmount} currency="USD" />
 *
 * // Show entity context
 * <EntityBadge name="Acme Inc" countryCode="CA" currency="CAD" />
 * ```
 */

export * from './MoneyAmount';
export * from './MoneyInput';
export * from './EntityBadge';

// Future financial components:
// export * from './AccountCard';
// export * from './TransactionRow';
// export * from './KPIIndicator';
// export * from './BalanceChange';
