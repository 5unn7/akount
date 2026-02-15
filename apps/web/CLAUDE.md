# Web Context (apps/web)

> **Loaded automatically** when Claude accesses files in `apps/web/`
> **Last verified:** 2026-02-14

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

## Built Pages (38 pages)

### Overview (3 pages)
- `/overview` — Dashboard home
- `/overview/cash-flow` — Cash flow analysis
- `/overview/net-worth` — Net worth breakdown

### Banking (7 pages)
- `/banking/accounts` — Account list
- `/banking/accounts/[id]` — Account detail with transactions
- `/banking/transactions` — All transactions
- `/banking/import` — Import upload form
- `/banking/imports` — Import history/batches
- `/banking/reconciliation` — Bank feed matching
- `/banking/transfers` — Transfer management

### Accounting (5 pages)
- `/accounting/chart-of-accounts` — GL accounts
- `/accounting/journal-entries` — Journal entry list
- `/accounting/journal-entries/new` — Create journal entry
- `/accounting/fiscal-periods` — Period management
- `/accounting/tax-rates` — Tax rate configuration
- `/accounting/assets` — Asset tracking

### Business (5 pages)
- `/business/invoices` — Invoice management
- `/business/bills` — Bill management
- `/business/clients` — Client directory
- `/business/vendors` — Vendor directory
- `/business/payments` — Payment tracking

### Planning (4 pages)
- `/planning/budgets` — Budget management
- `/planning/goals` — Financial goals
- `/planning/forecasts` — Forecasting
- `/planning/reports` — Financial reports

### AI Advisor (3 pages)
- `/ai-advisor/insights` — AI-generated insights
- `/ai-advisor/history` — Chat history
- `/ai-advisor/policy-alerts` — Policy alerts

### Services (3 pages)
- `/services/accountant` — Accountant portal
- `/services/bookkeeping` — Bookkeeping services
- `/services/documents` — Document management

### System (7 pages)
- `/system/settings` — Tenant settings
- `/system/entities` — Entity management
- `/system/users` — User management
- `/system/audit-log` — Audit trail
- `/system/integrations` — Integration setup
- `/system/rules` — Automation rules
- `/system/security` — Security settings

---

## Sidebar Navigation

| Section | Pages | Status |
|---------|-------|--------|
| Overview | Dashboard, Cash Flow, Net Worth | Built |
| Banking | Accounts, Transactions, Import, Reconciliation, Transfers | Built |
| Accounting | Chart of Accounts, Journal Entries, Fiscal Periods, Tax Rates | Built |
| Business | Invoices, Bills, Clients, Vendors, Payments | Pages exist (stub/planned) |
| Planning | Budgets, Goals, Forecasts, Reports | Pages exist (stub/planned) |
| AI Advisor | Insights, History, Policy Alerts | Pages exist (stub/planned) |
| Services | Accountant, Bookkeeping, Documents | Pages exist (stub/planned) |
| System | Settings, Entities, Users, Audit Log, Integrations, Rules, Security | Built |

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
