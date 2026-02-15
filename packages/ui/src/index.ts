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
 *   Button,
 *   Card,
 *   InsightCard,
 *   cn,
 * } from '@akount/ui';
 * ```
 *
 * Or import from subpaths for tree-shaking:
 * ```tsx
 * import { MoneyAmount } from '@akount/ui/financial';
 * import { Button, Input } from '@akount/ui/primitives';
 * import { Card, DataTable } from '@akount/ui/data-display';
 * import { InsightCard, AIPanel } from '@akount/ui/ai';
 * import { Toast, Modal } from '@akount/ui/feedback';
 * import { Sidebar } from '@akount/ui/patterns/navigation';
 * ```
 *
 * @packageDocumentation
 */

// Re-export all component categories
export * from './primitives';
export * from './financial';
export * from './data-display';
export * from './feedback';
export * from './ai';
export * from './patterns/navigation';

// Placeholder exports for future pattern categories
// export * from './patterns/tables';
// export * from './patterns/forms';

// Re-export utility functions
export { cn } from './utils';
