# Phase 2: packages/ui/ Bootstrap

**Days:** 5-10
**Status:** ✅ COMPLETE (2026-02-05)
**Dependencies:** Phase 1 must be complete ✅
**Can Parallel With:** Phase 3 (Security Foundation)

---

## Objectives

1. Create packages/ui/ package structure
2. Implement priority financial components
3. Implement navigation patterns
4. Migrate existing components from apps/web/

---

## Tasks

### 2.1 Create Package Structure

- [ ] Create package directory:
  ```bash
  mkdir -p packages/ui/src/{primitives,data-display,feedback,financial,ai,patterns/{navigation,tables,forms}}
  ```

- [ ] Create `packages/ui/package.json`:
  ```json
  {
    "name": "@akount/ui",
    "version": "0.1.0",
    "private": true,
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "exports": {
      ".": "./src/index.ts",
      "./primitives": "./src/primitives/index.ts",
      "./data-display": "./src/data-display/index.ts",
      "./feedback": "./src/feedback/index.ts",
      "./financial": "./src/financial/index.ts",
      "./ai": "./src/ai/index.ts",
      "./patterns/navigation": "./src/patterns/navigation/index.ts",
      "./patterns/tables": "./src/patterns/tables/index.ts",
      "./patterns/forms": "./src/patterns/forms/index.ts"
    },
    "scripts": {
      "lint": "eslint src/",
      "typecheck": "tsc --noEmit",
      "test": "vitest"
    },
    "dependencies": {
      "@akount/design-tokens": "workspace:*",
      "@akount/types": "workspace:*",
      "react": "^18.0.0",
      "react-dom": "^18.0.0"
    },
    "devDependencies": {
      "@types/react": "^18.0.0",
      "typescript": "^5.0.0",
      "vitest": "^1.0.0"
    },
    "peerDependencies": {
      "react": "^18.0.0",
      "react-dom": "^18.0.0"
    }
  }
  ```

- [ ] Create `packages/ui/tsconfig.json`:
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "jsx": "react-jsx",
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "include": ["src/**/*"]
  }
  ```

- [ ] Create index files for each category:
  ```bash
  touch packages/ui/src/index.ts
  touch packages/ui/src/primitives/index.ts
  touch packages/ui/src/data-display/index.ts
  touch packages/ui/src/feedback/index.ts
  touch packages/ui/src/financial/index.ts
  touch packages/ui/src/ai/index.ts
  touch packages/ui/src/patterns/navigation/index.ts
  touch packages/ui/src/patterns/tables/index.ts
  touch packages/ui/src/patterns/forms/index.ts
  ```

---

### 2.2 Priority Financial Components

**Reference:** `docs/design-system/01-components/financial-components.md`

#### 2.2.1 MoneyAmount Component

- [ ] Create `packages/ui/src/financial/MoneyAmount.tsx`:
  ```typescript
  import { type Cents, type Currency, formatCents } from '@akount/types';
  import { cn } from '../utils';

  export interface MoneyAmountProps {
    amount: Cents;
    currency: Currency;
    /**
     * Show sign prefix (+/-).
     */
    showSign?: boolean;
    /**
     * Use compact notation (e.g., $1.2K).
     */
    compact?: boolean;
    /**
     * Apply semantic color based on sign.
     */
    colorize?: boolean;
    className?: string;
  }

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
        className={cn(
          'font-mono tabular-nums',
          colorClass,
          className
        )}
      >
        {displayValue}
      </span>
    );
  }
  ```

#### 2.2.2 MoneyInput Component

- [ ] Create `packages/ui/src/financial/MoneyInput.tsx`:
  ```typescript
  'use client';

  import { useState, useCallback } from 'react';
  import { type Cents, type Currency, cents, formatCents } from '@akount/types';
  import { cn } from '../utils';

  export interface MoneyInputProps {
    value: Cents | null;
    onChange: (value: Cents | null) => void;
    currency: Currency;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    className?: string;
  }

  export function MoneyInput({
    value,
    onChange,
    currency,
    placeholder = '0.00',
    disabled = false,
    error,
    className,
  }: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState(
      value !== null ? (value / 100).toFixed(2) : ''
    );

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/[^0-9.-]/g, '');
      setDisplayValue(input);

      if (input === '' || input === '-') {
        onChange(null);
        return;
      }

      const parsed = parseFloat(input);
      if (!isNaN(parsed)) {
        try {
          onChange(cents(Math.round(parsed * 100)));
        } catch {
          // Invalid cents value, don't update
        }
      }
    }, [onChange]);

    const handleBlur = useCallback(() => {
      if (value !== null) {
        setDisplayValue((value / 100).toFixed(2));
      }
    }, [value]);

    return (
      <div className={cn('relative', className)}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {CURRENCY_INFO[currency].symbol}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-md border bg-background px-3 py-2 pl-8 font-mono',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            error && 'border-destructive',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
  ```

#### 2.2.3 EntityBadge Component

- [ ] Create `packages/ui/src/financial/EntityBadge.tsx`:
  ```typescript
  import { type Currency, CURRENCY_INFO } from '@akount/types';
  import { cn } from '../utils';

  export interface EntityBadgeProps {
    name: string;
    countryCode: string;
    currency: Currency;
    type?: 'individual' | 'corporation' | 'partnership';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }

  const TYPE_LABELS = {
    individual: 'Individual',
    corporation: 'Corp',
    partnership: 'Partnership',
  };

  export function EntityBadge({
    name,
    countryCode,
    currency,
    type,
    size = 'md',
    className,
  }: EntityBadgeProps) {
    const { flag } = CURRENCY_INFO[currency];

    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-1.5',
    };

    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full bg-muted',
          sizeClasses[size],
          className
        )}
      >
        <span className="text-lg">{flag}</span>
        <span className="font-medium">{name}</span>
        {type && (
          <span className="text-muted-foreground">
            ({TYPE_LABELS[type]})
          </span>
        )}
      </div>
    );
  }
  ```

#### 2.2.4 Export Financial Components

- [ ] Update `packages/ui/src/financial/index.ts`:
  ```typescript
  export * from './MoneyAmount';
  export * from './MoneyInput';
  export * from './EntityBadge';
  // Add more as implemented:
  // export * from './AccountCard';
  // export * from './TransactionRow';
  // export * from './KPIIndicator';
  ```

---

### 2.3 Navigation Pattern Components

**Reference:** `docs/design-system/02-patterns/navigation.md`

#### 2.3.1 Sidebar Component

- [ ] Create `packages/ui/src/patterns/navigation/Sidebar.tsx`:
  ```typescript
  'use client';

  import { type Role, canAccess } from '@akount/types/rbac';
  import { cn } from '../../utils';

  interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    permissionKey?: string;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const NAV_SECTIONS: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/overview', icon: '📊', permissionKey: 'overview:dashboard' },
        { label: 'Net Worth', href: '/overview/net-worth', icon: '💰', permissionKey: 'overview:net-worth' },
        { label: 'Cash Flow', href: '/overview/cash-flow', icon: '📈' },
      ],
    },
    {
      title: 'Money Movement',
      items: [
        { label: 'Accounts', href: '/banking/accounts', icon: '🏦', permissionKey: 'banking:accounts' },
        { label: 'Transactions', href: '/banking/transactions', icon: '💳', permissionKey: 'banking:transactions' },
        { label: 'Reconciliation', href: '/banking/reconciliation', icon: '✓', permissionKey: 'banking:reconciliation' },
      ],
    },
    {
      title: 'Business',
      items: [
        { label: 'Clients', href: '/business/clients', icon: '👥' },
        { label: 'Vendors', href: '/business/vendors', icon: '🏪' },
        { label: 'Invoices', href: '/business/invoices', icon: '📄' },
        { label: 'Bills', href: '/business/bills', icon: '📋' },
      ],
    },
    {
      title: 'Accounting',
      items: [
        { label: 'Journal Entries', href: '/accounting/journal-entries', icon: '📒', permissionKey: 'accounting:journal-entries' },
        { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts', icon: '📑', permissionKey: 'accounting:chart-of-accounts' },
      ],
    },
    {
      title: 'Planning',
      items: [
        { label: 'Reports', href: '/planning/reports', icon: '📊' },
        { label: 'Budgets', href: '/planning/budgets', icon: '🎯' },
      ],
    },
    {
      title: 'AI Advisor',
      items: [
        { label: 'Insights', href: '/ai-advisor', icon: '🧠' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Entities', href: '/system/entities', icon: '🏢' },
        { label: 'Users', href: '/system/users', icon: '👤', permissionKey: 'system:users' },
        { label: 'Audit Log', href: '/system/audit-log', icon: '📜', permissionKey: 'system:audit-log' },
      ],
    },
  ];

  export interface SidebarProps {
    user: {
      role: Role;
    };
    currentPath?: string;
    className?: string;
  }

  export function Sidebar({ user, currentPath, className }: SidebarProps) {
    const filterItems = (items: NavItem[]) =>
      items.filter((item) => {
        if (!item.permissionKey) return true;
        return canAccess(item.permissionKey as any, user.role, 'VIEW');
      });

    return (
      <aside
        className={cn(
          'fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-60 border-r bg-background',
          'overflow-y-auto',
          className
        )}
      >
        <nav className="p-4 space-y-6">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = filterItems(section.items);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {visibleItems.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2 py-2 text-sm',
                          'hover:bg-muted transition-colors',
                          currentPath === item.href && 'bg-muted font-medium'
                        )}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    );
  }
  ```

#### 2.3.2 TopCommandBar Component

- [ ] Create `packages/ui/src/patterns/navigation/TopCommandBar.tsx`:
  ```typescript
  'use client';

  import { useState } from 'react';
  import { type Currency, CURRENCY_INFO } from '@akount/types';

  interface Entity {
    id: string;
    name: string;
    type: string;
    countryCode: string;
    currency: Currency;
  }

  export interface TopCommandBarProps {
    entities: Entity[];
    selectedEntityId?: string;
    onEntityChange?: (entityId: string) => void;
    user: {
      role: string;
    };
  }

  export function TopCommandBar({
    entities,
    selectedEntityId,
    onEntityChange,
    user,
  }: TopCommandBarProps) {
    const [isEntitySwitcherOpen, setEntitySwitcherOpen] = useState(false);

    const selectedEntity = entities.find((e) => e.id === selectedEntityId) || entities[0];

    return (
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background z-50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <span className="font-heading text-xl font-bold">Akount</span>
          </div>

          {/* Global Controls */}
          <div className="flex items-center gap-4">
            {/* Entity Switcher */}
            <div className="relative">
              <button
                onClick={() => setEntitySwitcherOpen(!isEntitySwitcherOpen)}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-muted"
              >
                <span>{CURRENCY_INFO[selectedEntity?.currency || 'CAD'].flag}</span>
                <span className="font-medium">{selectedEntity?.name || 'Select Entity'}</span>
                <span className="text-muted-foreground">▼</span>
              </button>

              {isEntitySwitcherOpen && (
                <div className="absolute top-full mt-1 right-0 w-64 rounded-md border bg-background shadow-lg">
                  {entities.map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => {
                        onEntityChange?.(entity.id);
                        setEntitySwitcherOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-muted"
                    >
                      <span>{CURRENCY_INFO[entity.currency].flag}</span>
                      <span>{entity.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Period Selector (placeholder) */}
            <button className="rounded-md px-3 py-1.5 hover:bg-muted">
              📅 2026
            </button>

            {/* Search */}
            <button className="rounded-md px-3 py-1.5 hover:bg-muted">
              🔍 Search
            </button>

            {/* AI Panel Toggle */}
            <button className="rounded-md px-3 py-1.5 hover:bg-muted text-ai">
              🧠 AI
            </button>

            {/* User Menu */}
            <button className="rounded-full w-8 h-8 bg-muted">
              👤
            </button>
          </div>
        </div>
      </header>
    );
  }
  ```

#### 2.3.3 Export Navigation Components

- [ ] Update `packages/ui/src/patterns/navigation/index.ts`:
  ```typescript
  export * from './Sidebar';
  export * from './TopCommandBar';
  // Add more as implemented:
  // export * from './EntitySwitcher';
  // export * from './PeriodSelector';
  ```

---

### 2.4 Utility Functions

- [ ] Create `packages/ui/src/utils.ts`:
  ```typescript
  import { type ClassValue, clsx } from 'clsx';
  import { twMerge } from 'tailwind-merge';

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

- [ ] Add dependencies to package.json:
  ```json
  {
    "dependencies": {
      "clsx": "^2.0.0",
      "tailwind-merge": "^2.0.0"
    }
  }
  ```

---

### 2.5 Main Export

- [ ] Create `packages/ui/src/index.ts`:
  ```typescript
  // Re-export all components
  export * from './primitives';
  export * from './data-display';
  export * from './feedback';
  export * from './financial';
  export * from './ai';
  export * from './patterns/navigation';
  export * from './patterns/tables';
  export * from './patterns/forms';

  // Re-export utilities
  export { cn } from './utils';
  ```

---

### 2.6 Create README

- [ ] Create `packages/ui/README.md`:
  ```markdown
  # @akount/ui

  Akount Design System components built according to the design-system specification.

  ## Installation

  ```bash
  pnpm add @akount/ui
  ```

  ## Usage

  ```tsx
  import { MoneyAmount, EntityBadge, Sidebar } from '@akount/ui';
  import { cents } from '@akount/types';

  // Display money
  <MoneyAmount amount={cents(1050)} currency="CAD" colorize />

  // Show entity context
  <EntityBadge name="Acme Inc" countryCode="CA" currency="CAD" />

  // Navigation
  <Sidebar user={{ role: 'OWNER' }} />
  ```

  ## Component Categories

  - **financial/** - Money display, inputs, entity badges
  - **patterns/navigation/** - Sidebar, TopCommandBar
  - **primitives/** - Buttons, inputs, badges (shadcn-based)
  - **data-display/** - Cards, tables, empty states
  - **feedback/** - Toasts, alerts, progress
  - **ai/** - Insight cards, suggestion chips

  ## Design System Reference

  All components follow specifications in:
  - `docs/design-system/01-components/`
  - `docs/design-system/02-patterns/`
  ```

---

## Verification Checklist

Before marking Phase 2 complete:

- [ ] `packages/ui/` package exists with proper structure
- [ ] `MoneyAmount` component implemented and working
- [ ] `MoneyInput` component implemented and working
- [ ] `EntityBadge` component implemented and working
- [ ] `Sidebar` component implemented with RBAC filtering
- [ ] `TopCommandBar` component implemented
- [ ] All components pass typecheck
- [ ] Components can be imported in apps/web/

**Test in apps/web:**
```bash
pnpm --filter @akount/web dev
# Import and render a MoneyAmount component
```

---

## Handoff

When complete:
- Phases 4 & 5 can use these components
- Update status in `docs/restructuring/README.md` to ✅ COMPLETE
