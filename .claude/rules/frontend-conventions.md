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
