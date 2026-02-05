# Phase 1: Foundation Setup

**Days:** 3-4
**Status:** ✅ COMPLETE (2026-02-04)
**Dependencies:** Phase 0 must be complete ✅
**Can Parallel With:** None (foundation for all other phases)

---

## Objectives

1. Create packages/design-tokens/ package
2. Add financial types to packages/types/
3. Add RBAC types to packages/types/
4. Update root configuration files

---

## Tasks

### 1.1 Create packages/design-tokens/

**Purpose:** Extract design-system tokens into consumable package

- [ ] Create package directory:
  ```bash
  mkdir -p packages/design-tokens/src
  ```

- [ ] Create `packages/design-tokens/package.json`:
  ```json
  {
    "name": "@akount/design-tokens",
    "version": "0.1.0",
    "private": true,
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "exports": {
      ".": "./src/index.ts",
      "./css": "./src/css-variables.css",
      "./tailwind": "./src/tailwind-preset.ts"
    },
    "scripts": {
      "lint": "eslint src/",
      "typecheck": "tsc --noEmit"
    },
    "devDependencies": {
      "typescript": "^5.0.0"
    }
  }
  ```

- [ ] Create `packages/design-tokens/tsconfig.json`:
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "include": ["src/**/*"]
  }
  ```

- [ ] Copy token files from design-system:
  ```bash
  cp docs/design-system/00-foundations/tokens/akount.tokens.json packages/design-tokens/src/tokens.json
  cp docs/design-system/00-foundations/tokens/css-variables.css packages/design-tokens/src/css-variables.css
  ```

- [ ] Create `packages/design-tokens/src/index.ts`:
  ```typescript
  export { default as tokens } from './tokens.json';
  ```

- [ ] Create `packages/design-tokens/src/tailwind-preset.ts`:
  ```typescript
  import type { Config } from 'tailwindcss';
  import tokens from './tokens.json';

  export const akountPreset: Partial<Config> = {
    theme: {
      extend: {
        colors: {
          // Map from tokens.json to Tailwind colors
          primary: {
            DEFAULT: 'hsl(var(--ak-primary))',
            foreground: 'hsl(var(--ak-primary-foreground))',
          },
          secondary: {
            DEFAULT: 'hsl(var(--ak-secondary))',
            foreground: 'hsl(var(--ak-secondary-foreground))',
          },
          // Financial semantic colors
          finance: {
            income: 'hsl(var(--ak-finance-income))',
            expense: 'hsl(var(--ak-finance-expense))',
            neutral: 'hsl(var(--ak-finance-neutral))',
          },
          // AI colors
          ai: {
            DEFAULT: 'hsl(var(--ak-ai))',
            accent: 'hsl(var(--ak-ai-accent))',
          },
        },
        fontFamily: {
          heading: ['Newsreader', 'serif'],
          body: ['Manrope', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
        borderRadius: {
          DEFAULT: 'var(--ak-radius)',
          sm: 'var(--ak-radius-sm)',
          lg: 'var(--ak-radius-lg)',
        },
      },
    },
  };

  export default akountPreset;
  ```

- [ ] Create `packages/design-tokens/README.md`:
  ```markdown
  # @akount/design-tokens

  Design tokens extracted from the Akount Design System.

  ## Usage

  ### CSS Variables
  ```css
  @import '@akount/design-tokens/css';
  ```

  ### Tailwind Preset
  ```typescript
  // tailwind.config.ts
  import { akountPreset } from '@akount/design-tokens/tailwind';

  export default {
    presets: [akountPreset],
    // ...
  };
  ```

  ## Token Categories
  - Colors (primary, secondary, semantic)
  - Typography (font families, sizes)
  - Spacing (based on 4px grid)
  - Border radius
  - Shadows
  ```

**Verification:**
```bash
pnpm --filter @akount/design-tokens typecheck
```

---

### 1.2 Add Financial Types to packages/types/

**Purpose:** Type-safe money handling with branded Cents type

- [ ] Create financial types directory:
  ```bash
  mkdir -p packages/types/src/financial
  ```

- [ ] Create `packages/types/src/financial/money.ts`:
  ```typescript
  /**
   * Branded type for money amounts in cents.
   * Prevents accidental mixing of cents with other numbers.
   */
  declare const CentsBrand: unique symbol;
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
  ```

- [ ] Create `packages/types/src/financial/currency.ts`:
  ```typescript
  /**
   * Supported currencies in Akount.
   * Based on design-system multi-currency requirements.
   */
  export const CURRENCIES = [
    'CAD', 'USD', 'EUR', 'GBP', 'INR', 'AUD', 'JPY', 'CHF'
  ] as const;

  export type Currency = typeof CURRENCIES[number];

  /**
   * Currency metadata for display and formatting.
   */
  export const CURRENCY_INFO: Record<Currency, {
    symbol: string;
    name: string;
    decimals: number;
    flag: string;
  }> = {
    CAD: { symbol: '$', name: 'Canadian Dollar', decimals: 2, flag: '🇨🇦' },
    USD: { symbol: '$', name: 'US Dollar', decimals: 2, flag: '🇺🇸' },
    EUR: { symbol: '€', name: 'Euro', decimals: 2, flag: '🇪🇺' },
    GBP: { symbol: '£', name: 'British Pound', decimals: 2, flag: '🇬🇧' },
    INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2, flag: '🇮🇳' },
    AUD: { symbol: '$', name: 'Australian Dollar', decimals: 2, flag: '🇦🇺' },
    JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0, flag: '🇯🇵' },
    CHF: { symbol: 'Fr', name: 'Swiss Franc', decimals: 2, flag: '🇨🇭' },
  };
  ```

- [ ] Create `packages/types/src/financial/format.ts`:
  ```typescript
  import type { Cents } from './money';
  import type { Currency } from './currency';
  import { CURRENCY_INFO } from './currency';

  /**
   * Format cents as a currency string.
   */
  export function formatCents(
    amount: Cents,
    currency: Currency,
    options?: Intl.NumberFormatOptions
  ): string {
    const { decimals } = CURRENCY_INFO[currency];
    const value = decimals > 0 ? amount / Math.pow(10, decimals) : amount;

    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...options,
    }).format(value);
  }

  /**
   * Format cents with sign (+ for positive, - for negative).
   */
  export function formatCentsWithSign(amount: Cents, currency: Currency): string {
    const formatted = formatCents(Math.abs(amount) as Cents, currency);
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  /**
   * Format cents as compact number (e.g., $1.2K, $1.5M).
   */
  export function formatCentsCompact(amount: Cents, currency: Currency): string {
    const { decimals } = CURRENCY_INFO[currency];
    const value = decimals > 0 ? amount / Math.pow(10, decimals) : amount;

    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  ```

- [ ] Create `packages/types/src/financial/index.ts`:
  ```typescript
  export * from './money';
  export * from './currency';
  export * from './format';
  ```

- [ ] Update `packages/types/src/index.ts` to export financial types:
  ```typescript
  export * from './financial';
  // ... existing exports
  ```

**Verification:**
```bash
pnpm --filter @akount/types typecheck
```

---

### 1.3 Add RBAC Types to packages/types/

**Purpose:** Type-safe roles and permissions from design-system matrix

- [ ] Create RBAC types directory:
  ```bash
  mkdir -p packages/types/src/rbac
  ```

- [ ] Create `packages/types/src/rbac/roles.ts`:
  ```typescript
  /**
   * The 6 canonical roles from design-system.
   * See: docs/design-system/05-governance/permissions-matrix.md
   */
  export const ROLES = [
    'OWNER',
    'ADMIN',
    'ACCOUNTANT',
    'BOOKKEEPER',
    'INVESTOR',
    'ADVISOR'
  ] as const;

  export type Role = typeof ROLES[number];

  /**
   * Role metadata for display.
   */
  export const ROLE_INFO: Record<Role, {
    label: string;
    description: string;
    canInvite: boolean;
  }> = {
    OWNER: {
      label: 'Owner',
      description: 'Full access to all features and settings',
      canInvite: true,
    },
    ADMIN: {
      label: 'Administrator',
      description: 'Full access except ownership transfer',
      canInvite: true,
    },
    ACCOUNTANT: {
      label: 'Accountant',
      description: 'Full accounting access, can approve entries',
      canInvite: false,
    },
    BOOKKEEPER: {
      label: 'Bookkeeper',
      description: 'Day-to-day transaction entry',
      canInvite: false,
    },
    INVESTOR: {
      label: 'Investor',
      description: 'View-only access to reports',
      canInvite: false,
    },
    ADVISOR: {
      label: 'Advisor',
      description: 'View-only access with consultation notes',
      canInvite: false,
    },
  };
  ```

- [ ] Create `packages/types/src/rbac/permissions.ts`:
  ```typescript
  import type { Role } from './roles';

  /**
   * Permission levels from design-system.
   * See: docs/design-system/05-governance/permissions-matrix.md
   */
  export const PERMISSION_LEVELS = [
    'HIDDEN',   // Cannot see
    'VIEW',     // Read-only
    'ACT',      // Create/update
    'APPROVE',  // Approve/lock
    'ADMIN',    // Configure
  ] as const;

  export type PermissionLevel = typeof PERMISSION_LEVELS[number];

  /**
   * Permission level hierarchy (for comparison).
   */
  export const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
    HIDDEN: 0,
    VIEW: 1,
    ACT: 2,
    APPROVE: 3,
    ADMIN: 4,
  };

  /**
   * Check if user level meets required level.
   */
  export function hasPermission(
    userLevel: PermissionLevel,
    requiredLevel: PermissionLevel
  ): boolean {
    return PERMISSION_HIERARCHY[userLevel] >= PERMISSION_HIERARCHY[requiredLevel];
  }

  /**
   * Domain:Resource permission key.
   */
  export type PermissionKey = `${string}:${string}`;

  /**
   * Permission matrix mapping from design-system.
   * TODO: Complete matrix from docs/design-system/05-governance/permissions-matrix.md
   */
  export const PERMISSION_MATRIX: Record<PermissionKey, Record<Role, PermissionLevel>> = {
    // Overview Domain
    'overview:dashboard': {
      OWNER: 'VIEW', ADMIN: 'VIEW', ACCOUNTANT: 'VIEW',
      BOOKKEEPER: 'VIEW', INVESTOR: 'VIEW', ADVISOR: 'VIEW'
    },
    'overview:net-worth': {
      OWNER: 'VIEW', ADMIN: 'VIEW', ACCOUNTANT: 'VIEW',
      BOOKKEEPER: 'HIDDEN', INVESTOR: 'VIEW', ADVISOR: 'VIEW'
    },

    // Money Movement Domain
    'banking:accounts': {
      OWNER: 'ADMIN', ADMIN: 'ADMIN', ACCOUNTANT: 'VIEW',
      BOOKKEEPER: 'VIEW', INVESTOR: 'HIDDEN', ADVISOR: 'VIEW'
    },
    'banking:transactions': {
      OWNER: 'ACT', ADMIN: 'ACT', ACCOUNTANT: 'VIEW',
      BOOKKEEPER: 'ACT', INVESTOR: 'HIDDEN', ADVISOR: 'VIEW'
    },
    'banking:reconciliation': {
      OWNER: 'APPROVE', ADMIN: 'APPROVE', ACCOUNTANT: 'APPROVE',
      BOOKKEEPER: 'VIEW', INVESTOR: 'HIDDEN', ADVISOR: 'VIEW'
    },

    // Accounting Domain
    'accounting:journal-entries': {
      OWNER: 'APPROVE', ADMIN: 'APPROVE', ACCOUNTANT: 'APPROVE',
      BOOKKEEPER: 'HIDDEN', INVESTOR: 'HIDDEN', ADVISOR: 'VIEW'
    },
    'accounting:chart-of-accounts': {
      OWNER: 'ADMIN', ADMIN: 'ADMIN', ACCOUNTANT: 'ACT',
      BOOKKEEPER: 'HIDDEN', INVESTOR: 'HIDDEN', ADVISOR: 'VIEW'
    },

    // System Domain
    'system:users': {
      OWNER: 'ADMIN', ADMIN: 'ADMIN', ACCOUNTANT: 'HIDDEN',
      BOOKKEEPER: 'HIDDEN', INVESTOR: 'HIDDEN', ADVISOR: 'HIDDEN'
    },
    'system:audit-log': {
      OWNER: 'VIEW', ADMIN: 'VIEW', ACCOUNTANT: 'VIEW',
      BOOKKEEPER: 'HIDDEN', INVESTOR: 'HIDDEN', ADVISOR: 'HIDDEN'
    },
    'system:security': {
      OWNER: 'ADMIN', ADMIN: 'ADMIN', ACCOUNTANT: 'HIDDEN',
      BOOKKEEPER: 'HIDDEN', INVESTOR: 'HIDDEN', ADVISOR: 'HIDDEN'
    },
  };

  /**
   * Get permission level for a role on a resource.
   */
  export function getPermission(
    key: PermissionKey,
    role: Role
  ): PermissionLevel {
    return PERMISSION_MATRIX[key]?.[role] ?? 'HIDDEN';
  }

  /**
   * Check if role can access resource at required level.
   */
  export function canAccess(
    key: PermissionKey,
    role: Role,
    requiredLevel: PermissionLevel
  ): boolean {
    const userLevel = getPermission(key, role);
    return hasPermission(userLevel, requiredLevel);
  }
  ```

- [ ] Create `packages/types/src/rbac/index.ts`:
  ```typescript
  export * from './roles';
  export * from './permissions';
  ```

- [ ] Update `packages/types/src/index.ts`:
  ```typescript
  export * from './financial';
  export * from './rbac';
  // ... existing exports
  ```

**Verification:**
```bash
pnpm --filter @akount/types typecheck
```

---

### 1.4 Update Root Configuration

- [ ] Update `apps/web/package.json` to add dependency:
  ```json
  {
    "dependencies": {
      "@akount/design-tokens": "workspace:*",
      "@akount/types": "workspace:*"
    }
  }
  ```

- [ ] Update `apps/web/tailwind.config.ts`:
  ```typescript
  import type { Config } from 'tailwindcss';
  import { akountPreset } from '@akount/design-tokens/tailwind';

  const config: Config = {
    presets: [akountPreset],
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',
      '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    ],
    // ... existing config
  };

  export default config;
  ```

- [ ] Update `turbo.json` to add build task:
  ```json
  {
    "pipeline": {
      "build:tokens": {
        "dependsOn": ["^build:tokens"],
        "outputs": ["dist/**"]
      }
    }
  }
  ```

- [ ] Run install to link packages:
  ```bash
  pnpm install
  ```

**Verification:**
```bash
pnpm build
pnpm typecheck
```

---

## Verification Checklist

Before marking Phase 1 complete:

- [ ] `packages/design-tokens/` exists with all files
- [ ] `packages/types/src/financial/` has money, currency, format modules
- [ ] `packages/types/src/rbac/` has roles, permissions modules
- [ ] All packages pass typecheck
- [ ] `apps/web/tailwind.config.ts` imports akountPreset
- [ ] `pnpm install` completes without errors
- [ ] `pnpm build` completes without errors

---

## Handoff to Phases 2 & 3

When complete, the following can begin in parallel:

**Phase 2 (UI Components):**
- Can use `@akount/design-tokens` for styling
- Can use `@akount/types` for Cents, Currency types

**Phase 3 (Security):**
- Can use `@akount/types/rbac` for Role, Permission types
- Permission matrix available for middleware

Update status in `docs/restructuring/README.md` to ✅ COMPLETE.
