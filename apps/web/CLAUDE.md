# Web Context (apps/web)

> **Loaded automatically** when Claude accesses files in `apps/web/`
> **Last verified:** 2026-02-09

## Next.js 16 App Router

**Directory structure:**

```
src/app/
├── (dashboard)/      # Authenticated pages
│   ├── layout.tsx    # Shell with sidebar
│   ├── overview/     # Dashboard home
│   ├── banking/      # Account management (accounts/)
│   ├── invoicing/    # Invoice pages (planned)
│   ├── clients/      # Client pages (planned)
│   └── ...
├── (auth)/           # Login, signup
└── (marketing)/      # Public pages
```

**Page structure pattern:**

```
(dashboard)/<domain>/<resource>/
├── page.tsx           # Server Component (data fetch)
├── loading.tsx        # Loading skeleton
├── error.tsx          # Error boundary
├── <resource>-list-client.tsx   # Client Component
└── <resource>-form-sheet.tsx    # Client Component (form in Sheet)
```

## Server vs Client Components

**Default: Server Components** (no `'use client'`)

**Server Components:**

- Data fetching with `async`/`await`
- SEO metadata exports
- Initial page render
- Static content

**Client Components** (`'use client'` directive):

- Event handlers (`onClick`, `onChange`, `onSubmit`)
- React hooks (`useState`, `useEffect`, `useRef`)
- Browser APIs (`window`, `localStorage`, `document`)
- Forms, modals, interactive UI

**Example:**

```typescript
// page.tsx (Server Component)
export default async function AccountsPage() {
  const accounts = await getAccounts()
  return <AccountsListClient accounts={accounts} />
}

// accounts-list-client.tsx (Client Component)
'use client'
export function AccountsListClient({ accounts }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  return <div onClick={() => setSelected(id)}>...</div>
}
```

## Design System

### Tech Stack

- **Base:** shadcn/ui (headless, accessible)
- **Overlay:** shadcn-glass-ui@2.11.2 (glass morphism)
- **Styling:** Tailwind v4.1.18 (CSS config)
- **Tokens:** `packages/design-tokens/`

### Glass UI Components

- `ButtonGlass` (5 variants: default, secondary, destructive, outline, ghost)
- `InputGlass` (3 variants: default, error, success)
- `GlassCard` (3 variants: default, bordered, elevated)
- `BadgeGlass` (6 variants: default, secondary, outline, destructive, success, warning)
- `TabsGlass`, `ModalGlass`, `SwitchGlass`, `TooltipGlass`, `SeparatorGlass`

### Tailwind v4 CSS Config

Tailwind v4 uses **CSS variables**, NOT `tailwind.config.ts`:

- Theme tokens: `src/app/globals.css`
- Custom utilities: CSS `@utility` blocks
- ❌ DO NOT create `tailwind.config.ts`

**Example CSS config:**

```css
@theme {
  --radius-lg: 8px;
  --color-primary: 222.2 47.4% 11.2%;
}
```

### Color System

Use semantic tokens:

- `bg-primary`, `text-primary`
- `bg-secondary`, `text-secondary`
- `bg-accent`, `text-accent`
- `bg-destructive`, `text-destructive`
- `bg-muted`, `text-muted`

Dark mode: Automatic via CSS variables (`:root` and `.dark` selectors).

### Design Tokens

Color palette: `packages/design-tokens/src/colors.ts`
Typography: `packages/design-tokens/src/typography.ts`
Spacing: `packages/design-tokens/src/spacing.ts`

### Button Radius

Standard: **8px** (per Figma design system)

## Layout

**Shell:** `(dashboard)/layout.tsx`

- Sidebar navigation with domain sections
- User menu (top right)
- Glassmorphism cards
- Dark mode support

**Sidebar domains:**

1. Overview
2. Banking (accounts)
3. Invoicing (planned)
4. Clients (planned)
5. Vendors (planned)
6. Accounting (planned)
7. Planning (planned)
8. AI Advisor (planned)
9. Services (planned)
10. System (settings)

## API Client

Use `src/lib/api/client.ts` for API calls:

```typescript
import { apiClient } from '@/lib/api/client'

const invoices = await apiClient<Invoice[]>({
  method: 'GET',
  path: '/banking/accounts',
  params: { entityId }
})
```

Auth tokens automatically included via Clerk's `auth()` helper.

## Server Actions

Use for mutations from Client Components:

```typescript
// actions/accounts.ts
'use server'
export async function createAccount(data: FormData) {
  // ... validation ...
  await apiClient({ method: 'POST', path: '/banking/accounts', body })
  revalidatePath('/banking/accounts')
}

// component
'use client'
import { createAccount } from '@/actions/accounts'
<form action={createAccount}>...</form>
```

## Component Library

Located in `packages/ui/src/components/`:

- `primitives/` — Base components (Button, Input, Card)
- `composed/` — Composite (DataTable, Form)
- `layout/` — Layout (Header, Sidebar, Shell)
- `feedback/` — Feedback (Toast, Alert, Modal)
- `domain/` — Domain-specific (InvoiceCard, AccountCard)

Import from `@akount/ui`:

```typescript
import { Button, Input, Card } from '@akount/ui'
```

## Metadata & SEO

Export metadata from pages:

```typescript
export const metadata: Metadata = {
  title: 'Accounts | Akount',
  description: 'Manage your bank accounts'
}
```

## Loading & Error States

**Loading:** `loading.tsx` in same folder as `page.tsx`
**Error:** `error.tsx` with reset button

Both are Client Components by default.
