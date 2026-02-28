# Akount — Task Board

**Last Updated:** 2026-02-27
**Current Phase:** Phase 6 — Launch MVP

> **133 active tasks** · 🔴 5 critical · 🟠 17 high · 🟡 82 medium · ⚪ 29 low
> 📦 100 backlog · 🟢 25 ready · 🔒 7 blocked · 🟡 1 deferred
>
> _Completed tasks (287) archived in [TASKS-ARCHIVE.md](TASKS-ARCHIVE.md)_
> _43 Linear PM infrastructure tasks in [LINEAR-TASKS.md](LINEAR-TASKS.md)_

---

## Active Now

| Agent | Domain | Task | Started |
|-------|--------|------|---------|
| _(no active agents)_ | | | |

---

## Dev

### Critical / High

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| SEC-45 | Add consent gate middleware to bill/invoice scan routes | 15m | 🔴 Critical | 🟢 | SEC-33 | review:doc-intel-phase1 |
| SEC-46 | Fix cross-tenant IDOR in worker vendor/client lookups (use entityId not tenantId) | 10m | 🔴 Critical | 🟢 | DEV-238, DEV-239 | review:doc-intel-phase1 |
| PERF-27 | Add compound indexes for Client/Vendor name lookups (entityId, name, deletedAt) | 5m | 🔴 Critical | 🟢 | | review:doc-intel-phase1 |
| ARCH-14 | Fix worker initialization race condition (await ready events) | 10m | 🔴 Critical | 🟢 | | review:doc-intel-phase1 |
| SEC-47 | Add Zod validation for multipart entityId field in scan routes | 15m | 🟠 High | 🟢 | | review:doc-intel-phase1 |
| ARCH-15 | Change AIConsent CASCADE delete to Restrict (preserve audit trail) | 30m | 🟠 High | 🟢 | SEC-32 | review:doc-intel-phase1 |
| ARCH-16 | Extract Redis connection config to shared module (DRY) | 20m | 🟠 High | 🟢 | | review:doc-intel-phase1 |
| ARCH-17 | Migrate rate limiter to Redis-backed (multi-instance support) | 2-3h | 🟠 High | 🔒 | [needs: PERF-11] | review:doc-intel-phase1 |
| DRY-22 | Create domain error handler for business routes (eliminate duplication) | 20m | 🟠 High | 🟢 | | review:doc-intel-phase1 |
| UX-107 | Add success logging to scan routes (job enqueued successfully) | 5m | 🟠 High | 🟢 | | review:doc-intel-phase1 |
| UX-103 | Fix HeroSection SSR wrapper import (bypass dynamic ssr:false) | 5m | 🔴 Critical | 🟢 | | review:revie23feb |
| SEC-8 | Complete security audit (OWASP top 10, auth, tenant isolation, input validation) | 4h | 🟠 High | 🟡 deferred | | roadmap |
| INFRA-13 | Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import | 8-12h | 🟠 High | 📦 | | audit:fe-be-parity |


### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DRY-23 | Update job-progress.tsx callback types to allow async (onComplete/onError) | 5m | ⚪ Low | 🟢 | | review:doc-intel-phase1 |
| DRY-24 | Add JSDoc to useJobStream progress type check (explain defense) | 5m | ⚪ Low | 🟢 | | review:doc-intel-phase1 |
| UX-108 | Standardize error format across scan routes (always include message field) | 10m | 🟡 Medium | 🟢 | | review:doc-intel-phase1 |
| UX-109 | Add Retry-After header to 429 rate limit responses | 5m | ⚪ Low | 🟢 | | review:doc-intel-phase1 |
| UX-44 | Business: Add invoice/client list CSV/PDF export buttons | 2-3h | 🟡 Medium | 📦 | | audit:app-ux |
| DEV-83 | Business: Build credit notes feature (CreditNote Prisma model exists, zero API endpoints or UI) | 4-6h | 🟡 Medium | 📦 | | audit:app-ux |
| DEV-61 | Accounting JE: Add multi-currency support to JE form (backend supports, form is single-currency only) | 2-3h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-62 | Accounting JE: Add batch approve (select multiple drafts → approve all) | 2-3h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-63 | Accounting: Add recurring journal entry templates (monthly depreciation, rent, etc.) | 3-4h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-64 | Accounting: Add journal entry CSV import (bulk import from external accounting software) | 3-4h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-65 | Accounting: Add account reconciliation page (compare GL vs bank statement balances) | 4-6h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-66 | Accounting: Add aged receivables/payables report (AR/AP aging 30/60/90+ day buckets) | 3-4h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-67 | Accounting: Add audit trail view (who approved/voided/created entries, timestamps) | 2-3h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-68 | Accounting: Add GL account merge/reclassify (move journal lines between accounts) | 3-4h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-69 | Accounting Reports: Add year-over-year comparison mode (multi-year P&L and BS trends) | 2-3h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| ARCH-10 | Split report.service.ts into focused modules (7 report types → 7 services + coordinator) | 2-3d | 🟡 Medium | 📦 | | audit:2026-02-26 |
| FIN-33 | Add PostgreSQL double-entry balance trigger (defense-in-depth for SUM(debits) = SUM(credits)) | 2h | 🟡 Medium | 🟢 | | audit:2026-02-26 |
| SEC-10 | Row-Level Security (PostgreSQL) for production hardening | 3h | 🟡 Medium | 📦 | | roadmap |
| UX-6 | Keyboard shortcuts for power users (command palette, table nav) | 2h | 🟡 Medium | 📦 | | roadmap |
| UX-7 | Help overlay documenting keyboard shortcuts | 1h | 🟡 Medium | 🔒 | [needs: UX-6] | roadmap |
| PERF-10 | Distributed caching (Redis) for multi-instance deployment | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| PERF-12 | N+1 query monitoring / slow query detection in production (APM) | 2h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| FIN-7 | Fiscal period enforcement (prevent posting to locked periods) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| FIN-8 | Fiscal year close process (closing entries, revenue → retained earnings) | 4h | 🟡 Medium | 📦 | [needs: FIN-7] | review:smooth-floating-mountain |
| FIN-9 | Multi-currency revaluation on period close (FX gains/losses, IFRS/GAAP) | 4h | 🟡 Medium | 📦 | [needs: FIN-8] | review:smooth-floating-mountain |
| FIN-10 | Invoice/bill reconciliation workflows (AP/AR aging, match/approve) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| ARCH-5 | Error recovery patterns (idempotency keys, circuit breakers, retry with backoff) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| ARCH-1 | OpenAPI spec auto-generation from Zod schemas (fastify-zod-openapi) | 3h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| ARCH-4 | Background job processing setup (BullMQ for PDF gen, email, imports) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| TEST-4 | Integration tests (API → DB → API roundtrip for critical flows) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| DEV-18 | Overview: Balance Sheet Snapshot widget — asset:liability donut + equity trend | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| FIN-16 | Overview: Financial Health Ratios widget — current ratio, working capital, debt-to-equity | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-21 | Overview: Client Payment Health widget — % paid on time, avg days-to-payment, overdue count | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-22 | Overview: Invoice Aging Waterfall widget — AR buckets 0-30, 31-60, 61-90, 90+ days | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-23 | Overview: Revenue by Category widget — revenue sources breakdown | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-24 | Overview: Top Expense Vendors widget — top 5 by YTD spend + % of total | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-25 | Overview: Bill Aging Waterfall widget — AP buckets 0-30, 31-60, 61-90, 90+ days | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-26 | Overview: Vendor Payment Terms widget — on-time vs late payment performance | 2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-27 | Overview: Reconciliation Status widget — progress bar per account + unmatched count | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-28 | Overview: Import Health widget — last import date, success rate, failed imports | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-29 | Overview: Categorization Gap widget — % of transactions uncategorized by account | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-30 | Overview: Duplicate Detection Stats widget — duplicates detected this month | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-31 | Overview: Journal Entry Status widget — count by status, draft aging > 7d alert | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-32 | Overview: GL Posting Pipeline widget — pending bank feed txns waiting to post | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-33 | Overview: Ledger Spike Detection widget — accounts with unusual balance swings | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-37 | Overview: Cash Runway widget — days of cash remaining at burn rate | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-38 | Overview: Multi-Currency Exposure widget — portfolio breakdown by currency + FX risk % | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-39 | Overview: Entity KPI Comparison widget — side-by-side entity performance | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-47 | Banking: Add transaction full-text search on description/notes | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-48 | Banking: Add transaction split UI + endpoint (isSplit field exists, no implementation) | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-49 | Banking: Show multi-currency amounts — display original + base currency on transactions | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-50 | Banking: Add transaction export (CSV/PDF) for filtered transaction views | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-51 | Banking: Add account balance history chart — historical balance trend over time | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-52 | Banking: Add duplicate management UI — view detected duplicates, approve/dismiss | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-53 | Banking: Add transaction auto-categorization rules UI (Rule model exists in AI domain) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-54 | Banking: Add batch transaction edit — bulk update description/category/notes | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-55 | Banking: Recurring transaction detection — identify frequency patterns | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-56 | Banking: Add receipt/attachment upload per transaction | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-57 | Banking: Add CSV import column mapping UI (backend supports, frontend hardcoded) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-58 | Banking: Add import error detail view — show per-row errors when import partially fails | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-52 | Business: Add sort by columns on invoice/bill/client/vendor lists | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-85 | Business: Add bill PDF generation (invoice PDF exists, bills have no PDF) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-86 | Business: Add aging drill-down — click AR/AP aging bucket to see individual invoices/bills | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-87 | Business: Add duplicate invoice/bill detection — flag same vendor+amount+date | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-88 | Business: Add email reminder for overdue invoices | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-89 | Business: Add recurring invoice templates — auto-generate invoices on schedule | 4-6h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-55 | Business: Add visual status pipeline on invoice/bill list — Draft→Sent→Partial→Paid | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-90 | Business: Add top debtors/creditors summary widget | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-91 | Business: Add invoice/bill/client/vendor CSV export | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-100 | Planning: Add goal auto-tracking + milestone notifications | 3-4h | 🟡 Medium | 📦 | [needs: DEV-97] | audit:fe-be-parity |
| DEV-101 | Planning: Wire planning reports to existing accounting report endpoints | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-62 | Planning: Add budget period selector with visual spend-rate indicator | 1-2h | 🟡 Medium | 📦 | [needs: UX-59] | audit:fe-be-parity |
| UX-63 | Planning: Add budget vs actual drill-down — click category to see transactions | 2-3h | 🟡 Medium | 📦 | [needs: DEV-99] | audit:fe-be-parity |
| UX-64 | Planning: Add goal trajectory projection — "on pace" vs "behind" trend line | 2-3h | 🟡 Medium | 📦 | [needs: DEV-100] | audit:fe-be-parity |
| DEV-115 | Insights: Add route-level tests for `/api/ai/chat` and `/api/ai/categorize` | 1h | 🟡 Medium | 🟢 | | audit:ai-advisor |
| DEV-116 | Insights: Add RBAC tests for AI permission enforcement | 30m | 🟡 Medium | 🟢 | | audit:ai-advisor |
| DEV-117 | Insights: Wire AIBrief on dashboard to show real data | 1h | 🟡 Medium | 📦 | | audit:ai-advisor |
| DEV-118 | Insights: Implement `GET /api/ai/insights` endpoint (replace 501 stub) | 2-4h | 🟡 Medium | 📦 | | audit:ai-advisor |
| SEC-16 | File retention policies (auto-cleanup of old uploads) | 1h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| INFRA-11 | Database migration testing in CI pipeline | 2h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| DEV-70 | Accounting Reports: One-click export all statements as ZIP | 1-2h | ⚪ Low | 📦 | | audit:acct-fe-be |
| DRY-15 | Standardize table header styling — create `<TableHead variant="label">` | 30m | ⚪ Low | 🟢 | | inline-bandaid-audit |
| DRY-5 | `window.Clerk` triple-cast in downloadReport: clean up type assertion | 30m | ⚪ Low | 📦 | | review:typescript |
| DEV-40 | Overview: Onboarding Completion nudge widget — checklist of remaining steps | 1-2h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-41 | Overview: Tax Liability Estimate widget | 4-6h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-42 | Overview: Subscription MRR/ARR widget — recurring revenue detection | 4-6h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-15 | Overview: Add top expense categories widget | 1-2h | ⚪ Low | 🟢 | | audit:fe-be-parity |
| DEV-16 | Overview: Add unreconciled transaction count badge to dashboard | 1h | ⚪ Low | 🟢 | | audit:fe-be-parity |
| PERF-4 | PDF generation: move to worker thread (unblock event loop) | 2h | ⚪ Low | 📦 | | review:performance |
| PERF-11 | Distributed rate limiting (Redis-backed) for multi-instance | 2h | ⚪ Low | 📦 | | review:smooth-floating-mountain |
| FIN-6 | Cash Flow: document hardcoded account code ranges for categorization | doc | ⚪ Low | 📦 | | review:financial |
| FIN-11 | Consolidation/elimination accounting (multi-entity) | 8h | ⚪ Low | 📦 | | review:smooth-floating-mountain |
| FIN-12 | GAAP-compliant GL export format (XBRL/ixBRL regulatory reporting) | 6h | ⚪ Low | 📦 | | review:smooth-floating-mountain |
| SEC-15 | Duplicate file detection for uploads | 1h | ⚪ Low | 📦 | | review:smooth-floating-mountain |
| INFRA-12 | Usage analytics (companies, transactions, reports generated) | 2h | ⚪ Low | 📦 | | review:smooth-floating-mountain |
| DEV-93 | Business: Add payment receipt PDF generation | 2-3h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-94 | Business: Add batch invoice creation — generate multiple from template | 3-4h | ⚪ Low | 📦 | | audit:fe-be-parity |
| UX-57 | Business: Add notes/activity log per client and vendor | 2-3h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-106 | Planning: Add soft delete to Budget and Goal models (missing deletedAt) | 1h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-107 | Planning: Add AI-powered expense forecast | 4-6h | ⚪ Low | 📦 | [needs: DEV-104] | audit:fe-be-parity |
| DEV-108 | Planning: Add goal templates (emergency fund, revenue target, expense reduction) | 2-3h | ⚪ Low | 📦 | [needs: DEV-97] | audit:fe-be-parity |
| DEV-109 | Planning: Add budget rollover — carry unused budget forward to next period | 1-2h | ⚪ Low | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| DEV-110 | Planning: Add "What-if" scenario comparison — side-by-side forecast scenarios | 4-6h | ⚪ Low | 📦 | [needs: DEV-102] | audit:fe-be-parity |
| DEV-111 | Planning: Auto-suggest budgets from existing spending patterns | 2-3h | ⚪ Low | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| DEV-119 | Insights: Build Policy Alerts page with real data | 3-4h | ⚪ Low | 📦 | | audit:ai-advisor |
| DEV-120 | Insights: Build History page with AI interaction logging | 2-3h | ⚪ Low | 📦 | [needs: DEV-118] | audit:ai-advisor |

---

## Linked Plans

| Plan | Tasks | Status |
|------|-------|--------|
| [Banking Command Center](docs/plans/banking-command-center_tasks.md) | 28 tasks (4 sprints) | Sprint 1 in progress |
| [AI Auto-Bookkeeper Phase 1](docs/plans/2026-02-24-ai-auto-bookkeeper-phase1.md) | 16 tasks (4 sprints) | Ready (amended with review findings) |
| [AI Auto-Bookkeeper Phase 2](docs/plans/2026-02-24-ai-auto-bookkeeper-phase2.md) | 12 tasks (3 sprints) | Ready |
| [AI Auto-Bookkeeper Phase 3](docs/plans/2026-02-24-ai-auto-bookkeeper-phase3.md) | 14 tasks (4 sprints) | Ready |
| [Frontend Test Coverage](docs/plans/2026-02-25-frontend-test-coverage.md) | 14 tasks (5 sprints) | Ready |
| [Feedback Loops & Indexing V2](docs/plans/2026-02-27-feedback-loops-and-indexing-v2.md) | 17 tasks (4 sprints + quick wins) | Ready |

---

## Design System

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DS-1 | Figma-to-code token sync audit | 2h | 🟠 High | 🟢 | | audit:smooth-floating-mountain |
| DS-2 | Storybook setup for component documentation | 3h | 🟡 Medium | 📦 | | manual |

---

## Marketing & Content

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| MKT-1 | Landing page copy and design | 3h | 🟠 High | 📦 | | manual |
| MKT-2 | User documentation / getting started guide | 2h | 🟡 Medium | 📦 | | roadmap |
| CNT-1 | Competitive analysis update | 2h | 🟡 Medium | 📦 | | manual |

---

## Operations

### Critical / High

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| INFRA-1 | CI/CD pipeline (GitHub Actions) | 3h | 🟠 High | 🟢 | | roadmap |
| INFRA-2 | Production environment setup | 2h | 🟠 High | 🟢 | | roadmap |
| INFRA-3 | Database backups (automated daily) | 1h | 🟠 High | 🟢 | | roadmap |
| ARCH-3 | S3 cloud storage migration for file uploads (replace local filesystem) | 3h | 🟠 High | 🟢 | | review:smooth-floating-mountain |
| INFRA-5 | Monitoring (Sentry error tracking, Vercel Analytics, uptime alerts) | 2h | 🟠 High | 🔒 | [needs: INFRA-2] | roadmap |
| INFRA-7 | OpenTelemetry instrumentation (distributed tracing, metrics, alerting) | 4h | 🟠 High | 🔒 | [needs: INFRA-2] | review:smooth-floating-mountain |
| INFRA-8 | Docker image building + container deployment pipeline | 3h | 🟠 High | 🔒 | [needs: INFRA-1] | review:smooth-floating-mountain |

> _43 Linear PM infrastructure tasks in [LINEAR-TASKS.md](LINEAR-TASKS.md)_

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| INFRA-4 | Disaster recovery procedure + documentation | 2h | 🟡 Medium | 🔒 | [needs: INFRA-3] | roadmap |
| INFRA-6 | Deployment documentation | 1h | 🟡 Medium | 🔒 | [needs: INFRA-2] | roadmap |

---

## Recently Completed

_Last 10 — full history in [TASKS-ARCHIVE.md](TASKS-ARCHIVE.md)_

| ID | Task | Completed |
|----|------|-----------|
| UX-65 | Planning: Add budget/goal export (CSV/PDF) | 2026-02-27 |
| DEV-105 | Planning: Add budget alerts — threshold warnings at 80%/100% utilization | 2026-02-27 |
| DEV-104 | Planning: Add seasonal pattern detection — highlight high/low revenue months | 2026-02-27 |
| DEV-103 | Planning: Add cash runway calculator — months remaining at burn rate | 2026-02-27 |
| DEV-102 | Planning: Add Forecast model to Prisma + CRUD service (scenario modeling) | 2026-02-27 |
| UX-61 | Planning: Build forecasts page — cash flow projection chart | 2026-02-27 |
| DEV-99 | Planning: Add budget variance analysis endpoint — compare budget vs actual from GL | 2026-02-27 |
| DEV-36 | Overview: Expense Forecast widget — projected monthly spend at current 3-month run rate | 2026-02-27 |
| DEV-35 | Overview: Budget vs Actual widget — % of budget used this month, over-budget alerts | 2026-02-27 |
| DEV-34 | Overview: Goal Progress widget — progress bars for active goals, days to deadline | 2026-02-27 |

---

## Phase Progress

| Phase | Progress | Tests |
|-------|----------|-------|
| Foundation | COMPLETE | — |
| 1: See Your Money | ██████████ 100% | 62 |
| 2: Track Your Money | ██████████ 100% | 117 |
| 3: Post Your Money | ██████████ 100% | 33 |
| 4: Bill & Get Paid | ██████████ 100% | 21 |
| 5: Understand Your Money | ██████████ 100% | 267 |
| 6: Launch MVP | █████░░░░░ 55% | — |

**Total Backend Tests:** 1345 (verified 2026-02-24)

---

> **Legend:** 🟢 ready · 📦 backlog · 🔒 blocked · 🟡 deferred · ✅ done
> **Priority:** 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low























<!-- TASK-INDEX:START (auto-generated, do not edit manually)
{
  "version": "1.0",
  "generated": "2026-02-28T04:46:56.523Z",
  "summary": {
    "total": 133,
    "ready": 25,
    "blocked": 7,
    "backlog": 100,
    "done": 0
  },
  "byPriority": {
    "critical": [
      "SEC-45",
      "SEC-46",
      "PERF-27",
      "ARCH-14",
      "UX-103"
    ],
    "high": [
      "SEC-47",
      "ARCH-15",
      "ARCH-16",
      "ARCH-17",
      "DRY-22",
      "UX-107",
      "SEC-8",
      "INFRA-13",
      "DS-1",
      "MKT-1",
      "INFRA-1",
      "INFRA-2",
      "INFRA-3",
      "ARCH-3",
      "INFRA-5",
      "INFRA-7",
      "INFRA-8"
    ],
    "medium": [
      "UX-108",
      "UX-44",
      "DEV-83",
      "DEV-61",
      "DEV-62",
      "DEV-63",
      "DEV-64",
      "DEV-65",
      "DEV-66",
      "DEV-67",
      "DEV-68",
      "DEV-69",
      "ARCH-10",
      "FIN-33",
      "SEC-10",
      "UX-6",
      "UX-7",
      "PERF-10",
      "PERF-12",
      "FIN-7",
      "FIN-8",
      "FIN-9",
      "FIN-10",
      "ARCH-5",
      "ARCH-1",
      "ARCH-4",
      "TEST-4",
      "DEV-18",
      "FIN-16",
      "DEV-21",
      "DEV-22",
      "DEV-23",
      "DEV-24",
      "DEV-25",
      "DEV-26",
      "DEV-27",
      "DEV-28",
      "DEV-29",
      "DEV-30",
      "DEV-31",
      "DEV-32",
      "DEV-33",
      "DEV-37",
      "DEV-38",
      "DEV-39",
      "DEV-47",
      "DEV-48",
      "DEV-49",
      "DEV-50",
      "DEV-51",
      "DEV-52",
      "DEV-53",
      "DEV-54",
      "DEV-55",
      "DEV-56",
      "DEV-57",
      "DEV-58",
      "UX-52",
      "DEV-85",
      "DEV-86",
      "DEV-87",
      "DEV-88",
      "DEV-89",
      "UX-55",
      "DEV-90",
      "DEV-91",
      "DEV-100",
      "DEV-101",
      "UX-62",
      "UX-63",
      "UX-64",
      "DEV-115",
      "DEV-116",
      "DEV-117",
      "DEV-118",
      "SEC-16",
      "INFRA-11",
      "DS-2",
      "MKT-2",
      "CNT-1",
      "INFRA-4",
      "INFRA-6"
    ],
    "low": [
      "DRY-23",
      "DRY-24",
      "UX-109",
      "DEV-70",
      "DRY-15",
      "DRY-5",
      "DEV-40",
      "DEV-41",
      "DEV-42",
      "DEV-15",
      "DEV-16",
      "PERF-4",
      "PERF-11",
      "FIN-6",
      "FIN-11",
      "FIN-12",
      "SEC-15",
      "INFRA-12",
      "DEV-93",
      "DEV-94",
      "UX-57",
      "DEV-106",
      "DEV-107",
      "DEV-108",
      "DEV-109",
      "DEV-110",
      "DEV-111",
      "DEV-119",
      "DEV-120"
    ]
  },
  "byEffort": {
    "quick": [
      "SEC-45",
      "SEC-46",
      "PERF-27",
      "ARCH-14",
      "SEC-47",
      "ARCH-16",
      "DRY-22",
      "UX-107",
      "UX-103",
      "DRY-23",
      "DRY-24",
      "UX-108",
      "UX-109"
    ],
    "short": [
      "ARCH-15",
      "FIN-33",
      "UX-6",
      "UX-7",
      "PERF-12",
      "DEV-26",
      "DEV-27",
      "DEV-28",
      "DEV-29",
      "DEV-30",
      "DEV-31",
      "DEV-32",
      "DEV-49",
      "DEV-58",
      "UX-52",
      "UX-55",
      "DEV-101",
      "UX-62",
      "DEV-115",
      "DEV-116",
      "DEV-117",
      "SEC-16",
      "INFRA-11",
      "DEV-70",
      "DRY-15",
      "DRY-5",
      "DEV-40",
      "DEV-15",
      "DEV-16",
      "PERF-4",
      "PERF-11",
      "SEC-15",
      "INFRA-12",
      "DEV-106",
      "DEV-109",
      "DS-1",
      "MKT-2",
      "CNT-1",
      "INFRA-2",
      "INFRA-3",
      "INFRA-5",
      "INFRA-4",
      "INFRA-6"
    ],
    "medium": [
      "SEC-8",
      "DEV-63",
      "DEV-64",
      "DEV-66",
      "DEV-68",
      "SEC-10",
      "PERF-10",
      "FIN-7",
      "FIN-8",
      "FIN-9",
      "FIN-10",
      "ARCH-5",
      "ARCH-1",
      "ARCH-4",
      "TEST-4",
      "DEV-33",
      "DEV-39",
      "DEV-48",
      "DEV-51",
      "DEV-55",
      "DEV-56",
      "DEV-100",
      "DEV-118",
      "DEV-94",
      "DEV-119",
      "DS-2",
      "MKT-1",
      "INFRA-1",
      "ARCH-3",
      "INFRA-7",
      "INFRA-8"
    ],
    "long": [
      "INFRA-13",
      "DEV-83",
      "DEV-65",
      "DEV-89",
      "DEV-41",
      "DEV-42",
      "FIN-11",
      "FIN-12",
      "DEV-107",
      "DEV-110"
    ]
  },
  "byDomain": {
    "security": [
      "SEC-45",
      "SEC-46",
      "SEC-47",
      "SEC-8",
      "SEC-10",
      "SEC-16",
      "SEC-15"
    ],
    "performance": [
      "PERF-27",
      "PERF-10",
      "PERF-12",
      "PERF-4",
      "PERF-11"
    ],
    "architecture": [
      "ARCH-14",
      "ARCH-15",
      "ARCH-16",
      "ARCH-17",
      "ARCH-10",
      "ARCH-5",
      "ARCH-1",
      "ARCH-4",
      "ARCH-3"
    ],
    "code-quality": [
      "DRY-22",
      "DRY-23",
      "DRY-24",
      "DRY-15",
      "DRY-5"
    ],
    "ux": [
      "UX-107",
      "UX-103",
      "UX-108",
      "UX-109",
      "UX-44",
      "UX-6",
      "UX-7",
      "UX-52",
      "UX-55",
      "UX-62",
      "UX-63",
      "UX-64",
      "UX-57"
    ],
    "infrastructure": [
      "INFRA-13",
      "INFRA-11",
      "INFRA-12",
      "INFRA-1",
      "INFRA-2",
      "INFRA-3",
      "INFRA-5",
      "INFRA-7",
      "INFRA-8",
      "INFRA-4",
      "INFRA-6"
    ],
    "development": [
      "DEV-83",
      "DEV-61",
      "DEV-62",
      "DEV-63",
      "DEV-64",
      "DEV-65",
      "DEV-66",
      "DEV-67",
      "DEV-68",
      "DEV-69",
      "DEV-18",
      "DEV-21",
      "DEV-22",
      "DEV-23",
      "DEV-24",
      "DEV-25",
      "DEV-26",
      "DEV-27",
      "DEV-28",
      "DEV-29",
      "DEV-30",
      "DEV-31",
      "DEV-32",
      "DEV-33",
      "DEV-37",
      "DEV-38",
      "DEV-39",
      "DEV-47",
      "DEV-48",
      "DEV-49",
      "DEV-50",
      "DEV-51",
      "DEV-52",
      "DEV-53",
      "DEV-54",
      "DEV-55",
      "DEV-56",
      "DEV-57",
      "DEV-58",
      "DEV-85",
      "DEV-86",
      "DEV-87",
      "DEV-88",
      "DEV-89",
      "DEV-90",
      "DEV-91",
      "DEV-100",
      "DEV-101",
      "DEV-115",
      "DEV-116",
      "DEV-117",
      "DEV-118",
      "DEV-70",
      "DEV-40",
      "DEV-41",
      "DEV-42",
      "DEV-15",
      "DEV-16",
      "DEV-93",
      "DEV-94",
      "DEV-106",
      "DEV-107",
      "DEV-108",
      "DEV-109",
      "DEV-110",
      "DEV-111",
      "DEV-119",
      "DEV-120"
    ],
    "financial": [
      "FIN-33",
      "FIN-7",
      "FIN-8",
      "FIN-9",
      "FIN-10",
      "FIN-16",
      "FIN-6",
      "FIN-11",
      "FIN-12"
    ],
    "testing": [
      "TEST-4"
    ],
    "design-system": [
      "DS-1",
      "DS-2"
    ],
    "marketing": [
      "MKT-1",
      "MKT-2"
    ],
    "content": [
      "CNT-1"
    ]
  },
  "ready": [
    "SEC-45",
    "SEC-46",
    "PERF-27",
    "ARCH-14",
    "SEC-47",
    "ARCH-15",
    "ARCH-16",
    "DRY-22",
    "UX-107",
    "UX-103",
    "DRY-23",
    "DRY-24",
    "UX-108",
    "UX-109",
    "FIN-33",
    "DEV-115",
    "DEV-116",
    "DRY-15",
    "DEV-15",
    "DEV-16",
    "DS-1",
    "INFRA-1",
    "INFRA-2",
    "INFRA-3",
    "ARCH-3"
  ],
  "quickWins": [
    "SEC-45",
    "SEC-46",
    "PERF-27",
    "ARCH-14",
    "SEC-47",
    "ARCH-15",
    "ARCH-16",
    "DRY-22",
    "UX-107",
    "UX-103",
    "DS-1",
    "INFRA-2",
    "INFRA-3"
  ],
  "dashboard": [],
  "tasks": {
    "SEC-45": {
      "line": 28,
      "title": "Add consent gate middleware to bill/invoice scan routes",
      "effort": "15m",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "SEC-46": {
      "line": 29,
      "title": "Fix cross-tenant IDOR in worker vendor/client lookups (use entityId not tenantId)",
      "effort": "10m",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "PERF-27": {
      "line": 30,
      "title": "Add compound indexes for Client/Vendor name lookups (entityId, name, deletedAt)",
      "effort": "5m",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "ARCH-14": {
      "line": 31,
      "title": "Fix worker initialization race condition (await ready events)",
      "effort": "10m",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "SEC-47": {
      "line": 32,
      "title": "Add Zod validation for multipart entityId field in scan routes",
      "effort": "15m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "ARCH-15": {
      "line": 33,
      "title": "Change AIConsent CASCADE delete to Restrict (preserve audit trail)",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-16": {
      "line": 34,
      "title": "Extract Redis connection config to shared module (DRY)",
      "effort": "20m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-17": {
      "line": 35,
      "title": "Migrate rate limiter to Redis-backed (multi-instance support)",
      "effort": "2-3h",
      "priority": "high",
      "status": "blocked",
      "deps": [
        "PERF-11"
      ],
      "domain": "architecture"
    },
    "DRY-22": {
      "line": 36,
      "title": "Create domain error handler for business routes (eliminate duplication)",
      "effort": "20m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "UX-107": {
      "line": 37,
      "title": "Add success logging to scan routes (job enqueued successfully)",
      "effort": "5m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-103": {
      "line": 38,
      "title": "Fix HeroSection SSR wrapper import (bypass dynamic ssr:false)",
      "effort": "5m",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "SEC-8": {
      "line": 39,
      "title": "Complete security audit (OWASP top 10, auth, tenant isolation, input validation)",
      "effort": "4h",
      "priority": "high",
      "status": "unknown",
      "deps": [],
      "domain": "security"
    },
    "INFRA-13": {
      "line": 40,
      "title": "Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import",
      "effort": "8-12h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "DRY-23": {
      "line": 47,
      "title": "Update job-progress.tsx callback types to allow async (onComplete/onError)",
      "effort": "5m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-24": {
      "line": 48,
      "title": "Add JSDoc to useJobStream progress type check (explain defense)",
      "effort": "5m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "UX-108": {
      "line": 49,
      "title": "Standardize error format across scan routes (always include message field)",
      "effort": "10m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-109": {
      "line": 50,
      "title": "Add Retry-After header to 429 rate limit responses",
      "effort": "5m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-44": {
      "line": 51,
      "title": "Business: Add invoice/client list CSV/PDF export buttons",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-83": {
      "line": 52,
      "title": "Business: Build credit notes feature (CreditNote Prisma model exists, zero API endpoints or UI)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-61": {
      "line": 53,
      "title": "Accounting JE: Add multi-currency support to JE form (backend supports, form is single-currency only)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-62": {
      "line": 54,
      "title": "Accounting JE: Add batch approve (select multiple drafts → approve all)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-63": {
      "line": 55,
      "title": "Accounting: Add recurring journal entry templates (monthly depreciation, rent, etc.)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-64": {
      "line": 56,
      "title": "Accounting: Add journal entry CSV import (bulk import from external accounting software)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-65": {
      "line": 57,
      "title": "Accounting: Add account reconciliation page (compare GL vs bank statement balances)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-66": {
      "line": 58,
      "title": "Accounting: Add aged receivables/payables report (AR/AP aging 30/60/90+ day buckets)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-67": {
      "line": 59,
      "title": "Accounting: Add audit trail view (who approved/voided/created entries, timestamps)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-68": {
      "line": 60,
      "title": "Accounting: Add GL account merge/reclassify (move journal lines between accounts)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-69": {
      "line": 61,
      "title": "Accounting Reports: Add year-over-year comparison mode (multi-year P&L and BS trends)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "ARCH-10": {
      "line": 62,
      "title": "Split report.service.ts into focused modules (7 report types → 7 services + coordinator)",
      "effort": "2-3d",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "FIN-33": {
      "line": 63,
      "title": "Add PostgreSQL double-entry balance trigger (defense-in-depth for SUM(debits) = SUM(credits))",
      "effort": "2h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "financial"
    },
    "SEC-10": {
      "line": 64,
      "title": "Row-Level Security (PostgreSQL) for production hardening",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "UX-6": {
      "line": 65,
      "title": "Keyboard shortcuts for power users (command palette, table nav)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-7": {
      "line": 66,
      "title": "Help overlay documenting keyboard shortcuts",
      "effort": "1h",
      "priority": "medium",
      "status": "blocked",
      "deps": [
        "UX-6"
      ],
      "domain": "ux"
    },
    "PERF-10": {
      "line": 67,
      "title": "Distributed caching (Redis) for multi-instance deployment",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-12": {
      "line": 68,
      "title": "N+1 query monitoring / slow query detection in production (APM)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "FIN-7": {
      "line": 69,
      "title": "Fiscal period enforcement (prevent posting to locked periods)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-8": {
      "line": 70,
      "title": "Fiscal year close process (closing entries, revenue → retained earnings)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "FIN-7"
      ],
      "domain": "financial"
    },
    "FIN-9": {
      "line": 71,
      "title": "Multi-currency revaluation on period close (FX gains/losses, IFRS/GAAP)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "FIN-8"
      ],
      "domain": "financial"
    },
    "FIN-10": {
      "line": 72,
      "title": "Invoice/bill reconciliation workflows (AP/AR aging, match/approve)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "ARCH-5": {
      "line": 73,
      "title": "Error recovery patterns (idempotency keys, circuit breakers, retry with backoff)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-1": {
      "line": 74,
      "title": "OpenAPI spec auto-generation from Zod schemas (fastify-zod-openapi)",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-4": {
      "line": 75,
      "title": "Background job processing setup (BullMQ for PDF gen, email, imports)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "TEST-4": {
      "line": 76,
      "title": "Integration tests (API → DB → API roundtrip for critical flows)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "testing"
    },
    "DEV-18": {
      "line": 77,
      "title": "Overview: Balance Sheet Snapshot widget — asset:liability donut + equity trend",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "FIN-16": {
      "line": 78,
      "title": "Overview: Financial Health Ratios widget — current ratio, working capital, debt-to-equity",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "DEV-21": {
      "line": 79,
      "title": "Overview: Client Payment Health widget — % paid on time, avg days-to-payment, overdue count",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-22": {
      "line": 80,
      "title": "Overview: Invoice Aging Waterfall widget — AR buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-23": {
      "line": 81,
      "title": "Overview: Revenue by Category widget — revenue sources breakdown",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-24": {
      "line": 82,
      "title": "Overview: Top Expense Vendors widget — top 5 by YTD spend + % of total",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-25": {
      "line": 83,
      "title": "Overview: Bill Aging Waterfall widget — AP buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-26": {
      "line": 84,
      "title": "Overview: Vendor Payment Terms widget — on-time vs late payment performance",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-27": {
      "line": 85,
      "title": "Overview: Reconciliation Status widget — progress bar per account + unmatched count",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-28": {
      "line": 86,
      "title": "Overview: Import Health widget — last import date, success rate, failed imports",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-29": {
      "line": 87,
      "title": "Overview: Categorization Gap widget — % of transactions uncategorized by account",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-30": {
      "line": 88,
      "title": "Overview: Duplicate Detection Stats widget — duplicates detected this month",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-31": {
      "line": 89,
      "title": "Overview: Journal Entry Status widget — count by status, draft aging > 7d alert",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-32": {
      "line": 90,
      "title": "Overview: GL Posting Pipeline widget — pending bank feed txns waiting to post",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-33": {
      "line": 91,
      "title": "Overview: Ledger Spike Detection widget — accounts with unusual balance swings",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-37": {
      "line": 92,
      "title": "Overview: Cash Runway widget — days of cash remaining at burn rate",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-38": {
      "line": 93,
      "title": "Overview: Multi-Currency Exposure widget — portfolio breakdown by currency + FX risk %",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-39": {
      "line": 94,
      "title": "Overview: Entity KPI Comparison widget — side-by-side entity performance",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-47": {
      "line": 95,
      "title": "Banking: Add transaction full-text search on description/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-48": {
      "line": 96,
      "title": "Banking: Add transaction split UI + endpoint (isSplit field exists, no implementation)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-49": {
      "line": 97,
      "title": "Banking: Show multi-currency amounts — display original + base currency on transactions",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-50": {
      "line": 98,
      "title": "Banking: Add transaction export (CSV/PDF) for filtered transaction views",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-51": {
      "line": 99,
      "title": "Banking: Add account balance history chart — historical balance trend over time",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-52": {
      "line": 100,
      "title": "Banking: Add duplicate management UI — view detected duplicates, approve/dismiss",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-53": {
      "line": 101,
      "title": "Banking: Add transaction auto-categorization rules UI (Rule model exists in AI domain)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-54": {
      "line": 102,
      "title": "Banking: Add batch transaction edit — bulk update description/category/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-55": {
      "line": 103,
      "title": "Banking: Recurring transaction detection — identify frequency patterns",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-56": {
      "line": 104,
      "title": "Banking: Add receipt/attachment upload per transaction",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-57": {
      "line": 105,
      "title": "Banking: Add CSV import column mapping UI (backend supports, frontend hardcoded)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-58": {
      "line": 106,
      "title": "Banking: Add import error detail view — show per-row errors when import partially fails",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-52": {
      "line": 107,
      "title": "Business: Add sort by columns on invoice/bill/client/vendor lists",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-85": {
      "line": 108,
      "title": "Business: Add bill PDF generation (invoice PDF exists, bills have no PDF)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-86": {
      "line": 109,
      "title": "Business: Add aging drill-down — click AR/AP aging bucket to see individual invoices/bills",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-87": {
      "line": 110,
      "title": "Business: Add duplicate invoice/bill detection — flag same vendor+amount+date",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-88": {
      "line": 111,
      "title": "Business: Add email reminder for overdue invoices",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-89": {
      "line": 112,
      "title": "Business: Add recurring invoice templates — auto-generate invoices on schedule",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-55": {
      "line": 113,
      "title": "Business: Add visual status pipeline on invoice/bill list — Draft→Sent→Partial→Paid",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-90": {
      "line": 114,
      "title": "Business: Add top debtors/creditors summary widget",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-91": {
      "line": 115,
      "title": "Business: Add invoice/bill/client/vendor CSV export",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-100": {
      "line": 116,
      "title": "Planning: Add goal auto-tracking + milestone notifications",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-97"
      ],
      "domain": "development"
    },
    "DEV-101": {
      "line": 117,
      "title": "Planning: Wire planning reports to existing accounting report endpoints",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-62": {
      "line": 118,
      "title": "Planning: Add budget period selector with visual spend-rate indicator",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "UX-59"
      ],
      "domain": "ux"
    },
    "UX-63": {
      "line": 119,
      "title": "Planning: Add budget vs actual drill-down — click category to see transactions",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-99"
      ],
      "domain": "ux"
    },
    "UX-64": {
      "line": 120,
      "title": "Planning: Add goal trajectory projection — \"on pace\" vs \"behind\" trend line",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-100"
      ],
      "domain": "ux"
    },
    "DEV-115": {
      "line": 121,
      "title": "Insights: Add route-level tests for `/api/ai/chat` and `/api/ai/categorize`",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-116": {
      "line": 122,
      "title": "Insights: Add RBAC tests for AI permission enforcement",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-117": {
      "line": 123,
      "title": "Insights: Wire AIBrief on dashboard to show real data",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-118": {
      "line": 124,
      "title": "Insights: Implement `GET /api/ai/insights` endpoint (replace 501 stub)",
      "effort": "2-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "SEC-16": {
      "line": 125,
      "title": "File retention policies (auto-cleanup of old uploads)",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "INFRA-11": {
      "line": 126,
      "title": "Database migration testing in CI pipeline",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "DEV-70": {
      "line": 127,
      "title": "Accounting Reports: One-click export all statements as ZIP",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DRY-15": {
      "line": 128,
      "title": "Standardize table header styling — create `<TableHead variant=\"label\">`",
      "effort": "30m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-5": {
      "line": 129,
      "title": "`window.Clerk` triple-cast in downloadReport: clean up type assertion",
      "effort": "30m",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "code-quality"
    },
    "DEV-40": {
      "line": 130,
      "title": "Overview: Onboarding Completion nudge widget — checklist of remaining steps",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-41": {
      "line": 131,
      "title": "Overview: Tax Liability Estimate widget",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-42": {
      "line": 132,
      "title": "Overview: Subscription MRR/ARR widget — recurring revenue detection",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-15": {
      "line": 133,
      "title": "Overview: Add top expense categories widget",
      "effort": "1-2h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-16": {
      "line": 134,
      "title": "Overview: Add unreconciled transaction count badge to dashboard",
      "effort": "1h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "PERF-4": {
      "line": 135,
      "title": "PDF generation: move to worker thread (unblock event loop)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-11": {
      "line": 136,
      "title": "Distributed rate limiting (Redis-backed) for multi-instance",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "FIN-6": {
      "line": 137,
      "title": "Cash Flow: document hardcoded account code ranges for categorization",
      "effort": "doc",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-11": {
      "line": 138,
      "title": "Consolidation/elimination accounting (multi-entity)",
      "effort": "8h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-12": {
      "line": 139,
      "title": "GAAP-compliant GL export format (XBRL/ixBRL regulatory reporting)",
      "effort": "6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "SEC-15": {
      "line": 140,
      "title": "Duplicate file detection for uploads",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "INFRA-12": {
      "line": 141,
      "title": "Usage analytics (companies, transactions, reports generated)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "DEV-93": {
      "line": 142,
      "title": "Business: Add payment receipt PDF generation",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-94": {
      "line": 143,
      "title": "Business: Add batch invoice creation — generate multiple from template",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-57": {
      "line": 144,
      "title": "Business: Add notes/activity log per client and vendor",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-106": {
      "line": 145,
      "title": "Planning: Add soft delete to Budget and Goal models (missing deletedAt)",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-107": {
      "line": 146,
      "title": "Planning: Add AI-powered expense forecast",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-104"
      ],
      "domain": "development"
    },
    "DEV-108": {
      "line": 147,
      "title": "Planning: Add goal templates (emergency fund, revenue target, expense reduction)",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-97"
      ],
      "domain": "development"
    },
    "DEV-109": {
      "line": 148,
      "title": "Planning: Add budget rollover — carry unused budget forward to next period",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-98"
      ],
      "domain": "development"
    },
    "DEV-110": {
      "line": 149,
      "title": "Planning: Add \"What-if\" scenario comparison — side-by-side forecast scenarios",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-102"
      ],
      "domain": "development"
    },
    "DEV-111": {
      "line": 150,
      "title": "Planning: Auto-suggest budgets from existing spending patterns",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-98"
      ],
      "domain": "development"
    },
    "DEV-119": {
      "line": 151,
      "title": "Insights: Build Policy Alerts page with real data",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-120": {
      "line": 152,
      "title": "Insights: Build History page with AI interaction logging",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-118"
      ],
      "domain": "development"
    },
    "DS-1": {
      "line": 173,
      "title": "Figma-to-code token sync audit",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "design-system"
    },
    "DS-2": {
      "line": 174,
      "title": "Storybook setup for component documentation",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "design-system"
    },
    "MKT-1": {
      "line": 182,
      "title": "Landing page copy and design",
      "effort": "3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-2": {
      "line": 183,
      "title": "User documentation / getting started guide",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "CNT-1": {
      "line": 184,
      "title": "Competitive analysis update",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "content"
    },
    "INFRA-1": {
      "line": 194,
      "title": "CI/CD pipeline (GitHub Actions)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-2": {
      "line": 195,
      "title": "Production environment setup",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-3": {
      "line": 196,
      "title": "Database backups (automated daily)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "ARCH-3": {
      "line": 197,
      "title": "S3 cloud storage migration for file uploads (replace local filesystem)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "INFRA-5": {
      "line": 198,
      "title": "Monitoring (Sentry error tracking, Vercel Analytics, uptime alerts)",
      "effort": "2h",
      "priority": "high",
      "status": "blocked",
      "deps": [
        "INFRA-2"
      ],
      "domain": "infrastructure"
    },
    "INFRA-7": {
      "line": 199,
      "title": "OpenTelemetry instrumentation (distributed tracing, metrics, alerting)",
      "effort": "4h",
      "priority": "high",
      "status": "blocked",
      "deps": [
        "INFRA-2"
      ],
      "domain": "infrastructure"
    },
    "INFRA-8": {
      "line": 200,
      "title": "Docker image building + container deployment pipeline",
      "effort": "3h",
      "priority": "high",
      "status": "blocked",
      "deps": [
        "INFRA-1"
      ],
      "domain": "infrastructure"
    },
    "INFRA-4": {
      "line": 208,
      "title": "Disaster recovery procedure + documentation",
      "effort": "2h",
      "priority": "medium",
      "status": "blocked",
      "deps": [
        "INFRA-3"
      ],
      "domain": "infrastructure"
    },
    "INFRA-6": {
      "line": 209,
      "title": "Deployment documentation",
      "effort": "1h",
      "priority": "medium",
      "status": "blocked",
      "deps": [
        "INFRA-2"
      ],
      "domain": "infrastructure"
    }
  }
}
TASK-INDEX:END -->
