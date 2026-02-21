# Web Context (apps/web)

> **Loaded automatically** when Claude accesses files in `apps/web/`
> **Last verified:** 2026-02-21

**Conventions:** See `.claude/rules/frontend-conventions.md` (Server/Client components, design system, Tailwind v4, SRP).
**Design aesthetic:** See `.claude/rules/design-aesthetic.md` (Financial Clarity theme, glass morphism, colors).

---

## App Router Structure

```
src/app/
├── (dashboard)/      # Authenticated pages (shell with sidebar)
├── (auth)/           # Login, signup (Clerk)
├── (marketing)/      # Public pages
└── onboarding/       # Onboarding wizard
```

**Page pattern:** `(dashboard)/<domain>/<resource>/page.tsx` (Server Component) → Client Components for interactivity.

---

## Built Pages (50 pages across 8 domains)

### Overview (3 pages)
- `/overview` — Dashboard home
- `/overview/cash-flow` — Cash flow analysis
- `/overview/net-worth` — Net worth breakdown

### Banking (8 pages)
- `/banking/accounts` — Account list
- `/banking/accounts/[id]` — Account detail with transactions
- `/banking/transactions` — All transactions
- `/banking/import` — Import upload form
- `/banking/imports` — Import history/batches
- `/banking/imports/[id]` — Import batch detail
- `/banking/reconciliation` — Bank feed matching
- `/banking/transfers` — Transfer management

### Business (7 pages)
- `/business/invoices` — Invoice list
- `/business/invoices/[id]` — Invoice detail
- `/business/bills` — Bill list
- `/business/invoices/bills/[id]` — Bill detail (legacy route)
- `/business/clients` — Client directory
- `/business/vendors` — Vendor directory
- `/business/payments` — Payment tracking

### Accounting (15 pages)
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

### Planning (3 pages)
- `/planning/budgets` — Budget management
- `/planning/goals` — Financial goals
- `/planning/forecasts` — Forecasting

### Insights (3 pages)
- `/insights/insights` — AI-generated insights
- `/insights/history` — Chat history
- `/insights/policy-alerts` — Policy alerts

### Services (3 pages)
- `/services/accountant` — Accountant portal
- `/services/bookkeeping` — Bookkeeping services
- `/services/documents` — Document management

### System (8 pages)
- `/system/entities` — Entity management
- `/system/entities/[id]` — Entity detail
- `/system/settings` — Tenant settings
- `/system/users` — User management
- `/system/audit-log` — Audit trail
- `/system/integrations` — Integration setup
- `/system/rules` — Automation rules
- `/system/security` — Security settings

---

## Sidebar Navigation (8 Domains)

**Navigation Definition:** `src/lib/navigation.ts` — defines 8 domains with role-based filtering

| Domain | Label | Items | Status |
|--------|-------|-------|--------|
| **overview** | Overview | Dashboard, Net Worth, Cash Flow | ✅ Built (3 pages) |
| **banking** | Banking | Accounts, Transactions, Reconciliation, Imports, Transfers | ✅ Built (8 pages) |
| **business** | Business | Clients, Vendors, Invoices, Bills, Payments | ✅ Built (7 pages) |
| **accounting** | Accounting | Journal Entries, Chart of Accounts, Reports (×7), Assets, Tax Rates, Fiscal Periods | ✅ Built (15 pages) |
| **planning** | Planning | Budgets, Goals, Forecasts | ✅ Built (3 pages) |
| **insights** | Insights | Insights, Policy Alerts, History | ✅ Built (3 pages) |
| **services** | Services | Accountant, Bookkeeping, Documents | ✅ Built (3 pages) |
| **system** | System | Entities, Integrations, Rules, Users, Audit Log, Security, Settings | ✅ Built (8 pages) |

**Total Pages:** 50 (all domains built, some with stub content pending backend completion)

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
| `src/lib/api/client.ts` | API client with Clerk auth |
| `src/components/` | App-specific components by domain |
| `src/actions/` | Server actions for mutations |
