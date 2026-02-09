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

Use semantic tokens from design system:
- `--primary`, `--secondary`, `--accent`
- `--background`, `--foreground`
- `--destructive`, `--muted`, `--border`

Dark mode: Automatic via CSS variables in `:root` and `.dark`.

## Component File Structure

```
apps/web/src/app/(dashboard)/<domain>/<resource>/
├── page.tsx              # Server Component (data fetch)
├── loading.tsx           # Loading skeleton
├── error.tsx             # Error boundary
├── <resource>-list.tsx   # Client Component (interactive)
└── <resource>-form.tsx   # Client Component (form)
```

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
