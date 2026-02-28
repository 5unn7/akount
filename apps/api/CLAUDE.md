# API Context (apps/api)

> **Loaded automatically** when Claude accesses files in `apps/api/`
> **Last verified:** 2026-02-28

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
| `domains/invoicing/` | `/api/business/invoices` | Built (CRUD, send, void, GL posting, payments, scan) | 10 files |
| `domains/clients/` | `/api/business/clients` | Built (CRUD, search, stats) | 3 files |
| `domains/vendors/` | `/api/business/vendors` | Built (CRUD, search, stats, bill scan) | 4 files |
| `domains/accounting/` | `/api/accounting` | Built (COA, journal entries, posting, reports, tax rates, fixed assets, fiscal periods) | 31 files |
| `domains/planning/` | `/api/planning` | Built (budgets, forecasts, goals, variance, cash runway, seasonal patterns) | 18 files |
| `domains/ai/` | `/api/ai` | Built (chat, categorization, insights, rules, rule-suggestions, actions, monthly close, natural language, document scan, workers) | 52 files |
| `domains/services/` | `/api/services` | Built (data export, consent) | 6 files |
| `domains/system/` | `/api/system` | Built (entities, onboarding, audit-log, users, settings, consent) | 12 files |

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
- `POST /api/business/invoices/:id/void` — Void invoice (GL reversal)
- `POST /api/business/invoices/scan` — AI document scan (BullMQ async)
- `GET /api/business/bills` — List bills with filters & pagination
- `GET /api/business/bills/:id` — Single bill details
- `POST /api/business/bills` — Create bill (DRAFT)
- `PATCH /api/business/bills/:id` — Update bill
- `DELETE /api/business/bills/:id` — Soft delete
- `POST /api/business/bills/scan` — AI document scan (BullMQ async)
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

### Planning — Budgets

- `GET /api/planning/budgets` — List budgets with filters
- `GET /api/planning/budgets/:id` — Single budget
- `POST /api/planning/budgets` — Create budget
- `PATCH /api/planning/budgets/:id` — Update budget
- `DELETE /api/planning/budgets/:id` — Delete budget
- `POST /api/planning/budgets/:id/lock` — Lock budget period
- `GET /api/planning/budgets/:id/variance` — Budget vs actual variance
- `GET /api/planning/budgets/suggestions` — AI-powered budget suggestions
- `GET /api/planning/budgets/runway` — Cash runway projection

### Planning — Forecasts

- `GET /api/planning/forecasts` — List forecasts
- `GET /api/planning/forecasts/:id` — Single forecast
- `POST /api/planning/forecasts` — Create forecast
- `PATCH /api/planning/forecasts/:id` — Update forecast
- `GET /api/planning/forecasts/:id/projections` — Forecast projections
- `GET /api/planning/forecasts/seasonal` — Seasonal pattern analysis
- `GET /api/planning/forecasts/ai-predict` — AI-powered predictions
- `DELETE /api/planning/forecasts/:id` — Delete forecast

### Planning — Goals

- `GET /api/planning/goals` — List goals
- `GET /api/planning/goals/:id` — Single goal
- `POST /api/planning/goals` — Create goal
- `PATCH /api/planning/goals/:id` — Update goal
- `POST /api/planning/goals/:id/check-in` — Record progress
- `POST /api/planning/goals/:id/complete` — Complete goal
- `GET /api/planning/goals/templates` — Goal templates
- `DELETE /api/planning/goals/:id` — Delete goal

### AI — Chat & Categorization

- `POST /api/ai/chat` — General AI chat
- `POST /api/ai/categorize` — AI transaction categorization
- `POST /api/ai/extract-statement` — AI bank statement extraction
- `POST /api/ai/extract-bill` — AI bill data extraction
- `POST /api/ai/extract-invoice` — AI invoice data extraction
- `POST /api/ai/suggest-je` — AI journal entry suggestions

### AI — Insights & Monthly Close

- `GET /api/ai/insights` — List insights
- `GET /api/ai/insights/generate` — Generate new insights
- `POST /api/ai/insights/:id/dismiss` — Dismiss insight
- `GET /api/ai/monthly-close/status` — Monthly close checklist
- `POST /api/ai/monthly-close/run` — Execute monthly close
- `GET /api/ai/monthly-close/history` — Historical close runs

### AI — Rules & Rule Suggestions

- `GET /api/ai/rules` — List automation rules
- `GET /api/ai/rules/:id` — Single rule
- `POST /api/ai/rules` — Create rule
- `PATCH /api/ai/rules/:id` — Update rule
- `DELETE /api/ai/rules/:id` — Delete rule
- `POST /api/ai/rules/:id/execute` — Execute rule manually
- `GET /api/ai/rules/:id/history` — Rule execution history
- `GET /api/ai/rule-suggestions` — List AI-suggested rules
- `GET /api/ai/rule-suggestions/:id` — Single suggestion
- `POST /api/ai/rule-suggestions/:id/accept` — Accept suggestion → create rule
- `GET /api/ai/rule-suggestions/generate` — Generate new suggestions
- `POST /api/ai/rule-suggestions/:id/reject` — Reject suggestion
- `POST /api/ai/rule-suggestions/:id/defer` — Defer suggestion

### AI — Actions & Decision Log

- `GET /api/ai/actions` — List AI actions (pending, executed, etc.)
- `GET /api/ai/actions/:id` — Single action
- `GET /api/ai/actions/stats` — Action statistics
- `POST /api/ai/actions` — Create AI action
- `POST /api/ai/actions/:id/approve` — Approve action
- `POST /api/ai/actions/:id/reject` — Reject action
- `POST /api/ai/actions/:id/execute` — Execute approved action

### AI — Natural Language

- `POST /api/ai/natural-bookkeeping` — Natural language transaction entry
- `POST /api/ai/natural-search` — Natural language search

### AI — Jobs (Document Scan)

- `GET /api/ai/jobs/:jobId/stream` — SSE real-time job progress

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

### Services

- `GET /api/services/consent` — Get AI consent status
- `POST /api/services/consent` — Update AI consent
- `GET /api/services/export/data` — Export user data (GDPR)
- `GET /api/services/documents` — List documents
- `GET /api/services/documents/:id` — Single document
- `POST /api/services/documents` — Upload document

---

## Services (60 total)

| Domain | Service | Purpose |
|--------|---------|---------|
| **Banking** | `account.service.ts` | Account CRUD, balance calculations |
| | `transaction.service.ts` | Transaction CRUD, bulk operations |
| | `import.service.ts` | CSV/XLSX/PDF import pipeline |
| | `parser.service.ts` | Multi-format statement parsing |
| | `reconciliation.service.ts` | Bank feed matching |
| | `duplication.service.ts` | Duplicate transaction detection |
| | `account-matcher.service.ts` | Account matching logic |
| | `transfer.service.ts` | Inter-account transfers |
| | `category.service.ts` | Category management |
| | `flinks.service.ts` | Flinks banking integration |
| | `fx-rate.service.ts` | Foreign exchange rates |
| **Accounting** | `gl-account.service.ts` | Chart of accounts CRUD |
| | `journal-entry.service.ts` | Journal entry lifecycle |
| | `posting.service.ts` | Transaction → GL posting |
| | `document-posting.service.ts` | Invoice/Bill → GL posting |
| | `report.service.ts` | Financial report generation |
| | `report-export.service.ts` | Report PDF/CSV export |
| | `tax-rate.service.ts` | Tax rate CRUD |
| | `fiscal-period.service.ts` | Fiscal period management |
| | `asset.service.ts` | Fixed asset tracking & depreciation |
| | `coa-template.ts` | Default COA templates |
| **Invoicing** | `invoice.service.ts` | Invoice lifecycle (CRUD, send, void) |
| | `bill.service.ts` | Bill lifecycle |
| | `payment.service.ts` | Payment CRUD & allocation |
| | `pdf.service.ts` | PDF generation |
| **Clients** | `client.service.ts` | Client CRUD & search |
| **Vendors** | `vendor.service.ts` | Vendor CRUD & search |
| | `bill.service.ts` | Vendor bill operations |
| **Overview** | `dashboard.service.ts` | Dashboard metrics aggregation |
| | `performance.service.ts` | Performance metrics |
| **Planning** | `budget.service.ts` | Budget CRUD & locking |
| | `budget-variance.service.ts` | Budget vs actual analysis |
| | `budget-suggestions.service.ts` | AI budget suggestions |
| | `forecast.service.ts` | Forecast CRUD & projections |
| | `ai-forecast.service.ts` | AI-powered forecasting |
| | `goal.service.ts` | Goal CRUD |
| | `goal-tracking.service.ts` | Goal progress tracking |
| | `goal-templates.ts` | Goal template library |
| | `cash-runway.service.ts` | Cash runway projections |
| | `seasonal-patterns.service.ts` | Seasonal pattern detection |
| **AI** | `ai.service.ts` | AI chat integration |
| | `categorization.service.ts` | ML-powered categorization |
| | `document-extraction.service.ts` | Bill/invoice OCR extraction |
| | `insight.service.ts` | Insight CRUD |
| | `insight-generator.service.ts` | Auto insight generation (6 analyzers) |
| | `pattern-detection.service.ts` | Spending/revenue pattern detection |
| | `rule.service.ts` | Automation rule CRUD |
| | `rule-engine.service.ts` | Rule execution engine |
| | `rule-suggestion.service.ts` | AI rule suggestions |
| | `ai-action.service.ts` | AI action queue management |
| | `ai-decision-log.service.ts` | AI decision audit trail |
| | `action-executor.service.ts` | Action execution engine |
| | `je-suggestion.service.ts` | Journal entry suggestions |
| | `monthly-close.service.ts` | Monthly close checklist |
| | `natural-bookkeeping.service.ts` | Natural language bookkeeping |
| | `natural-search.service.ts` | Natural language search |
| **System** | `entity.service.ts` | Entity management |
| | `user.service.ts` | User management |
| | `health.service.ts` | Health check |
| | `audit-query.service.ts` | Audit log queries |
| | `ai-consent.service.ts` | AI consent management |
| | `data-export.service.ts` | GDPR data export |

---

## Middleware Chain

Requests flow through:

1. **Rate Limit** (`@fastify/rate-limit`) — 100 req/min per user/IP
2. **Security Headers** (`@fastify/helmet`) — CSP, HSTS, XSS, clickjacking
3. **CORS** (`@fastify/cors`) — Environment-based origin whitelist
4. **CSRF** (`middleware/csrf.ts`) — Token-based CSRF protection (POST/PUT/PATCH/DELETE)
5. **Auth** (`middleware/auth.ts`) — Clerk JWT verification → `request.userId`
6. **Tenant** (`middleware/tenant.ts`) — Load tenant → `request.tenant`
7. **Consent** (`middleware/consent-gate.ts`) — AI consent check for AI endpoints
8. **Validation** (Fastify Zod) — Request schema validation
9. **RBAC** (`middleware/rbac.ts`) — Role-based access control
10. **Route Handler** — Execute business logic

Additional middleware: `sanitize.ts` (input sanitization), `error-collector.ts` (runtime error tracking), `withPermission.ts` (granular permissions).

---

## Background Workers (BullMQ)

| Worker | Queue | Purpose |
|--------|-------|---------|
| `bill-scan.worker.ts` | `bill-scan` | Async bill document scanning (AP flow) |
| `invoice-scan.worker.ts` | `invoice-scan` | Async invoice document scanning (AR flow) |

Workers start on app boot, SSE progress via `GET /api/ai/jobs/:jobId/stream`.

---

## AI Provider Architecture

| Provider | File | Models |
|----------|------|--------|
| Claude | `providers/claude.provider.ts` | Anthropic Claude (primary) |
| Mistral | `providers/mistral.provider.ts` | Mistral (OCR, vision) |
| Perplexity | `providers/perplexity.provider.ts` | Perplexity (search) |

---

## Test Coverage (2,330 tests passing)

**Total:** 2,330 tests across 117 test files (21 failures in document extraction — new feature edge cases)

**Coverage by Domain:**
- **Banking:** Largest test suite (accounts, transactions, imports, reconciliation, categories, connections, transfers)
- **Accounting:** Comprehensive (GL accounts, journal entries, posting, reports, fiscal periods, tax rates, assets)
- **Business:** Full coverage (invoices, bills, payments, clients, vendors)
- **System:** Complete (entities, onboarding, audit-log, users, settings)
- **Planning:** Full (budgets, forecasts, goals, variance, cash runway)
- **AI:** Extensive (categorization, chat, rules, rule-suggestions, actions, insights, consent, monthly close)
- **Overview:** Dashboard metrics and aggregations
- **Shared:** FX rates, utilities, middleware (auth, tenant, CSRF, sanitize, rate-limit, RBAC)

**Test Distribution:** Every service has corresponding test file in `__tests__/` subdirectory. Financial invariant assertions enforced (integer cents, soft delete, tenant isolation, double-entry).

---

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Fastify instance, plugin registration, worker startup |
| `src/middleware/auth.ts` | Clerk JWT verification |
| `src/middleware/tenant.ts` | Tenant membership → `request.tenant` |
| `src/middleware/csrf.ts` | CSRF token protection |
| `src/middleware/consent-gate.ts` | AI consent enforcement |
| `src/middleware/rbac.ts` | Role-based access control |
| `src/lib/env.ts` | Environment configuration |
| `src/lib/file-scanner.ts` | File type validation + EXIF stripping |
| `src/lib/prompt-defense.ts` | Prompt injection defense |
| `src/lib/pii-redaction.ts` | PII redaction for AI calls |
| `src/lib/queue/queue-manager.ts` | BullMQ queue management |
| `src/lib/prisma-observer.ts` | Prisma query performance observer |
| `src/domains/<domain>/routes.ts` | Top-level route registration |
| `src/domains/<domain>/routes/*.ts` | Sub-route files |
| `src/test-utils/` | Test helpers, financial assertions |
