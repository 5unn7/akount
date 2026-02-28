# Web Context (apps/web)

> **Loaded automatically** when Claude accesses files in `apps/web/`
> **Last verified:** 2026-02-28

**Conventions:** See `.claude/rules/frontend-conventions.md` (Server/Client components, design system, Tailwind v4, SRP, **shared utilities**).
**Design aesthetic:** See `.claude/rules/design-aesthetic.md` (Financial Clarity theme, glass morphism, colors).
**Shared utilities:** `@/lib/utils/currency` (formatCurrency), `@/lib/utils/date` (formatDate), status badges in `packages/ui`.

---

## App Router Structure

```
src/app/
├── (dashboard)/      # Authenticated pages (shell with sidebar)
├── (auth)/           # Login, signup (Clerk)
├── (marketing)/      # Public pages (landing page)
└── onboarding/       # Onboarding wizard
```

**Page pattern:** `(dashboard)/<domain>/<resource>/page.tsx` (Server Component) → Client Components for interactivity.

---

## Built Pages (59 dashboard pages across 8 domains)

### Overview (3 pages)
- `/overview` — Dashboard home (P&L widget, trial balance, top clients, KPIs)
- `/overview/cash-flow` — Cash flow analysis
- `/overview/net-worth` — Net worth breakdown

### Banking (9 pages)
- `/banking/accounts` — Account list
- `/banking/accounts/[id]` — Account detail with transactions
- `/banking/transactions` — All transactions
- `/banking/categories` — Category management
- `/banking/import` — Import upload form
- `/banking/imports` — Import history/batches
- `/banking/imports/[id]` — Import batch detail
- `/banking/reconciliation` — Bank feed matching
- `/banking/transfers` — Transfer management

### Business (12 pages)
- `/business` — Business hub
- `/business/invoices` — Invoice list
- `/business/invoices/[id]` — Invoice detail (with void, record payment, post to GL)
- `/business/bills` — Bill list
- `/business/bills/[id]` — Bill detail
- `/business/clients` — Client directory
- `/business/clients/[id]` — Client detail
- `/business/vendors` — Vendor directory
- `/business/vendors/[id]` — Vendor detail
- `/business/payments` — Payment tracking
- `/business/payments/[id]` — Payment detail

### Accounting (16 pages)
- `/accounting` — Accounting hub
- `/accounting/chart-of-accounts` — GL accounts
- `/accounting/journal-entries` — Journal entry list
- `/accounting/journal-entries/[id]` — Journal entry detail
- `/accounting/journal-entries/new` — Create journal entry
- `/accounting/reports` — Reports hub
- `/accounting/reports/balance-sheet` — Balance sheet
- `/accounting/reports/profit-loss` — P&L statement
- `/accounting/reports/trial-balance` — Trial balance
- `/accounting/reports/general-ledger` — General ledger
- `/accounting/reports/cash-flow` — Cash flow statement
- `/accounting/reports/revenue` — Revenue analysis
- `/accounting/reports/spending` — Spending analysis
- `/accounting/fiscal-periods` — Period management
- `/accounting/tax-rates` — Tax rate configuration
- `/accounting/assets` — Asset tracking

### Planning (4 pages)
- `/planning` — Planning hub
- `/planning/budgets` — Budget management
- `/planning/goals` — Financial goals
- `/planning/forecasts` — Forecasting

### Insights (5 pages)
- `/insights` — AI insights dashboard
- `/insights/policy-alerts` — Monthly close / policy alerts
- `/insights/history` — Chat history
- `/insights/actions` — AI action queue
- `/insights/rules` — Automation rules

### Services (3 pages)
- `/services/accountant` — Accountant portal
- `/services/bookkeeping` — Bookkeeping services
- `/services/documents` — Document management

### System (8 pages)
- `/system/entities` — Entity management
- `/system/entities/[id]` — Entity detail
- `/system/settings` — Tenant settings (includes AI consent)
- `/system/users` — User management
- `/system/audit-log` — Audit trail
- `/system/integrations` — Integration setup
- `/system/rules` — Automation rules
- `/system/security` — Security settings

---

## Sidebar Navigation (8 Domains)

**Navigation Definition:** `src/lib/navigation.ts` — defines 8 domains with role-based filtering
**Domain Tabs:** `getDomainTabs(domainId)` in `navigation.ts` — derives tabs from the same structure (single source of truth). **NEVER** define tab arrays inline in layout files. See `.claude/rules/frontend-conventions.md` § Domain Layout Pattern.

| Domain | Label | Items | Status |
|--------|-------|-------|--------|
| **overview** | Overview | Dashboard, Net Worth, Cash Flow | Built (3 pages) |
| **banking** | Banking | Accounts, Transactions, Reconciliation, Imports, Transfers | Built (9 pages) |
| **business** | Business | Clients, Vendors, Invoices, Bills, Payments (with detail pages) | Built (12 pages) |
| **accounting** | Accounting | Overview, Chart of Accounts, Journal Entries, Reports (×7), Assets, Tax Rates, Fiscal Periods | Built (16 pages) |
| **planning** | Planning | Budgets, Goals, Forecasts | Built (4 pages) |
| **insights** | Insights | Insights, Monthly Close, History, Actions, Rules | Built (5 pages) |
| **services** | Services | Accountant, Bookkeeping, Documents | Built (3 pages) |
| **system** | System | Entities, Integrations, Rules, Users, Audit Log, Security, Settings | Built (8 pages) |

**Total Pages:** 59 dashboard + 7 system (auth, onboarding, marketing) = 66 total

---

## Notable UI Components (Added Feb 25-28)

- **Natural Language Bookkeeping Input** — `NLBookkeepingBar` component for conversational transaction entry
- **Natural Language Search** — `NLSearchBar` component for semantic search
- **Bill/Invoice Scan Upload** — Upload UI with drag-drop + SSE progress tracking
- **AI Transparency Labels** — `AIBadge` component for EU AI Act compliance
- **AI Consent Settings** — AI Preferences card with 5 consent toggles
- **Job Progress Component** — `JobProgress` using `useJobStream` SSE hook

---

## Server Actions

Use for mutations from Client Components:

```typescript
// actions/accounts.ts
'use server'
export async function createAccount(data: FormData) {
  await apiClient({ method: 'POST', path: '/banking/accounts', body })
  revalidatePath('/banking/accounts')
}
```

---

## Component Library

Located in `packages/ui/src/components/`:

- `primitives/` — Base (Button, Input, Card)
- `composed/` — Composite (DataTable, Form)
- `layout/` — Layout (Header, Sidebar, Shell)
- `feedback/` — Feedback (Toast, Alert, Modal)
- `domain/` — Domain-specific (InvoiceCard, AccountCard)

Import: `import { Button, Input, Card } from '@akount/ui'`

App-specific components: `apps/web/src/components/<domain>/`

---

## Metadata & SEO

Export from pages:

```typescript
export const metadata: Metadata = {
  title: 'Accounts | Akount',
  description: 'Manage your bank accounts'
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/layout.tsx` | Shell with sidebar, user menu |
| `src/app/globals.css` | Tailwind v4 theme tokens, utilities |
| `src/lib/api/client.ts` | API client with Clerk auth (server-side) |
| `src/lib/api/client-browser.ts` | API client for client components (browser-side) |
| `src/lib/navigation.ts` | 8-domain navigation structure |
| `src/components/` | App-specific components by domain |
| `src/actions/` | Server actions for mutations |
