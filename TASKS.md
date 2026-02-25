# Akount — Task Board

**Last Updated:** 2026-02-24 16:58
**Current Phase:** Phase 6 — Launch MVP

> **223 product tasks** · 🔴 5 critical · 🟠 45 high · 🟡 113 medium · ⚪ 23 low · ✅ 114 done
> 216 active · 53% progress
>
> _Note: 43 Linear PM infrastructure tasks moved to [LINEAR-TASKS.md](LINEAR-TASKS.md)_

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
| ~~FIN-23~~ | ~~Fix `voidTransfer` balance reversal — voiding a transfer marks JEs as VOIDED but does NOT reverse account balances (financial integrity bug)~~ | 30-45m | 🔴 Critical | ✅ done | | review:transfer-service |
| SEC-8 | Complete security audit (OWASP top 10, auth, tenant isolation, input validation) | 4h | 🟠 High | 🟡 deferred | | roadmap |
| ~~SEC-24~~ | ~~GL Account service: _count queries don't filter by tenant (childAccounts, journalLines counts leak cross-tenant)~~ | 1h | 🟠 High | ✅ done | | pm:execute/UX-19 (18d40d1) |
| ~~TEST-1~~ | ~~Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests~~ | 3-4h | 🟠 High | ✅ done | | review:typescript (256b647) |
| TEST-2 | E2E tests for critical user flows (onboarding, import, posting, reports) | 4h | 🟠 High | 🟢 | | roadmap |
| TEST-3 | 80%+ API test coverage target | 2h | 🟠 High | 🟢 | | roadmap |
| ~~DEV-2~~ | ~~Service tests for client/invoice/bill/vendor services~~ | 3h | 🟠 High | ✅ done | | audit:smooth-floating-mountain (pre-existing) |
| ~~UX-8~~ | ~~Add loading/error states to remaining dashboard pages (~30 pages)~~ | 2h | 🟠 High | ✅ done | | plan:phase-6-tasks, plan:entity-selector-global.md (364ea9b) |
| ~~DEV-46~~ | ~~Banking: Implement transfers backend API + wire transfers page — inter-account transfers with journal entry creation (10/12 tasks complete, tests deferred)~~ | 4-6h | 🟠 High | ✅ | session | audit:fe-be-parity, sitemap:audit, plan:2026-02-21-banking-transfers.md |
| ~~UX-15~~ | ~~Banking: Add GL account linking UI on account detail~~ | 1-2h | 🟠 High | ✅ done | | audit:fe-be-parity, plan:banking-command-center.md |
| INFRA-13 | Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import | 8-12h | 🟠 High | 📦 | | audit:fe-be-parity |
| UX-18 | Accounting: Add landing page at `/accounting` with summary stats (draft JEs, account count, recent activity) | 2-3h | 🟠 High | 🟢 | | audit:acct-fe-be |
| ~~DEV-59~~ | ~~Accounting: Add transaction posting UI — post bank txns to GL~~ | 3-4h | 🟠 High | ✅ done | | audit:acct-fe-be |
| ~~UX-31~~ | ~~Business: Add search/filter bar on invoice, bill, client, vendor lists~~ | 2-3h | 🟠 High | ✅ done | cc6c96c | audit:app-ux |
| ~~UX-32~~ | ~~Business: Add pagination controls — cursor pagination + Load More~~ | 1-2h | 🟠 High | ✅ done | cc6c96c | audit:app-ux |
| DEV-71 | Business: Add invoice/bill edit for DRAFT status (PUT endpoints exist, no edit UI) | 2-3h | 🟠 High | 🟢 | | audit:app-ux, plan:phase-4-bill-and-get-paid.md |
| ~~DEV-72~~ | ~~Business: Void invoice full stack — schema + service + route + frontend (ef8ff46)~~ | 1h | 🟠 High | ✅ done | ef8ff46 | audit:app-ux, plan:phase-4-bill-and-get-paid.md |
| DEV-73 | Business: Add vendor CRUD — create/edit/delete (full backend API exists, frontend is read-only) | 2-3h | 🟠 High | 🟢 | | audit:app-ux, plan:phase-4-bill-and-get-paid.md |
| DEV-74 | Business: Add client CRUD — create/edit/delete (full backend API exists, only inline from invoice form) | 2-3h | 🟠 High | 🟢 | | audit:app-ux, plan:phase-4-bill-and-get-paid.md |
| ~~DEV-75~~ | ~~Business: Replace bills "Coming Soon" stub with real bill list page (API ready, `/business/bills` is placeholder)~~ | 2-3h | 🟠 High | ✅ | 1e987ed | audit:app-ux, plan:phase-4-bill-and-get-paid.md |
| ~~DEV-76~~ | ~~Business: Wire payment allocation UI — split payment across multiple invoices (PaymentAllocation model + endpoints exist)~~ | 3-4h | 🟠 High | ✅ done | | audit:app-ux, audit:fe-be-parity, plan:phase-4-bill-and-get-paid.md |
| ~~DEV-77~~ | ~~Business: Wire edit/delete invoice/bill/payment actions (PUT/DELETE endpoints exist, no UI)~~ | 2-3h | 🟠 High | ✅ done | | audit:app-ux, audit:fe-be-parity, plan:phase-4-bill-and-get-paid.md |
| ~~DEV-78~~ | ~~Business: Wire "Post to GL" button on payment allocation (backend route exists, no frontend trigger)~~ | 1h | 🟠 High | ✅ done | | audit:fe-be-parity, plan:phase-4-bill-and-get-paid.md |
| ~~UX-45~~ | ~~Business: Add quick "Record Payment" button on invoice detail page (shortcut to payment form)~~ | 1-2h | 🟠 High | ✅ done | | audit:fe-be-parity, plan:phase-4-bill-and-get-paid.md |
| DEV-97 | Planning: Build Goal service + full CRUD (create/list/get/update/delete using Goal model, migrate from Entity.metadata) | 4-6h | 🟠 High | 📦 | | audit:fe-be-parity |
| DEV-98 | Planning: Build Budget service + full CRUD (create/list/get/update/delete using Budget model) | 4-6h | 🟠 High | 📦 | | audit:fe-be-parity |
| UX-58 | Planning: Build goals page — list goals, create form, progress tracking, status updates | 3-4h | 🟠 High | 📦 | [needs: DEV-97] | audit:fe-be-parity |
| UX-59 | Planning: Build budgets page — list budgets, create form, budget vs actual bars | 3-4h | 🟠 High | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| UX-60 | Planning: Add planning landing page at `/planning` with summary cards (active goals, budget utilization, forecast status) | 2-3h | 🟠 High | 📦 | [needs: DEV-97, DEV-98] | audit:fe-be-parity |
| DEV-112 | Insights: Create API client (`apps/web/src/lib/api/ai.ts`) for 5 existing AI endpoints | 30m | 🟠 High | ✅ | commit 15a7ef4 | audit:ai-advisor [atomic] |
| DEV-113 | Insights: Build AI Chat interface on Insights page (wire to existing `POST /api/ai/chat`) | 2-3h | 🟠 High | ✅ | commit 1abfdae | audit:ai-advisor |
| DEV-185 | AI: Add `defaultGLAccountId` FK to Category model (schema migration) | 30m | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-186 | AI: Add `AI_SUGGESTION` to JournalEntrySourceType enum (schema migration) | 15m | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-187 | AI: Enhance categorization with GL resolution + confidence tiers | 2-3h | 🟠 High | 🟢 | [needs: DEV-185] | plan:ai-auto-bookkeeper-phase1 |
| DEV-188 | AI: Batch categorize API endpoint + schema extraction | 1-2h | 🟠 High | 🟢 | [needs: DEV-187] | plan:ai-auto-bookkeeper-phase1 |
| DEV-189 | AI: Add Claude (Anthropic) provider to AIService | 1-2h | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-190 | AI: JE suggestion service — draft journal entries from categorized transactions | 4-6h | 🔴 Critical | 🟢 | [needs: DEV-185,DEV-186,DEV-187,DEV-189] | plan:ai-auto-bookkeeper-phase1 |
| DEV-191 | AI: JE suggestion API routes + tests (draft, preview endpoints) | 3-4h | 🔴 Critical | 🟢 | [needs: DEV-190] | plan:ai-auto-bookkeeper-phase1 |
| DEV-192 | AI: Create AIAction Prisma model + enums (schema migration) | 30m | 🟠 High | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-193 | AI: AIAction service + AI domain error handler (CRUD, batch, stats) | 3-4h | 🟠 High | 🟢 | [needs: DEV-192] | plan:ai-auto-bookkeeper-phase1 |
| DEV-194 | AI: Action Feed API routes + tests (list, approve, reject, batch, stats) | 3-4h | 🟠 High | 🟢 | [needs: DEV-193] | plan:ai-auto-bookkeeper-phase1 |
| DEV-195 | AI: Wire JE/categorization services to create AIActions on suggestions | 1-2h | 🟠 High | 🟢 | [needs: DEV-190,DEV-193] | plan:ai-auto-bookkeeper-phase1 |
| DEV-196 | AI: Frontend Action Feed UI (page, components, navigation, confidence badges) | 4-6h | 🟠 High | 🟢 | [needs: DEV-194] | plan:ai-auto-bookkeeper-phase1 |
| DEV-197 | Accounting: Batch JE approval endpoint with partial success handling | 2-3h | 🔴 Critical | 🟢 | | plan:ai-auto-bookkeeper-phase1 |
| DEV-198 | AI: Wire AIAction approval to execution (action-executor service) | 2-3h | 🔴 Critical | 🟢 | [needs: DEV-193,DEV-195,DEV-197] | plan:ai-auto-bookkeeper-phase1 |
| DEV-199 | AI: Dashboard AI Action widget (glass card, pending count, quick-approve) | 1-2h | 🟡 Medium | 🟢 | [needs: DEV-194,DEV-196] | plan:ai-auto-bookkeeper-phase1 |
| DEV-200 | AI: Integration test — full auto-bookkeeper workflow E2E | 2-3h | 🔴 Critical | 🟢 | [needs: DEV-191,DEV-194,DEV-197,DEV-198] | plan:ai-auto-bookkeeper-phase1 |
| SEC-25 | Global tax rate pollution: Make entityId required in create schema | 30m | 🔴 Critical | 🟢 | | review:revie23feb |
| SEC-26 | Derive tenantId server-side in onboarding /complete endpoint | 30m | 🔴 Critical | 🟢 | | review:revie23feb |
| UX-103 | Fix HeroSection SSR wrapper import (bypass dynamic ssr:false) | 5m | 🔴 Critical | 🟢 | | review:revie23feb |

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| UX-33 | App-wide: Add cross-links between related records — Invoice↔Client, Transaction↔JournalEntry, Bill↔Vendor, Payment↔Invoice/Bill (isolated views currently) | 2-3h | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-34 | App-wide: Add bulk operations to list pages — Business (batch send/approve invoices, batch approve bills), Banking (batch deactivate accounts) | 3-4h | 🟡 Medium | 📦 | | audit:app-ux |
| ~~UX-36~~ | ~~Business: Add standalone "Create Client" / "Create Vendor" buttons on list pages (currently only via invoice/bill forms)~~ | 1h | 🟡 Medium | ✅ done | | audit:app-ux |
| UX-44 | Business: Add invoice/client list CSV/PDF export buttons | 2-3h | 🟡 Medium | 📦 | | audit:app-ux |
| DEV-83 | Business: Build credit notes feature (CreditNote Prisma model exists, zero API endpoints or UI) | 4-6h | 🟡 Medium | 📦 | | audit:app-ux |
| DEV-84 | App-wide: Fix navigation.ts mismatches — Bills route points to stub, verify all nav items match real pages | 30m | 🟡 Medium | ✅ done | | audit:app-ux [atomic] |
| UX-19 | Accounting COA: Add search input for GL accounts (backend `search` param exists, UI only has type filter) | 30m | 🟡 Medium | ✅ done | d7e9e90 | audit:acct-fe-be |
| ~~UX-20~~ | ~~Accounting COA: Add reactivate button for deactivated accounts (PATCH isActive:true works, no UI)~~ | 15m | 🟡 Medium | ✅ done | | audit:acct-fe-be |
| UX-21 | Accounting COA: Add balance summary header (Total Assets/Liabilities/Equity cards, data already fetched) | 1h | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| UX-22 | Accounting JE: Fix filter auto-refresh (date/status changes don't re-fetch, only affect loadMore) | 1h | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| UX-24 | Accounting JE: Add "Duplicate Entry" action to pre-fill form from existing entry | 1h | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| UX-25 | Accounting Reports: Add quick-generate buttons (Last Month / This Quarter / YTD) on report hub cards | 1h | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| DEV-61 | Accounting JE: Add multi-currency support to JE form (backend supports, form is single-currency only) | 2-3h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-62 | Accounting JE: Add batch approve (select multiple drafts → approve all, needs new backend endpoint) | 2-3h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-63 | Accounting: Add recurring journal entry templates (monthly depreciation, rent, etc.) | 3-4h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-64 | Accounting: Add journal entry CSV import (bulk import from external accounting software) | 3-4h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-65 | Accounting: Add account reconciliation page (compare GL vs bank statement balances) | 4-6h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-66 | Accounting: Add aged receivables/payables report (AR/AP aging 30/60/90+ day buckets) | 3-4h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-67 | Accounting: Add audit trail view (who approved/voided/created entries, timestamps) | 2-3h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-68 | Accounting: Add GL account merge/reclassify (move journal lines between accounts) | 3-4h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-69 | Accounting Reports: Add year-over-year comparison mode (multi-year P&L and BS trends) | 2-3h | 🟡 Medium | 📦 | | audit:acct-fe-be |
| DEV-70 | Accounting Reports: One-click export all statements as ZIP | 1-2h | ⚪ Low | 📦 | | audit:acct-fe-be |
| PERF-2 | Revenue: add JSONB expression index for extraction | 30m | 🟡 Medium | ✅ done | | review:performance [atomic] |
| PERF-3 | Recharts: code-split import (lazy load) | 30m | 🟡 Medium | ✅ done | | review:performance [atomic] |
| PERF-7 | Lazy-loading heavy frontend components | 1h | 🟡 Medium | 🟢 | | roadmap [atomic] |
| DRY-2 | CSV sanitization: deduplicate between report-export and data-export | 30m | 🟡 Medium | ✅ done | | review:simplicity [atomic] |
| ~~DRY-3~~ | ~~Report routes: extract shared 40-line handler pattern into helper~~ | 1h | 🟡 Medium | ✅ done | | review:simplicity [atomic] |
| ~~DRY-8~~ | ~~Transfer routes: refactor string-matching error handling to use `AccountingError.statusCode` pattern (consistent with all other routes)~~ | 15-20m | 🟡 Medium | ✅ done | | review:transfer-service [atomic] |
| ~~DRY-9~~ | ~~Remove formatCurrency duplicates — consolidate 5+ inline implementations to `@/lib/utils/currency`~~ | 1h | 🔴 High | ✅ done | 3860bf0 | inline-bandaid-audit [atomic] |
| DRY-10 | Create `@/lib/utils/date.ts` with formatDate/formatDateTime/formatDateSplit — consolidate 15+ inline implementations | 1.5h | 🟡 Medium | 🟢 | | inline-bandaid-audit [atomic] |
| DRY-11 | ~~Extract StatusBadge components to `packages/ui` — create InvoiceStatusBadge, BillStatusBadge, AccountStatusBadge~~ | 2h | 🟡 Medium | ✅ done | 7640e1f | inline-bandaid-audit |
| DRY-12 | ~~Create `<EmptyState>` component — consolidate 11+ inline empty state patterns~~ | 1h | 🟢 Low | ✅ done | 913fa60 | inline-bandaid-audit [atomic] |
| DRY-13 | Create `<EntitySelector>` component — wire API integration for 7 report views | 2h | 🟡 Medium | 🟢 | | inline-bandaid-audit |
| DRY-14 | Create global error tracking util — integrate Sentry in 3+ error.tsx files | 1.5h | 🟡 Medium | 🟢 | | inline-bandaid-audit |
| DRY-15 | Standardize table header styling — create `<TableHead variant="label">` with `text-micro` utility | 30m | 🟢 Low | 🟢 | | inline-bandaid-audit [atomic] |
| ~~DRY-17~~ | ~~Refactor StatusBadges to use base Badge component + fix semantic token violations~~ | 1-2h | 🟡 Medium | ✅ done | 4ce91e4 | ad-hoc:session |
| ~~FIN-24~~ | ~~Transfer service: extract overdraft-allowed account types constant + add multi-currency limitation doc comment~~ | 10m | ⚪ Low | ✅ done | | review:transfer-service [atomic] |
| ~~FIN-25~~ | ~~Fix subtotal calculation bug in invoice & bill services — backend subtracts tax from pre-tax amount, blocking all creation~~ | <1h | 🔴 Critical | ✅ done | 81cb868 | diagnose:invoice-form |
| ~~FIN-26~~ | ~~Wire taxRateId to invoice/bill line items — accept in Zod schema, pass through service to Prisma~~ | 1-2h | 🔴 High | ✅ done | [needs: FIN-25] | diagnose:invoice-form |
| ~~FIN-27~~ | ~~Fix document-posting.service.ts netAmount — same pre-tax bug as FIN-25, under-credits Revenue and under-debits Expense in JEs~~ | <1h | 🔴 Critical | ✅ done | a88a2bb | diagnose:financial-audit |
| ~~FIN-28~~ | ~~Fix transfer baseCurrency calculation — exchangeRate applied twice for foreign-currency side, JEs don't balance in base currency~~ | <1h | 🔴 Critical | ✅ done | 36c2dd8 | diagnose:financial-audit |
| ~~UX-102~~ | ~~Replace manual tax input with tax rate dropdown + auto-calculation in LineItemBuilder~~ | 2-4h | 🔴 High | ✅ done | [needs: FIN-26] | diagnose:invoice-form |
| UX-3 | Report tables: add `aria-*` attributes, caption, scope, role="progressbar" | 45m | 🟡 Medium | 🟢 | | review:nextjs [atomic] |
| UX-4 | Report views: replace array index React keys with stable identifiers | 15m | 🟡 Medium | 🟢 | | review:nextjs [atomic] |
| DOC-2 | Consolidate logging rules (full version in api-conventions.md, update guardrails.md ref) | 30m | 🟡 Medium | ✅ done | | review:smooth-floating-mountain [atomic] |
| DOC-3 | Archive .reviews/ temp workspace to docs/reviews/ or delete | 15m | 🟡 Medium | 🟢 | | review:smooth-floating-mountain [atomic] |
| DOC-7 | Update test/page counts in context files (apps/api: 362→1010 tests, apps/web: 38→54 pages, root: 38→40 models) | 30m | ⚪ Low | ✅ done | | audit:2026-02-20 [atomic] |
| DOC-8 | Update domain status in apps/api/CLAUDE.md (Invoicing marked "stub" but is fully built) | 15m | ⚪ Low | 🟢 | | audit:2026-02-20 [atomic] |
| SEC-27 | Fix listTaxRates to include custom rates when entityId absent | 30m | 🟠 High | 🟢 | | review:revie23feb |
| DRY-18 | Sanitize invoice number in Content-Disposition header (HTTP response splitting risk) | 20m | 🟠 High | 🟢 | | review:revie23feb |
| DRY-19 | Replace z.record(z.unknown()) in onboarding with typed schema | 30m | 🟡 Medium | 🟢 | | review:revie23feb |
| FIN-29 | Re-validate totals against line items in updateInvoice/updateBill PATCH | 1h | 🟡 Medium | 🟢 | | review:revie23feb |
| FIN-30 | Add linkedEntryId deduplication filter to GL report queries | 1h | 🟡 Medium | 🟢 | | review:revie23feb |
| UX-104 | Fix static key="create" bug in ClientForm/VendorForm (stale data on switch) | 20m | 🟡 Medium | 🟢 | | review:revie23feb |
| UX-105 | Move UpcomingPayments fetch to server component (eliminate waterfall) | 30m | 🟡 Medium | 🟢 | | review:revie23feb |
| DRY-20 | Strengthen StatusBadge types (enum union vs string) | 30m | 🟡 Medium | 🟢 | | review:revie23feb |
| DRY-21 | Extract inline formatCents/parseCentsInput to shared utility | 20m | 🟡 Medium | 🟢 | | review:revie23feb |
| TEST-5 | Add assertIntegerCents to transfer.service.test.ts | 15m | 🟡 Medium | 🟢 | | review:revie23feb |
| TEST-6 | Write tests for data-export and report-export services | 2h | 🟡 Medium | 🟢 | | review:revie23feb |
| SEC-10 | Row-Level Security (PostgreSQL) for production hardening | 3h | 🟡 Medium | 📦 | | roadmap |
| UX-6 | Keyboard shortcuts for power users (command palette, table nav) | 2h | 🟡 Medium | 📦 | | roadmap |
| UX-7 | Help overlay documenting keyboard shortcuts | 1h | 🟡 Medium | 🔒 | [needs: UX-6] | roadmap |
| SEC-12 | File upload quota enforcement per tenant (prevent abuse/DoS) | 1h | 🟡 Medium | 🟢 | | review:smooth-floating-mountain §2.2.3 [atomic] |
| SEC-14 | Audit log retention policies (prevent unbounded growth, compliance) | 1h | 🟡 Medium | 🟢 | | review:smooth-floating-mountain §2.2.4 [atomic] |
| PERF-10 | Distributed caching (Redis) for multi-instance deployment | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain §2.1.1 |
| PERF-12 | N+1 query monitoring / slow query detection in production (APM) | 2h | 🟡 Medium | 📦 | | review:smooth-floating-mountain §2.1.3 |
| FIN-7 | Fiscal period enforcement (prevent posting to locked periods) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain §2.3.2 |
| FIN-8 | Fiscal year close process (closing entries, revenue → retained earnings) | 4h | 🟡 Medium | 📦 | [needs: FIN-7] | review:smooth-floating-mountain §2.3.2 |
| FIN-9 | Multi-currency revaluation on period close (FX gains/losses, IFRS/GAAP) | 4h | 🟡 Medium | 📦 | [needs: FIN-8] | review:smooth-floating-mountain §2.3.1 |
| FIN-10 | Invoice/bill reconciliation workflows (AP/AR aging, match/approve) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain §2.3.4 |
| ARCH-5 | Error recovery patterns (idempotency keys, circuit breakers, retry with backoff) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain §2.2.2 |
| ARCH-1 | OpenAPI spec auto-generation from Zod schemas (fastify-zod-openapi) | 3h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| ARCH-4 | Background job processing setup (BullMQ for PDF gen, email, imports) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| TEST-4 | Integration tests (API → DB → API roundtrip for critical flows) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| DRY-7 | Dashboard page.tsx: extract 120+ lines of data transformation to `lib/dashboard/transformers.ts` | 30m | 🟡 Medium | ✅ done | | review:dashboard-overview [atomic] |
| DS-4 | ExpenseChart: replace inline `backgroundColor` with token-mapped CSS variables | 30m | 🟡 Medium | ✅ done | | review:dashboard-overview [atomic] |
| FIN-14 | DashboardService: document or fix float arithmetic in FX conversion (`Math.abs(balance) * rate`) | 30m | 🟡 Medium | ✅ done | | review:dashboard-overview [atomic] |
| DEV-11 | Overview: Add upcoming payments endpoint — bills due + expected invoice payments (RightRail placeholder) | 2-3h | 🟡 Medium | 🟢 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-12 | Overview: Add action items endpoint — unreconciled txns, overdue invoices, overdue bills (RightRail placeholder) | 3-4h | 🟡 Medium | 🟢 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-13 | Overview: Add cash flow time-series chart endpoint — historical cash position by day/week (CashFlowChart placeholder) | 3-4h | 🟡 Medium | 🟢 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-14 | Overview: Add expense breakdown by category endpoint for ExpenseChart (placeholder component) | 2-3h | 🟡 Medium | 🟢 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| ~~DEV-17~~ | ~~Overview: P&L Summary mini-widget — revenue vs expense bars + YTD trend (ReportService ready)~~ **SUPERSEDED by DEV-179+DEV-180** | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-18 | Overview: Balance Sheet Snapshot widget — asset:liability donut + equity trend (ReportService ready) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| ~~DEV-19~~ | ~~Overview: Trial Balance Status widget — balanced alert + account type counts (ReportService ready)~~ **SUPERSEDED by DEV-179+DEV-181** | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| FIN-16 | Overview: Financial Health Ratios widget — current ratio, working capital, debt-to-equity, profit margin (computed from BS+P&L) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| ~~DEV-20~~ | ~~Overview: Top Revenue Clients widget — top 5 by YTD revenue + concentration % (ReportService ready)~~ **SUPERSEDED by DEV-179+DEV-182** | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-179 | Overview Widgets: Add client-side API functions for P&L, Trial Balance, and Revenue reports (dashboard-client.ts) | 30m | 🟡 Medium | ✅ | commit:b6b09b1 | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-180 | Overview Widgets: Create ProfitLossSummaryWidget component — revenue vs expense bars + YTD trend | 1h | 🟡 Medium | 🟢 | | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-181 | Overview Widgets: Create TrialBalanceStatusWidget component — balanced alert + account type counts | 45m | 🟡 Medium | 🟢 | | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-182 | Overview Widgets: Create TopRevenueClientsWidget component — top 5 by YTD revenue + concentration % | 1h | 🟡 Medium | 🟢 | | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-183 | Overview Widgets: Add 3 report widgets to Overview page grid layout (responsive 3-col) | 30m | 🟡 Medium | 🟢 | [needs: DEV-180, DEV-181, DEV-182] | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-184 | Overview Widgets: Update Overview loading skeleton to include report widgets row | 15m | 🟡 Medium | 🟢 | [needs: DEV-183] | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-21 | Overview: Client Payment Health widget — % paid on time, avg days-to-payment, overdue count (Invoice model) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-22 | Overview: Invoice Aging Waterfall widget — AR buckets 0-30, 31-60, 61-90, 90+ days | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-23 | Overview: Revenue by Category widget — revenue sources breakdown from InvoiceLine + Category | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-24 | Overview: Top Expense Vendors widget — top 5 by YTD spend + % of total (Bill + vendor aggregations) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-25 | Overview: Bill Aging Waterfall widget — AP buckets 0-30, 31-60, 61-90, 90+ days | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-26 | Overview: Vendor Payment Terms widget — on-time vs late payment performance | 2h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-27 | Overview: Reconciliation Status widget — progress bar per account + unmatched count (ReconciliationService ready) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-28 | Overview: Import Health widget — last import date, success rate, failed imports (ImportBatch model) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-29 | Overview: Categorization Gap widget — % of transactions uncategorized by account (Transaction.categoryId) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-30 | Overview: Duplicate Detection Stats widget — duplicates detected this month (duplication.service) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-31 | Overview: Journal Entry Status widget — count by status (DRAFT/POSTED/VOIDED), draft aging > 7d alert | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-32 | Overview: GL Posting Pipeline widget — pending bank feed txns waiting to post, oldest first | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-33 | Overview: Ledger Spike Detection widget — accounts with unusual balance swings this month | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-34 | Overview: Goal Progress widget — progress bars for active goals, days to deadline (Goal model) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-35 | Overview: Budget vs Actual widget — % of budget used this month, over-budget alerts (Budget model) | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-36 | Overview: Expense Forecast widget — projected monthly spend at current 3-month run rate | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-37 | Overview: Cash Runway widget — days of cash remaining at burn rate, healthy/monitor/critical | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-38 | Overview: Multi-Currency Exposure widget — portfolio breakdown by currency + FX risk % | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-39 | Overview: Entity KPI Comparison widget — side-by-side entity performance for multi-business users | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-40 | Overview: Onboarding Completion nudge widget — checklist of remaining steps (OnboardingProgress model) | 1-2h | ⚪ Low | 📦 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-41 | Overview: Tax Liability Estimate widget — estimated taxes due this quarter (needs tax rules engine) | 4-6h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-42 | Overview: Subscription MRR/ARR widget — recurring revenue detection for SaaS solopreneurs | 4-6h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-47 | Banking: Add transaction full-text search on description/notes | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-48 | Banking: Add transaction split UI + endpoint (isSplit field exists, no implementation) | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-49 | Banking: Show multi-currency amounts — display original + base currency on transactions | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-50 | Banking: Add transaction export (CSV/PDF) for filtered transaction views | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-51 | Banking: Add account balance history chart — historical balance trend over time | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-52 | Banking: Add duplicate management UI — view detected duplicates, approve/dismiss | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-53 | Banking: Add transaction auto-categorization rules UI (Rule model exists in AI domain) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-54 | Banking: Add batch transaction edit — bulk update description/category/notes | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-55 | Banking: Recurring transaction detection — identify frequency patterns (e.g. Netflix monthly, API subscriptions) | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-56 | Banking: Add receipt/attachment upload per transaction (notes field exists, need file storage) | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-57 | Banking: Add CSV import column mapping UI (backend supports columnMappings, frontend hardcoded) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-58 | Banking: Add import error detail view — show per-row errors when import partially fails | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-52 | Business: Add sort by columns on invoice/bill/client/vendor lists (backend supports orderBy) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-85 | Business: Add bill PDF generation (invoice PDF exists, bills have no PDF) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-86 | Business: Add aging drill-down — click AR/AP aging bucket to see individual invoices/bills | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-87 | Business: Add duplicate invoice/bill detection — flag same vendor+amount+date combinations | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-88 | Business: Add email reminder for overdue invoices (mark-overdue endpoint exists, no notification) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-89 | Business: Add recurring invoice templates — auto-generate invoices on schedule | 4-6h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-54 | Business: Auto-fill due date from client/vendor payment terms (terms field exists, not used in form) | 30m | 🟡 Medium | ✅ done | | audit:fe-be-parity [atomic] |
| UX-55 | Business: Add visual status pipeline on invoice/bill list — Draft→Sent→Partial→Paid flow | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-90 | Business: Add top debtors/creditors summary widget — clients with most outstanding AR, vendors with most AP | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-91 | Business: Add invoice/bill/client/vendor CSV export | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-93 | Business: Add payment receipt PDF generation | 2-3h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-94 | Business: Add batch invoice creation — generate multiple invoices from template | 3-4h | ⚪ Low | 📦 | | audit:fe-be-parity |
| UX-57 | Business: Add notes/activity log per client and vendor (notes field exists, no UI) | 2-3h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-99 | Planning: Add budget variance analysis endpoint — compare budget amount vs actual spend from GL/transactions | 3-4h | 🟡 Medium | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| DEV-100 | Planning: Add goal auto-tracking + milestone notifications — calculate currentAmount from linked account/category, alert at 25/50/75/100% | 3-4h | 🟡 Medium | 📦 | [needs: DEV-97] | audit:fe-be-parity |
| DEV-101 | Planning: Wire planning reports to existing accounting report endpoints (reuse P&L/BS/CF, don't duplicate) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-61 | Planning: Build forecasts page — cash flow projection chart using historical transaction trends | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-102 | Planning: Add Forecast model to Prisma + CRUD service (scenario modeling: optimistic/pessimistic/baseline) | 4-6h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-62 | Planning: Add budget period selector (monthly/quarterly/yearly) with visual spend-rate indicator | 1-2h | 🟡 Medium | 📦 | [needs: UX-59] | audit:fe-be-parity |
| UX-63 | Planning: Add budget vs actual drill-down — click category to see transactions contributing to spend | 2-3h | 🟡 Medium | 📦 | [needs: DEV-99] | audit:fe-be-parity |
| DEV-103 | Planning: Add cash runway calculator — months remaining at current burn rate, healthy/warning/critical indicator | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-104 | Planning: Add seasonal pattern detection — highlight historically high/low revenue months from transaction data | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-105 | Planning: Add budget alerts — threshold warnings at 80%/100% utilization, surfaced to dashboard action items | 2-3h | 🟡 Medium | 📦 | [needs: DEV-99] | audit:fe-be-parity |
| UX-64 | Planning: Add goal trajectory projection — trend line showing "on pace" vs "behind" based on progress rate | 2-3h | 🟡 Medium | 📦 | [needs: DEV-100] | audit:fe-be-parity |
| DEV-106 | Planning: Add soft delete to Budget and Goal models (missing deletedAt — financial invariant gap) | 1h | ⚪ Low | 📦 | | audit:fe-be-parity [atomic] |
| DEV-107 | Planning: Add AI-powered expense forecast — predict next month spend using 3-month trend + seasonality | 4-6h | ⚪ Low | 📦 | [needs: DEV-104] | audit:fe-be-parity |
| DEV-108 | Planning: Add goal templates — pre-built goals (emergency fund, revenue target, expense reduction) | 2-3h | ⚪ Low | 📦 | [needs: DEV-97] | audit:fe-be-parity |
| UX-65 | Planning: Add budget/goal export (CSV/PDF) | 2-3h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-109 | Planning: Add budget rollover — option to carry unused budget forward to next period | 1-2h | ⚪ Low | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| DEV-110 | Planning: Add "What-if" scenario comparison — side-by-side view of 2-3 forecast scenarios | 4-6h | ⚪ Low | 📦 | [needs: DEV-102] | audit:fe-be-parity |
| DEV-111 | Planning: Auto-suggest budgets from existing spending patterns — pre-fill amounts from 3-month category averages | 2-3h | ⚪ Low | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| DEV-114 | Insights: Extract shared AI types to `packages/types/src/ai.ts` (currently only in backend `services/types.ts`) | 20m | 🟡 Medium | ✅ done | | audit:ai-advisor [atomic] |
| DEV-115 | Insights: Add route-level tests for `/api/ai/chat` and `/api/ai/categorize` endpoints | 1h | 🟡 Medium | 🟢 | | audit:ai-advisor |
| DEV-116 | Insights: Add RBAC tests for AI permission enforcement (verify 403 for insufficient roles) | 30m | 🟡 Medium | 🟢 | | audit:ai-advisor |
| DEV-117 | Insights: Wire AIBrief on dashboard to show real data (generate basic insight from transaction trends) | 1h | 🟡 Medium | 📦 | [needs: DEV-112] | audit:ai-advisor |
| DEV-118 | Insights: Implement `GET /api/ai/insights` endpoint (replace 501 stub, use Insight Prisma model) | 2-4h | 🟡 Medium | 📦 | | audit:ai-advisor |
| DEV-119 | Insights: Build Policy Alerts page with real data (requires new BE endpoint for rule-based alerts) | 3-4h | ⚪ Low | 📦 | | audit:ai-advisor |
| DEV-120 | Insights: Build History page with AI interaction logging (requires new BE endpoint + model) | 2-3h | ⚪ Low | 📦 | [needs: DEV-118] | audit:ai-advisor |
| DOC-4 | Elevate source preservation to explicit 5th invariant in guardrails.md | 15m | 🟡 Medium | 🟢 | | review:smooth-floating-mountain §1.2 [atomic] |
| DEV-15 | Overview: Add top expense categories widget (data exists in categorized transactions) | 1-2h | ⚪ Low | 🟢 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| DEV-16 | Overview: Add unreconciled transaction count badge to dashboard | 1h | ⚪ Low | 🟢 | | audit:fe-be-parity, plan:command-center-dashboard.md |
| PERF-4 | PDF generation: move to worker thread (unblock event loop) | 2h | ⚪ Low | 📦 | | review:performance |
| PERF-11 | Distributed rate limiting (Redis-backed) for multi-instance | 2h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.1.4 |
| DRY-5 | `window.Clerk` triple-cast in downloadReport: clean up type assertion | 30m | ⚪ Low | 📦 | | review:typescript [atomic] |
| DOC-5 | Add double-entry bookkeeping check to guardrails.md anti-patterns | 15m | ⚪ Low | 🟢 | | review:smooth-floating-mountain §1.2 [atomic] |
| DOC-6 | Update version dates across CLAUDE.md files (inconsistent: 2026-02-15 vs 2026-02-09) | 15m | ⚪ Low | 🟢 | | review:smooth-floating-mountain §1.2 [atomic] |
| FIN-11 | Consolidation/elimination accounting (multi-entity) | 8h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.3.1 |
| FIN-12 | GAAP-compliant GL export format (XBRL/ixBRL regulatory reporting) | 6h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.3.3 |
| SEC-15 | Duplicate file detection for uploads | 1h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.2.3 |
| SEC-16 | File retention policies (auto-cleanup of old uploads) | 1h | 🟡 Medium | 📦 | | review:smooth-floating-mountain §2.2.3 |
| INFRA-11 | Database migration testing in CI pipeline | 2h | 🟡 Medium | 📦 | | review:smooth-floating-mountain §2.4.4 |
| INFRA-12 | Usage analytics (companies, transactions, reports generated) | 2h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.4.5 |
| FIN-6 | Cash Flow: document hardcoded account code ranges for categorization | doc | ⚪ Low | 📦 | | review:financial |
| DEV-121 | Accounting: Add journal entry detail page `/accounting/journal-entries/[id]` — view entry with debit/credit lines, approve/void actions, source document link (API `GET /:id` exists, no frontend) | 3-4h | 🔴 Critical | ✅ | 8106fcb | sitemap:audit |
| UX-77 | Routing: Move `/business/invoices/bills/[id]` → `/business/bills/[id]` — bills aren't children of invoices, fix domain nesting + update all internal links | 30m | 🟠 High | ✅ done | | sitemap:audit [atomic] |
| UX-78 | Routing: Rename `/insights/insights` → `/insights` — move page.tsx up one level, eliminate stuttering URL segment, update nav config | 30m | 🟠 High | ✅ | commit a799d81 | sitemap:audit [atomic] |
| ~~DEV-122~~ | ~~Business: Add client detail page `/business/clients/[id]` — contact info, stats summary, invoice history tab, edit capability (API `GET /clients/:id` + `PUT` exist). Absorbs DEV-95 + UX-37 (client portion)~~ | 3-4h | 🟡 Medium | ✅ | 1e987ed | sitemap:audit |
| UX-79 | Business: Add bill detail page at `/business/bills/[id]` — view bill, approve/cancel actions, payment progress bar, mark-overdue button (API `GET /bills/:id` exists). Absorbs UX-56 + UX-40. Depends on UX-77 (route fix) | 2-3h | 🟡 Medium | 🟢 | [needs: UX-77] | sitemap:audit, plan:phase-4-bill-and-get-paid.md |
| UX-81 | Business: Add payment detail page `/business/payments/[id]` — view payment with allocation breakdown across invoices/bills and GL posting status | 2-3h | ⚪ Low | 🟢 | | sitemap:audit |

---

## Linked Plans

| Plan | Tasks | Status |
|------|-------|--------|
| [Banking Command Center](docs/plans/banking-command-center_tasks.md) | 28 tasks (4 sprints) | Sprint 1 in progress |
| [AI Auto-Bookkeeper Phase 1](docs/plans/2026-02-24-ai-auto-bookkeeper-phase1.md) | 16 tasks (4 sprints) | Ready |

---

## Design System

### Critical / High

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DS-1 | Figma-to-code token sync audit | 2h | 🟠 High | 🟢 | | audit:smooth-floating-mountain |

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DS-2 | Storybook setup for component documentation | 3h | 🟡 Medium | 📦 | | manual |

---

## Marketing & Content

### Critical / High

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| MKT-1 | Landing page copy and design | 3h | 🟠 High | 📦 | | manual |
| MKT-3 | Install 3D dependencies (`@react-three/fiber`, `@react-three/drei`, `three`) | 15m | 🟠 High | 🟢 | | plan:2026-02-23-marketing-landing-page.md |
| MKT-4 | Create hero section with 3D orb and parallax effect | 2-3h | 🟠 High | 🟢 | [needs: MKT-3] | plan:2026-02-23-marketing-landing-page.md |
| MKT-5 | Create problem statement section (3 pain point cards) | 1-2h | 🟠 High | 🟢 | | plan:2026-02-23-marketing-landing-page.md |
| MKT-6 | Create solution pillars section (3 GlowCard components) | 2h | 🟠 High | 🟢 | | plan:2026-02-23-marketing-landing-page.md |
| MKT-7 | Create 3D feature showcase (interactive card grid) | 3-4h | 🟠 High | 🟢 | [needs: MKT-3] | plan:2026-02-23-marketing-landing-page.md |
| MKT-8 | Create stats/social proof section (animated counters) | 1-2h | 🟠 High | 🟢 | | plan:2026-02-23-marketing-landing-page.md |
| MKT-9 | Create final CTA section (gradient background, glass container) | 1h | 🟠 High | 🟢 | | plan:2026-02-23-marketing-landing-page.md |
| MKT-10 | Create landing page layout (minimal nav + footer) | 1-2h | 🟠 High | 🟢 | | plan:2026-02-23-marketing-landing-page.md |
| MKT-11 | Replace root page with landing (remove redirect) | 30m | 🟠 High | 🟢 | [needs: MKT-4, MKT-5, MKT-6, MKT-7, MKT-8, MKT-9, MKT-10] | plan:2026-02-23-marketing-landing-page.md |
| MKT-12 | Add scroll animations and performance optimization (Lighthouse >90) | 2-3h | 🟠 High | 🟢 | [needs: MKT-11] | plan:2026-02-23-marketing-landing-page.md |

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
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
| ~~INFRA-59~~ | ~~Flinks API production readiness — verify env vars, test demo mode, create deployment checklist (code already exists, prep for API key activation)~~ | 1-2h | 🟠 High | ✅ | | ad-hoc:flinks-production-prep |

**→ Linear PM Infrastructure tasks (43 tasks) moved to [LINEAR-TASKS.md](LINEAR-TASKS.md)**

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| INFRA-4 | Disaster recovery procedure + documentation | 2h | 🟡 Medium | 🔒 | [needs: INFRA-3] | roadmap |
| INFRA-6 | Deployment documentation | 1h | 🟡 Medium | 🔒 | [needs: INFRA-2] | roadmap |

---

## Uncommitted Work

| Item | Files | Status | Source |
|------|-------|--------|--------|
| Dashboard redesign (NetWorthHero, RecentTransactions, 7-stat left rail) | 14 modified + 4 new | ⏳ needs review + commit | manual |
| Onboarding personal-first redesign (3 new steps, conditional flow) | 6 modified + 3 new | ⏳ needs review + commit | manual |
| dialog.tsx UI component | 1 new | ⏳ needs commit | manual |

---

## Done (Recent)

| ID | Task | Completed | Commit |
|----|------|-----------|--------|
| ✅ DEV-178 | Fix onboarding race conditions and transaction timeout (P2002/P2028) | 2026-02-23 | manual |
| ✅ DEV-1 | Onboarding middleware fix (middleware.ts TODO — disabled, blocks resume) | 2026-02-21 | audit:smooth-floating-mountain |
| ✅ PERF-18 | Add composite index on Invoice for AR aging (entityId, status, dueDate, deletedAt) | 2026-02-21 | audit:2026-02-20 |
| ✅ PERF-19 | Add composite index on Transaction for date range queries (accountId, categoryId, date, deletedAt) | 2026-02-21 | audit:2026-02-20 |
| ✅ PERF-20 | Add composite index on Bill for AP aging (entityId, status, dueDate, deletedAt) | 2026-02-21 | audit:2026-02-20 |
| ✅ SEC-9 | CSRF protection review (N/A — pure JWT Bearer auth, no cookies, not vulnerable to CSRF) | 2026-02-21 | roadmap |
| ✅ PERF-1 | Balance Sheet: combine 2 redundant heavy SQL queries into 1 | 2026-02-21 | review:performance |
| ✅ PERF-5 | Database indexes on hot paths (dashboard, reports) | 2026-02-21 | roadmap |
| ✅ PERF-6 | Query optimization audit (dashboard + report queries) | 2026-02-21 | roadmap |
| ✅ PERF-8 | p95 < 2s page load target verification + load testing | 2026-02-21 | roadmap |
| ✅ INFRA-14 | Add timeout to Clerk auth verification (3-second Promise.race wrapper in auth middleware) | 2026-02-21 | audit:2026-02-20 |
| ✅ INFRA-16 | Upgrade markdownlint-cli2 to fix markdown-it ReDoS (0.20.0 → 0.21.0+) | 2026-02-21 | 276661d |
| ✅ INFRA-17 | Upgrade eslint to v10 to fix minimatch ReDoS (8.57.1 → 10.0.1, flat config) | 2026-02-21 | 276661d |
| ✅ INFRA-18 | Verify dev dependency fixes (markdown-it resolved, minimatch in transitive deps) | 2026-02-21 | 276661d |
| ✅ INFRA-19 | Install exceljs@4.4.0 and remove vulnerable xlsx@0.18.5 | 2026-02-21 | 276661d |
| ✅ INFRA-20 | Migrate parseXLSX to async exceljs API (apps/api/src/domains/banking/services/parser-csv.ts) | 2026-02-21 | 276661d |
| ✅ INFRA-21 | Verify XLSX magic bytes detection still works (no code change needed) | 2026-02-21 | 276661d |
| ✅ INFRA-22 | Update parseXLSX tests for exceljs async API (all pass) | 2026-02-21 | 276661d |
| ✅ INFRA-23 | Update XLSX import route tests (21/21 tests pass) | 2026-02-21 | 276661d |
| ✅ INFRA-24 | Update file scanner tests (18/18 tests pass) | 2026-02-21 | 276661d |
| ✅ INFRA-25 | Run full test suite (1133/1133 tests pass) | 2026-02-21 | 276661d |
| ✅ INFRA-26 | Type check (maintained 0 TypeScript errors) | 2026-02-21 | 276661d |
| ✅ INFRA-27 | Final npm audit (xlsx resolved, 19 minimatch in dev/archiver accepted) | 2026-02-21 | 276661d |
| ✅ INFRA-28 | Update MEMORY.md Known Issues (updated npm vulnerabilities status) | 2026-02-21 | 276661d |
| ✅ SEC-23 | Replace console.log in webhook route with structured logging (apps/web/src/app/api/webhooks/clerk/route.ts — 7 occurrences) | 2026-02-21 | audit:2026-02-20 |
| ✅ DRY-1 | Report types: move shared types to `packages/types` (eliminate duplication) | 2026-02-21 | review:typescript |
| ✅ UX-1 | Entity selector: replace 7+ hardcoded `entities[0]` with real selector (Accounting JE/COA, AccountFormSheet, Navbar, Invoicing, Vendors — all domains affected) | 2026-02-21 | 1b338f8 |
| ✅ UX-2 | GL Account ID: replace raw CUID input with searchable dropdown (also: JE form uses plain Select) | 2026-02-21 | review:nextjs, audit:acct-fe-be |
| ✅ PERF-9 | Replace console.log with pino structured logging (7 production files — already compliant, only env.ts pre-boot) | 2026-02-21 | plan:phase-6-tasks |
| ✅ ARCH-2 | Audit log coverage expansion (bulk ops, imports, exports, reconciliation) | 2026-02-21 | review:smooth-floating-mountain (commit 7b709b6) |
| ✅ ARCH-6 | Audit logging inside DB transactions (not fire-and-forget outside TX) | 2026-02-21 | review:smooth-floating-mountain §2.2.1 (commit 86f13c4) |
| ✅ SEC-11 | File upload virus scanning (ClamAV integration for PDFs/CSVs) | 2026-02-21 | review:smooth-floating-mountain §2.2.3 |
| ✅ SEC-13 | Audit log tamper detection (immutable log storage) | 2026-02-21 | review:smooth-floating-mountain §2.2.4 |
| ✅ INFRA-9 | Secrets management for production (env var vault, not .env files) | 2026-02-21 | review:smooth-floating-mountain §2.4.4 |
| ✅ INFRA-10 | Security scanning in CI (SAST + dependency/supply chain checks) | 2026-02-21 | review:smooth-floating-mountain §2.4.4 |
| ✅ SEC-17 | XSS fix: sanitize `dangerouslySetInnerHTML` in AIBrief (DOMPurify or markdown renderer) | 2026-02-21 | review:dashboard-overview |
| ✅ SEC-18 | Dashboard routes: replace unsafe `request.tenantId as string` with `requireTenantId()` guard | 2026-02-21 | review:dashboard-overview |
| ✅ SEC-19 | Dashboard routes: replace unsafe `as DashboardQuery` casts with Fastify generic route typing | 2026-02-21 | review:dashboard-overview |
| ✅ FIN-13 | `UpcomingPayments.amount` typed as `string` — must be `number` (integer cents violation) | 2026-02-21 | review:dashboard-overview |
| ✅ DOC-1 | Add plan-enforcement.md to CLAUDE.md Tier 1/2 context hierarchy | 2026-02-21 | review:smooth-floating-mountain |
| ✅ UX-11 | Overview: Wire `/overview/net-worth` page with real data (backend endpoint exists, page says "coming soon") | 2026-02-21 | audit:fe-be-parity |
| ✅ UX-12 | Overview: Wire `/overview/cash-flow` page with real data (backend endpoint exists, page says "coming soon") | 2026-02-21 | audit:fe-be-parity |
| ✅ FIN-15 | Performance endpoint: Wire receivables data from invoicing domain (currently hardcoded to 0) | 2026-02-21 | audit:fe-be-parity |
| ✅ DEV-10 | Overview: Add Accounts Payable summary to dashboard (query bills/vendor domain) | 2026-02-21 | audit:fe-be-parity |
| ✅ DEV-43 | Banking: Add manual transaction creation form (POST endpoint exists, no UI) | 2026-02-21 | audit:fe-be-parity |
| ✅ DEV-44 | Banking: Wire XLSX import support in import wizard (backend endpoint exists) | 2026-02-21 | audit:fe-be-parity |
| ✅ UX-13 | Banking: Add category management page — edit, delete, detail view (3 endpoints exist, no UI) | 2026-02-21 | session |
| ✅ UX-14 | Banking: Add unmatch button to reconciliation (DELETE endpoint exists, no UI) | 2026-02-21 | audit:fe-be-parity |
| ✅ DEV-45 | Banking: Add import batch detail page — drill into imported transactions (GET endpoint exists) | 2026-02-21 | audit:fe-be-parity |
| ✅ UX-16 | Accounting: Add confirmation dialogs on Void/Delete journal entry actions (no prompt currently) | 2026-02-21 | audit:acct-fe-be |
| ✅ UX-17 | App-wide: Add toast notifications on ALL mutations — covered: account CRUD, transaction create, JE CRUD, invoice/bill actions, COA seed | 2026-02-21 | 4990262 |
| ✅ DEV-60 | Accounting: Add journal entry sourceType filter (backend supports, UI only has status filter) | 2026-02-21 | audit:acct-fe-be |
| ✅ UX-29 | App-wide: Add confirmation dialogs on ALL destructive actions — Cancel Invoice/Bill, Bulk Delete, account deactivate (6+ unconfirmed actions) | 2026-02-21 | 2479218 |
| ✅ UX-30 | Banking: Fix posted transaction link (goes to filtered list, not specific journal entry) | 2026-02-21 | session |
| ✅ UX-66 | Rename "AI Advisor" → "Insights" across entire codebase (~29 files): frontend routes/dir rename/nav/components, RBAC comment, CLAUDE.md docs, design system docs, config/meta. Backend `domains/ai/`, API paths, permission keys, Prisma models stay as-is. | 2026-02-21 | audit:ai-advisor |
| ✅ UX-72 | Dashboard: Implement cash flow projection endpoint + wire chart (CashFlowChart expects time-series data, endpoint returns static snapshot only) | 2026-02-21 | 5c6d170 |
| ✅ FIN-17 | Fix missing entityId on import audit logs (imports.ts:140, 396) | 2026-02-21 | diagnose:audit-fk-bug |
| ✅ FIN-18 | Fix missing entityId on data export audit log (system/routes.ts) | 2026-02-21 | diagnose:audit-fk-bug |
| ✅ ARCH-7 | Fix audit log hash chain race condition (serializable tx) | 2026-02-21 | diagnose:audit-fk-bug |
| ✅ ARCH-8 | Pass tx to audit log calls for atomic audit+operation (category, reconciliation) | 2026-02-21 | diagnose:audit-fk-bug |
| ✅ FIN-19 | Add entityId validation guard in createAuditLog (empty string → undefined) | 2026-02-21 | diagnose:audit-fk-bug |
| ✅ FIN-20 | Add audit log tests for FK validation (5 new tests) | 2026-02-21 | diagnose:audit-fk-bug |
| ✅ UX-35 | Sidebar: Add "Coming Soon" badge to 17 placeholder pages or hide unimplemented nav items | 2026-02-21 | session |
| ✅ UX-37 | Business: Add client/vendor edit capability in detail panels (merged into DEV-122 + DEV-123) | 2026-02-21 | audit:app-ux |
| ✅ UX-38 | Banking: Add active/inactive account filter toggle (backend supports `isActive` param, UI shows all) | 2026-02-21 | session |
| ✅ UX-39 | Banking: Add aria-labels to bulk action buttons, select-all checkbox, filter dropdowns (a11y) | 2026-02-21 | session |
| ✅ UX-40 | Business: Add mark-overdue button on bill detail (merged into UX-79) | 2026-02-21 | audit:app-ux |
| ✅ UX-41 | Business: Fix hardcoded 'CAD' currency on vendor/client pages — should use entity functional currency | 2026-02-21 | session |
| ✅ UX-42 | Business: Add "View Journal Entry" link after posting invoice/bill to GL | 2026-02-21 | session |
| ✅ UX-43 | Business: Add payment allocation UI (merged into DEV-76) | 2026-02-21 | audit:app-ux |
| ✅ UX-23 | Accounting JE: Replace GL account Select with searchable Combobox (31+ accounts hard to scroll) | 2026-02-21 | audit:acct-fe-be |
| ✅ UX-26 | Accounting JE: Add source cross-links (click source type navigates to source transaction/invoice/bill) | 2026-02-21 | 8106fcb |
| ✅ UX-27 | Accounting COA: Replace `window.location.reload()` after seed with state update (jarring full reload) | 2026-02-21 | 2360780 |
| ✅ UX-28 | Sidebar: Add "Coming Soon" badge or hide unimplemented pages (merged into UX-35) | 2026-02-21 | audit:acct-fe-be |
| ✅ PERF-21 | Add composite index on JournalLine for GL account filtering (glAccountId, journalEntryId, deletedAt) | 2026-02-21 | audit:2026-02-20 |
| ✅ PERF-22 | Add composite index on Payment for client/vendor filtering (clientId, vendorId, status, date, deletedAt) | 2026-02-21 | audit:2026-02-20 |
| ✅ INFRA-15 | Add security headers to Next.js API routes (X-Frame-Options, CSP, HSTS in next.config.js) | 2026-02-21 | audit:2026-02-20 |
| ✅ DRY-6 | Dashboard: deduplicate SparkCards/DashboardLeftRail (shared types, constants, MiniSparkline) | 2026-02-21 | review:dashboard-overview |
| ✅ UX-9 | Dashboard: fix SVG gradient ID collision (use `React.useId()`) | 2026-02-21 | review:dashboard-overview |
| ✅ UX-10 | Navbar: add live sync status indicator with refresh button | 2026-02-21 | existing |
| ✅ DEV-3 | Dashboard: delete dead `handleSkipStep` in OnboardingHeroCard + dead SparkCardsSkeleton | 2026-02-21 | review:dashboard-overview |
| ✅ DEV-4 | Dashboard: type entity maps as `Record<EntityType, ...>` for exhaustive checking | 2026-02-21 | review:dashboard-overview |
| ✅ DS-3 | Dashboard: replace `hover:glass-3` with proper hover pattern | 2026-02-21 | review:dashboard-overview |
| ✅ DS-5 | AIBrief: change `text-primary` (amber) to AI-specific purple tokens | 2026-02-21 | review:dashboard-overview |
| ✅ DS-6 | Dashboard: resolve `text-[9px]` vs `text-[10px]` inconsistency with `text-micro` utility | 2026-02-21 | review:dashboard-overview |
| ✅ DEV-5 | Dashboard: add `cancelAnimationFrame` cleanup in DashboardLeftRail/SparkCards useEffect | 2026-02-21 | review:dashboard-overview |
| ✅ DEV-6 | Dashboard: delete duplicate `OnboardingHeroCard` in `components/dashboard/` (dead code) | 2026-02-21 | review:dashboard-overview |
| ✅ DEV-7 | DashboardRightRail: replace `\ | 2026-02-21 | 🟡 Medium |
| ✅ DEV-8 | DashboardService: add explicit return type to `getMetrics()` method | 2026-02-21 | review:dashboard-overview |
| ✅ DEV-9 | DashboardService: type `byType` as `Partial<Record<AccountType, number>>` (not `Record<string, number>`) | 2026-02-21 | review:dashboard-overview |
| ✅ UX-50 | Business: Add search/filter bar on invoice list (merged into UX-31) | 2026-02-21 | audit:fe-be-parity |
| ✅ UX-51 | Business: Add search/filter bar on bill list (merged into UX-31) | 2026-02-21 | audit:fe-be-parity |
| ✅ UX-53 | Business: Add pagination controls (merged into UX-32) | 2026-02-21 | audit:fe-be-parity |
| ✅ DEV-95 | Business: Add client invoice history tab (merged into DEV-122) | 2026-02-21 | audit:fe-be-parity |
| ✅ DEV-96 | Business: Add vendor bill history tab (merged into DEV-123) | 2026-02-21 | audit:fe-be-parity |
| ✅ UX-56 | Business: Add partial payment progress bar on invoice/bill detail (merged into UX-79) | 2026-02-21 | audit:fe-be-parity |
| ✅ DEV-92 | Business: Build credit notes feature (merged into DEV-83) | 2026-02-21 | audit:fe-be-parity |
| ✅ DEV-123 | Business: Add vendor detail page `/business/vendors/[id]` — contact info, stats summary, bill history tab, edit capability (API `GET /vendors/:id` + `PUT` exist). Absorbs DEV-96 + UX-37 (vendor portion) | 2026-02-21 | session |
| ✅ UX-80 | Sidebar: Add top 3 report shortcuts (Balance Sheet, P&L, Trial Balance) as sub-items under "Reports" in Accounting nav section | 2026-02-21 | existing |
| ✅ DEV-43 | Banking: Add manual transaction creation form | 2026-02-20 | 300b7ee |
| ✅ DEV-44 | Banking: Wire XLSX import support (fix sourceType bug) | 2026-02-20 | 300b7ee |
| ✅ DEV-45 | Banking: Add import batch detail page | 2026-02-20 | 300b7ee |
| ✅ FIN-13 | Change UpcomingPayments.amount to integer cents | 2026-02-19 | 8ec6cf5 |
| ✅ DRY-1 | Move report types to packages/types | 2026-02-19 | 9503c36 |
| ✅ DOC-1 | Add plan-enforcement.md to CLAUDE.md Layer 1 | 2026-02-19 | 2d1dce0 |
| ✅ DRY-6 | Dashboard: deduplicate SparkCards/DashboardLeftRail | 2026-02-19 | 53d2db6 |
| ✅ DEV-5 | Dashboard: add cancelAnimationFrame cleanup | 2026-02-19 | 53d2db6 |
| ✅ DS-5 | AIBrief: change text-primary to AI purple tokens | 2026-02-19 | 53d2db6 |
| ✅ UX-66 | Rename "AI Advisor" → "Insights" across codebase (~29 files) | 2026-02-19 | pending |
| ✅ DS-6 | Dashboard: add text-micro utility for consistency | 2026-02-19 | 53d2db6 |
| ✅ DEV-3 | Dashboard: delete dead handleSkipStep + SparkCardsSkeleton | 2026-02-19 | 53d2db6 |
| ✅ SEC-17 | XSS fix: sanitize `dangerouslySetInnerHTML` in AIBrief | 2026-02-19 | 76cb077 |
| ✅ SEC-18 | Dashboard routes: replace unsafe `request.tenantId as string` with `requireTenantId()` | 2026-02-19 | 76cb077 |
| ✅ SEC-19 | Dashboard routes: replace unsafe `as DashboardQuery` casts with Fastify generics | 2026-02-19 | 76cb077 |
| ✅ DEV-1 | Onboarding middleware fix (middleware.ts TODO — disabled, blocks resume) | 2026-02-19 | e4fe40e |
| ✅ SEC-1 | RBAC middleware: Wire requirePermission() to canonical PERMISSION_MATRIX | 2026-02-17 | 5e18109 |
| ✅ SEC-2 | tenantScopedQuery string check — strengthen runtime assertion | 2026-02-17 | 5e18109 |
| ✅ SEC-3 | Data export: mask bank account numbers (show last 4 only) | 2026-02-17 | 5e18109 |
| ✅ SEC-4 | Error handler: stop exposing details object to client | 2026-02-17 | 4e4d049 |
| ✅ SEC-5 | sanitizeFilename: guard against empty string result | 2026-02-17 | 4e4d049 |
| ✅ SEC-6 | Cache TTL env var: validate against NaN | 2026-02-17 | 4e4d049 |
| ✅ SEC-7 | PDF timeout timer: clean up unhandled rejection | 2026-02-17 | 5e18109 |
| ✅ FIN-1 | Balance Sheet: enforce strict balance (remove 1-cent tolerance) | 2026-02-17 | 4e4d049 |
| ✅ FIN-2 | Cash Flow: add reconciliation check (opening + net = closing) | 2026-02-17 | 6ad5626 |
| ✅ FIN-3 | GL Ledger: order window function by date, not CUID | 2026-02-17 | 4e4d049 |
| ✅ FIN-4 | Spending/Revenue: add currency validation for multi-entity | 2026-02-17 | 6ad5626 |
| ✅ FIN-5 | Data export: apply includeSoftDeleted flag | 2026-02-17 | 6ad5626 |
| ✅ DRY-4 | sanitizeCsvCell: accept null in type signature | 2026-02-17 | 4e4d049 |
| ✅ UX-5 | Spending view: remove duplicate CHART_COLORS entry | 2026-02-17 | 4e4d049 |

---

## Phase Progress

| Phase | Progress | Tests |
|-------|----------|-------|
| Foundation | ✅ COMPLETE | — |
| 1: See Your Money | ✅ ██████████ 100% | 62 |
| 2: Track Your Money | ✅ ██████████ 100% | 117 |
| 3: Post Your Money | ✅ ██████████ 100% | 33 |
| 4: Bill & Get Paid | ✅ ██████████ 100% | 21 |
| 5: Understand Your Money | ✅ ██████████ 100% | 267 |
| 6: Launch MVP | 🔵 ████░░░░░░ 35% | — |

**Total Backend Tests:** 1133 (verified 2026-02-21)

---

> **Legend:** 🟢 ready · 📦 backlog · 🔒 blocked (has unmet deps) · ⏳ pending · ✅ done
> **Priority:** 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low

























<!-- TASK-INDEX:START (auto-generated, do not edit manually)
{
  "version": "1.0",
  "generated": "2026-02-24T16:46:08.402Z",
  "summary": {
    "total": 246,
    "ready": 80,
    "blocked": 6,
    "backlog": 118,
    "done": 41
  },
  "byPriority": {
    "critical": [
      "FIN-23",
      "DEV-190",
      "DEV-191",
      "DEV-197",
      "DEV-198",
      "DEV-200",
      "DRY-9",
      "FIN-25",
      "FIN-26",
      "FIN-27",
      "FIN-28",
      "UX-102",
      "DEV-121"
    ],
    "high": [
      "SEC-8",
      "SEC-24",
      "TEST-1",
      "TEST-2",
      "TEST-3",
      "DEV-2",
      "UX-8",
      "DEV-46",
      "UX-15",
      "INFRA-13",
      "UX-18",
      "DEV-59",
      "UX-31",
      "UX-32",
      "DEV-71",
      "DEV-72",
      "DEV-73",
      "DEV-74",
      "DEV-75",
      "DEV-76",
      "DEV-77",
      "DEV-78",
      "UX-45",
      "DEV-97",
      "DEV-98",
      "UX-58",
      "UX-59",
      "UX-60",
      "DEV-112",
      "DEV-113",
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
      "UX-77",
      "UX-78",
      "DS-1",
      "MKT-1",
      "MKT-3",
      "MKT-4",
      "MKT-5",
      "MKT-6",
      "MKT-7",
      "MKT-8",
      "MKT-9",
      "MKT-10",
      "MKT-11",
      "MKT-12",
      "INFRA-1",
      "INFRA-2",
      "INFRA-3",
      "ARCH-3",
      "INFRA-5",
      "INFRA-7",
      "INFRA-8",
      "INFRA-59"
    ],
    "medium": [
      "DEV-199",
      "UX-33",
      "UX-34",
      "UX-36",
      "UX-44",
      "DEV-83",
      "DEV-84",
      "UX-19",
      "UX-20",
      "UX-21",
      "UX-22",
      "UX-24",
      "UX-25",
      "DEV-61",
      "DEV-62",
      "DEV-63",
      "DEV-64",
      "DEV-65",
      "DEV-66",
      "DEV-67",
      "DEV-68",
      "DEV-69",
      "PERF-2",
      "PERF-3",
      "PERF-7",
      "DRY-2",
      "DRY-3",
      "DRY-8",
      "DRY-10",
      "DRY-11",
      "DRY-13",
      "DRY-14",
      "DRY-17",
      "UX-3",
      "UX-4",
      "DOC-2",
      "DOC-3",
      "SEC-10",
      "UX-6",
      "UX-7",
      "SEC-12",
      "SEC-14",
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
      "DRY-7",
      "DS-4",
      "FIN-14",
      "DEV-11",
      "DEV-12",
      "DEV-13",
      "DEV-14",
      "DEV-17",
      "DEV-18",
      "DEV-19",
      "FIN-16",
      "DEV-20",
      "DEV-179",
      "DEV-180",
      "DEV-181",
      "DEV-182",
      "DEV-183",
      "DEV-184",
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
      "UX-54",
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
      "DEV-114",
      "DEV-115",
      "DEV-116",
      "DEV-117",
      "DEV-118",
      "DOC-4",
      "SEC-16",
      "INFRA-11",
      "DEV-122",
      "UX-79",
      "DS-2",
      "MKT-2",
      "CNT-1",
      "INFRA-4",
      "INFRA-6"
    ],
    "low": [
      "DEV-70",
      "DRY-12",
      "DRY-15",
      "FIN-24",
      "DOC-7",
      "DOC-8",
      "DEV-40",
      "DEV-41",
      "DEV-42",
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
      "DEV-120",
      "DEV-15",
      "DEV-16",
      "PERF-4",
      "PERF-11",
      "DRY-5",
      "DOC-5",
      "DOC-6",
      "FIN-11",
      "FIN-12",
      "SEC-15",
      "INFRA-12",
      "FIN-6",
      "UX-81"
    ]
  },
  "byEffort": {
    "quick": [
      "DEV-186",
      "UX-20",
      "FIN-24",
      "UX-4",
      "DOC-3",
      "DOC-8",
      "DEV-184",
      "DEV-114",
      "DOC-4",
      "DOC-5",
      "DOC-6",
      "MKT-3"
    ],
    "short": [
      "SEC-24",
      "TEST-3",
      "UX-8",
      "UX-15",
      "UX-32",
      "DEV-72",
      "DEV-78",
      "UX-45",
      "DEV-112",
      "DEV-185",
      "DEV-188",
      "DEV-189",
      "DEV-192",
      "DEV-195",
      "DEV-199",
      "UX-36",
      "DEV-84",
      "UX-19",
      "UX-21",
      "UX-22",
      "UX-24",
      "UX-25",
      "DEV-70",
      "PERF-2",
      "PERF-3",
      "PERF-7",
      "DRY-2",
      "DRY-3",
      "DRY-9",
      "DRY-11",
      "DRY-12",
      "DRY-13",
      "DRY-15",
      "DRY-17",
      "FIN-26",
      "UX-3",
      "DOC-2",
      "DOC-7",
      "UX-6",
      "UX-7",
      "SEC-12",
      "SEC-14",
      "PERF-12",
      "DRY-7",
      "DS-4",
      "FIN-14",
      "DEV-19",
      "DEV-179",
      "DEV-180",
      "DEV-181",
      "DEV-182",
      "DEV-183",
      "DEV-26",
      "DEV-27",
      "DEV-28",
      "DEV-29",
      "DEV-30",
      "DEV-31",
      "DEV-32",
      "DEV-40",
      "DEV-49",
      "DEV-58",
      "UX-52",
      "UX-54",
      "UX-55",
      "DEV-101",
      "UX-62",
      "DEV-106",
      "DEV-109",
      "DEV-115",
      "DEV-116",
      "DEV-117",
      "DEV-15",
      "DEV-16",
      "PERF-4",
      "PERF-11",
      "DRY-5",
      "SEC-15",
      "SEC-16",
      "INFRA-11",
      "INFRA-12",
      "UX-77",
      "UX-78",
      "DS-1",
      "MKT-5",
      "MKT-6",
      "MKT-8",
      "MKT-9",
      "MKT-10",
      "MKT-11",
      "MKT-2",
      "CNT-1",
      "INFRA-2",
      "INFRA-3",
      "INFRA-5",
      "INFRA-59",
      "INFRA-4",
      "INFRA-6"
    ],
    "medium": [
      "SEC-8",
      "TEST-1",
      "TEST-2",
      "DEV-2",
      "DEV-59",
      "DEV-76",
      "UX-58",
      "UX-59",
      "DEV-191",
      "DEV-193",
      "DEV-194",
      "UX-34",
      "DEV-63",
      "DEV-64",
      "DEV-66",
      "DEV-68",
      "UX-102",
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
      "DEV-94",
      "DEV-99",
      "DEV-100",
      "UX-61",
      "DEV-104",
      "DEV-118",
      "DEV-119",
      "DEV-121",
      "DEV-122",
      "DS-2",
      "MKT-1",
      "MKT-7",
      "INFRA-1",
      "ARCH-3",
      "INFRA-7",
      "INFRA-8"
    ],
    "long": [
      "DEV-46",
      "INFRA-13",
      "DEV-97",
      "DEV-98",
      "DEV-190",
      "DEV-196",
      "DEV-83",
      "DEV-65",
      "DRY-10",
      "DRY-14",
      "DEV-41",
      "DEV-42",
      "DEV-89",
      "DEV-102",
      "DEV-107",
      "DEV-110",
      "FIN-11",
      "FIN-12"
    ]
  },
  "byDomain": {
    "financial": [
      "FIN-23",
      "FIN-24",
      "FIN-25",
      "FIN-26",
      "FIN-27",
      "FIN-28",
      "FIN-7",
      "FIN-8",
      "FIN-9",
      "FIN-10",
      "FIN-14",
      "FIN-16",
      "FIN-11",
      "FIN-12",
      "FIN-6"
    ],
    "security": [
      "SEC-8",
      "SEC-24",
      "SEC-10",
      "SEC-12",
      "SEC-14",
      "SEC-15",
      "SEC-16"
    ],
    "testing": [
      "TEST-1",
      "TEST-2",
      "TEST-3",
      "TEST-4"
    ],
    "development": [
      "DEV-2",
      "DEV-46",
      "DEV-59",
      "DEV-71",
      "DEV-72",
      "DEV-73",
      "DEV-74",
      "DEV-75",
      "DEV-76",
      "DEV-77",
      "DEV-78",
      "DEV-97",
      "DEV-98",
      "DEV-112",
      "DEV-113",
      "DEV-185",
      "DEV-186",
      "DEV-187",
      "DEV-188",
      "DEV-189",
      "DEV-190",
      "DEV-191",
      "DEV-192",
      "DEV-193",
      "DEV-194",
      "DEV-195",
      "DEV-196",
      "DEV-197",
      "DEV-198",
      "DEV-199",
      "DEV-200",
      "DEV-83",
      "DEV-84",
      "DEV-61",
      "DEV-62",
      "DEV-63",
      "DEV-64",
      "DEV-65",
      "DEV-66",
      "DEV-67",
      "DEV-68",
      "DEV-69",
      "DEV-70",
      "DEV-11",
      "DEV-12",
      "DEV-13",
      "DEV-14",
      "DEV-17",
      "DEV-18",
      "DEV-19",
      "DEV-20",
      "DEV-179",
      "DEV-180",
      "DEV-181",
      "DEV-182",
      "DEV-183",
      "DEV-184",
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
      "DEV-40",
      "DEV-41",
      "DEV-42",
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
      "DEV-93",
      "DEV-94",
      "DEV-99",
      "DEV-100",
      "DEV-101",
      "DEV-102",
      "DEV-103",
      "DEV-104",
      "DEV-105",
      "DEV-106",
      "DEV-107",
      "DEV-108",
      "DEV-109",
      "DEV-110",
      "DEV-111",
      "DEV-114",
      "DEV-115",
      "DEV-116",
      "DEV-117",
      "DEV-118",
      "DEV-119",
      "DEV-120",
      "DEV-15",
      "DEV-16",
      "DEV-121",
      "DEV-122"
    ],
    "ux": [
      "UX-8",
      "UX-15",
      "UX-18",
      "UX-31",
      "UX-32",
      "UX-45",
      "UX-58",
      "UX-59",
      "UX-60",
      "UX-33",
      "UX-34",
      "UX-36",
      "UX-44",
      "UX-19",
      "UX-20",
      "UX-21",
      "UX-22",
      "UX-24",
      "UX-25",
      "UX-102",
      "UX-3",
      "UX-4",
      "UX-6",
      "UX-7",
      "UX-52",
      "UX-54",
      "UX-55",
      "UX-57",
      "UX-61",
      "UX-62",
      "UX-63",
      "UX-64",
      "UX-65",
      "UX-77",
      "UX-78",
      "UX-79",
      "UX-81"
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
      "INFRA-59",
      "INFRA-4",
      "INFRA-6"
    ],
    "performance": [
      "PERF-2",
      "PERF-3",
      "PERF-7",
      "PERF-10",
      "PERF-12",
      "PERF-4",
      "PERF-11"
    ],
    "code-quality": [
      "DRY-2",
      "DRY-3",
      "DRY-8",
      "DRY-9",
      "DRY-10",
      "DRY-11",
      "DRY-12",
      "DRY-13",
      "DRY-14",
      "DRY-15",
      "DRY-17",
      "DRY-7",
      "DRY-5"
    ],
    "documentation": [
      "DOC-2",
      "DOC-3",
      "DOC-7",
      "DOC-8",
      "DOC-4",
      "DOC-5",
      "DOC-6"
    ],
    "architecture": [
      "ARCH-5",
      "ARCH-1",
      "ARCH-4",
      "ARCH-3"
    ],
    "design-system": [
      "DS-4",
      "DS-1",
      "DS-2"
    ],
    "marketing": [
      "MKT-1",
      "MKT-3",
      "MKT-4",
      "MKT-5",
      "MKT-6",
      "MKT-7",
      "MKT-8",
      "MKT-9",
      "MKT-10",
      "MKT-11",
      "MKT-12",
      "MKT-2"
    ],
    "content": [
      "CNT-1"
    ]
  },
  "ready": [
    "TEST-2",
    "TEST-3",
    "UX-18",
    "DEV-71",
    "DEV-72",
    "DEV-73",
    "DEV-74",
    "DEV-76",
    "DEV-77",
    "DEV-78",
    "UX-45",
    "DEV-185",
    "DEV-186",
    "DEV-187",
    "DEV-188",
    "DEV-189",
    "DEV-190",
    "DEV-191",
    "DEV-192",
    "DEV-193",
    "DEV-194",
    "DEV-195",
    "DEV-196",
    "DEV-197",
    "DEV-198",
    "DEV-199",
    "DEV-200",
    "UX-33",
    "UX-36",
    "UX-20",
    "UX-21",
    "UX-22",
    "UX-24",
    "UX-25",
    "PERF-7",
    "DRY-3",
    "DRY-10",
    "DRY-13",
    "DRY-14",
    "DRY-15",
    "UX-3",
    "UX-4",
    "DOC-3",
    "DOC-8",
    "SEC-12",
    "SEC-14",
    "DEV-11",
    "DEV-12",
    "DEV-13",
    "DEV-14",
    "DEV-179",
    "DEV-180",
    "DEV-181",
    "DEV-182",
    "DEV-183",
    "DEV-184",
    "DEV-115",
    "DEV-116",
    "DOC-4",
    "DEV-15",
    "DEV-16",
    "DOC-5",
    "DOC-6",
    "UX-79",
    "UX-81",
    "DS-1",
    "MKT-3",
    "MKT-4",
    "MKT-5",
    "MKT-6",
    "MKT-7",
    "MKT-8",
    "MKT-9",
    "MKT-10",
    "MKT-11",
    "MKT-12",
    "INFRA-1",
    "INFRA-2",
    "INFRA-3",
    "ARCH-3"
  ],
  "quickWins": [
    "TEST-3",
    "DEV-72",
    "DEV-78",
    "UX-45",
    "DEV-185",
    "DEV-186",
    "DEV-188",
    "DEV-189",
    "DEV-192",
    "DEV-195",
    "DS-1",
    "MKT-3",
    "MKT-5",
    "MKT-6",
    "MKT-8",
    "MKT-9",
    "MKT-10",
    "MKT-11",
    "INFRA-2",
    "INFRA-3"
  ],
  "dashboard": [
    "DEV-199",
    "DEV-179"
  ],
  "tasks": {
    "FIN-23": {
      "line": 27,
      "title": "Fix `voidTransfer` balance reversal — voiding a transfer marks JEs as VOIDED but does NOT reverse account balances (financial integrity bug)",
      "effort": "30-45m",
      "priority": "critical",
      "status": "done",
      "deps": [],
      "domain": "financial"
    },
    "SEC-8": {
      "line": 28,
      "title": "Complete security audit (OWASP top 10, auth, tenant isolation, input validation)",
      "effort": "4h",
      "priority": "high",
      "status": "unknown",
      "deps": [],
      "domain": "security"
    },
    "SEC-24": {
      "line": 29,
      "title": "GL Account service: _count queries don't filter by tenant (childAccounts, journalLines counts leak cross-tenant)",
      "effort": "1h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "security"
    },
    "TEST-1": {
      "line": 30,
      "title": "Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests",
      "effort": "3-4h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "testing"
    },
    "TEST-2": {
      "line": 31,
      "title": "E2E tests for critical user flows (onboarding, import, posting, reports)",
      "effort": "4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "testing"
    },
    "TEST-3": {
      "line": 32,
      "title": "80%+ API test coverage target",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "testing"
    },
    "DEV-2": {
      "line": 33,
      "title": "Service tests for client/invoice/bill/vendor services",
      "effort": "3h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "UX-8": {
      "line": 34,
      "title": "Add loading/error states to remaining dashboard pages (~30 pages)",
      "effort": "2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "DEV-46": {
      "line": 35,
      "title": "Banking: Implement transfers backend API + wire transfers page — inter-account transfers with journal entry creation (10/12 tasks complete, tests deferred)",
      "effort": "4-6h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "UX-15": {
      "line": 36,
      "title": "Banking: Add GL account linking UI on account detail",
      "effort": "1-2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "INFRA-13": {
      "line": 37,
      "title": "Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import",
      "effort": "8-12h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "UX-18": {
      "line": 38,
      "title": "Accounting: Add landing page at `/accounting` with summary stats (draft JEs, account count, recent activity)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-59": {
      "line": 39,
      "title": "Accounting: Add transaction posting UI — post bank txns to GL",
      "effort": "3-4h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "UX-31": {
      "line": 40,
      "title": "Business: Add search/filter bar on invoice, bill, client, vendor lists",
      "effort": "2-3h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-32": {
      "line": 41,
      "title": "Business: Add pagination controls — cursor pagination + Load More",
      "effort": "1-2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "DEV-71": {
      "line": 42,
      "title": "Business: Add invoice/bill edit for DRAFT status (PUT endpoints exist, no edit UI)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-72": {
      "line": 43,
      "title": "Business: Add void invoice action (POST /business/invoices/:id/void exists, no UI button)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-73": {
      "line": 44,
      "title": "Business: Add vendor CRUD — create/edit/delete (full backend API exists, frontend is read-only)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-74": {
      "line": 45,
      "title": "Business: Add client CRUD — create/edit/delete (full backend API exists, only inline from invoice form)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-75": {
      "line": 46,
      "title": "Business: Replace bills \"Coming Soon\" stub with real bill list page (API ready, `/business/bills` is placeholder)",
      "effort": "2-3h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-76": {
      "line": 47,
      "title": "Business: Wire payment allocation UI — split payment across multiple invoices (PaymentAllocation model + endpoints exist)",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-77": {
      "line": 48,
      "title": "Business: Wire edit/delete invoice/bill/payment actions (PUT/DELETE endpoints exist, no UI)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-78": {
      "line": 49,
      "title": "Business: Wire \"Post to GL\" button on payment allocation (backend route exists, no frontend trigger)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "UX-45": {
      "line": 50,
      "title": "Business: Add quick \"Record Payment\" button on invoice detail page (shortcut to payment form)",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-97": {
      "line": 51,
      "title": "Planning: Build Goal service + full CRUD (create/list/get/update/delete using Goal model, migrate from Entity.metadata)",
      "effort": "4-6h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-98": {
      "line": 52,
      "title": "Planning: Build Budget service + full CRUD (create/list/get/update/delete using Budget model)",
      "effort": "4-6h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-58": {
      "line": 53,
      "title": "Planning: Build goals page — list goals, create form, progress tracking, status updates",
      "effort": "3-4h",
      "priority": "high",
      "status": "backlog",
      "deps": [
        "DEV-97"
      ],
      "domain": "ux"
    },
    "UX-59": {
      "line": 54,
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
      "line": 55,
      "title": "Planning: Add planning landing page at `/planning` with summary cards (active goals, budget utilization, forecast status)",
      "effort": "2-3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-112": {
      "line": 56,
      "title": "Insights: Create API client (`apps/web/src/lib/api/ai.ts`) for 5 existing AI endpoints",
      "effort": "30m",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-113": {
      "line": 57,
      "title": "Insights: Build AI Chat interface on Insights page (wire to existing `POST /api/ai/chat`)",
      "effort": "2-3h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-185": {
      "line": 58,
      "title": "AI: Add `defaultGLAccountId` FK to Category model (schema migration)",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-186": {
      "line": 59,
      "title": "AI: Add `AI_SUGGESTION` to JournalEntrySourceType enum (schema migration)",
      "effort": "15m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-187": {
      "line": 60,
      "title": "AI: Enhance categorization with GL resolution + confidence tiers",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-185"
      ],
      "domain": "development"
    },
    "DEV-188": {
      "line": 61,
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
      "line": 62,
      "title": "AI: Add Claude (Anthropic) provider to AIService",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-190": {
      "line": 63,
      "title": "AI: JE suggestion service — draft journal entries from categorized transactions",
      "effort": "4-6h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-191": {
      "line": 64,
      "title": "AI: JE suggestion API routes + tests (draft, preview endpoints)",
      "effort": "3-4h",
      "priority": "critical",
      "status": "ready",
      "deps": [
        "DEV-190"
      ],
      "domain": "development"
    },
    "DEV-192": {
      "line": 65,
      "title": "AI: Create AIAction Prisma model + enums (schema migration)",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-193": {
      "line": 66,
      "title": "AI: AIAction service + AI domain error handler (CRUD, batch, stats)",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-192"
      ],
      "domain": "development"
    },
    "DEV-194": {
      "line": 67,
      "title": "AI: Action Feed API routes + tests (list, approve, reject, batch, stats)",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-193"
      ],
      "domain": "development"
    },
    "DEV-195": {
      "line": 68,
      "title": "AI: Wire JE/categorization services to create AIActions on suggestions",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-196": {
      "line": 69,
      "title": "AI: Frontend Action Feed UI (page, components, navigation, confidence badges)",
      "effort": "4-6h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "DEV-194"
      ],
      "domain": "development"
    },
    "DEV-197": {
      "line": 70,
      "title": "Accounting: Batch JE approval endpoint with partial success handling",
      "effort": "2-3h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-198": {
      "line": 71,
      "title": "AI: Wire AIAction approval to execution (action-executor service)",
      "effort": "2-3h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-199": {
      "line": 72,
      "title": "AI: Dashboard AI Action widget (glass card, pending count, quick-approve)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-200": {
      "line": 73,
      "title": "AI: Integration test — full auto-bookkeeper workflow E2E",
      "effort": "2-3h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "UX-33": {
      "line": 79,
      "title": "App-wide: Add cross-links between related records — Invoice↔Client, Transaction↔JournalEntry, Bill↔Vendor, Payment↔Invoice/Bill (isolated views currently)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-34": {
      "line": 80,
      "title": "App-wide: Add bulk operations to list pages — Business (batch send/approve invoices, batch approve bills), Banking (batch deactivate accounts)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-36": {
      "line": 81,
      "title": "Business: Add standalone \"Create Client\" / \"Create Vendor\" buttons on list pages (currently only via invoice/bill forms)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-44": {
      "line": 82,
      "title": "Business: Add invoice/client list CSV/PDF export buttons",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-83": {
      "line": 83,
      "title": "Business: Build credit notes feature (CreditNote Prisma model exists, zero API endpoints or UI)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-84": {
      "line": 84,
      "title": "App-wide: Fix navigation.ts mismatches — Bills route points to stub, verify all nav items match real pages",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "UX-19": {
      "line": 85,
      "title": "Accounting COA: Add search input for GL accounts (backend `search` param exists, UI only has type filter)",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-20": {
      "line": 86,
      "title": "Accounting COA: Add reactivate button for deactivated accounts (PATCH isActive:true works, no UI)",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-21": {
      "line": 87,
      "title": "Accounting COA: Add balance summary header (Total Assets/Liabilities/Equity cards, data already fetched)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-22": {
      "line": 88,
      "title": "Accounting JE: Fix filter auto-refresh (date/status changes don't re-fetch, only affect loadMore)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-24": {
      "line": 89,
      "title": "Accounting JE: Add \"Duplicate Entry\" action to pre-fill form from existing entry",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-25": {
      "line": 90,
      "title": "Accounting Reports: Add quick-generate buttons (Last Month / This Quarter / YTD) on report hub cards",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-61": {
      "line": 91,
      "title": "Accounting JE: Add multi-currency support to JE form (backend supports, form is single-currency only)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-62": {
      "line": 92,
      "title": "Accounting JE: Add batch approve (select multiple drafts → approve all, needs new backend endpoint)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-63": {
      "line": 93,
      "title": "Accounting: Add recurring journal entry templates (monthly depreciation, rent, etc.)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-64": {
      "line": 94,
      "title": "Accounting: Add journal entry CSV import (bulk import from external accounting software)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-65": {
      "line": 95,
      "title": "Accounting: Add account reconciliation page (compare GL vs bank statement balances)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-66": {
      "line": 96,
      "title": "Accounting: Add aged receivables/payables report (AR/AP aging 30/60/90+ day buckets)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-67": {
      "line": 97,
      "title": "Accounting: Add audit trail view (who approved/voided/created entries, timestamps)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-68": {
      "line": 98,
      "title": "Accounting: Add GL account merge/reclassify (move journal lines between accounts)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-69": {
      "line": 99,
      "title": "Accounting Reports: Add year-over-year comparison mode (multi-year P&L and BS trends)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-70": {
      "line": 100,
      "title": "Accounting Reports: One-click export all statements as ZIP",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "PERF-2": {
      "line": 101,
      "title": "Revenue: add JSONB expression index for extraction",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "performance"
    },
    "PERF-3": {
      "line": 102,
      "title": "Recharts: code-split import (lazy load)",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "performance"
    },
    "PERF-7": {
      "line": 103,
      "title": "Lazy-loading heavy frontend components",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "DRY-2": {
      "line": 104,
      "title": "CSV sanitization: deduplicate between report-export and data-export",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-3": {
      "line": 105,
      "title": "Report routes: extract shared 40-line handler pattern into helper",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-8": {
      "line": 106,
      "title": "Transfer routes: refactor string-matching error handling to use `AccountingError.statusCode` pattern (consistent with all other routes)",
      "effort": "15-20m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-9": {
      "line": 107,
      "title": "Remove formatCurrency duplicates — consolidate 5+ inline implementations to `@/lib/utils/currency`",
      "effort": "1h",
      "priority": "critical",
      "status": "done",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-10": {
      "line": 108,
      "title": "Create `@/lib/utils/date.ts` with formatDate/formatDateTime/formatDateSplit — consolidate 15+ inline implementations",
      "effort": "1.5h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-11": {
      "line": 109,
      "title": "Extract StatusBadge components to `packages/ui` — create InvoiceStatusBadge, BillStatusBadge, AccountStatusBadge",
      "effort": "2h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-12": {
      "line": 110,
      "title": "Create `<EmptyState>` component — consolidate 11+ inline empty state patterns",
      "effort": "1h",
      "priority": "low",
      "status": "done",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-13": {
      "line": 111,
      "title": "Create `<EntitySelector>` component — wire API integration for 7 report views",
      "effort": "2h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-14": {
      "line": 112,
      "title": "Create global error tracking util — integrate Sentry in 3+ error.tsx files",
      "effort": "1.5h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-15": {
      "line": 113,
      "title": "Standardize table header styling — create `<TableHead variant=\"label\">` with `text-micro` utility",
      "effort": "30m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-17": {
      "line": 114,
      "title": "Refactor StatusBadges to use base Badge component + fix semantic token violations",
      "effort": "1-2h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "code-quality"
    },
    "FIN-24": {
      "line": 115,
      "title": "Transfer service: extract overdraft-allowed account types constant + add multi-currency limitation doc comment",
      "effort": "10m",
      "priority": "low",
      "status": "done",
      "deps": [],
      "domain": "financial"
    },
    "FIN-25": {
      "line": 116,
      "title": "Fix subtotal calculation bug in invoice & bill services — backend subtracts tax from pre-tax amount, blocking all creation",
      "effort": "<1h",
      "priority": "critical",
      "status": "done",
      "deps": [],
      "domain": "financial"
    },
    "FIN-26": {
      "line": 117,
      "title": "Wire taxRateId to invoice/bill line items — accept in Zod schema, pass through service to Prisma",
      "effort": "1-2h",
      "priority": "critical",
      "status": "done",
      "deps": [
        "FIN-25"
      ],
      "domain": "financial"
    },
    "FIN-27": {
      "line": 118,
      "title": "Fix document-posting.service.ts netAmount — same pre-tax bug as FIN-25, under-credits Revenue and under-debits Expense in JEs",
      "effort": "<1h",
      "priority": "critical",
      "status": "done",
      "deps": [],
      "domain": "financial"
    },
    "FIN-28": {
      "line": 119,
      "title": "Fix transfer baseCurrency calculation — exchangeRate applied twice for foreign-currency side, JEs don't balance in base currency",
      "effort": "<1h",
      "priority": "critical",
      "status": "done",
      "deps": [],
      "domain": "financial"
    },
    "UX-102": {
      "line": 120,
      "title": "Replace manual tax input with tax rate dropdown + auto-calculation in LineItemBuilder",
      "effort": "2-4h",
      "priority": "critical",
      "status": "done",
      "deps": [
        "FIN-26"
      ],
      "domain": "ux"
    },
    "UX-3": {
      "line": 121,
      "title": "Report tables: add `aria-*` attributes, caption, scope, role=\"progressbar\"",
      "effort": "45m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-4": {
      "line": 122,
      "title": "Report views: replace array index React keys with stable identifiers",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DOC-2": {
      "line": 123,
      "title": "Consolidate logging rules (full version in api-conventions.md, update guardrails.md ref)",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-3": {
      "line": 124,
      "title": "Archive .reviews/ temp workspace to docs/reviews/ or delete",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-7": {
      "line": 125,
      "title": "Update test/page counts in context files (apps/api: 362→1010 tests, apps/web: 38→54 pages, root: 38→40 models)",
      "effort": "30m",
      "priority": "low",
      "status": "done",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-8": {
      "line": 126,
      "title": "Update domain status in apps/api/CLAUDE.md (Invoicing marked \"stub\" but is fully built)",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "SEC-10": {
      "line": 127,
      "title": "Row-Level Security (PostgreSQL) for production hardening",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "UX-6": {
      "line": 128,
      "title": "Keyboard shortcuts for power users (command palette, table nav)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-7": {
      "line": 129,
      "title": "Help overlay documenting keyboard shortcuts",
      "effort": "1h",
      "priority": "medium",
      "status": "blocked",
      "deps": [
        "UX-6"
      ],
      "domain": "ux"
    },
    "SEC-12": {
      "line": 130,
      "title": "File upload quota enforcement per tenant (prevent abuse/DoS)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "SEC-14": {
      "line": 131,
      "title": "Audit log retention policies (prevent unbounded growth, compliance)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "PERF-10": {
      "line": 132,
      "title": "Distributed caching (Redis) for multi-instance deployment",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-12": {
      "line": 133,
      "title": "N+1 query monitoring / slow query detection in production (APM)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "FIN-7": {
      "line": 134,
      "title": "Fiscal period enforcement (prevent posting to locked periods)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-8": {
      "line": 135,
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
      "line": 136,
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
      "line": 137,
      "title": "Invoice/bill reconciliation workflows (AP/AR aging, match/approve)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "ARCH-5": {
      "line": 138,
      "title": "Error recovery patterns (idempotency keys, circuit breakers, retry with backoff)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-1": {
      "line": 139,
      "title": "OpenAPI spec auto-generation from Zod schemas (fastify-zod-openapi)",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-4": {
      "line": 140,
      "title": "Background job processing setup (BullMQ for PDF gen, email, imports)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "TEST-4": {
      "line": 141,
      "title": "Integration tests (API → DB → API roundtrip for critical flows)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "testing"
    },
    "DRY-7": {
      "line": 142,
      "title": "Dashboard page.tsx: extract 120+ lines of data transformation to `lib/dashboard/transformers.ts`",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "code-quality"
    },
    "DS-4": {
      "line": 143,
      "title": "ExpenseChart: replace inline `backgroundColor` with token-mapped CSS variables",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "design-system"
    },
    "FIN-14": {
      "line": 144,
      "title": "DashboardService: document or fix float arithmetic in FX conversion (`Math.abs(balance) * rate`)",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "financial"
    },
    "DEV-11": {
      "line": 145,
      "title": "Overview: Add upcoming payments endpoint — bills due + expected invoice payments (RightRail placeholder)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-12": {
      "line": 146,
      "title": "Overview: Add action items endpoint — unreconciled txns, overdue invoices, overdue bills (RightRail placeholder)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-13": {
      "line": 147,
      "title": "Overview: Add cash flow time-series chart endpoint — historical cash position by day/week (CashFlowChart placeholder)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-14": {
      "line": 148,
      "title": "Overview: Add expense breakdown by category endpoint for ExpenseChart (placeholder component)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-17": {
      "line": 149,
      "title": "Overview: P&L Summary mini-widget — revenue vs expense bars + YTD trend (ReportService ready)~~ **SUPERSEDED by DEV-179+DEV-180**",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-18": {
      "line": 150,
      "title": "Overview: Balance Sheet Snapshot widget — asset:liability donut + equity trend (ReportService ready)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-19": {
      "line": 151,
      "title": "Overview: Trial Balance Status widget — balanced alert + account type counts (ReportService ready)~~ **SUPERSEDED by DEV-179+DEV-181**",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "FIN-16": {
      "line": 152,
      "title": "Overview: Financial Health Ratios widget — current ratio, working capital, debt-to-equity, profit margin (computed from BS+P&L)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "DEV-20": {
      "line": 153,
      "title": "Overview: Top Revenue Clients widget — top 5 by YTD revenue + concentration % (ReportService ready)~~ **SUPERSEDED by DEV-179+DEV-182**",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-179": {
      "line": 154,
      "title": "Overview Widgets: Add client-side API functions for P&L, Trial Balance, and Revenue reports (dashboard-client.ts)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-180": {
      "line": 155,
      "title": "Overview Widgets: Create ProfitLossSummaryWidget component — revenue vs expense bars + YTD trend",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [
        "DEV-179"
      ],
      "domain": "development"
    },
    "DEV-181": {
      "line": 156,
      "title": "Overview Widgets: Create TrialBalanceStatusWidget component — balanced alert + account type counts",
      "effort": "45m",
      "priority": "medium",
      "status": "ready",
      "deps": [
        "DEV-179"
      ],
      "domain": "development"
    },
    "DEV-182": {
      "line": 157,
      "title": "Overview Widgets: Create TopRevenueClientsWidget component — top 5 by YTD revenue + concentration %",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [
        "DEV-179"
      ],
      "domain": "development"
    },
    "DEV-183": {
      "line": 158,
      "title": "Overview Widgets: Add 3 report widgets to Overview page grid layout (responsive 3-col)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-184": {
      "line": 159,
      "title": "Overview Widgets: Update Overview loading skeleton to include report widgets row",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [
        "DEV-183"
      ],
      "domain": "development"
    },
    "DEV-21": {
      "line": 160,
      "title": "Overview: Client Payment Health widget — % paid on time, avg days-to-payment, overdue count (Invoice model)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-22": {
      "line": 161,
      "title": "Overview: Invoice Aging Waterfall widget — AR buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-23": {
      "line": 162,
      "title": "Overview: Revenue by Category widget — revenue sources breakdown from InvoiceLine + Category",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-24": {
      "line": 163,
      "title": "Overview: Top Expense Vendors widget — top 5 by YTD spend + % of total (Bill + vendor aggregations)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-25": {
      "line": 164,
      "title": "Overview: Bill Aging Waterfall widget — AP buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-26": {
      "line": 165,
      "title": "Overview: Vendor Payment Terms widget — on-time vs late payment performance",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-27": {
      "line": 166,
      "title": "Overview: Reconciliation Status widget — progress bar per account + unmatched count (ReconciliationService ready)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-28": {
      "line": 167,
      "title": "Overview: Import Health widget — last import date, success rate, failed imports (ImportBatch model)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-29": {
      "line": 168,
      "title": "Overview: Categorization Gap widget — % of transactions uncategorized by account (Transaction.categoryId)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-30": {
      "line": 169,
      "title": "Overview: Duplicate Detection Stats widget — duplicates detected this month (duplication.service)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-31": {
      "line": 170,
      "title": "Overview: Journal Entry Status widget — count by status (DRAFT/POSTED/VOIDED), draft aging > 7d alert",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-32": {
      "line": 171,
      "title": "Overview: GL Posting Pipeline widget — pending bank feed txns waiting to post, oldest first",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-33": {
      "line": 172,
      "title": "Overview: Ledger Spike Detection widget — accounts with unusual balance swings this month",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-34": {
      "line": 173,
      "title": "Overview: Goal Progress widget — progress bars for active goals, days to deadline (Goal model)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-35": {
      "line": 174,
      "title": "Overview: Budget vs Actual widget — % of budget used this month, over-budget alerts (Budget model)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-36": {
      "line": 175,
      "title": "Overview: Expense Forecast widget — projected monthly spend at current 3-month run rate",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-37": {
      "line": 176,
      "title": "Overview: Cash Runway widget — days of cash remaining at burn rate, healthy/monitor/critical",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-38": {
      "line": 177,
      "title": "Overview: Multi-Currency Exposure widget — portfolio breakdown by currency + FX risk %",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-39": {
      "line": 178,
      "title": "Overview: Entity KPI Comparison widget — side-by-side entity performance for multi-business users",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-40": {
      "line": 179,
      "title": "Overview: Onboarding Completion nudge widget — checklist of remaining steps (OnboardingProgress model)",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-41": {
      "line": 180,
      "title": "Overview: Tax Liability Estimate widget — estimated taxes due this quarter (needs tax rules engine)",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-42": {
      "line": 181,
      "title": "Overview: Subscription MRR/ARR widget — recurring revenue detection for SaaS solopreneurs",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-47": {
      "line": 182,
      "title": "Banking: Add transaction full-text search on description/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-48": {
      "line": 183,
      "title": "Banking: Add transaction split UI + endpoint (isSplit field exists, no implementation)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-49": {
      "line": 184,
      "title": "Banking: Show multi-currency amounts — display original + base currency on transactions",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-50": {
      "line": 185,
      "title": "Banking: Add transaction export (CSV/PDF) for filtered transaction views",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-51": {
      "line": 186,
      "title": "Banking: Add account balance history chart — historical balance trend over time",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-52": {
      "line": 187,
      "title": "Banking: Add duplicate management UI — view detected duplicates, approve/dismiss",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-53": {
      "line": 188,
      "title": "Banking: Add transaction auto-categorization rules UI (Rule model exists in AI domain)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-54": {
      "line": 189,
      "title": "Banking: Add batch transaction edit — bulk update description/category/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-55": {
      "line": 190,
      "title": "Banking: Recurring transaction detection — identify frequency patterns (e.g. Netflix monthly, API subscriptions)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-56": {
      "line": 191,
      "title": "Banking: Add receipt/attachment upload per transaction (notes field exists, need file storage)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-57": {
      "line": 192,
      "title": "Banking: Add CSV import column mapping UI (backend supports columnMappings, frontend hardcoded)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-58": {
      "line": 193,
      "title": "Banking: Add import error detail view — show per-row errors when import partially fails",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-52": {
      "line": 194,
      "title": "Business: Add sort by columns on invoice/bill/client/vendor lists (backend supports orderBy)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-85": {
      "line": 195,
      "title": "Business: Add bill PDF generation (invoice PDF exists, bills have no PDF)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-86": {
      "line": 196,
      "title": "Business: Add aging drill-down — click AR/AP aging bucket to see individual invoices/bills",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-87": {
      "line": 197,
      "title": "Business: Add duplicate invoice/bill detection — flag same vendor+amount+date combinations",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-88": {
      "line": 198,
      "title": "Business: Add email reminder for overdue invoices (mark-overdue endpoint exists, no notification)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-89": {
      "line": 199,
      "title": "Business: Add recurring invoice templates — auto-generate invoices on schedule",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-54": {
      "line": 200,
      "title": "Business: Auto-fill due date from client/vendor payment terms (terms field exists, not used in form)",
      "effort": "30m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-55": {
      "line": 201,
      "title": "Business: Add visual status pipeline on invoice/bill list — Draft→Sent→Partial→Paid flow",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-90": {
      "line": 202,
      "title": "Business: Add top debtors/creditors summary widget — clients with most outstanding AR, vendors with most AP",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-91": {
      "line": 203,
      "title": "Business: Add invoice/bill/client/vendor CSV export",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-93": {
      "line": 204,
      "title": "Business: Add payment receipt PDF generation",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-94": {
      "line": 205,
      "title": "Business: Add batch invoice creation — generate multiple invoices from template",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-57": {
      "line": 206,
      "title": "Business: Add notes/activity log per client and vendor (notes field exists, no UI)",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-99": {
      "line": 207,
      "title": "Planning: Add budget variance analysis endpoint — compare budget amount vs actual spend from GL/transactions",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-98"
      ],
      "domain": "development"
    },
    "DEV-100": {
      "line": 208,
      "title": "Planning: Add goal auto-tracking + milestone notifications — calculate currentAmount from linked account/category, alert at 25/50/75/100%",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-97"
      ],
      "domain": "development"
    },
    "DEV-101": {
      "line": 209,
      "title": "Planning: Wire planning reports to existing accounting report endpoints (reuse P&L/BS/CF, don't duplicate)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-61": {
      "line": 210,
      "title": "Planning: Build forecasts page — cash flow projection chart using historical transaction trends",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-102": {
      "line": 211,
      "title": "Planning: Add Forecast model to Prisma + CRUD service (scenario modeling: optimistic/pessimistic/baseline)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-62": {
      "line": 212,
      "title": "Planning: Add budget period selector (monthly/quarterly/yearly) with visual spend-rate indicator",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "UX-59"
      ],
      "domain": "ux"
    },
    "UX-63": {
      "line": 213,
      "title": "Planning: Add budget vs actual drill-down — click category to see transactions contributing to spend",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-99"
      ],
      "domain": "ux"
    },
    "DEV-103": {
      "line": 214,
      "title": "Planning: Add cash runway calculator — months remaining at current burn rate, healthy/warning/critical indicator",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-104": {
      "line": 215,
      "title": "Planning: Add seasonal pattern detection — highlight historically high/low revenue months from transaction data",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-105": {
      "line": 216,
      "title": "Planning: Add budget alerts — threshold warnings at 80%/100% utilization, surfaced to dashboard action items",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-99"
      ],
      "domain": "development"
    },
    "UX-64": {
      "line": 217,
      "title": "Planning: Add goal trajectory projection — trend line showing \"on pace\" vs \"behind\" based on progress rate",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-100"
      ],
      "domain": "ux"
    },
    "DEV-106": {
      "line": 218,
      "title": "Planning: Add soft delete to Budget and Goal models (missing deletedAt — financial invariant gap)",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-107": {
      "line": 219,
      "title": "Planning: Add AI-powered expense forecast — predict next month spend using 3-month trend + seasonality",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-104"
      ],
      "domain": "development"
    },
    "DEV-108": {
      "line": 220,
      "title": "Planning: Add goal templates — pre-built goals (emergency fund, revenue target, expense reduction)",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-97"
      ],
      "domain": "development"
    },
    "UX-65": {
      "line": 221,
      "title": "Planning: Add budget/goal export (CSV/PDF)",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-109": {
      "line": 222,
      "title": "Planning: Add budget rollover — option to carry unused budget forward to next period",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-98"
      ],
      "domain": "development"
    },
    "DEV-110": {
      "line": 223,
      "title": "Planning: Add \"What-if\" scenario comparison — side-by-side view of 2-3 forecast scenarios",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-102"
      ],
      "domain": "development"
    },
    "DEV-111": {
      "line": 224,
      "title": "Planning: Auto-suggest budgets from existing spending patterns — pre-fill amounts from 3-month category averages",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-98"
      ],
      "domain": "development"
    },
    "DEV-114": {
      "line": 225,
      "title": "Insights: Extract shared AI types to `packages/types/src/ai.ts` (currently only in backend `services/types.ts`)",
      "effort": "20m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-115": {
      "line": 226,
      "title": "Insights: Add route-level tests for `/api/ai/chat` and `/api/ai/categorize` endpoints",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-116": {
      "line": 227,
      "title": "Insights: Add RBAC tests for AI permission enforcement (verify 403 for insufficient roles)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-117": {
      "line": 228,
      "title": "Insights: Wire AIBrief on dashboard to show real data (generate basic insight from transaction trends)",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [
        "DEV-112"
      ],
      "domain": "development"
    },
    "DEV-118": {
      "line": 229,
      "title": "Insights: Implement `GET /api/ai/insights` endpoint (replace 501 stub, use Insight Prisma model)",
      "effort": "2-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-119": {
      "line": 230,
      "title": "Insights: Build Policy Alerts page with real data (requires new BE endpoint for rule-based alerts)",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-120": {
      "line": 231,
      "title": "Insights: Build History page with AI interaction logging (requires new BE endpoint + model)",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [
        "DEV-118"
      ],
      "domain": "development"
    },
    "DOC-4": {
      "line": 232,
      "title": "Elevate source preservation to explicit 5th invariant in guardrails.md",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DEV-15": {
      "line": 233,
      "title": "Overview: Add top expense categories widget (data exists in categorized transactions)",
      "effort": "1-2h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-16": {
      "line": 234,
      "title": "Overview: Add unreconciled transaction count badge to dashboard",
      "effort": "1h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "PERF-4": {
      "line": 235,
      "title": "PDF generation: move to worker thread (unblock event loop)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-11": {
      "line": 236,
      "title": "Distributed rate limiting (Redis-backed) for multi-instance",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "DRY-5": {
      "line": 237,
      "title": "`window.Clerk` triple-cast in downloadReport: clean up type assertion",
      "effort": "30m",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "code-quality"
    },
    "DOC-5": {
      "line": 238,
      "title": "Add double-entry bookkeeping check to guardrails.md anti-patterns",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-6": {
      "line": 239,
      "title": "Update version dates across CLAUDE.md files (inconsistent: 2026-02-15 vs 2026-02-09)",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "FIN-11": {
      "line": 240,
      "title": "Consolidation/elimination accounting (multi-entity)",
      "effort": "8h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-12": {
      "line": 241,
      "title": "GAAP-compliant GL export format (XBRL/ixBRL regulatory reporting)",
      "effort": "6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "SEC-15": {
      "line": 242,
      "title": "Duplicate file detection for uploads",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "SEC-16": {
      "line": 243,
      "title": "File retention policies (auto-cleanup of old uploads)",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "INFRA-11": {
      "line": 244,
      "title": "Database migration testing in CI pipeline",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-12": {
      "line": 245,
      "title": "Usage analytics (companies, transactions, reports generated)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "FIN-6": {
      "line": 246,
      "title": "Cash Flow: document hardcoded account code ranges for categorization",
      "effort": "doc",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "DEV-121": {
      "line": 247,
      "title": "Accounting: Add journal entry detail page `/accounting/journal-entries/[id]` — view entry with debit/credit lines, approve/void actions, source document link (API `GET /:id` exists, no frontend)",
      "effort": "3-4h",
      "priority": "critical",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "UX-77": {
      "line": 248,
      "title": "Routing: Move `/business/invoices/bills/[id]` → `/business/bills/[id]` — bills aren't children of invoices, fix domain nesting + update all internal links",
      "effort": "30m",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-78": {
      "line": 249,
      "title": "Routing: Rename `/insights/insights` → `/insights` — move page.tsx up one level, eliminate stuttering URL segment, update nav config",
      "effort": "30m",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "DEV-122": {
      "line": 250,
      "title": "Business: Add client detail page `/business/clients/[id]` — contact info, stats summary, invoice history tab, edit capability (API `GET /clients/:id` + `PUT` exist). Absorbs DEV-95 + UX-37 (client portion)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "UX-79": {
      "line": 251,
      "title": "Business: Add bill detail page at `/business/bills/[id]` — view bill, approve/cancel actions, payment progress bar, mark-overdue button (API `GET /bills/:id` exists). Absorbs UX-56 + UX-40. Depends on UX-77 (route fix)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [
        "UX-77"
      ],
      "domain": "ux"
    },
    "UX-81": {
      "line": 252,
      "title": "Business: Add payment detail page `/business/payments/[id]` — view payment with allocation breakdown across invoices/bills and GL posting status",
      "effort": "2-3h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DS-1": {
      "line": 271,
      "title": "Figma-to-code token sync audit",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "design-system"
    },
    "DS-2": {
      "line": 277,
      "title": "Storybook setup for component documentation",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "design-system"
    },
    "MKT-1": {
      "line": 287,
      "title": "Landing page copy and design",
      "effort": "3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-3": {
      "line": 288,
      "title": "Install 3D dependencies (`@react-three/fiber`, `@react-three/drei`, `three`)",
      "effort": "15m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-4": {
      "line": 289,
      "title": "Create hero section with 3D orb and parallax effect",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "MKT-3"
      ],
      "domain": "marketing"
    },
    "MKT-5": {
      "line": 290,
      "title": "Create problem statement section (3 pain point cards)",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-6": {
      "line": 291,
      "title": "Create solution pillars section (3 GlowCard components)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-7": {
      "line": 292,
      "title": "Create 3D feature showcase (interactive card grid)",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "MKT-3"
      ],
      "domain": "marketing"
    },
    "MKT-8": {
      "line": 293,
      "title": "Create stats/social proof section (animated counters)",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-9": {
      "line": 294,
      "title": "Create final CTA section (gradient background, glass container)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-10": {
      "line": 295,
      "title": "Create landing page layout (minimal nav + footer)",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-11": {
      "line": 296,
      "title": "Replace root page with landing (remove redirect)",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-12": {
      "line": 297,
      "title": "Add scroll animations and performance optimization (Lighthouse >90)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [
        "MKT-11"
      ],
      "domain": "marketing"
    },
    "MKT-2": {
      "line": 303,
      "title": "User documentation / getting started guide",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "CNT-1": {
      "line": 304,
      "title": "Competitive analysis update",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "content"
    },
    "INFRA-1": {
      "line": 314,
      "title": "CI/CD pipeline (GitHub Actions)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-2": {
      "line": 315,
      "title": "Production environment setup",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-3": {
      "line": 316,
      "title": "Database backups (automated daily)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "ARCH-3": {
      "line": 317,
      "title": "S3 cloud storage migration for file uploads (replace local filesystem)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "INFRA-5": {
      "line": 318,
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
      "line": 319,
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
      "line": 320,
      "title": "Docker image building + container deployment pipeline",
      "effort": "3h",
      "priority": "high",
      "status": "blocked",
      "deps": [
        "INFRA-1"
      ],
      "domain": "infrastructure"
    },
    "INFRA-59": {
      "line": 321,
      "title": "Flinks API production readiness — verify env vars, test demo mode, create deployment checklist (code already exists, prep for API key activation)",
      "effort": "1-2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-4": {
      "line": 329,
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
      "line": 330,
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
