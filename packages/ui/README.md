# @akount/ui

Akount Design System components built according to the design-system specification.

## Installation

```bash
pnpm add @akount/ui
```

## Usage

### Full Import

```tsx
import {
  MoneyAmount,
  MoneyInput,
  EntityBadge,
  Sidebar,
  TopCommandBar,
  cn,
} from '@akount/ui';
import { cents } from '@akount/types';

// Display formatted money
<MoneyAmount amount={cents(1050)} currency="CAD" colorize />

// Input money values
<MoneyInput value={amount} onChange={setAmount} currency="USD" />

// Show entity context
<EntityBadge name="Acme Inc" countryCode="CA" currency="CAD" type="corporation" />

// Navigation with RBAC filtering
<Sidebar user={{ role: 'OWNER' }} currentPath="/dashboard" />
```

### Subpath Imports (Tree-Shaking)

For better bundle optimization, import from specific subpaths:

```tsx
import { MoneyAmount, MoneyInput, EntityBadge } from '@akount/ui/financial';
import { Sidebar, TopCommandBar } from '@akount/ui/patterns/navigation';
```

## Component Categories

### Financial (`@akount/ui/financial`)

Components for displaying and inputting monetary values.

| Component | Description |
|-----------|-------------|
| `MoneyAmount` | Display formatted currency with optional semantic coloring |
| `MoneyInput` | Input component that handles dollars-to-cents conversion |
| `EntityBadge` | Display entity with flag, name, and type |

### Navigation (`@akount/ui/patterns/navigation`)

Main navigation components with RBAC support.

| Component | Description |
|-----------|-------------|
| `Sidebar` | Main navigation sidebar with permission-based filtering |
| `TopCommandBar` | Top bar with entity switcher, period selector, search |

### Future Categories

These are defined but not yet implemented:

- **primitives/** - Buttons, inputs, badges (shadcn-based)
- **data-display/** - Cards, tables, empty states
- **feedback/** - Toasts, alerts, progress indicators
- **ai/** - Insight cards, suggestion chips
- **patterns/tables/** - Data grids, sortable tables
- **patterns/forms/** - Form layouts, field groups

## Utilities

### `cn(...inputs)`

Merge Tailwind CSS classes with conflict resolution.

```tsx
import { cn } from '@akount/ui';

// Automatic conflict resolution
cn('px-2 py-1', 'px-4') // => 'py-1 px-4'

// Conditional classes
cn('base-class', isActive && 'active-class')
```

## Design System Reference

All components follow specifications in:

- `docs/design-system/01-components/` - Component specifications
- `docs/design-system/02-patterns/` - Pattern guidelines
- `docs/design-system/00-foundations/` - Design tokens and colors

## Dependencies

This package requires:

- `@akount/design-tokens` - Design tokens and Tailwind preset
- `@akount/types` - Financial and RBAC types
- `react` (peer dependency)
- `react-dom` (peer dependency)

## Development

```bash
# Type check
pnpm --filter @akount/ui typecheck

# Lint
pnpm --filter @akount/ui lint

# Test
pnpm --filter @akount/ui test
```
