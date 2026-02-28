# Akount — Task Board

**Last Updated:** 2026-02-28
**Current Phase:** Phase 6 — Launch MVP

> **151 active tasks** · 🔴 12 critical · 🟠 22 high · 🟡 85 medium · ⚪ 32 low
> 📦 107 backlog · 🟢 37 ready · 🔒 6 blocked · 🟡 1 deferred
>
> _Completed tasks (303) archived in [TASKS-ARCHIVE.md](TASKS-ARCHIVE.md)_
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
| UX-103 | Fix HeroSection SSR wrapper import (bypass dynamic ssr:false) | 5m | 🔴 Critical | 🟢 | | review:revie23feb |
| DEV-268 | AI: Add timeout (30s) to all AI provider calls (Anthropic, Mistral) — stuck requests cost $50-100 | 2h | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
| DEV-269 | AI: Implement token tracking — log tokensUsed to AIDecisionLog after every AI call | 2h | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
| DEV-270 | AI: Add per-tenant AI budget caps — check budget before AI calls, 402 when exceeded | 3h | 🔴 Critical | 🟢 | [needs: DEV-269] | review:doc-intel-p2 |
| SEC-48 | AI: Add service-layer consent re-verification in all AI service methods (GDPR Article 22 defense-in-depth) | 1h | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
| SEC-49 | AI: Fix PII leak — redact OCR text BEFORE logging/analysis (currently logs raw PII) | 1h | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
| DEV-271 | Workers: Add idempotency checks — check AIDecisionLog.inputHash before creating entities on retry | 2h | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
| SEC-50 | Workers: Add entity ownership validation — verify entityId belongs to tenantId before processing | 1h | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
| ARCH-28 | Workers: Refactor to call business domain services instead of raw Prisma (domain boundary fix) | 4h | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
| PERF-30 | Schema: Add Vendor.name composite index `[entityId, name, deletedAt]` (166x speedup) | 30m | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
| PERF-31 | Schema: Add AIDecisionLog composite indexes (3 indexes: entityId+createdAt, feature+createdAt, inputHash) | 30m | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
| SEC-8 | Complete security audit (OWASP top 10, auth, tenant isolation, input validation) | 4h | 🟠 High | 🟡 deferred | | roadmap |
| INFRA-13 | Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import | 8-12h | 🟠 High | 📦 | | audit:fe-be-parity |
| DEV-272 | AI: Add AIDecisionLog entries in natural-search and auto-bookkeeper services (GDPR Article 30) | 2h | 🟠 High | 🟢 | [needs: DEV-269] | review:doc-intel-p2 |
| DEV-273 | AI: Reduce Mistral maxTokens from 2048 → 800 for vision/OCR ($120/mo savings) | 30m | 🟠 High | 🟢 | | review:doc-intel-p2 |
| SEC-51 | AI: Add Mistral AI to third-party processor disclosure in consent UI and service | 30m | 🟠 High | 🟢 | | review:doc-intel-p2 |
| ARCH-29 | Workers: Add DLQ monitoring — log failed jobs, add `/api/system/jobs/failed` admin endpoint | 2h | 🟠 High | 🟢 | | review:doc-intel-p2 |
| ARCH-30 | Workers: Add graceful shutdown (SIGTERM/SIGINT) — wait for in-progress jobs before exit | 1h | 🟠 High | 🟢 | | review:doc-intel-p2 |
| ARCH-31 | Workers: Fix job cleanup config — reduce removeOnComplete count, add TTL | 30m | 🟠 High | 🟢 | | review:doc-intel-p2 |
| ARCH-32 | Workers: Extract BaseDocumentScanWorker — deduplicate 258 lines (93% identical) | 3h | 🟠 High | 🟢 | [needs: ARCH-28] | review:doc-intel-p2 |
| ARCH-33 | Architecture: Split DocumentExtractionService (God Service) into focused modules | 1h | 🟠 High | 🟢 | | review:doc-intel-p2 |
| ARCH-34 | SSE: Fix memory leak — remove orphaned BullMQ event listeners on client disconnect | 1h | 🟠 High | 🟢 | | review:doc-intel-p2 |
| DEV-274 | Fix console.error in rule-engine.service.ts:75,118 — replace with structured pino logging | 30m | 🟠 High | 🟢 | | review:doc-intel-p2 |
| DEV-275 | Fix 3 type safety violations — async callback, query params `:any`, Fastify request extension | 1h | 🟠 High | 🟢 | | review:doc-intel-p2 |
| INFRA-69 | System: Add Redis PING to `/health` endpoint (currently only checks DB) | 1h | 🟠 High | 🟢 | | review:doc-intel-p2 |


### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
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
| DEV-276 | AI: Add AIDecisionLog retention policy — auto-delete logs >90 days (configurable) | 2h | 🟡 Medium | 📦 | | review:doc-intel-p2 |
| PERF-32 | AI: Add caching for AI extraction results — check inputHash before re-calling AI (30% duplicate rate) | 2h | 🟡 Medium | 📦 | [needs: DEV-271] | review:doc-intel-p2 |
| PERF-33 | AI: Add cursor pagination to AIDecisionLog list endpoint | 1h | 🟡 Medium | 📦 | | review:doc-intel-p2 |
| DEV-277 | Schema: Add data cleanup step before unique constraint on Insight (duplicate cleanup) | 1h | 🟡 Medium | 📦 | | review:doc-intel-p2 |
| SEC-52 | Schema: Add FK ownership validation for Category.defaultGLAccountId (cross-scope reference) | 1h | 🟡 Medium | 📦 | | review:doc-intel-p2 |
| DEV-278 | Code cleanup: Remove unused DocumentExtractionService.extractStatement() (115 lines, 0 callers) | 15m | ⚪ Low | 🟢 | | review:doc-intel-p2 |
| DEV-279 | Code cleanup: Remove 3 unused queue definitions from queue-manager.ts | 15m | ⚪ Low | 🟢 | | review:doc-intel-p2 |
| DEV-280 | Code cleanup: Unify bill-scan and invoice-scan routes via shared factory (95% identical) | 1h | ⚪ Low | 📦 | | review:doc-intel-p2 |
| DEV-281 | Exports: Add UTF-8 BOM prefix to CSV output for Excel compatibility | 15m | ⚪ Low | 🟢 | | review:doc-intel-p2 |
| SEC-53 | Exports: Mask tax IDs in export output (PII exposure prevention) | 30m | ⚪ Low | 📦 | | review:doc-intel-p2 |
| PERF-34 | Exports: Add pagination to PDF line items — prevent OOM on 10K+ line invoices | 30m | ⚪ Low | 📦 | | review:doc-intel-p2 |
| DEV-282 | Security: Write integration test verifying CSRF on multipart/form-data uploads | 1h | ⚪ Low | 📦 | | review:doc-intel-p2 |

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
| [Doc Intelligence Review Remediation](docs/plans/2026-02-28-doc-intelligence-review-remediation.md) | 34 tasks (3 phases: P0/P1/P2) | Ready — P0 blocking production |

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
| ARCH-3 | S3 cloud storage migration for file uploads + base64 memory bomb fix (P0: 13MB×1000 jobs = 13GB Redis) | 4h | 🔴 Critical | 🟢 | | review:doc-intel-p2 |
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
  "generated": "2026-02-28T17:33:17.005Z",
  "summary": {
    "total": 151,
    "ready": 37,
    "blocked": 6,
    "backlog": 107,
    "done": 0
  },
  "byPriority": {
    "critical": [
      "UX-103",
      "DEV-268",
      "DEV-269",
      "DEV-270",
      "SEC-48",
      "SEC-49",
      "DEV-271",
      "SEC-50",
      "ARCH-28",
      "PERF-30",
      "PERF-31",
      "ARCH-3"
    ],
    "high": [
      "SEC-8",
      "INFRA-13",
      "DEV-272",
      "DEV-273",
      "SEC-51",
      "ARCH-29",
      "ARCH-30",
      "ARCH-31",
      "ARCH-32",
      "ARCH-33",
      "ARCH-34",
      "DEV-274",
      "DEV-275",
      "INFRA-69",
      "DS-1",
      "MKT-1",
      "INFRA-1",
      "INFRA-2",
      "INFRA-3",
      "INFRA-5",
      "INFRA-7",
      "INFRA-8"
    ],
    "medium": [
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
      "DEV-276",
      "PERF-32",
      "PERF-33",
      "DEV-277",
      "SEC-52",
      "DS-2",
      "MKT-2",
      "CNT-1",
      "INFRA-4",
      "INFRA-6"
    ],
    "low": [
      "DEV-70",
      "DRY-15",
      "DRY-5",
      "DEV-40",
      "DEV-41",
      "DEV-42",
      "DEV-15",
      "DEV-16",
      "PERF-4",
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
      "DEV-120",
      "DEV-278",
      "DEV-279",
      "DEV-280",
      "DEV-281",
      "SEC-53",
      "PERF-34",
      "DEV-282"
    ]
  },
  "byEffort": {
    "quick": [
      "UX-103",
      "DEV-278",
      "DEV-279",
      "DEV-281"
    ],
    "short": [
      "DEV-268",
      "DEV-269",
      "SEC-48",
      "SEC-49",
      "DEV-271",
      "SEC-50",
      "PERF-30",
      "PERF-31",
      "DEV-272",
      "DEV-273",
      "SEC-51",
      "ARCH-29",
      "ARCH-30",
      "ARCH-31",
      "ARCH-33",
      "ARCH-34",
      "DEV-274",
      "DEV-275",
      "INFRA-69",
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
      "SEC-15",
      "INFRA-12",
      "DEV-106",
      "DEV-109",
      "DEV-276",
      "PERF-32",
      "PERF-33",
      "DEV-277",
      "SEC-52",
      "DEV-280",
      "SEC-53",
      "PERF-34",
      "DEV-282",
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
      "DEV-270",
      "ARCH-28",
      "SEC-8",
      "ARCH-32",
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
    "ux": [
      "UX-103",
      "UX-6",
      "UX-7",
      "UX-52",
      "UX-55",
      "UX-62",
      "UX-63",
      "UX-64",
      "UX-57"
    ],
    "development": [
      "DEV-268",
      "DEV-269",
      "DEV-270",
      "DEV-271",
      "DEV-272",
      "DEV-273",
      "DEV-274",
      "DEV-275",
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
      "DEV-120",
      "DEV-276",
      "DEV-277",
      "DEV-278",
      "DEV-279",
      "DEV-280",
      "DEV-281",
      "DEV-282"
    ],
    "security": [
      "SEC-48",
      "SEC-49",
      "SEC-50",
      "SEC-8",
      "SEC-51",
      "SEC-10",
      "SEC-16",
      "SEC-15",
      "SEC-52",
      "SEC-53"
    ],
    "architecture": [
      "ARCH-28",
      "ARCH-29",
      "ARCH-30",
      "ARCH-31",
      "ARCH-32",
      "ARCH-33",
      "ARCH-34",
      "ARCH-10",
      "ARCH-5",
      "ARCH-1",
      "ARCH-4",
      "ARCH-3"
    ],
    "performance": [
      "PERF-30",
      "PERF-31",
      "PERF-10",
      "PERF-12",
      "PERF-4",
      "PERF-32",
      "PERF-33",
      "PERF-34"
    ],
    "infrastructure": [
      "INFRA-13",
      "INFRA-69",
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
    "code-quality": [
      "DRY-15",
      "DRY-5"
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
    "UX-103",
    "DEV-268",
    "DEV-269",
    "DEV-270",
    "SEC-48",
    "SEC-49",
    "DEV-271",
    "SEC-50",
    "ARCH-28",
    "PERF-30",
    "PERF-31",
    "DEV-272",
    "DEV-273",
    "SEC-51",
    "ARCH-29",
    "ARCH-30",
    "ARCH-31",
    "ARCH-32",
    "ARCH-33",
    "ARCH-34",
    "DEV-274",
    "DEV-275",
    "INFRA-69",
    "FIN-33",
    "DEV-115",
    "DEV-116",
    "DRY-15",
    "DEV-15",
    "DEV-16",
    "DEV-278",
    "DEV-279",
    "DEV-281",
    "DS-1",
    "INFRA-1",
    "INFRA-2",
    "INFRA-3",
    "ARCH-3"
  ],
  "quickWins": [
    "UX-103",
    "DEV-268",
    "DEV-269",
    "SEC-48",
    "SEC-49",
    "DEV-271",
    "SEC-50",
    "PERF-30",
    "PERF-31",
    "DEV-272",
    "DEV-273",
    "SEC-51",
    "ARCH-29",
    "ARCH-30",
    "ARCH-31",
    "ARCH-33",
    "ARCH-34",
    "DEV-274",
    "DEV-275",
    "INFRA-69",
    "DS-1",
    "INFRA-2",
    "INFRA-3"
  ],
  "dashboard": [],
  "tasks": {
    "UX-103": {
      "line": 28,
      "title": "Fix HeroSection SSR wrapper import (bypass dynamic ssr:false)",
      "effort": "5m",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-268": {
      "line": 29,
      "title": "AI: Add timeout (30s) to all AI provider calls (Anthropic, Mistral) — stuck requests cost $50-100",
      "effort": "2h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-269": {
      "line": 30,
      "title": "AI: Implement token tracking — log tokensUsed to AIDecisionLog after every AI call",
      "effort": "2h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-270": {
      "line": 31,
      "title": "AI: Add per-tenant AI budget caps — check budget before AI calls, 402 when exceeded",
      "effort": "3h",
      "priority": "critical",
      "status": "ready",
      "deps": [
        "DEV-269"
      ],
      "domain": "development"
    },
    "SEC-48": {
      "line": 32,
      "title": "AI: Add service-layer consent re-verification in all AI service methods (GDPR Article 22 defense-in-depth)",
      "effort": "1h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "SEC-49": {
      "line": 33,
      "title": "AI: Fix PII leak — redact OCR text BEFORE logging/analysis (currently logs raw PII)",
      "effort": "1h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "DEV-271": {
      "line": 34,
      "title": "Workers: Add idempotency checks — check AIDecisionLog.inputHash before creating entities on retry",
      "effort": "2h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "SEC-50": {
      "line": 35,
      "title": "Workers: Add entity ownership validation — verify entityId belongs to tenantId before processing",
      "effort": "1h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "ARCH-28": {
      "line": 36,
      "title": "Workers: Refactor to call business domain services instead of raw Prisma (domain boundary fix)",
      "effort": "4h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "PERF-30": {
      "line": 37,
      "title": "Schema: Add Vendor.name composite index `[entityId, name, deletedAt]` (166x speedup)",
      "effort": "30m",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-31": {
      "line": 38,
      "title": "Schema: Add AIDecisionLog composite indexes (3 indexes: entityId+createdAt, feature+createdAt, inputHash)",
      "effort": "30m",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "performance"
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
    "DEV-272": {
      "line": 41,
      "title": "AI: Add AIDecisionLog entries in natural-search and auto-bookkeeper services (GDPR Article 30)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-269"
      ],
      "domain": "development"
    },
    "DEV-273": {
      "line": 42,
      "title": "AI: Reduce Mistral maxTokens from 2048 → 800 for vision/OCR ($120/mo savings)",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "SEC-51": {
      "line": 43,
      "title": "AI: Add Mistral AI to third-party processor disclosure in consent UI and service",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "ARCH-29": {
      "line": 44,
      "title": "Workers: Add DLQ monitoring — log failed jobs, add `/api/system/jobs/failed` admin endpoint",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-30": {
      "line": 45,
      "title": "Workers: Add graceful shutdown (SIGTERM/SIGINT) — wait for in-progress jobs before exit",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-31": {
      "line": 46,
      "title": "Workers: Fix job cleanup config — reduce removeOnComplete count, add TTL",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-32": {
      "line": 47,
      "title": "Workers: Extract BaseDocumentScanWorker — deduplicate 258 lines (93% identical)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "ARCH-28"
      ],
      "domain": "architecture"
    },
    "ARCH-33": {
      "line": 48,
      "title": "Architecture: Split DocumentExtractionService (God Service) into focused modules",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-34": {
      "line": 49,
      "title": "SSE: Fix memory leak — remove orphaned BullMQ event listeners on client disconnect",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "DEV-274": {
      "line": 50,
      "title": "Fix console.error in rule-engine.service.ts:75,118 — replace with structured pino logging",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-275": {
      "line": 51,
      "title": "Fix 3 type safety violations — async callback, query params `:any`, Fastify request extension",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "INFRA-69": {
      "line": 52,
      "title": "System: Add Redis PING to `/health` endpoint (currently only checks DB)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "DEV-83": {
      "line": 59,
      "title": "Business: Build credit notes feature (CreditNote Prisma model exists, zero API endpoints or UI)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-61": {
      "line": 60,
      "title": "Accounting JE: Add multi-currency support to JE form (backend supports, form is single-currency only)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-62": {
      "line": 61,
      "title": "Accounting JE: Add batch approve (select multiple drafts → approve all)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-63": {
      "line": 62,
      "title": "Accounting: Add recurring journal entry templates (monthly depreciation, rent, etc.)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-64": {
      "line": 63,
      "title": "Accounting: Add journal entry CSV import (bulk import from external accounting software)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-65": {
      "line": 64,
      "title": "Accounting: Add account reconciliation page (compare GL vs bank statement balances)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-66": {
      "line": 65,
      "title": "Accounting: Add aged receivables/payables report (AR/AP aging 30/60/90+ day buckets)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-67": {
      "line": 66,
      "title": "Accounting: Add audit trail view (who approved/voided/created entries, timestamps)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-68": {
      "line": 67,
      "title": "Accounting: Add GL account merge/reclassify (move journal lines between accounts)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-69": {
      "line": 68,
      "title": "Accounting Reports: Add year-over-year comparison mode (multi-year P&L and BS trends)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "ARCH-10": {
      "line": 69,
      "title": "Split report.service.ts into focused modules (7 report types → 7 services + coordinator)",
      "effort": "2-3d",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "FIN-33": {
      "line": 70,
      "title": "Add PostgreSQL double-entry balance trigger (defense-in-depth for SUM(debits) = SUM(credits))",
      "effort": "2h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "financial"
    },
    "SEC-10": {
      "line": 71,
      "title": "Row-Level Security (PostgreSQL) for production hardening",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "UX-6": {
      "line": 72,
      "title": "Keyboard shortcuts for power users (command palette, table nav)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-7": {
      "line": 73,
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
      "line": 74,
      "title": "Distributed caching (Redis) for multi-instance deployment",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-12": {
      "line": 75,
      "title": "N+1 query monitoring / slow query detection in production (APM)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "FIN-7": {
      "line": 76,
      "title": "Fiscal period enforcement (prevent posting to locked periods)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-8": {
      "line": 77,
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
      "line": 78,
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
      "line": 79,
      "title": "Invoice/bill reconciliation workflows (AP/AR aging, match/approve)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "ARCH-5": {
      "line": 80,
      "title": "Error recovery patterns (idempotency keys, circuit breakers, retry with backoff)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-1": {
      "line": 81,
      "title": "OpenAPI spec auto-generation from Zod schemas (fastify-zod-openapi)",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-4": {
      "line": 82,
      "title": "Background job processing setup (BullMQ for PDF gen, email, imports)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "TEST-4": {
      "line": 83,
      "title": "Integration tests (API → DB → API roundtrip for critical flows)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "testing"
    },
    "DEV-18": {
      "line": 84,
      "title": "Overview: Balance Sheet Snapshot widget — asset:liability donut + equity trend",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "FIN-16": {
      "line": 85,
      "title": "Overview: Financial Health Ratios widget — current ratio, working capital, debt-to-equity",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "DEV-21": {
      "line": 86,
      "title": "Overview: Client Payment Health widget — % paid on time, avg days-to-payment, overdue count",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-22": {
      "line": 87,
      "title": "Overview: Invoice Aging Waterfall widget — AR buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-23": {
      "line": 88,
      "title": "Overview: Revenue by Category widget — revenue sources breakdown",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-24": {
      "line": 89,
      "title": "Overview: Top Expense Vendors widget — top 5 by YTD spend + % of total",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-25": {
      "line": 90,
      "title": "Overview: Bill Aging Waterfall widget — AP buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-26": {
      "line": 91,
      "title": "Overview: Vendor Payment Terms widget — on-time vs late payment performance",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-27": {
      "line": 92,
      "title": "Overview: Reconciliation Status widget — progress bar per account + unmatched count",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-28": {
      "line": 93,
      "title": "Overview: Import Health widget — last import date, success rate, failed imports",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-29": {
      "line": 94,
      "title": "Overview: Categorization Gap widget — % of transactions uncategorized by account",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-30": {
      "line": 95,
      "title": "Overview: Duplicate Detection Stats widget — duplicates detected this month",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-31": {
      "line": 96,
      "title": "Overview: Journal Entry Status widget — count by status, draft aging > 7d alert",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-32": {
      "line": 97,
      "title": "Overview: GL Posting Pipeline widget — pending bank feed txns waiting to post",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-33": {
      "line": 98,
      "title": "Overview: Ledger Spike Detection widget — accounts with unusual balance swings",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-37": {
      "line": 99,
      "title": "Overview: Cash Runway widget — days of cash remaining at burn rate",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-38": {
      "line": 100,
      "title": "Overview: Multi-Currency Exposure widget — portfolio breakdown by currency + FX risk %",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-39": {
      "line": 101,
      "title": "Overview: Entity KPI Comparison widget — side-by-side entity performance",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-47": {
      "line": 102,
      "title": "Banking: Add transaction full-text search on description/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-48": {
      "line": 103,
      "title": "Banking: Add transaction split UI + endpoint (isSplit field exists, no implementation)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-49": {
      "line": 104,
      "title": "Banking: Show multi-currency amounts — display original + base currency on transactions",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-50": {
      "line": 105,
      "title": "Banking: Add transaction export (CSV/PDF) for filtered transaction views",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-51": {
      "line": 106,
      "title": "Banking: Add account balance history chart — historical balance trend over time",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-52": {
      "line": 107,
      "title": "Banking: Add duplicate management UI — view detected duplicates, approve/dismiss",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-53": {
      "line": 108,
      "title": "Banking: Add transaction auto-categorization rules UI (Rule model exists in AI domain)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-54": {
      "line": 109,
      "title": "Banking: Add batch transaction edit — bulk update description/category/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-55": {
      "line": 110,
      "title": "Banking: Recurring transaction detection — identify frequency patterns",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-56": {
      "line": 111,
      "title": "Banking: Add receipt/attachment upload per transaction",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-57": {
      "line": 112,
      "title": "Banking: Add CSV import column mapping UI (backend supports, frontend hardcoded)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-58": {
      "line": 113,
      "title": "Banking: Add import error detail view — show per-row errors when import partially fails",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-52": {
      "line": 114,
      "title": "Business: Add sort by columns on invoice/bill/client/vendor lists",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-85": {
      "line": 115,
      "title": "Business: Add bill PDF generation (invoice PDF exists, bills have no PDF)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-86": {
      "line": 116,
      "title": "Business: Add aging drill-down — click AR/AP aging bucket to see individual invoices/bills",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-87": {
      "line": 117,
      "title": "Business: Add duplicate invoice/bill detection — flag same vendor+amount+date",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-88": {
      "line": 118,
      "title": "Business: Add email reminder for overdue invoices",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-89": {
      "line": 119,
      "title": "Business: Add recurring invoice templates — auto-generate invoices on schedule",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-55": {
      "line": 120,
      "title": "Business: Add visual status pipeline on invoice/bill list — Draft→Sent→Partial→Paid",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-90": {
      "line": 121,
      "title": "Business: Add top debtors/creditors summary widget",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-91": {
      "line": 122,
      "title": "Business: Add invoice/bill/client/vendor CSV export",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-100": {
      "line": 123,
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
      "line": 124,
      "title": "Planning: Wire planning reports to existing accounting report endpoints",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-62": {
      "line": 125,
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
      "line": 126,
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
      "line": 127,
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
      "line": 128,
      "title": "Insights: Add route-level tests for `/api/ai/chat` and `/api/ai/categorize`",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-116": {
      "line": 129,
      "title": "Insights: Add RBAC tests for AI permission enforcement",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-117": {
      "line": 130,
      "title": "Insights: Wire AIBrief on dashboard to show real data",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-118": {
      "line": 131,
      "title": "Insights: Implement `GET /api/ai/insights` endpoint (replace 501 stub)",
      "effort": "2-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "SEC-16": {
      "line": 132,
      "title": "File retention policies (auto-cleanup of old uploads)",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "INFRA-11": {
      "line": 133,
      "title": "Database migration testing in CI pipeline",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "DEV-70": {
      "line": 134,
      "title": "Accounting Reports: One-click export all statements as ZIP",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DRY-15": {
      "line": 135,
      "title": "Standardize table header styling — create `<TableHead variant=\"label\">`",
      "effort": "30m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-5": {
      "line": 136,
      "title": "`window.Clerk` triple-cast in downloadReport: clean up type assertion",
      "effort": "30m",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "code-quality"
    },
    "DEV-40": {
      "line": 137,
      "title": "Overview: Onboarding Completion nudge widget — checklist of remaining steps",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-41": {
      "line": 138,
      "title": "Overview: Tax Liability Estimate widget",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-42": {
      "line": 139,
      "title": "Overview: Subscription MRR/ARR widget — recurring revenue detection",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-15": {
      "line": 140,
      "title": "Overview: Add top expense categories widget",
      "effort": "1-2h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-16": {
      "line": 141,
      "title": "Overview: Add unreconciled transaction count badge to dashboard",
      "effort": "1h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "PERF-4": {
      "line": 142,
      "title": "PDF generation: move to worker thread (unblock event loop)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "FIN-6": {
      "line": 143,
      "title": "Cash Flow: document hardcoded account code ranges for categorization",
      "effort": "doc",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-11": {
      "line": 144,
      "title": "Consolidation/elimination accounting (multi-entity)",
      "effort": "8h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-12": {
      "line": 145,
      "title": "GAAP-compliant GL export format (XBRL/ixBRL regulatory reporting)",
      "effort": "6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "SEC-15": {
      "line": 146,
      "title": "Duplicate file detection for uploads",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "INFRA-12": {
      "line": 147,
      "title": "Usage analytics (companies, transactions, reports generated)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "DEV-93": {
      "line": 148,
      "title": "Business: Add payment receipt PDF generation",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-94": {
      "line": 149,
      "title": "Business: Add batch invoice creation — generate multiple from template",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-57": {
      "line": 150,
      "title": "Business: Add notes/activity log per client and vendor",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-106": {
      "line": 151,
      "title": "Planning: Add soft delete to Budget and Goal models (missing deletedAt)",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-107": {
      "line": 152,
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
      "line": 153,
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
      "line": 154,
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
      "line": 155,
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
      "line": 156,
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
      "line": 157,
      "title": "Insights: Build Policy Alerts page with real data",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-120": {
      "line": 158,
      "title": "Insights: Build History page with AI interaction logging",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-118"
      ],
      "domain": "development"
    },
    "DEV-276": {
      "line": 159,
      "title": "AI: Add AIDecisionLog retention policy — auto-delete logs >90 days (configurable)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "PERF-32": {
      "line": 160,
      "title": "AI: Add caching for AI extraction results — check inputHash before re-calling AI (30% duplicate rate)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-271"
      ],
      "domain": "performance"
    },
    "PERF-33": {
      "line": 161,
      "title": "AI: Add cursor pagination to AIDecisionLog list endpoint",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "DEV-277": {
      "line": 162,
      "title": "Schema: Add data cleanup step before unique constraint on Insight (duplicate cleanup)",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "SEC-52": {
      "line": 163,
      "title": "Schema: Add FK ownership validation for Category.defaultGLAccountId (cross-scope reference)",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "DEV-278": {
      "line": 164,
      "title": "Code cleanup: Remove unused DocumentExtractionService.extractStatement() (115 lines, 0 callers)",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-279": {
      "line": 165,
      "title": "Code cleanup: Remove 3 unused queue definitions from queue-manager.ts",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-280": {
      "line": 166,
      "title": "Code cleanup: Unify bill-scan and invoice-scan routes via shared factory (95% identical)",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-281": {
      "line": 167,
      "title": "Exports: Add UTF-8 BOM prefix to CSV output for Excel compatibility",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "SEC-53": {
      "line": 168,
      "title": "Exports: Mask tax IDs in export output (PII exposure prevention)",
      "effort": "30m",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "PERF-34": {
      "line": 169,
      "title": "Exports: Add pagination to PDF line items — prevent OOM on 10K+ line invoices",
      "effort": "30m",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "DEV-282": {
      "line": 170,
      "title": "Security: Write integration test verifying CSRF on multipart/form-data uploads",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DS-1": {
      "line": 192,
      "title": "Figma-to-code token sync audit",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "design-system"
    },
    "DS-2": {
      "line": 193,
      "title": "Storybook setup for component documentation",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "design-system"
    },
    "MKT-1": {
      "line": 201,
      "title": "Landing page copy and design",
      "effort": "3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-2": {
      "line": 202,
      "title": "User documentation / getting started guide",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "CNT-1": {
      "line": 203,
      "title": "Competitive analysis update",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "content"
    },
    "INFRA-1": {
      "line": 213,
      "title": "CI/CD pipeline (GitHub Actions)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-2": {
      "line": 214,
      "title": "Production environment setup",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-3": {
      "line": 215,
      "title": "Database backups (automated daily)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "ARCH-3": {
      "line": 216,
      "title": "S3 cloud storage migration for file uploads + base64 memory bomb fix (P0: 13MB×1000 jobs = 13GB Redis)",
      "effort": "4h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "INFRA-5": {
      "line": 217,
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
      "line": 218,
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
      "line": 219,
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
      "line": 227,
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
      "line": 228,
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
