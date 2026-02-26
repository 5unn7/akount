# Akount — Task Board

**Last Updated:** 2026-02-25
**Current Phase:** Phase 6 — Launch MVP

> **152 active tasks** · 🔴 8 critical · 🟠 33 high · 🟡 82 medium · ⚪ 18 low
> 📦 74 backlog · 🟢 72 ready · 🔒 6 blocked · 🟡 1 deferred
>
> _Completed tasks (152) archived in [TASKS-ARCHIVE.md](TASKS-ARCHIVE.md)_
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
| UX-3 | Report tables: add `aria-*` attributes, caption, scope, role="progressbar" | 45m | 🟡 Medium | ✅ |  | review:nextjs |
| DOC-8 | Update domain status in apps/api/CLAUDE.md (Invoicing marked "stub" but is fully built) | 15m | ⚪ Low | 🟢 | | audit:2026-02-20 |
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
| UX-79 | Business: Add bill detail page at `/business/bills/[id]` | 2-3h | 🟡 Medium | 🟢 | | sitemap:audit |
| SEC-16 | File retention policies (auto-cleanup of old uploads) | 1h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| INFRA-11 | Database migration testing in CI pipeline | 2h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| DEV-70 | Accounting Reports: One-click export all statements as ZIP | 1-2h | ⚪ Low | 📦 | | audit:acct-fe-be |
| DRY-15 | Standardize table header styling — create `<TableHead variant="label">` | 30m | ⚪ Low | 🟢 | | inline-bandaid-audit |
| DRY-5 | `window.Clerk` triple-cast in downloadReport: clean up type assertion | 30m | ⚪ Low | 📦 | | review:typescript |
| DOC-5 | Add double-entry bookkeeping check to guardrails.md anti-patterns | 15m | ⚪ Low | 🟢 | | review:smooth-floating-mountain |
| DOC-6 | Update version dates across CLAUDE.md files | 15m | ⚪ Low | 🟢 | | review:smooth-floating-mountain |
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
| UX-81 | Business: Add payment detail page `/business/payments/[id]` | 2-3h | ⚪ Low | 🟢 | | sitemap:audit |

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
| MKT-3 | Install 3D dependencies (`@react-three/fiber`, `@react-three/drei`, `three`) | 15m | 🟠 High | 🟢 | | plan:marketing-landing-page |
| MKT-4 | Create hero section with 3D orb and parallax effect | 2-3h | 🟠 High | 🟢 | [needs: MKT-3] | plan:marketing-landing-page |
| MKT-5 | Create problem statement section (3 pain point cards) | 1-2h | 🟠 High | 🟢 | | plan:marketing-landing-page |
| MKT-6 | Create solution pillars section (3 GlowCard components) | 2h | 🟠 High | 🟢 | | plan:marketing-landing-page |
| MKT-7 | Create 3D feature showcase (interactive card grid) | 3-4h | 🟠 High | 🟢 | [needs: MKT-3] | plan:marketing-landing-page |
| MKT-8 | Create stats/social proof section (animated counters) | 1-2h | 🟠 High | 🟢 | | plan:marketing-landing-page |
| MKT-9 | Create final CTA section (gradient background, glass container) | 1h | 🟠 High | 🟢 | | plan:marketing-landing-page |
| MKT-10 | Create landing page layout (minimal nav + footer) | 1-2h | 🟠 High | 🟢 | | plan:marketing-landing-page |
| MKT-11 | Replace root page with landing (remove redirect) | 30m | 🟠 High | 🟢 | [needs: MKT-4,MKT-5,MKT-6,MKT-7,MKT-8,MKT-9,MKT-10] | plan:marketing-landing-page |
| MKT-12 | Add scroll animations and performance optimization (Lighthouse >90) | 2-3h | 🟠 High | 🟢 | [needs: MKT-11] | plan:marketing-landing-page |
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

## Uncommitted Work

| Item | Files | Status | Source |
|------|-------|--------|--------|
| Dashboard redesign (NetWorthHero, RecentTransactions, 7-stat left rail) | 14 modified + 4 new | needs review + commit | manual |
| Onboarding personal-first redesign (3 new steps, conditional flow) | 6 modified + 3 new | needs review + commit | manual |
| dialog.tsx UI component | 1 new | needs commit | manual |

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
