# API Context (apps/api)

> **Loaded automatically** when Claude accesses files in `apps/api/`
> **Last verified:** 2026-02-25

**Conventions:** See `.claude/rules/api-conventions.md` (middleware chain, service pattern, error responses, SRP).
**Financial rules:** See `.claude/rules/financial-rules.md` (integer cents, tenant isolation, soft delete).
**Test conventions:** See `.claude/rules/test-conventions.md` (financial invariant assertions).

---

## Domain Structure

**8 Registered API Routes** (in `src/index.ts`):
- `/api/overview` → `domains/overview/`
- `/api/banking` → `domains/banking/`
- `/api/business` → `domains/business/` + `domains/invoicing/` + `domains/clients/` + `domains/vendors/`
- `/api/accounting` → `domains/accounting/`
- `/api/planning` → `domains/planning/`
- `/api/ai` → `domains/ai/`
- `/api/services` → `domains/services/`
- `/api/system` → `domains/system/`

**File Structure** (11 folders for modularity):

| Domain Folder | Route Prefix | Status | File Count |
|---------------|--------------|--------|------------|
| `domains/overview/` | `/api/overview` | Built (dashboard, net-worth, cash-flow, P&L, trial balance, top clients) | 5 files |
| `domains/banking/` | `/api/banking` | Built (accounts, transactions, imports, reconciliation, categories, transfers, connections) | 26 files |
| `domains/business/` | `/api/business` | Built (unified route handler for invoices/bills/payments/clients/vendors) | 2 files |
| `domains/invoicing/` | `/api/business/invoices` | Built (CRUD, send, void, GL posting, payments) | 10 files |
| `domains/clients/` | `/api/business/clients` | Built (CRUD, search, stats) | 3 files |
| `domains/vendors/` | `/api/business/vendors` | Built (CRUD, search, stats) | 4 files |
| `domains/accounting/` | `/api/accounting` | Built (COA, journal entries, posting, reports, tax rates, fixed assets) | 31 files |
| `domains/planning/` | `/api/planning` | Partial (goals built; budgets, forecasts stub) | 2 files |
| `domains/ai/` | `/api/ai` | Partial (chat, categorization built; insights, rules stub) | 6 files |
| `domains/services/` | `/api/services` | Stub (planned) | 2 files |
| `domains/system/` | `/api/system` | Built (entities, onboarding, audit-log, users, settings) | 12 files |

---

## Built Endpoints

### Overview

- `GET /api/overview/dashboard` — KPIs, net worth, cash position, accounts
- `GET /api/overview/net-worth` — Detailed net worth breakdown
- `GET /api/overview/cash-flow` — Cash flow summary

### Banking — Accounts

- `GET /api/banking/accounts` — List with cursor pagination, filtering
- `GET /api/banking/accounts/:id` — Single account details
- `POST /api/banking/accounts` — Create new account
- `PATCH /api/banking/accounts/:id` — Update account
- `DELETE /api/banking/accounts/:id` — Soft delete
- `GET /api/banking/accounts/:id/transactions` — Account transactions with running balance

### Banking — Transactions

- `GET /api/banking/transactions` — List with date/category/account filters
- `GET /api/banking/transactions/:id` — Single transaction
- `POST /api/banking/transactions` — Create manual transaction
- `PATCH /api/banking/transactions/:id` — Update transaction
- `PATCH /api/banking/transactions/bulk/categorize` — Bulk categorize
- `POST /api/banking/transactions/bulk/delete` — Bulk soft-delete (OWNER/ADMIN)
- `DELETE /api/banking/transactions/:id` — Soft delete

### Banking — Imports

- `POST /api/banking/imports/csv` — CSV upload & import
- `POST /api/banking/imports/xlsx` — Excel upload & import
- `POST /api/banking/imports/pdf` — PDF statement upload & import
- `GET /api/banking/imports` — List import batches with pagination
- `GET /api/banking/imports/:id` — Single import batch details

### Banking — Reconciliation

- `GET /api/banking/reconciliation/:bankFeedTransactionId/suggestions` — Match suggestions
- `POST /api/banking/reconciliation/matches` — Create match
- `DELETE /api/banking/reconciliation/matches/:matchId` — Unmatch
- `GET /api/banking/reconciliation/status/:accountId` — Reconciliation status

### Business — Invoices, Bills, Clients, Vendors, Payments

- `GET /api/business/invoices` — List invoices with filters & pagination
- `GET /api/business/invoices/:id` — Single invoice details
- `POST /api/business/invoices` — Create invoice (DRAFT)
- `PATCH /api/business/invoices/:id` — Update invoice
- `DELETE /api/business/invoices/:id` — Soft delete
- `POST /api/business/invoices/:id/send` — Send invoice to client
- `GET /api/business/bills` — List bills with filters & pagination
- `GET /api/business/bills/:id` — Single bill details
- `POST /api/business/bills` — Create bill (DRAFT)
- `PATCH /api/business/bills/:id` — Update bill
- `DELETE /api/business/bills/:id` — Soft delete
- `GET /api/business/clients` — List clients with pagination
- `GET /api/business/clients/:id` — Single client details
- `POST /api/business/clients` — Create client
- `PATCH /api/business/clients/:id` — Update client
- `DELETE /api/business/clients/:id` — Soft delete
- `GET /api/business/vendors` — List vendors with pagination
- `GET /api/business/vendors/:id` — Single vendor details
- `POST /api/business/vendors` — Create vendor
- `PATCH /api/business/vendors/:id` — Update vendor
- `DELETE /api/business/vendors/:id` — Soft delete
- `GET /api/business/payments` — List payments with filters
- `POST /api/business/payments` — Create payment with allocations
- `GET /api/business/payments/:id` — Single payment details

### Accounting — Chart of Accounts

- `GET /api/accounting/chart-of-accounts` — List GL accounts with filters
- `GET /api/accounting/chart-of-accounts/:id` — Single GL account
- `POST /api/accounting/chart-of-accounts` — Create GL account
- `PATCH /api/accounting/chart-of-accounts/:id` — Update GL account
- `DELETE /api/accounting/chart-of-accounts/:id` — Deactivate (soft)
- `GET /api/accounting/chart-of-accounts/balances` — Account balances summary
- `POST /api/accounting/chart-of-accounts/seed` — Seed default COA for entity

### Accounting — Journal Entries

- `GET /api/accounting/journal-entries` — List with filters & cursor pagination
- `GET /api/accounting/journal-entries/:id` — Full entry with lines
- `POST /api/accounting/journal-entries` — Create manual entry (DRAFT)
- `POST /api/accounting/journal-entries/:id/approve` — DRAFT → POSTED
- `POST /api/accounting/journal-entries/:id/void` — Void (creates reversal)
- `DELETE /api/accounting/journal-entries/:id` — Soft delete DRAFT only
- `POST /api/accounting/journal-entries/post-transaction` — Post bank txn to GL
- `POST /api/accounting/journal-entries/post-transactions` — Bulk post
- `POST /api/accounting/journal-entries/post-split-transaction` — Post split txn

### System

- `GET /api/system/entities` — List tenant entities
- `GET /api/system/entities/:id` — Single entity
- `POST /api/system/entities` — Create entity (ADMIN only)
- `GET /api/system/users` — List tenant users
- `GET /api/system/settings` — Get tenant settings
- `GET /api/system/audit-log` — Query audit logs with filters
- `POST /api/system/onboarding/start` — Start wizard (auth only)
- `POST /api/system/onboarding/complete` — Complete wizard
- `GET /api/system/onboarding/progress` — Onboarding progress

### AI (Partial)

- `POST /api/ai/chat` — General AI chat
- `POST /api/ai/categorize` — AI transaction categorization
- `GET /api/ai/insights` — 501 stub
- `GET /api/ai/recommendations` — 501 stub

### Planning (Partial)

- `POST /api/planning/goals` — Create goal
- Other endpoints: 501 stubs (budgets, reports, forecasts)

---

## Services

| Domain | Service | Purpose |
|--------|---------|---------|
| Banking | `account.service.ts` | Account CRUD, balance calculations |
| Banking | `transaction.service.ts` | Transaction CRUD, bulk operations |
| Banking | `import.service.ts` | CSV/XLSX/PDF import pipeline |
| Banking | `parser.service.ts` | Multi-format statement parsing |
| Banking | `reconciliation.service.ts` | Bank feed matching |
| Banking | `duplication.service.ts` | Duplicate transaction detection |
| Banking | `account-matcher.service.ts` | Account matching logic |
| Accounting | `gl-account.service.ts` | Chart of accounts CRUD |
| Accounting | `journal-entry.service.ts` | Journal entry lifecycle |
| Accounting | `posting.service.ts` | Transaction → GL posting |
| Accounting | `coa-template.ts` | Default COA templates |
| Overview | `dashboard.service.ts` | Dashboard metrics aggregation |
| System | `entity.service.ts` | Entity management |
| AI | `ai.service.ts` | AI chat integration |
| AI | `categorization.service.ts` | ML-powered categorization |

---

## Test Coverage (2,169 tests passing)

**Total:** 2,169 tests across all domains (all passing as of 2026-02-26)

**Coverage by Domain:**
- **Banking:** Largest test suite (accounts, transactions, imports, reconciliation, categories, connections)
- **Accounting:** Comprehensive (GL accounts, journal entries, posting, reports, fiscal periods)
- **Business:** Full coverage (invoices, bills, payments, clients, vendors)
- **System:** Complete (entities, onboarding, audit-log, users, settings)
- **Overview:** Dashboard metrics and aggregations
- **Planning:** Goals service
- **AI:** Categorization and chat
- **Shared:** FX rates, utilities

**Test Distribution:** Every service has corresponding test file in `__tests__/` subdirectory. Financial invariant assertions enforced (integer cents, soft delete, tenant isolation, double-entry).

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app.ts` | Fastify instance, plugin registration |
| `src/middleware/auth.ts` | Clerk JWT verification |
| `src/middleware/tenant.ts` | Tenant membership → `request.tenant` |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/domains/<domain>/routes.ts` | Top-level route registration |
| `src/domains/<domain>/routes/*.ts` | Sub-route files |
| `src/test-utils/` | Test helpers, financial assertions |
