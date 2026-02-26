# Akount — Task Board

**Last Updated:** 2026-02-25
**Current Phase:** Phase 6 — Launch MVP

> **188 active tasks** · 🔴 12 critical · 🟠 42 high · 🟡 107 medium · ⚪ 27 low
> 📦 114 backlog · 🟢 67 ready · 🔒 6 blocked · 🟡 1 deferred
>
> _Completed tasks (223) archived in [TASKS-ARCHIVE.md](TASKS-ARCHIVE.md)_
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
| SEC-28 | AI: Add `ai:actions` + `ai:monthly-close` to PERMISSION_MATRIX (RBAC prerequisite for AI features) | 30m | 🔴 Critical | 🟢 | | review:ai-bookkeeper-review |
| INFRA-60 | AI: Install `@fastify/rate-limit`, add per-endpoint limits to AI routes | 1h | 🟠 High | 🟢 | | review:ai-bookkeeper-review |
| DEV-202 | AI: Extract `resolveGLAccountByCode` to shared utility (`domains/accounting/utils/gl-resolve.ts`) | 30m | 🟠 High | 🟢 | | review:ai-bookkeeper-review |
| DEV-190 | AI: JE suggestion service — draft journal entries from categorized transactions + transfer detection guard (skip TRANSFER sourceType), zero-amount guard, conservation of value for multi-currency, Int 0-100 confidence | 4-6h | 🔴 Critical | 🟢 | [needs: DEV-185,DEV-186,DEV-187,DEV-189] | plan:ai-auto-bookkeeper-phase1 |
| DEV-191 | AI: JE suggestion API routes + tests (draft, preview endpoints) + JSON payload size limits in Zod schemas | 3-4h | 🔴 Critical | 🟢 | [needs: DEV-190] | plan:ai-auto-bookkeeper-phase1 |
| DEV-197 | Accounting: Batch JE approval endpoint — wrap each individual approval in `$transaction` for atomicity | 2-3h | 🔴 Critical | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-198 | AI: Wire AIAction approval to execution — DRAFT JE cleanup on rejection (soft-delete JE + clear txn.journalEntryId), re-fetch/re-validate JE from DB on approval (never trust payload), registry pattern for executor dispatch | 2-3h | 🔴 Critical | 🟢 | [needs: DEV-193,DEV-195,DEV-197] | plan:ai-auto-bookkeeper-phase1 |
| DEV-200 | AI: Integration test — full auto-bookkeeper workflow E2E | 2-3h | 🔴 Critical | 🟢 | [needs: DEV-191,DEV-194,DEV-197,DEV-198] | plan:ai-auto-bookkeeper-phase1 |
| SEC-8 | Complete security audit (OWASP top 10, auth, tenant isolation, input validation) | 4h | 🟠 High | 🟡 deferred | | roadmap |
| INFRA-13 | Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import | 8-12h | 🟠 High | 📦 | | audit:fe-be-parity |
| DEV-97 | Planning: Build Goal service + full CRUD (create/list/get/update/delete using Goal model) | 4-6h | 🟠 High | 📦 | | audit:fe-be-parity |
| DEV-98 | Planning: Build Budget service + full CRUD (create/list/get/update/delete using Budget model) | 4-6h | 🟠 High | 📦 | | audit:fe-be-parity |
| UX-58 | Planning: Build goals page — list goals, create form, progress tracking | 3-4h | 🟠 High | 📦 | [needs: DEV-97] | audit:fe-be-parity |
| UX-59 | Planning: Build budgets page — list budgets, create form, budget vs actual bars | 3-4h | 🟠 High | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| UX-60 | Planning: Add planning landing page at `/planning` with summary cards | 2-3h | 🟠 High | 📦 | [needs: DEV-97, DEV-98] | audit:fe-be-parity |
| DEV-185 | AI: Add `defaultGLAccountId` FK to Category model (schema migration) + document cross-scope FK (Category=tenant, GLAccount=entity), validate at runtime | 30m | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-186 | AI: Add `AI_SUGGESTION` to JournalEntrySourceType enum (schema migration) | 15m | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-187 | AI: Enhance categorization with GL resolution + confidence tiers + sign-aware GL fallback (income→4990, expense→5990), refactor to class-based service, use extracted resolveGLAccountByCode | 2-3h | 🟠 High | 🟢 | [needs: DEV-185,DEV-202] | plan:ai-auto-bookkeeper-phase1 |
| DEV-188 | AI: Batch categorize API endpoint + schema extraction | 1-2h | 🟠 High | 🟢 | [needs: DEV-187] | plan:ai-auto-bookkeeper-phase1 |
| DEV-189 | AI: Add Claude (Anthropic) provider to AIService + add ANTHROPIC_API_KEY to env.ts Zod schema, sanitize SDK errors | 1-2h | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-192 | AI: Create AIAction Prisma model + enums (schema migration) + remove INSIGHT from AIActionType enum (dead value), use confidence Int? (0-100 not Float 0-1) | 30m | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-193 | AI: AIAction service + AI domain error handler (CRUD, batch, stats) + validate expiresAt on approval | 3-4h | 🟠 High | 🟢 | [needs: DEV-192] | plan:ai-auto-bookkeeper-phase1 |
| DEV-194 | AI: Action Feed API routes + tests (list, approve, reject, batch, stats) + entityId required in batch ops, RBAC uses SEC-28 permissions | 3-4h | 🟠 High | 🟢 | [needs: DEV-193,SEC-28] | plan:ai-auto-bookkeeper-phase1 |
| DEV-195 | AI: Wire JE/categorization services to create AIActions on suggestions | 1-2h | 🟠 High | 🟢 | [needs: DEV-190,DEV-193] | plan:ai-auto-bookkeeper-phase1 |
| DEV-196 | AI: Frontend Action Feed UI (page, components, navigation, confidence badges) | 4-6h | 🟠 High | 🟢 | [needs: DEV-194] | plan:ai-auto-bookkeeper-phase1 |


### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DEV-199 | AI: Dashboard AI Action widget (glass card, pending count, quick-approve) | 1-2h | 🟡 Medium | 🟢 | [needs: DEV-194,DEV-196] | plan:ai-auto-bookkeeper-phase1 |
| DEV-203 | AI Rules: Rule service — CRUD operations (list, create, update, delete, toggle, stats) | 2-3h | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase2 |
| DEV-204 | AI Rules: Rule evaluation engine — condition evaluation, batch, first-match-wins, NO regex (contains/eq/gt/lt only), field allowlist | 2-3h | 🟠 High | 🟢 | [needs: DEV-203] | plan:ai-auto-bookkeeper-phase2 |
| DEV-205 | AI Rules: API routes + Zod schemas (CRUD, toggle, stats) + JSON payload size validation | 2-3h | 🟠 High | 🟢 | [needs: DEV-203,DEV-204] | plan:ai-auto-bookkeeper-phase2 |
| DEV-206 | AI Rules: Hook rules into autoCategorize pipeline (rules before keywords, backward compatible) | 2-3h | 🔴 Critical | 🟢 | [needs: DEV-204,DEV-187] | plan:ai-auto-bookkeeper-phase2 |
| DEV-207 | AI Rules: Pattern detection service (3+ corrections threshold, keyword extraction, dedup) | 2-3h | 🟠 High | 🟢 | [needs: DEV-204] | plan:ai-auto-bookkeeper-phase2 |
| DEV-208 | AI Rules: Rule suggestion generation service (creates RuleSuggestion + AIAction) | 2-3h | 🟠 High | 🟢 | [needs: DEV-207,DEV-192,DEV-193] | plan:ai-auto-bookkeeper-phase2 |
| DEV-209 | AI Rules: Wire correction triggers + RULE_SUGGESTION executor handler | 2-3h | 🔴 Critical | 🟢 | [needs: DEV-207,DEV-208,DEV-198] | plan:ai-auto-bookkeeper-phase2 |
| DEV-210 | AI Rules: Rule suggestion API routes + tests | 2-3h | 🟠 High | 🟢 | [needs: DEV-207,DEV-208,DEV-209] | plan:ai-auto-bookkeeper-phase2 |
| DEV-211 | AI Rules: Frontend API client + types for rules | 1-2h | 🟡 Medium | 🟢 | [needs: DEV-205,DEV-210] | plan:ai-auto-bookkeeper-phase2 |
| DEV-212 | AI Rules: Rules management page (`/insights/rules`) + Sheet + navigation | 3-4h | 🟡 Medium | 🟢 | [needs: DEV-211] | plan:ai-auto-bookkeeper-phase2 |
| DEV-213 | AI Rules: Rule condition builder component (visual AND/OR, field dropdowns) | 2-3h | 🟡 Medium | 🟢 | [needs: DEV-212] | plan:ai-auto-bookkeeper-phase2 |
| DEV-214 | AI Rules: Rule suggestions in Action Feed (card rendering, approve creates rule) | 2-3h | 🟡 Medium | 🟢 | [needs: DEV-211,DEV-212,DEV-196] | plan:ai-auto-bookkeeper-phase2 |
| DEV-215 | AI Insights: Schema enhancement — add dismiss/snooze fields + @@unique([entityId,triggerId]) | 30m | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase3 |
| DEV-216 | AI Insights: Types, constants, Zod schemas (7 types, 4 priorities, 5 statuses) | 1-2h | 🟠 High | 🟢 | [needs: DEV-215] | plan:ai-auto-bookkeeper-phase3 |
| DEV-217 | AI Insights: CRUD service (upsert dedup, dismiss, snooze, expire, counts) | 2-3h | 🟠 High | 🟢 | [needs: DEV-215,DEV-216] | plan:ai-auto-bookkeeper-phase3 |
| DEV-218 | AI Insights: API routes — replace 501 stubs (list, dismiss, snooze, generate, counts) | 2-3h | 🟠 High | 🟢 | [needs: DEV-217] | plan:ai-auto-bookkeeper-phase3 |
| DEV-219 | AI Insights: Generator orchestrator service (fan-out to analyzers, AIAction bridge for critical) | 3-4h | 🔴 Critical | 🟢 | [needs: DEV-217,DEV-218,DEV-193] | plan:ai-auto-bookkeeper-phase3 |
| DEV-220 | AI Insights: Cash flow + overdue analyzers (pure functions, integer cents thresholds) | 2-3h | 🟠 High | 🟢 | [needs: DEV-219] | plan:ai-auto-bookkeeper-phase3 |
| DEV-221 | AI Insights: Spending anomaly + duplicate expense analyzers (pure functions) | 2-3h | 🟠 High | 🟢 | [needs: DEV-219] | plan:ai-auto-bookkeeper-phase3 |
| DEV-222 | AI Insights: Revenue trend + reconciliation gap analyzers (DB-access) | 2-3h | 🟠 High | 🟢 | [needs: DEV-219] | plan:ai-auto-bookkeeper-phase3 |
| DEV-223 | AI Insights: Wire import trigger + optional generation timer (SYSTEM_USER_ID audit) | 2-3h | 🔴 Critical | 🟢 | [needs: DEV-219,DEV-220,DEV-221,DEV-222,DEV-198] | plan:ai-auto-bookkeeper-phase3 |
| DEV-224 | AI Insights: Monthly close readiness service (weighted score, atomic executeClose with post-lock re-validation, APPROVE-level RBAC) | 3-4h | 🔴 Critical | 🟢 | [needs: DEV-192,SEC-28] | plan:ai-auto-bookkeeper-phase3 |
| DEV-225 | AI Insights: Monthly close API routes + tests (readiness, execute, history) | 2-3h | 🟠 High | 🟢 | [needs: DEV-224] | plan:ai-auto-bookkeeper-phase3 |
| DEV-226 | AI Insights: Frontend API client + types (insights + monthly close) | 1-2h | 🟡 Medium | 🟢 | [needs: DEV-218,DEV-225] | plan:ai-auto-bookkeeper-phase3 |
| DEV-227 | AI Insights: Insights list page — replace chat-only UI (tabs, filters, cards, dismiss/snooze) | 3-4h | 🟡 Medium | 🟢 | [needs: DEV-226] | plan:ai-auto-bookkeeper-phase3 |
| DEV-228 | AI Insights: Monthly Close page + dashboard insight widget | 3-4h | 🟡 Medium | 🟢 | [needs: DEV-226,DEV-227] | plan:ai-auto-bookkeeper-phase3 |
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
| PERF-7 | Lazy-loading heavy frontend components | 1h | 🟡 Medium | 🟢 | | roadmap |
| DRY-10 | Create `@/lib/utils/date.ts` with formatDate/formatDateTime/formatDateSplit — consolidate 15+ inline implementations | 1.5h | 🟡 Medium | 🟢 | | inline-bandaid-audit |
| DRY-13 | Create `<EntitySelector>` component — wire API integration for 7 report views | 2h | 🟡 Medium | 🟢 | | inline-bandaid-audit |
| DRY-14 | Create global error tracking util — integrate Sentry in 3+ error.tsx files | 1.5h | 🟡 Medium | 🟢 | | inline-bandaid-audit |
| DRY-19 | Replace z.record(z.unknown()) in onboarding with typed schema | 30m | 🟡 Medium | 🟢 | | review:revie23feb |
| FIN-29 | Re-validate totals against line items in updateInvoice/updateBill PATCH | 1h | 🟡 Medium | 🟢 | | review:revie23feb |
| FIN-30 | Add linkedEntryId deduplication filter to GL report queries | 1h | 🟡 Medium | 🟢 | | review:revie23feb |
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
| DEV-11 | Overview: Add upcoming payments endpoint — bills due + expected invoice payments | 2-3h | 🟡 Medium | 🟢 | | audit:fe-be-parity |
| DEV-12 | Overview: Add action items endpoint — unreconciled txns, overdue invoices, overdue bills | 3-4h | 🟡 Medium | 🟢 | | audit:fe-be-parity |
| DEV-13 | Overview: Add cash flow time-series chart endpoint — historical cash position by day/week | 3-4h | 🟡 Medium | 🟢 | | audit:fe-be-parity |
| DEV-14 | Overview: Add expense breakdown by category endpoint for ExpenseChart | 2-3h | 🟡 Medium | 🟢 | | audit:fe-be-parity |
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
| DEV-34 | Overview: Goal Progress widget — progress bars for active goals, days to deadline | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-35 | Overview: Budget vs Actual widget — % of budget used this month, over-budget alerts | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-36 | Overview: Expense Forecast widget — projected monthly spend at current 3-month run rate | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
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
| DEV-99 | Planning: Add budget variance analysis endpoint — compare budget vs actual from GL | 3-4h | 🟡 Medium | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| DEV-100 | Planning: Add goal auto-tracking + milestone notifications | 3-4h | 🟡 Medium | 📦 | [needs: DEV-97] | audit:fe-be-parity |
| DEV-101 | Planning: Wire planning reports to existing accounting report endpoints | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-61 | Planning: Build forecasts page — cash flow projection chart | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-102 | Planning: Add Forecast model to Prisma + CRUD service (scenario modeling) | 4-6h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-62 | Planning: Add budget period selector with visual spend-rate indicator | 1-2h | 🟡 Medium | 📦 | [needs: UX-59] | audit:fe-be-parity |
| UX-63 | Planning: Add budget vs actual drill-down — click category to see transactions | 2-3h | 🟡 Medium | 📦 | [needs: DEV-99] | audit:fe-be-parity |
| DEV-103 | Planning: Add cash runway calculator — months remaining at burn rate | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-104 | Planning: Add seasonal pattern detection — highlight high/low revenue months | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-105 | Planning: Add budget alerts — threshold warnings at 80%/100% utilization | 2-3h | 🟡 Medium | 📦 | [needs: DEV-99] | audit:fe-be-parity |
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
| UX-65 | Planning: Add budget/goal export (CSV/PDF) | 2-3h | ⚪ Low | 📦 | | audit:fe-be-parity |
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
| SEC-25 | Global tax rate pollution: Make entityId required in create schema | 2026-02-24 |
| SEC-26 | Derive tenantId server-side in onboarding /complete endpoint | 2026-02-24 |
| DEV-180 | Overview: ProfitLossSummaryWidget component | 2026-02-24 |
| DEV-181 | Overview: TrialBalanceStatusWidget component | 2026-02-24 |
| DEV-182 | Overview: TopRevenueClientsWidget component | 2026-02-24 |
| DEV-183 | Overview: Add 3 report widgets to Overview page grid | 2026-02-24 |
| DEV-184 | Overview: Update loading skeleton for report widgets | 2026-02-24 |
| FIN-25 | Fix subtotal calculation bug in invoice & bill services | 2026-02-23 |
| FIN-27 | Fix document-posting.service.ts netAmount | 2026-02-23 |
| FIN-28 | Fix transfer baseCurrency calculation | 2026-02-23 |

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
| 6: Launch MVP | ████░░░░░░ 42% | — |

**Total Backend Tests:** 1345 (verified 2026-02-24)

---

> **Legend:** 🟢 ready · 📦 backlog · 🔒 blocked · 🟡 deferred · ✅ done
> **Priority:** 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low



<!-- TASK-INDEX:START (auto-generated, do not edit manually)
{
  "version": "1.0",
  "generated": "2026-02-26T05:11:17.282Z",
  "summary": {
    "total": 188,
    "ready": 67,
    "blocked": 6,
    "backlog": 114,
    "done": 0
  },
  "byPriority": {
    "critical": [
      "UX-103",
      "SEC-28",
      "DEV-190",
      "DEV-191",
      "DEV-197",
      "DEV-198",
      "DEV-200",
      "DEV-206",
      "DEV-209",
      "DEV-219",
      "DEV-223",
      "DEV-224"
    ],
    "high": [
      "INFRA-60",
      "DEV-202",
      "SEC-8",
      "INFRA-13",
      "DEV-97",
      "DEV-98",
      "UX-58",
      "UX-59",
      "UX-60",
      "DEV-185",
      "DEV-186",
      "DEV-187",
      "DEV-188",
      "DEV-189",
      "DEV-192",
      "DEV-193",
      "DEV-194",
      "DEV-195",
      "DEV-196",
      "DEV-203",
      "DEV-204",
      "DEV-205",
      "DEV-207",
      "DEV-208",
      "DEV-210",
      "DEV-215",
      "DEV-216",
      "DEV-217",
      "DEV-218",
      "DEV-220",
      "DEV-221",
      "DEV-222",
      "DEV-225",
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
      "DEV-199",
      "DEV-211",
      "DEV-212",
      "DEV-213",
      "DEV-214",
      "DEV-226",
      "DEV-227",
      "DEV-228",
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
      "PERF-7",
      "DRY-10",
      "DRY-13",
      "DRY-14",
      "DRY-19",
      "FIN-29",
      "FIN-30",
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
      "DEV-11",
      "DEV-12",
      "DEV-13",
      "DEV-14",
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
      "DEV-34",
      "DEV-35",
      "DEV-36",
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
      "DEV-99",
      "DEV-100",
      "DEV-101",
      "UX-61",
      "DEV-102",
      "UX-62",
      "UX-63",
      "DEV-103",
      "DEV-104",
      "DEV-105",
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
      "UX-65",
      "DEV-109",
      "DEV-110",
      "DEV-111",
      "DEV-119",
      "DEV-120"
    ]
  },
  "byEffort": {
    "quick": [
      "UX-103",
      "DEV-186"
    ],
    "short": [
      "SEC-28",
      "INFRA-60",
      "DEV-202",
      "DEV-185",
      "DEV-188",
      "DEV-189",
      "DEV-192",
      "DEV-195",
      "DEV-199",
      "DEV-211",
      "DEV-215",
      "DEV-216",
      "DEV-226",
      "PERF-7",
      "DRY-13",
      "DRY-19",
      "FIN-29",
      "FIN-30",
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
      "DEV-191",
      "SEC-8",
      "UX-58",
      "UX-59",
      "DEV-193",
      "DEV-194",
      "DEV-212",
      "DEV-219",
      "DEV-224",
      "DEV-227",
      "DEV-228",
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
      "DEV-12",
      "DEV-13",
      "DEV-33",
      "DEV-35",
      "DEV-39",
      "DEV-48",
      "DEV-51",
      "DEV-55",
      "DEV-56",
      "DEV-99",
      "DEV-100",
      "UX-61",
      "DEV-104",
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
      "DEV-190",
      "INFRA-13",
      "DEV-97",
      "DEV-98",
      "DEV-196",
      "DEV-83",
      "DEV-65",
      "DRY-10",
      "DRY-14",
      "DEV-89",
      "DEV-102",
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
      "UX-58",
      "UX-59",
      "UX-60",
      "UX-44",
      "UX-6",
      "UX-7",
      "UX-52",
      "UX-55",
      "UX-61",
      "UX-62",
      "UX-63",
      "UX-64",
      "UX-57",
      "UX-65"
    ],
    "security": [
      "SEC-28",
      "SEC-8",
      "SEC-10",
      "SEC-16",
      "SEC-15"
    ],
    "infrastructure": [
      "INFRA-60",
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
      "DEV-202",
      "DEV-190",
      "DEV-191",
      "DEV-197",
      "DEV-198",
      "DEV-200",
      "DEV-97",
      "DEV-98",
      "DEV-185",
      "DEV-186",
      "DEV-187",
      "DEV-188",
      "DEV-189",
      "DEV-192",
      "DEV-193",
      "DEV-194",
      "DEV-195",
      "DEV-196",
      "DEV-199",
      "DEV-203",
      "DEV-204",
      "DEV-205",
      "DEV-206",
      "DEV-207",
      "DEV-208",
      "DEV-209",
      "DEV-210",
      "DEV-211",
      "DEV-212",
      "DEV-213",
      "DEV-214",
      "DEV-215",
      "DEV-216",
      "DEV-217",
      "DEV-218",
      "DEV-219",
      "DEV-220",
      "DEV-221",
      "DEV-222",
      "DEV-223",
      "DEV-224",
      "DEV-225",
      "DEV-226",
      "DEV-227",
      "DEV-228",
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
      "DEV-11",
      "DEV-12",
      "DEV-13",
      "DEV-14",
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
      "DEV-34",
      "DEV-35",
      "DEV-36",
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
      "DEV-99",
      "DEV-100",
      "DEV-101",
      "DEV-102",
      "DEV-103",
      "DEV-104",
      "DEV-105",
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
    "performance": [
      "PERF-7",
      "PERF-10",
      "PERF-12",
      "PERF-4",
      "PERF-11"
    ],
    "code-quality": [
      "DRY-10",
      "DRY-13",
      "DRY-14",
      "DRY-19",
      "DRY-15",
      "DRY-5"
    ],
    "financial": [
      "FIN-29",
      "FIN-30",
      "FIN-7",
      "FIN-8",
      "FIN-9",
      "FIN-10",
      "FIN-16",
      "FIN-6",
      "FIN-11",
      "FIN-12"
    ],
    "architecture": [
      "ARCH-5",
      "ARCH-1",
      "ARCH-4",
      "ARCH-3"
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
    "UX-103",
    "SEC-28",
    "INFRA-60",
    "DEV-202",
    "DEV-190",
    "DEV-191",
    "DEV-197",
    "DEV-198",
    "DEV-200",
    "DEV-185",
    "DEV-186",
    "DEV-187",
    "DEV-188",
    "DEV-189",
    "DEV-192",
    "DEV-193",
    "DEV-194",
    "DEV-195",
    "DEV-196",
    "DEV-199",
    "DEV-203",
    "DEV-204",
    "DEV-205",
    "DEV-206",
    "DEV-207",
    "DEV-208",
    "DEV-209",
    "DEV-210",
    "DEV-211",
    "DEV-212",
    "DEV-213",
    "DEV-214",
    "DEV-215",
    "DEV-216",
    "DEV-217",
    "DEV-218",
    "DEV-219",
    "DEV-220",
    "DEV-221",
    "DEV-222",
    "DEV-223",
    "DEV-224",
    "DEV-225",
    "DEV-226",
    "DEV-227",
    "DEV-228",
    "PERF-7",
    "DRY-10",
    "DRY-13",
    "DRY-14",
    "DRY-19",
    "FIN-29",
    "FIN-30",
    "DEV-11",
    "DEV-12",
    "DEV-13",
    "DEV-14",
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
    "UX-103",
    "SEC-28",
    "INFRA-60",
    "DEV-202",
    "DEV-185",
    "DEV-186",
    "DEV-188",
    "DEV-189",
    "DEV-192",
    "DEV-195",
    "DEV-215",
    "DEV-216",
    "DS-1",
    "INFRA-2",
    "INFRA-3"
  ],
  "dashboard": [
    "DEV-199",
    "DEV-228"
  ],
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
    "SEC-28": {
      "line": 29,
      "title": "AI: Add `ai:actions` + `ai:monthly-close` to PERMISSION_MATRIX (RBAC prerequisite for AI features)",
      "effort": "30m",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "INFRA-60": {
      "line": 30,
      "title": "AI: Install `@fastify/rate-limit`, add per-endpoint limits to AI routes",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "DEV-202": {
      "line": 31,
      "title": "AI: Extract `resolveGLAccountByCode` to shared utility (`domains/accounting/utils/gl-resolve.ts`)",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-190": {
      "line": 32,
      "title": "AI: JE suggestion service — draft journal entries from categorized transactions + transfer detection guard (skip TRANSFER sourceType), zero-amount guard, conservation of value for multi-currency, Int 0-100 confidence",
      "effort": "4-6h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-191": {
      "line": 33,
      "title": "AI: JE suggestion API routes + tests (draft, preview endpoints) + JSON payload size limits in Zod schemas",
      "effort": "3-4h",
      "priority": "critical",
      "status": "ready",
      "deps": [
        "DEV-190"
      ],
      "domain": "development"
    },
    "DEV-197": {
      "line": 34,
      "title": "Accounting: Batch JE approval endpoint — wrap each individual approval in `$transaction` for atomicity",
      "effort": "2-3h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-198": {
      "line": 35,
      "title": "AI: Wire AIAction approval to execution — DRAFT JE cleanup on rejection (soft-delete JE + clear txn.journalEntryId), re-fetch/re-validate JE from DB on approval (never trust payload), registry pattern for executor dispatch",
      "effort": "2-3h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-200": {
      "line": 36,
      "title": "AI: Integration test — full auto-bookkeeper workflow E2E",
      "effort": "2-3h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "SEC-8": {
      "line": 37,
      "title": "Complete security audit (OWASP top 10, auth, tenant isolation, input validation)",
      "effort": "4h",
      "priority": "high",
      "status": "unknown",
      "deps": [],
      "domain": "security"
    },
    "INFRA-13": {
      "line": 38,
      "title": "Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import",
      "effort": "8-12h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "DEV-97": {
      "line": 39,
      "title": "Planning: Build Goal service + full CRUD (create/list/get/update/delete using Goal model)",
      "effort": "4-6h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-98": {
      "line": 40,
      "title": "Planning: Build Budget service + full CRUD (create/list/get/update/delete using Budget model)",
      "effort": "4-6h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-58": {
      "line": 41,
      "title": "Planning: Build goals page — list goals, create form, progress tracking",
      "effort": "3-4h",
      "priority": "high",
      "status": "backlog",
      "deps": [
        "DEV-97"
      ],
      "domain": "ux"
    },
    "UX-59": {
      "line": 42,
      "title": "Planning: Build budgets page — list budgets, create form, budget vs actual bars",
      "effort": "3-4h",
      "priority": "high",
      "status": "backlog",
      "deps": [
        "DEV-98"
      ],
      "domain": "ux"
    },
    "UX-60": {
      "line": 43,
      "title": "Planning: Add planning landing page at `/planning` with summary cards",
      "effort": "2-3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-185": {
      "line": 44,
      "title": "AI: Add `defaultGLAccountId` FK to Category model (schema migration) + document cross-scope FK (Category=tenant, GLAccount=entity), validate at runtime",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-186": {
      "line": 45,
      "title": "AI: Add `AI_SUGGESTION` to JournalEntrySourceType enum (schema migration)",
      "effort": "15m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-187": {
      "line": 46,
      "title": "AI: Enhance categorization with GL resolution + confidence tiers + sign-aware GL fallback (income→4990, expense→5990), refactor to class-based service, use extracted resolveGLAccountByCode",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-188": {
      "line": 47,
      "title": "AI: Batch categorize API endpoint + schema extraction",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-187"
      ],
      "domain": "development"
    },
    "DEV-189": {
      "line": 48,
      "title": "AI: Add Claude (Anthropic) provider to AIService + add ANTHROPIC_API_KEY to env.ts Zod schema, sanitize SDK errors",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-192": {
      "line": 49,
      "title": "AI: Create AIAction Prisma model + enums (schema migration) + remove INSIGHT from AIActionType enum (dead value), use confidence Int? (0-100 not Float 0-1)",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-193": {
      "line": 50,
      "title": "AI: AIAction service + AI domain error handler (CRUD, batch, stats) + validate expiresAt on approval",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-192"
      ],
      "domain": "development"
    },
    "DEV-194": {
      "line": 51,
      "title": "AI: Action Feed API routes + tests (list, approve, reject, batch, stats) + entityId required in batch ops, RBAC uses SEC-28 permissions",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-195": {
      "line": 52,
      "title": "AI: Wire JE/categorization services to create AIActions on suggestions",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-196": {
      "line": 53,
      "title": "AI: Frontend Action Feed UI (page, components, navigation, confidence badges)",
      "effort": "4-6h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-194"
      ],
      "domain": "development"
    },
    "DEV-199": {
      "line": 60,
      "title": "AI: Dashboard AI Action widget (glass card, pending count, quick-approve)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-203": {
      "line": 61,
      "title": "AI Rules: Rule service — CRUD operations (list, create, update, delete, toggle, stats)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-204": {
      "line": 62,
      "title": "AI Rules: Rule evaluation engine — condition evaluation, batch, first-match-wins, NO regex (contains/eq/gt/lt only), field allowlist",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-203"
      ],
      "domain": "development"
    },
    "DEV-205": {
      "line": 63,
      "title": "AI Rules: API routes + Zod schemas (CRUD, toggle, stats) + JSON payload size validation",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-206": {
      "line": 64,
      "title": "AI Rules: Hook rules into autoCategorize pipeline (rules before keywords, backward compatible)",
      "effort": "2-3h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-207": {
      "line": 65,
      "title": "AI Rules: Pattern detection service (3+ corrections threshold, keyword extraction, dedup)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-204"
      ],
      "domain": "development"
    },
    "DEV-208": {
      "line": 66,
      "title": "AI Rules: Rule suggestion generation service (creates RuleSuggestion + AIAction)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-209": {
      "line": 67,
      "title": "AI Rules: Wire correction triggers + RULE_SUGGESTION executor handler",
      "effort": "2-3h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-210": {
      "line": 68,
      "title": "AI Rules: Rule suggestion API routes + tests",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-211": {
      "line": 69,
      "title": "AI Rules: Frontend API client + types for rules",
      "effort": "1-2h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-212": {
      "line": 70,
      "title": "AI Rules: Rules management page (`/insights/rules`) + Sheet + navigation",
      "effort": "3-4h",
      "priority": "medium",
      "status": "ready",
      "deps": [
        "DEV-211"
      ],
      "domain": "development"
    },
    "DEV-213": {
      "line": 71,
      "title": "AI Rules: Rule condition builder component (visual AND/OR, field dropdowns)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [
        "DEV-212"
      ],
      "domain": "development"
    },
    "DEV-214": {
      "line": 72,
      "title": "AI Rules: Rule suggestions in Action Feed (card rendering, approve creates rule)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-215": {
      "line": 73,
      "title": "AI Insights: Schema enhancement — add dismiss/snooze fields + @@unique([entityId,triggerId])",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-216": {
      "line": 74,
      "title": "AI Insights: Types, constants, Zod schemas (7 types, 4 priorities, 5 statuses)",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-215"
      ],
      "domain": "development"
    },
    "DEV-217": {
      "line": 75,
      "title": "AI Insights: CRUD service (upsert dedup, dismiss, snooze, expire, counts)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-218": {
      "line": 76,
      "title": "AI Insights: API routes — replace 501 stubs (list, dismiss, snooze, generate, counts)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-217"
      ],
      "domain": "development"
    },
    "DEV-219": {
      "line": 77,
      "title": "AI Insights: Generator orchestrator service (fan-out to analyzers, AIAction bridge for critical)",
      "effort": "3-4h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-220": {
      "line": 78,
      "title": "AI Insights: Cash flow + overdue analyzers (pure functions, integer cents thresholds)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-219"
      ],
      "domain": "development"
    },
    "DEV-221": {
      "line": 79,
      "title": "AI Insights: Spending anomaly + duplicate expense analyzers (pure functions)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-219"
      ],
      "domain": "development"
    },
    "DEV-222": {
      "line": 80,
      "title": "AI Insights: Revenue trend + reconciliation gap analyzers (DB-access)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-219"
      ],
      "domain": "development"
    },
    "DEV-223": {
      "line": 81,
      "title": "AI Insights: Wire import trigger + optional generation timer (SYSTEM_USER_ID audit)",
      "effort": "2-3h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-224": {
      "line": 82,
      "title": "AI Insights: Monthly close readiness service (weighted score, atomic executeClose with post-lock re-validation, APPROVE-level RBAC)",
      "effort": "3-4h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-225": {
      "line": 83,
      "title": "AI Insights: Monthly close API routes + tests (readiness, execute, history)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-224"
      ],
      "domain": "development"
    },
    "DEV-226": {
      "line": 84,
      "title": "AI Insights: Frontend API client + types (insights + monthly close)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-227": {
      "line": 85,
      "title": "AI Insights: Insights list page — replace chat-only UI (tabs, filters, cards, dismiss/snooze)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "ready",
      "deps": [
        "DEV-226"
      ],
      "domain": "development"
    },
    "DEV-228": {
      "line": 86,
      "title": "AI Insights: Monthly Close page + dashboard insight widget",
      "effort": "3-4h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "UX-44": {
      "line": 87,
      "title": "Business: Add invoice/client list CSV/PDF export buttons",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-83": {
      "line": 88,
      "title": "Business: Build credit notes feature (CreditNote Prisma model exists, zero API endpoints or UI)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-61": {
      "line": 89,
      "title": "Accounting JE: Add multi-currency support to JE form (backend supports, form is single-currency only)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-62": {
      "line": 90,
      "title": "Accounting JE: Add batch approve (select multiple drafts → approve all)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-63": {
      "line": 91,
      "title": "Accounting: Add recurring journal entry templates (monthly depreciation, rent, etc.)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-64": {
      "line": 92,
      "title": "Accounting: Add journal entry CSV import (bulk import from external accounting software)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-65": {
      "line": 93,
      "title": "Accounting: Add account reconciliation page (compare GL vs bank statement balances)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-66": {
      "line": 94,
      "title": "Accounting: Add aged receivables/payables report (AR/AP aging 30/60/90+ day buckets)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-67": {
      "line": 95,
      "title": "Accounting: Add audit trail view (who approved/voided/created entries, timestamps)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-68": {
      "line": 96,
      "title": "Accounting: Add GL account merge/reclassify (move journal lines between accounts)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-69": {
      "line": 97,
      "title": "Accounting Reports: Add year-over-year comparison mode (multi-year P&L and BS trends)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "PERF-7": {
      "line": 98,
      "title": "Lazy-loading heavy frontend components",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "DRY-10": {
      "line": 99,
      "title": "Create `@/lib/utils/date.ts` with formatDate/formatDateTime/formatDateSplit — consolidate 15+ inline implementations",
      "effort": "1.5h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-13": {
      "line": 100,
      "title": "Create `<EntitySelector>` component — wire API integration for 7 report views",
      "effort": "2h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-14": {
      "line": 101,
      "title": "Create global error tracking util — integrate Sentry in 3+ error.tsx files",
      "effort": "1.5h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-19": {
      "line": 102,
      "title": "Replace z.record(z.unknown()) in onboarding with typed schema",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "FIN-29": {
      "line": 103,
      "title": "Re-validate totals against line items in updateInvoice/updateBill PATCH",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "financial"
    },
    "FIN-30": {
      "line": 104,
      "title": "Add linkedEntryId deduplication filter to GL report queries",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "financial"
    },
    "SEC-10": {
      "line": 105,
      "title": "Row-Level Security (PostgreSQL) for production hardening",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "UX-6": {
      "line": 106,
      "title": "Keyboard shortcuts for power users (command palette, table nav)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-7": {
      "line": 107,
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
      "line": 108,
      "title": "Distributed caching (Redis) for multi-instance deployment",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-12": {
      "line": 109,
      "title": "N+1 query monitoring / slow query detection in production (APM)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "FIN-7": {
      "line": 110,
      "title": "Fiscal period enforcement (prevent posting to locked periods)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-8": {
      "line": 111,
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
      "line": 112,
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
      "line": 113,
      "title": "Invoice/bill reconciliation workflows (AP/AR aging, match/approve)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "ARCH-5": {
      "line": 114,
      "title": "Error recovery patterns (idempotency keys, circuit breakers, retry with backoff)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-1": {
      "line": 115,
      "title": "OpenAPI spec auto-generation from Zod schemas (fastify-zod-openapi)",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-4": {
      "line": 116,
      "title": "Background job processing setup (BullMQ for PDF gen, email, imports)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "TEST-4": {
      "line": 117,
      "title": "Integration tests (API → DB → API roundtrip for critical flows)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "testing"
    },
    "DEV-11": {
      "line": 118,
      "title": "Overview: Add upcoming payments endpoint — bills due + expected invoice payments",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-12": {
      "line": 119,
      "title": "Overview: Add action items endpoint — unreconciled txns, overdue invoices, overdue bills",
      "effort": "3-4h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-13": {
      "line": 120,
      "title": "Overview: Add cash flow time-series chart endpoint — historical cash position by day/week",
      "effort": "3-4h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-14": {
      "line": 121,
      "title": "Overview: Add expense breakdown by category endpoint for ExpenseChart",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-18": {
      "line": 122,
      "title": "Overview: Balance Sheet Snapshot widget — asset:liability donut + equity trend",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "FIN-16": {
      "line": 123,
      "title": "Overview: Financial Health Ratios widget — current ratio, working capital, debt-to-equity",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "DEV-21": {
      "line": 124,
      "title": "Overview: Client Payment Health widget — % paid on time, avg days-to-payment, overdue count",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-22": {
      "line": 125,
      "title": "Overview: Invoice Aging Waterfall widget — AR buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-23": {
      "line": 126,
      "title": "Overview: Revenue by Category widget — revenue sources breakdown",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-24": {
      "line": 127,
      "title": "Overview: Top Expense Vendors widget — top 5 by YTD spend + % of total",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-25": {
      "line": 128,
      "title": "Overview: Bill Aging Waterfall widget — AP buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-26": {
      "line": 129,
      "title": "Overview: Vendor Payment Terms widget — on-time vs late payment performance",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-27": {
      "line": 130,
      "title": "Overview: Reconciliation Status widget — progress bar per account + unmatched count",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-28": {
      "line": 131,
      "title": "Overview: Import Health widget — last import date, success rate, failed imports",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-29": {
      "line": 132,
      "title": "Overview: Categorization Gap widget — % of transactions uncategorized by account",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-30": {
      "line": 133,
      "title": "Overview: Duplicate Detection Stats widget — duplicates detected this month",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-31": {
      "line": 134,
      "title": "Overview: Journal Entry Status widget — count by status, draft aging > 7d alert",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-32": {
      "line": 135,
      "title": "Overview: GL Posting Pipeline widget — pending bank feed txns waiting to post",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-33": {
      "line": 136,
      "title": "Overview: Ledger Spike Detection widget — accounts with unusual balance swings",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-34": {
      "line": 137,
      "title": "Overview: Goal Progress widget — progress bars for active goals, days to deadline",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-35": {
      "line": 138,
      "title": "Overview: Budget vs Actual widget — % of budget used this month, over-budget alerts",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-36": {
      "line": 139,
      "title": "Overview: Expense Forecast widget — projected monthly spend at current 3-month run rate",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-37": {
      "line": 140,
      "title": "Overview: Cash Runway widget — days of cash remaining at burn rate",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-38": {
      "line": 141,
      "title": "Overview: Multi-Currency Exposure widget — portfolio breakdown by currency + FX risk %",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-39": {
      "line": 142,
      "title": "Overview: Entity KPI Comparison widget — side-by-side entity performance",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-47": {
      "line": 143,
      "title": "Banking: Add transaction full-text search on description/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-48": {
      "line": 144,
      "title": "Banking: Add transaction split UI + endpoint (isSplit field exists, no implementation)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-49": {
      "line": 145,
      "title": "Banking: Show multi-currency amounts — display original + base currency on transactions",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-50": {
      "line": 146,
      "title": "Banking: Add transaction export (CSV/PDF) for filtered transaction views",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-51": {
      "line": 147,
      "title": "Banking: Add account balance history chart — historical balance trend over time",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-52": {
      "line": 148,
      "title": "Banking: Add duplicate management UI — view detected duplicates, approve/dismiss",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-53": {
      "line": 149,
      "title": "Banking: Add transaction auto-categorization rules UI (Rule model exists in AI domain)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-54": {
      "line": 150,
      "title": "Banking: Add batch transaction edit — bulk update description/category/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-55": {
      "line": 151,
      "title": "Banking: Recurring transaction detection — identify frequency patterns",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-56": {
      "line": 152,
      "title": "Banking: Add receipt/attachment upload per transaction",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-57": {
      "line": 153,
      "title": "Banking: Add CSV import column mapping UI (backend supports, frontend hardcoded)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-58": {
      "line": 154,
      "title": "Banking: Add import error detail view — show per-row errors when import partially fails",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-52": {
      "line": 155,
      "title": "Business: Add sort by columns on invoice/bill/client/vendor lists",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-85": {
      "line": 156,
      "title": "Business: Add bill PDF generation (invoice PDF exists, bills have no PDF)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-86": {
      "line": 157,
      "title": "Business: Add aging drill-down — click AR/AP aging bucket to see individual invoices/bills",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-87": {
      "line": 158,
      "title": "Business: Add duplicate invoice/bill detection — flag same vendor+amount+date",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-88": {
      "line": 159,
      "title": "Business: Add email reminder for overdue invoices",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-89": {
      "line": 160,
      "title": "Business: Add recurring invoice templates — auto-generate invoices on schedule",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-55": {
      "line": 161,
      "title": "Business: Add visual status pipeline on invoice/bill list — Draft→Sent→Partial→Paid",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-90": {
      "line": 162,
      "title": "Business: Add top debtors/creditors summary widget",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-91": {
      "line": 163,
      "title": "Business: Add invoice/bill/client/vendor CSV export",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-99": {
      "line": 164,
      "title": "Planning: Add budget variance analysis endpoint — compare budget vs actual from GL",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-98"
      ],
      "domain": "development"
    },
    "DEV-100": {
      "line": 165,
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
      "line": 166,
      "title": "Planning: Wire planning reports to existing accounting report endpoints",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-61": {
      "line": 167,
      "title": "Planning: Build forecasts page — cash flow projection chart",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-102": {
      "line": 168,
      "title": "Planning: Add Forecast model to Prisma + CRUD service (scenario modeling)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-62": {
      "line": 169,
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
      "line": 170,
      "title": "Planning: Add budget vs actual drill-down — click category to see transactions",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-99"
      ],
      "domain": "ux"
    },
    "DEV-103": {
      "line": 171,
      "title": "Planning: Add cash runway calculator — months remaining at burn rate",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-104": {
      "line": 172,
      "title": "Planning: Add seasonal pattern detection — highlight high/low revenue months",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-105": {
      "line": 173,
      "title": "Planning: Add budget alerts — threshold warnings at 80%/100% utilization",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-99"
      ],
      "domain": "development"
    },
    "UX-64": {
      "line": 174,
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
      "line": 175,
      "title": "Insights: Add route-level tests for `/api/ai/chat` and `/api/ai/categorize`",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-116": {
      "line": 176,
      "title": "Insights: Add RBAC tests for AI permission enforcement",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-117": {
      "line": 177,
      "title": "Insights: Wire AIBrief on dashboard to show real data",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-118": {
      "line": 178,
      "title": "Insights: Implement `GET /api/ai/insights` endpoint (replace 501 stub)",
      "effort": "2-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "SEC-16": {
      "line": 179,
      "title": "File retention policies (auto-cleanup of old uploads)",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "INFRA-11": {
      "line": 180,
      "title": "Database migration testing in CI pipeline",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "DEV-70": {
      "line": 181,
      "title": "Accounting Reports: One-click export all statements as ZIP",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DRY-15": {
      "line": 182,
      "title": "Standardize table header styling — create `<TableHead variant=\"label\">`",
      "effort": "30m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-5": {
      "line": 183,
      "title": "`window.Clerk` triple-cast in downloadReport: clean up type assertion",
      "effort": "30m",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "code-quality"
    },
    "DEV-40": {
      "line": 184,
      "title": "Overview: Onboarding Completion nudge widget — checklist of remaining steps",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-41": {
      "line": 185,
      "title": "Overview: Tax Liability Estimate widget",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-42": {
      "line": 186,
      "title": "Overview: Subscription MRR/ARR widget — recurring revenue detection",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-15": {
      "line": 187,
      "title": "Overview: Add top expense categories widget",
      "effort": "1-2h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-16": {
      "line": 188,
      "title": "Overview: Add unreconciled transaction count badge to dashboard",
      "effort": "1h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "PERF-4": {
      "line": 189,
      "title": "PDF generation: move to worker thread (unblock event loop)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-11": {
      "line": 190,
      "title": "Distributed rate limiting (Redis-backed) for multi-instance",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "FIN-6": {
      "line": 191,
      "title": "Cash Flow: document hardcoded account code ranges for categorization",
      "effort": "doc",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-11": {
      "line": 192,
      "title": "Consolidation/elimination accounting (multi-entity)",
      "effort": "8h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-12": {
      "line": 193,
      "title": "GAAP-compliant GL export format (XBRL/ixBRL regulatory reporting)",
      "effort": "6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "SEC-15": {
      "line": 194,
      "title": "Duplicate file detection for uploads",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "INFRA-12": {
      "line": 195,
      "title": "Usage analytics (companies, transactions, reports generated)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "DEV-93": {
      "line": 196,
      "title": "Business: Add payment receipt PDF generation",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-94": {
      "line": 197,
      "title": "Business: Add batch invoice creation — generate multiple from template",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-57": {
      "line": 198,
      "title": "Business: Add notes/activity log per client and vendor",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-106": {
      "line": 199,
      "title": "Planning: Add soft delete to Budget and Goal models (missing deletedAt)",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-107": {
      "line": 200,
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
      "line": 201,
      "title": "Planning: Add goal templates (emergency fund, revenue target, expense reduction)",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-97"
      ],
      "domain": "development"
    },
    "UX-65": {
      "line": 202,
      "title": "Planning: Add budget/goal export (CSV/PDF)",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-109": {
      "line": 203,
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
      "line": 204,
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
      "line": 205,
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
      "line": 206,
      "title": "Insights: Build Policy Alerts page with real data",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-120": {
      "line": 207,
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
      "line": 227,
      "title": "Figma-to-code token sync audit",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "design-system"
    },
    "DS-2": {
      "line": 228,
      "title": "Storybook setup for component documentation",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "design-system"
    },
    "MKT-1": {
      "line": 236,
      "title": "Landing page copy and design",
      "effort": "3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-2": {
      "line": 237,
      "title": "User documentation / getting started guide",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "CNT-1": {
      "line": 238,
      "title": "Competitive analysis update",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "content"
    },
    "INFRA-1": {
      "line": 248,
      "title": "CI/CD pipeline (GitHub Actions)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-2": {
      "line": 249,
      "title": "Production environment setup",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-3": {
      "line": 250,
      "title": "Database backups (automated daily)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "ARCH-3": {
      "line": 251,
      "title": "S3 cloud storage migration for file uploads (replace local filesystem)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "INFRA-5": {
      "line": 252,
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
      "line": 253,
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
      "line": 254,
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
      "line": 262,
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
      "line": 263,
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
