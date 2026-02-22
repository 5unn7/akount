# Frontend Conventions

---
paths:

- "apps/web/**"
- "packages/ui/**"

---

## Server vs Client Components

**Default to Server Components** — only add `'use client'` when necessary:

**Use Server Components for:**

- Data fetching
- Static content
- SEO metadata
- Initial page render

**Use Client Components for:**

- Event handlers (`onClick`, `onChange`)
- React hooks (`useState`, `useEffect`, `useRef`)
- Browser APIs (`window`, `localStorage`)
- Interactive UI (forms, modals, dropdowns)

```typescript
// ✅ Server Component (default)
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent data={data} />
}

// ✅ Client Component (explicit)
'use client'
export function InteractiveForm() {
  const [value, setValue] = useState('')
  return <input value={value} onChange={e => setValue(e.target.value)} />
}
```

## Design System Stack

**Base:** shadcn/ui components (headless, accessible)
**Overlay:** shadcn-glass-ui@2.11.2 (glass morphism variants)
**Styling:** Tailwind v4.1.18 (CSS config, NO tailwind.config.ts)
**Tokens:** `packages/design-tokens/`

**Glass UI Components Available:**

- ButtonGlass (5 variants)
- InputGlass (3 variants)
- GlassCard (3 variants)
- BadgeGlass (6 variants)
- TabsGlass, ModalGlass, SwitchGlass, TooltipGlass, SeparatorGlass

**Button Radius:** 8px (design system standard)

## Tailwind v4 CSS Config

Tailwind v4 uses CSS variables, NOT JavaScript config:

- Theme tokens: `apps/web/src/app/globals.css`
- Custom utilities: CSS `@utility` blocks
- ❌ DO NOT create `tailwind.config.ts`

## Color & Theme System

**NEVER hardcode hex values.** Use Tailwind utility classes from `globals.css`. Full mapping in `.claude/rules/design-aesthetic.md`.

**shadcn tokens:** `bg-primary`, `text-foreground`, `bg-destructive`, `text-muted-foreground`, `bg-accent`, `border-border`

**Akount tokens (defined in globals.css):**
- Finance: `text-finance-income`, `text-finance-expense`, `text-finance-transfer`
- Colors: `text-ak-green`, `text-ak-red`, `text-ak-blue`, `text-ak-purple`, `text-ak-teal` (+ `bg-*-dim` variants)
- Primary: `bg-ak-pri-dim`, `text-ak-pri-text`, `hover:bg-ak-pri-hover`
- Glass: `glass`, `glass-2`, `glass-3` (utility classes — include bg + border)
- Borders: `border-ak-border`, `border-ak-border-2`, `border-ak-border-3`

Dark mode: Automatic — tokens switch values between `:root` and `.dark`.

## Component File Structure

```
apps/web/src/app/(dashboard)/<domain>/<resource>/
├── page.tsx              # Server Component (data fetch)
├── loading.tsx           # Loading skeleton (REQUIRED)
├── error.tsx             # Error boundary (REQUIRED)
├── <resource>-list.tsx   # Client Component (interactive)
└── <resource>-form.tsx   # Client Component (form)
```

## Domain Layout Pattern (REQUIRED)

Each domain under `(dashboard)/` uses a `layout.tsx` with `DomainTabs` for sub-page navigation. **Tabs are derived from `navigation.ts` — the single source of truth.**

**NEVER define tab arrays inline in layout files.** Use `getDomainTabs()` from `@/lib/navigation`.

```typescript
// ✅ CORRECT — derive tabs from navigation.ts
import { DomainTabs } from '@/components/shared/DomainTabs';
import { getDomainTabs } from '@/lib/navigation';

export default function BankingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <DomainTabs tabs={getDomainTabs('banking')} />
            {children}
        </div>
    );
}
```

```typescript
// ❌ WRONG — inline tab definition (duplicates navigation.ts)
const bankingTabs = [
    { label: 'Accounts', href: '/banking/accounts' },
    { label: 'Transactions', href: '/banking/transactions' },
];
```

**How it works:**
- `getDomainTabs(domainId)` reads from `navigationDomains` in `navigation.ts`
- Automatically filters out sub-pages (e.g., `/accounting/reports/balance-sheet`)
- Only top-level domain pages appear as tabs
- Tab order matches sidebar navigation order

**When adding a new domain layout:**
1. Add navigation items to `navigationDomains` in `src/lib/navigation.ts`
2. Create `(dashboard)/<domain>/layout.tsx` using the pattern above
3. That's it — tabs are derived automatically

## Loading and Error States (REQUIRED)

Every `page.tsx` MUST have sibling `loading.tsx` and `error.tsx` files. No exceptions for dashboard pages.

**Why:** Without loading.tsx, users see a blank screen during data fetches. Without error.tsx, errors crash the entire layout instead of showing a recoverable message.

**loading.tsx template:**

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**error.tsx template:**

```typescript
'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{error.message}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
          )}
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Reference implementations:** `banking/accounts/loading.tsx`, `banking/accounts/error.tsx`

## Minimal UI Changes First (REQUIRED for Visual Work)

When modifying UI — layout, styles, components — follow this progression:

1. **Smallest change first** — Change ONE thing (e.g., a single CSS class, one component prop)
2. **Verify it works** — Check the dev server or describe the expected visual result
3. **Then expand** — Only after the first change is confirmed correct, make the next change
4. **Never batch visual changes** — Don't change layout + colors + typography + spacing in one edit

**Why:** Broad UI changes cause 3-4 revision rounds. Incremental changes are faster to debug and cheaper to undo.

### Anti-Patterns

- Making 5+ visual changes in a single edit
- Changing component structure AND styling simultaneously
- Guessing at spacing/sizing values instead of checking existing patterns
- Rewriting an entire component when only the styles need updating

### Good Pattern

```
Step 1: Fix the padding -> verify
Step 2: Update the color token -> verify
Step 3: Adjust the font size -> verify
```

Each step is independently verifiable and reversible.

## API Client Pattern

Use `apps/web/src/lib/api/client.ts` for API calls:

```typescript
import { apiClient } from '@/lib/api/client'

const invoices = await apiClient<Invoice[]>({
  method: 'GET',
  path: '/invoices',
  params: { entityId }
})
```

Auth tokens automatically included via Clerk.

### Verify Function Signatures Before Calling

When calling API client functions from `@/lib/api/*`, ALWAYS check the TypeScript signature. Don't assume parameter shape:

```typescript
// ❌ WRONG — passing object when function expects string
const balances = await getAccountBalances({ entityId })

// ✅ CORRECT — read the function definition first
const balances = await getAccountBalances(entityId)
```

**Also guard against `undefined`:** If a value might be `undefined` (like `entityId` from search params), add an early return before calling:

```typescript
if (!entityId) return <EmptyState message="Select an entity" />
const data = await fetchData(entityId) // now guaranteed string
```

## Shared Utilities (REQUIRED - NO Inline Duplication)

**NEVER create inline helper functions for common operations.** Search for existing utilities first.

### Canonical Utility Locations

| Utility | Location | Import Path |
|---------|----------|-------------|
| `formatCurrency` | `apps/web/src/lib/utils/currency.ts` | `@/lib/utils/currency` |
| `formatCompactNumber` | `apps/web/src/lib/utils/currency.ts` | `@/lib/utils/currency` |
| Date formatting | `apps/web/src/lib/utils/date.ts` | `@/lib/utils/date` (TODO: create) |
| Validation helpers | `apps/api/src/lib/validators/` | Server-side only |

**Before creating ANY helper function:**

1. ✅ **Search existing utilities** — `Grep "functionName" apps/web/src/lib/`
2. ✅ **Check if pattern exists** — `Grep "similar logic" apps/`
3. ✅ **Import, don't duplicate** — If found, import from canonical location

### ❌ Anti-Pattern: Inline Utility Duplication

```typescript
// ❌ WRONG - Creating inline formatCurrency
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ✅ CORRECT - Import from canonical location
import { formatCurrency } from '@/lib/utils/currency';
```

**Why this matters:**
- **Locale drift** — Inline implementations use different locales (`en-US` vs `en-CA`)
- **Inconsistent formatting** — Some show decimals, others don't
- **Maintenance debt** — Bug fixes require updating 10+ files instead of 1

### Exception: Context-Specific Formatting

Inline helpers are ONLY acceptable when:
- The formatting is **unique to that component's UX** (e.g., no decimals in summary view)
- The logic is **too specific** to be reusable (e.g., custom date split for calendar UI)
- You add a comment explaining WHY it's not using the shared utility

```typescript
// ✅ ACCEPTABLE - Unique UX requirement
// Note: Summary view uses no decimals for cleaner display (different from standard formatCurrency)
const formatCurrencyValue = (cents: number) => {
  if (cents === 0) return '—';
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
};
```

## Single Responsibility Principle (SRP)

**Every component/file should have ONE clear purpose.**

### ✅ Good Examples (Current Pattern)

```typescript
// accounts.ts - ONE responsibility: API client functions
export function listAccounts() { }
export function getAccount() { }
export function createAccount() { }

// account-list.tsx - ONE responsibility: Display account list
'use client'
export function AccountList({ accounts }) {
  return <Table>{accounts.map(...)}</Table>
}

// account-form.tsx - ONE responsibility: Account form logic
'use client'
export function AccountForm() {
  const [data, setData] = useState({})
  return <form>...</form>
}
```

### ❌ Anti-Patterns to Avoid

```typescript
// ❌ BAD: Component doing data fetch + display + form logic
'use client'
export function AccountPage() {
  const [accounts, setAccounts] = useState([])
  const [formData, setFormData] = useState({})

  useEffect(() => { fetch(...) }, [])  // Fetching
  return (
    <div>
      <Table>{accounts}</Table>         {/* Display */}
      <Form>{formData}</Form>           {/* Form */}
    </div>
  )
}

// ✅ BETTER: Split into focused components
// page.tsx (Server Component)
export default async function Page() {
  const accounts = await getAccounts()
  return <AccountList accounts={accounts} />
}

// account-list.tsx (Client Component)
'use client'
export function AccountList({ accounts }) { }
```

### File Size Guidelines

- **Components**: Keep under ~200 lines
- **API clients**: Keep under ~300 lines
- **Split when**: File has multiple distinct sections or concerns

**Rule of thumb**: If you're scrolling a lot, consider splitting.
