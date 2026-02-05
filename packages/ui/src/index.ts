/**
 * @akount/ui - Akount Design System Components
 *
 * This package provides React components built according to the
 * Akount design-system specification.
 *
 * @example
 * ```tsx
 * import {
 *   MoneyAmount,
 *   MoneyInput,
 *   EntityBadge,
 *   Sidebar,
 *   TopCommandBar,
 *   cn,
 * } from '@akount/ui';
 * ```
 *
 * Or import from subpaths for tree-shaking:
 * ```tsx
 * import { MoneyAmount } from '@akount/ui/financial';
 * import { Sidebar } from '@akount/ui/patterns/navigation';
 * ```
 *
 * @packageDocumentation
 */

// Re-export all component categories
export * from './financial';
export * from './patterns/navigation';

// Placeholder exports for future categories
// (These are empty but allow imports to work)
// export * from './primitives';
// export * from './data-display';
// export * from './feedback';
// export * from './ai';
// export * from './patterns/tables';
// export * from './patterns/forms';

// Re-export utility functions
export { cn } from './utils';
