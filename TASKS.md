# Akount — Task Board

**Last Updated:** 2026-02-20
**Current Phase:** Phase 6 — Launch MVP

> **256 tasks** · 🔴 0 critical · 🟠 59 high · 🟡 130 medium · ⚪ 28 low · ✅ 39 done
> 🟢 93 ready · 📦 117 backlog · 🔒 7 blocked · ⚠️ 0 stale · 🎯 0 high-risk

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
| ~~DEV-1~~ | ~~Onboarding middleware fix (middleware.ts TODO — disabled, blocks resume)~~ | 1h | 🔴 Critical | ✅ | | audit:smooth-floating-mountain |
| ~~PERF-18~~ | ~~Add composite index on Invoice for AR aging (entityId, status, dueDate, deletedAt)~~ | 2h | 🔴 Critical | ✅ | | audit:2026-02-20 |
| ~~PERF-19~~ | ~~Add composite index on Transaction for date range queries (accountId, categoryId, date, deletedAt)~~ | 2h | 🔴 Critical | ✅ | | audit:2026-02-20 |
| ~~PERF-20~~ | ~~Add composite index on Bill for AP aging (entityId, status, dueDate, deletedAt)~~ | 2h | 🔴 Critical | ✅ | | audit:2026-02-20 |
| SEC-8 | Complete security audit (OWASP top 10, auth, tenant isolation, input validation) | 4h | 🟠 High | 🟡 deferred | | roadmap |
| ~~SEC-9~~ | ~~CSRF protection review (N/A — pure JWT Bearer auth, no cookies, not vulnerable to CSRF)~~ | 1h | 🟠 High | ✅ | | roadmap |
| ~~PERF-1~~ | ~~Balance Sheet: combine 2 redundant heavy SQL queries into 1~~ | 2h | 🟠 High | ✅ | | review:performance |
| ~~PERF-5~~ | ~~Database indexes on hot paths (dashboard, reports)~~ | 2h | 🟠 High | ✅ | | roadmap |
| ~~PERF-6~~ | ~~Query optimization audit (dashboard + report queries)~~ | 2h | 🟠 High | ✅ | | roadmap |
| ~~PERF-8~~ | ~~p95 < 2s page load target verification + load testing~~ | 2h | 🟠 High | ✅ | | roadmap |
| ~~INFRA-14~~ | ~~Add timeout to Clerk auth verification (3-second Promise.race wrapper in auth middleware)~~ | 4h | 🟠 High | ✅ | | audit:2026-02-20 |
| ~~SEC-23~~ | ~~Replace console.log in webhook route with structured logging (apps/web/src/app/api/webhooks/clerk/route.ts — 7 occurrences)~~ | 30m | 🟠 High | ✅ | | audit:2026-02-20 |
| ~~DRY-1~~ | ~~Report types: move shared types to `packages/types` (eliminate duplication)~~ | 1h | 🟠 High | ✅ | | review:typescript |
| UX-1 | Entity selector: replace 7+ hardcoded `entities[0]` with real selector (Accounting JE/COA, AccountFormSheet, Navbar, Invoicing, Vendors — all domains affected) | 2-3h | 🟠 High | 🟢 | | review:nextjs, audit:acct-fe-be, audit:app-ux |
| ~~UX-2~~ | ~~GL Account ID: replace raw CUID input with searchable dropdown (also: JE form uses plain Select)~~ | 1h | 🟠 High | ✅ | | review:nextjs, audit:acct-fe-be |
| TEST-1 | Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests | 3-4h | 🟠 High | 🟢 | | review:typescript |
| TEST-2 | E2E tests for critical user flows (onboarding, import, posting, reports) | 4h | 🟠 High | 🟢 | | roadmap |
| TEST-3 | 80%+ API test coverage target | 2h | 🟠 High | 🔒 | [needs: TEST-1] | roadmap |
| DEV-2 | Service tests for client/invoice/bill/vendor services | 3h | 🟠 High | 🟢 | | audit:smooth-floating-mountain |
| ~~PERF-9~~ | ~~Replace console.log with pino structured logging (7 production files — already compliant, only env.ts pre-boot)~~ | 2h | 🟠 High | ✅ | | plan:phase-6-tasks |
| UX-8 | Add loading/error states to remaining dashboard pages (~30 pages) | 2h | 🟠 High | 🟢 | | plan:phase-6-tasks |
| ~~ARCH-2~~ | ~~Audit log coverage expansion (bulk ops, imports, exports, reconciliation)~~ | 3h | 🟠 High | ✅ | | review:smooth-floating-mountain (commit 7b709b6) |
| ~~ARCH-6~~ | ~~Audit logging inside DB transactions (not fire-and-forget outside TX)~~ | 2h | 🟠 High | ✅ | | review:smooth-floating-mountain §2.2.1 (commit 86f13c4) |
| ~~SEC-11~~ | ~~File upload virus scanning (ClamAV integration for PDFs/CSVs)~~ | 3h | 🟠 High | ✅ | | review:smooth-floating-mountain §2.2.3 |
| ~~SEC-13~~ | ~~Audit log tamper detection (immutable log storage)~~ | 3h | 🟠 High | ✅ | | review:smooth-floating-mountain §2.2.4 |
| ~~INFRA-9~~ | ~~Secrets management for production (env var vault, not .env files)~~ | 2h | 🟠 High | ✅ | | review:smooth-floating-mountain §2.4.4 |
| ~~INFRA-10~~ | ~~Security scanning in CI (SAST + dependency/supply chain checks)~~ | 2h | 🟠 High | ✅ | | review:smooth-floating-mountain §2.4.4 |
| ~~SEC-17~~ | ~~XSS fix: sanitize `dangerouslySetInnerHTML` in AIBrief (DOMPurify or markdown renderer)~~ | 30m | 🟠 High | ✅ | | review:dashboard-overview |
| ~~SEC-18~~ | ~~Dashboard routes: replace unsafe `request.tenantId as string` with `requireTenantId()` guard~~ | 30m | 🟠 High | ✅ | | review:dashboard-overview |
| ~~SEC-19~~ | ~~Dashboard routes: replace unsafe `as DashboardQuery` casts with Fastify generic route typing~~ | 1h | 🟠 High | ✅ | | review:dashboard-overview |
| ~~FIN-13~~ | ~~`UpcomingPayments.amount` typed as `string` — must be `number` (integer cents violation)~~ | 15m | 🟠 High | ✅ | | review:dashboard-overview |
| ~~DOC-1~~ | ~~Add plan-enforcement.md to CLAUDE.md Tier 1/2 context hierarchy~~ | 30m | 🟠 High | ✅ | | review:smooth-floating-mountain |
| ~~UX-11~~ | ~~Overview: Wire `/overview/net-worth` page with real data (backend endpoint exists, page says "coming soon")~~ | 1-2h | 🟠 High | ✅ | | audit:fe-be-parity |
| ~~UX-12~~ | ~~Overview: Wire `/overview/cash-flow` page with real data (backend endpoint exists, page says "coming soon")~~ | 1-2h | 🟠 High | ✅ | | audit:fe-be-parity |
| ~~FIN-15~~ | ~~Performance endpoint: Wire receivables data from invoicing domain (currently hardcoded to 0)~~ | 2-3h | 🟠 High | ✅ | | audit:fe-be-parity |
| ~~DEV-10~~ | ~~Overview: Add Accounts Payable summary to dashboard (query bills/vendor domain)~~ | 2-3h | 🟠 High | ✅ | | audit:fe-be-parity |
| ~~DEV-43~~ | ~~Banking: Add manual transaction creation form (POST endpoint exists, no UI)~~ | 2-3h | 🟠 High | ✅ | | audit:fe-be-parity |
| ~~DEV-44~~ | ~~Banking: Wire XLSX import support in import wizard (backend endpoint exists)~~ | 1-2h | 🟠 High | ✅ | | audit:fe-be-parity |
| UX-13 | Banking: Add category management page — edit, delete, detail view (3 endpoints exist, no UI) | 2-3h | 🟠 High | 🟢 | | audit:fe-be-parity |
| ~~UX-14~~ | ~~Banking: Add unmatch button to reconciliation (DELETE endpoint exists, no UI)~~ | 1h | 🟠 High | ✅ | | audit:fe-be-parity |
| ~~DEV-45~~ | ~~Banking: Add import batch detail page — drill into imported transactions (GET endpoint exists)~~ | 1-2h | 🟠 High | ✅ | | audit:fe-be-parity |
| DEV-46 | Banking: Implement transfers page — inter-account transfers with journal entry creation | 4-6h | 🟠 High | 📦 | | audit:fe-be-parity |
| UX-15 | Banking: Add GL account linking UI on account detail (glAccountId field exists, no UI) | 1-2h | 🟠 High | 🟢 | | audit:fe-be-parity |
| INFRA-13 | Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import | 8-12h | 🟠 High | 📦 | | audit:fe-be-parity |
| ~~UX-16~~ | ~~Accounting: Add confirmation dialogs on Void/Delete journal entry actions (no prompt currently)~~ | 30m | 🟠 High | ✅ | | audit:acct-fe-be |
| UX-17 | App-wide: Add toast notifications on ALL mutations — zero toast usage across entire app (accounting, banking, invoicing, vendors, settings: ~20+ mutation points) | 3-4h | 🟠 High | 🟢 | | audit:acct-fe-be, audit:app-ux |
| UX-18 | Accounting: Add landing page at `/accounting` with summary stats (draft JEs, account count, recent activity) | 2-3h | 🟠 High | 🟢 | | audit:acct-fe-be |
| DEV-59 | Accounting: Add transaction posting UI — post bank txns to GL (3 backend endpoints exist, no UI) | 3-4h | 🟠 High | 🟢 | | audit:acct-fe-be |
| ~~DEV-60~~ | ~~Accounting: Add journal entry sourceType filter (backend supports, UI only has status filter)~~ | 30m | 🟠 High | ✅ | | audit:acct-fe-be |
| UX-29 | App-wide: Add confirmation dialogs on ALL destructive actions — Cancel Invoice/Bill, Bulk Delete, account deactivate (6+ unconfirmed actions) | 2h | 🟠 High | 🟢 | | audit:app-ux |
| UX-30 | Banking: Fix posted transaction link (goes to filtered list, not specific journal entry) | 30m | 🟠 High | 🟢 | | audit:app-ux |
| UX-31 | Business: Add search/filter bar on invoice, bill, client, vendor lists (no search, status filter, or date filter) | 2-3h | 🟠 High | 🟢 | | audit:app-ux |
| UX-32 | Business: Add pagination controls — backend supports cursor pagination, frontend shows max 50 items with no "Load More" | 1-2h | 🟠 High | 🟢 | | audit:app-ux |
| DEV-71 | Business: Add invoice/bill edit for DRAFT status (PUT endpoints exist, no edit UI) | 2-3h | 🟠 High | 🟢 | | audit:app-ux |
| DEV-72 | Business: Add void invoice action (POST /business/invoices/:id/void exists, no UI button) | 1h | 🟠 High | 🟢 | | audit:app-ux |
| DEV-73 | Business: Add vendor CRUD — create/edit/delete (full backend API exists, frontend is read-only) | 2-3h | 🟠 High | 🟢 | | audit:app-ux |
| DEV-74 | Business: Add client CRUD — create/edit/delete (full backend API exists, only inline from invoice form) | 2-3h | 🟠 High | 🟢 | | audit:app-ux |
| DEV-75 | Business: Replace bills "Coming Soon" stub with real bill list page (API ready, `/business/bills` is placeholder) | 2-3h | 🟠 High | 🟢 | | audit:app-ux |
| DEV-76 | Business: Wire payment allocation UI — split payment across multiple invoices (PaymentAllocation model + endpoints exist) | 3-4h | 🟠 High | 🟢 | | audit:app-ux, audit:fe-be-parity |
| DEV-77 | Business: Wire edit/delete invoice/bill/payment actions (PUT/DELETE endpoints exist, no UI) | 2-3h | 🟠 High | 🟢 | | audit:app-ux, audit:fe-be-parity |
| DEV-78 | Business: Wire "Post to GL" button on payment allocation (backend route exists, no frontend trigger) | 1h | 🟠 High | 🟢 | | audit:fe-be-parity |
| UX-45 | Business: Add quick "Record Payment" button on invoice detail page (shortcut to payment form) | 1-2h | 🟠 High | 🟢 | | audit:fe-be-parity |
| DEV-97 | Planning: Build Goal service + full CRUD (create/list/get/update/delete using Goal model, migrate from Entity.metadata) | 4-6h | 🟠 High | 📦 | | audit:fe-be-parity |
| DEV-98 | Planning: Build Budget service + full CRUD (create/list/get/update/delete using Budget model) | 4-6h | 🟠 High | 📦 | | audit:fe-be-parity |
| UX-58 | Planning: Build goals page — list goals, create form, progress tracking, status updates | 3-4h | 🟠 High | 📦 | [needs: DEV-97] | audit:fe-be-parity |
| UX-59 | Planning: Build budgets page — list budgets, create form, budget vs actual bars | 3-4h | 🟠 High | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| UX-60 | Planning: Add planning landing page at `/planning` with summary cards (active goals, budget utilization, forecast status) | 2-3h | 🟠 High | 📦 | [needs: DEV-97, DEV-98] | audit:fe-be-parity |
| ~~UX-66~~ | ~~Rename "AI Advisor" → "Insights" across entire codebase (~29 files): frontend routes/dir rename/nav/components, RBAC comment, CLAUDE.md docs, design system docs, config/meta. Backend `domains/ai/`, API paths, permission keys, Prisma models stay as-is.~~ | 2-3h | 🟠 High | ✅ | | audit:ai-advisor |
| DEV-112 | Insights: Create API client (`apps/web/src/lib/api/ai.ts`) for 5 existing AI endpoints | 30m | 🟠 High | 🟢 | | audit:ai-advisor |
| DEV-113 | Insights: Build AI Chat interface on Insights page (wire to existing `POST /api/ai/chat`) | 2-3h | 🟠 High | 📦 | [needs: UX-66, DEV-112] | audit:ai-advisor |
| UX-72 | Dashboard: Implement cash flow projection endpoint + wire chart (CashFlowChart expects time-series data, endpoint returns static snapshot only) | 3-4h | 🟠 High | 🟢 | | manual:bug-fix |

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| ~~FIN-17~~ | ~~Fix missing entityId on import audit logs (imports.ts:140, 396)~~ | 30m | 🟡 Medium | ✅ | | diagnose:audit-fk-bug |
| ~~FIN-18~~ | ~~Fix missing entityId on data export audit log (system/routes.ts)~~ | 15m | 🟡 Medium | ✅ | | diagnose:audit-fk-bug |
| ~~ARCH-7~~ | ~~Fix audit log hash chain race condition (serializable tx)~~ | 1h | 🟡 Medium | ✅ | | diagnose:audit-fk-bug |
| ~~ARCH-8~~ | ~~Pass tx to audit log calls for atomic audit+operation (category, reconciliation)~~ | 1-2h | 🟡 Medium | ✅ | | diagnose:audit-fk-bug |
| ~~FIN-19~~ | ~~Add entityId validation guard in createAuditLog (empty string → undefined)~~ | 15m | ⚪ Low | ✅ | | diagnose:audit-fk-bug |
| ~~FIN-20~~ | ~~Add audit log tests for FK validation (5 new tests)~~ | 30m | ⚪ Low | ✅ | | diagnose:audit-fk-bug |
| UX-33 | App-wide: Add cross-links between related records — Invoice↔Client, Transaction↔JournalEntry, Bill↔Vendor, Payment↔Invoice/Bill (isolated views currently) | 2-3h | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-34 | App-wide: Add bulk operations to list pages — Business (batch send/approve invoices, batch approve bills), Banking (batch deactivate accounts) | 3-4h | 🟡 Medium | 📦 | | audit:app-ux |
| UX-35 | Sidebar: Add "Coming Soon" badge to 17 placeholder pages or hide unimplemented nav items | 30m | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-36 | Business: Add standalone "Create Client" / "Create Vendor" buttons on list pages (currently only via invoice/bill forms) | 1h | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-37 | Business: Add client/vendor edit capability in detail panels (backend PUT endpoints exist, panels are read-only) | 1-2h | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-38 | Banking: Add active/inactive account filter toggle (backend supports `isActive` param, UI shows all) | 30m | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-39 | Banking: Add aria-labels to bulk action buttons, select-all checkbox, filter dropdowns (a11y) | 30m | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-40 | Business: Add mark-overdue button on bill detail (backend endpoint exists, no UI) | 30m | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-41 | Business: Fix hardcoded 'CAD' currency on vendor/client pages — should use entity functional currency | 15m | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-42 | Business: Add "View Journal Entry" link after posting invoice/bill to GL | 30m | 🟡 Medium | 🟢 | | audit:app-ux |
| ~~UX-43~~ | ~~Business: Add payment allocation UI~~ (merged into DEV-76) | 3-4h | 🟡 Medium | ✅ | | audit:app-ux |
| UX-44 | Business: Add invoice/client list CSV/PDF export buttons | 2-3h | 🟡 Medium | 📦 | | audit:app-ux |
| DEV-83 | Business: Build credit notes feature (CreditNote Prisma model exists, zero API endpoints or UI) | 4-6h | 🟡 Medium | 📦 | | audit:app-ux |
| DEV-84 | App-wide: Fix navigation.ts mismatches — Bills route points to stub, verify all nav items match real pages | 30m | 🟡 Medium | 🟢 | | audit:app-ux |
| UX-19 | Accounting COA: Add search input for GL accounts (backend `search` param exists, UI only has type filter) | 30m | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| UX-20 | Accounting COA: Add reactivate button for deactivated accounts (PATCH isActive:true works, no UI) | 15m | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| UX-21 | Accounting COA: Add balance summary header (Total Assets/Liabilities/Equity cards, data already fetched) | 1h | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| UX-22 | Accounting JE: Fix filter auto-refresh (date/status changes don't re-fetch, only affect loadMore) | 1h | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| ~~UX-23~~ | ~~Accounting JE: Replace GL account Select with searchable Combobox (31+ accounts hard to scroll)~~ | 1h | 🟡 Medium | ✅ | | audit:acct-fe-be |
| UX-24 | Accounting JE: Add "Duplicate Entry" action to pre-fill form from existing entry | 1h | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| UX-25 | Accounting Reports: Add quick-generate buttons (Last Month / This Quarter / YTD) on report hub cards | 1h | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| UX-26 | Accounting JE: Add source cross-links (click source type navigates to source transaction/invoice/bill) | 1h | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| UX-27 | Accounting COA: Replace `window.location.reload()` after seed with state update (jarring full reload) | 30m | 🟡 Medium | 🟢 | | audit:acct-fe-be |
| ~~UX-28~~ | ~~Sidebar: Add "Coming Soon" badge or hide unimplemented pages~~ (merged into UX-35) | 15m | 🟡 Medium | ✅ | | audit:acct-fe-be |
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
| PERF-2 | Revenue: add JSONB expression index for extraction | 30m | 🟡 Medium | 🟢 | | review:performance |
| PERF-3 | Recharts: code-split import (lazy load) | 30m | 🟡 Medium | 🟢 | | review:performance |
| ~~PERF-21~~ | ~~Add composite index on JournalLine for GL account filtering (glAccountId, journalEntryId, deletedAt)~~ | 1h | 🟡 Medium | ✅ | | audit:2026-02-20 |
| ~~PERF-22~~ | ~~Add composite index on Payment for client/vendor filtering (clientId, vendorId, status, date, deletedAt)~~ | 1h | 🟡 Medium | ✅ | | audit:2026-02-20 |
| PERF-7 | Lazy-loading heavy frontend components | 1h | 🟡 Medium | 🟢 | | roadmap |
| DRY-2 | CSV sanitization: deduplicate between report-export and data-export | 30m | 🟡 Medium | 🟢 | | review:simplicity |
| DRY-3 | Report routes: extract shared 40-line handler pattern into helper | 1h | 🟡 Medium | 🟢 | | review:simplicity |
| UX-3 | Report tables: add `aria-*` attributes, caption, scope, role="progressbar" | 45m | 🟡 Medium | 🟢 | | review:nextjs |
| UX-4 | Report views: replace array index React keys with stable identifiers | 15m | 🟡 Medium | 🟢 | | review:nextjs |
| DOC-2 | Consolidate logging rules (full version in api-conventions.md, update guardrails.md ref) | 30m | 🟡 Medium | 🟢 | | review:smooth-floating-mountain |
| DOC-3 | Archive .reviews/ temp workspace to docs/reviews/ or delete | 15m | 🟡 Medium | 🟢 | | review:smooth-floating-mountain |
| DOC-7 | Update test/page counts in context files (apps/api: 362→1010 tests, apps/web: 38→54 pages, root: 38→40 models) | 30m | ⚪ Low | 🟢 | | audit:2026-02-20 |
| DOC-8 | Update domain status in apps/api/CLAUDE.md (Invoicing marked "stub" but is fully built) | 15m | ⚪ Low | 🟢 | | audit:2026-02-20 |
| SEC-10 | Row-Level Security (PostgreSQL) for production hardening | 3h | 🟡 Medium | 📦 | | roadmap |
| UX-6 | Keyboard shortcuts for power users (command palette, table nav) | 2h | 🟡 Medium | 📦 | | roadmap |
| UX-7 | Help overlay documenting keyboard shortcuts | 1h | 🟡 Medium | 🔒 | [needs: UX-6] | roadmap |
| SEC-12 | File upload quota enforcement per tenant (prevent abuse/DoS) | 1h | 🟡 Medium | 🟢 | | review:smooth-floating-mountain §2.2.3 |
| SEC-14 | Audit log retention policies (prevent unbounded growth, compliance) | 1h | 🟡 Medium | 🟢 | | review:smooth-floating-mountain §2.2.4 |
| ~~INFRA-15~~ | ~~Add security headers to Next.js API routes (X-Frame-Options, CSP, HSTS in next.config.js)~~ | 1h | 🟡 Medium | ✅ | | audit:2026-02-20 |
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
| ~~DRY-6~~ | ~~Dashboard: deduplicate SparkCards/DashboardLeftRail (shared types, constants, MiniSparkline)~~ | 45m | 🟡 Medium | ✅ | | review:dashboard-overview |
| DRY-7 | Dashboard page.tsx: extract 120+ lines of data transformation to `lib/dashboard/transformers.ts` | 30m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| ~~UX-9~~ | ~~Dashboard: fix SVG gradient ID collision (use `React.useId()`)~~ | 15m | 🟡 Medium | ✅ | | review:dashboard-overview |
| UX-10 | Navbar: add live sync status indicator with refresh button | 30m | 🟡 Medium | 🟢 | | ad-hoc:user-request |
| ~~DEV-3~~ | ~~Dashboard: delete dead `handleSkipStep` in OnboardingHeroCard + dead SparkCardsSkeleton~~ | 10m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DEV-4~~ | ~~Dashboard: type entity maps as `Record<EntityType, ...>` for exhaustive checking~~ | 15m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DS-3~~ | ~~Dashboard: replace `hover:glass-3` with proper hover pattern~~ | 10m | 🟡 Medium | ✅ | | review:dashboard-overview |
| DS-4 | ExpenseChart: replace inline `backgroundColor` with token-mapped CSS variables | 30m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| ~~DS-5~~ | ~~AIBrief: change `text-primary` (amber) to AI-specific purple tokens~~ | 10m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DS-6~~ | ~~Dashboard: resolve `text-[9px]` vs `text-[10px]` inconsistency with `text-micro` utility~~ | 15m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DEV-5~~ | ~~Dashboard: add `cancelAnimationFrame` cleanup in DashboardLeftRail/SparkCards useEffect~~ | 10m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DEV-6~~ | ~~Dashboard: delete duplicate `OnboardingHeroCard` in `components/dashboard/` (dead code)~~ | 5m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DEV-7~~ | ~~DashboardRightRail: replace `\|\|` className with `cn()` for proper class merging~~ | 5m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DEV-8~~ | ~~DashboardService: add explicit return type to `getMetrics()` method~~ | 15m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DEV-9~~ | ~~DashboardService: type `byType` as `Partial<Record<AccountType, number>>` (not `Record<string, number>`)~~ | 10m | 🟡 Medium | ✅ | | review:dashboard-overview |
| FIN-14 | DashboardService: document or fix float arithmetic in FX conversion (`Math.abs(balance) * rate`) | 30m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DEV-11 | Overview: Add upcoming payments endpoint — bills due + expected invoice payments (RightRail placeholder) | 2-3h | 🟡 Medium | 🟢 | | audit:fe-be-parity |
| DEV-12 | Overview: Add action items endpoint — unreconciled txns, overdue invoices, overdue bills (RightRail placeholder) | 3-4h | 🟡 Medium | 🟢 | | audit:fe-be-parity |
| DEV-13 | Overview: Add cash flow time-series chart endpoint — historical cash position by day/week (CashFlowChart placeholder) | 3-4h | 🟡 Medium | 🟢 | | audit:fe-be-parity |
| DEV-14 | Overview: Add expense breakdown by category endpoint for ExpenseChart (placeholder component) | 2-3h | 🟡 Medium | 🟢 | | audit:fe-be-parity |
| DEV-17 | Overview: P&L Summary mini-widget — revenue vs expense bars + YTD trend (ReportService ready) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-18 | Overview: Balance Sheet Snapshot widget — asset:liability donut + equity trend (ReportService ready) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-19 | Overview: Trial Balance Status widget — balanced alert + account type counts (ReportService ready) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| FIN-16 | Overview: Financial Health Ratios widget — current ratio, working capital, debt-to-equity, profit margin (computed from BS+P&L) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-20 | Overview: Top Revenue Clients widget — top 5 by YTD revenue + concentration % (ReportService ready) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-21 | Overview: Client Payment Health widget — % paid on time, avg days-to-payment, overdue count (Invoice model) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-22 | Overview: Invoice Aging Waterfall widget — AR buckets 0-30, 31-60, 61-90, 90+ days | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-23 | Overview: Revenue by Category widget — revenue sources breakdown from InvoiceLine + Category | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-24 | Overview: Top Expense Vendors widget — top 5 by YTD spend + % of total (Bill + vendor aggregations) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-25 | Overview: Bill Aging Waterfall widget — AP buckets 0-30, 31-60, 61-90, 90+ days | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-26 | Overview: Vendor Payment Terms widget — on-time vs late payment performance | 2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-27 | Overview: Reconciliation Status widget — progress bar per account + unmatched count (ReconciliationService ready) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-28 | Overview: Import Health widget — last import date, success rate, failed imports (ImportBatch model) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-29 | Overview: Categorization Gap widget — % of transactions uncategorized by account (Transaction.categoryId) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-30 | Overview: Duplicate Detection Stats widget — duplicates detected this month (duplication.service) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-31 | Overview: Journal Entry Status widget — count by status (DRAFT/POSTED/VOIDED), draft aging > 7d alert | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-32 | Overview: GL Posting Pipeline widget — pending bank feed txns waiting to post, oldest first | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-33 | Overview: Ledger Spike Detection widget — accounts with unusual balance swings this month | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-34 | Overview: Goal Progress widget — progress bars for active goals, days to deadline (Goal model) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-35 | Overview: Budget vs Actual widget — % of budget used this month, over-budget alerts (Budget model) | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-36 | Overview: Expense Forecast widget — projected monthly spend at current 3-month run rate | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-37 | Overview: Cash Runway widget — days of cash remaining at burn rate, healthy/monitor/critical | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-38 | Overview: Multi-Currency Exposure widget — portfolio breakdown by currency + FX risk % | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-39 | Overview: Entity KPI Comparison widget — side-by-side entity performance for multi-business users | 3-4h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-40 | Overview: Onboarding Completion nudge widget — checklist of remaining steps (OnboardingProgress model) | 1-2h | ⚪ Low | 📦 | | audit:fe-be-parity |
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
| ~~UX-50~~ | ~~Business: Add search/filter bar on invoice list~~ (merged into UX-31) | 2-3h | 🟡 Medium | ✅ | | audit:fe-be-parity |
| ~~UX-51~~ | ~~Business: Add search/filter bar on bill list~~ (merged into UX-31) | 2-3h | 🟡 Medium | ✅ | | audit:fe-be-parity |
| UX-52 | Business: Add sort by columns on invoice/bill/client/vendor lists (backend supports orderBy) | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| ~~UX-53~~ | ~~Business: Add pagination controls~~ (merged into UX-32) | 1-2h | 🟡 Medium | ✅ | | audit:fe-be-parity |
| DEV-95 | Business: Add client invoice history tab — all invoices + payments for a client on detail page | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-96 | Business: Add vendor bill history tab — all bills + payments for a vendor on detail page | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-85 | Business: Add bill PDF generation (invoice PDF exists, bills have no PDF) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-86 | Business: Add aging drill-down — click AR/AP aging bucket to see individual invoices/bills | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-87 | Business: Add duplicate invoice/bill detection — flag same vendor+amount+date combinations | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-88 | Business: Add email reminder for overdue invoices (mark-overdue endpoint exists, no notification) | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-89 | Business: Add recurring invoice templates — auto-generate invoices on schedule | 4-6h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-54 | Business: Auto-fill due date from client/vendor payment terms (terms field exists, not used in form) | 30m | 🟡 Medium | 🟢 | | audit:fe-be-parity |
| UX-55 | Business: Add visual status pipeline on invoice/bill list — Draft→Sent→Partial→Paid flow | 1-2h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| UX-56 | Business: Add partial payment progress bar on invoice/bill detail (amountPaid vs total) | 1h | 🟡 Medium | 🟢 | | audit:fe-be-parity |
| DEV-90 | Business: Add top debtors/creditors summary widget — clients with most outstanding AR, vendors with most AP | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| DEV-91 | Business: Add invoice/bill/client/vendor CSV export | 2-3h | 🟡 Medium | 📦 | | audit:fe-be-parity |
| ~~DEV-92~~ | ~~Business: Build credit notes feature~~ (merged into DEV-83) | 4-6h | ⚪ Low | ✅ | | audit:fe-be-parity |
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
| DEV-106 | Planning: Add soft delete to Budget and Goal models (missing deletedAt — financial invariant gap) | 1h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-107 | Planning: Add AI-powered expense forecast — predict next month spend using 3-month trend + seasonality | 4-6h | ⚪ Low | 📦 | [needs: DEV-104] | audit:fe-be-parity |
| DEV-108 | Planning: Add goal templates — pre-built goals (emergency fund, revenue target, expense reduction) | 2-3h | ⚪ Low | 📦 | [needs: DEV-97] | audit:fe-be-parity |
| UX-65 | Planning: Add budget/goal export (CSV/PDF) | 2-3h | ⚪ Low | 📦 | | audit:fe-be-parity |
| DEV-109 | Planning: Add budget rollover — option to carry unused budget forward to next period | 1-2h | ⚪ Low | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| DEV-110 | Planning: Add "What-if" scenario comparison — side-by-side view of 2-3 forecast scenarios | 4-6h | ⚪ Low | 📦 | [needs: DEV-102] | audit:fe-be-parity |
| DEV-111 | Planning: Auto-suggest budgets from existing spending patterns — pre-fill amounts from 3-month category averages | 2-3h | ⚪ Low | 📦 | [needs: DEV-98] | audit:fe-be-parity |
| DEV-114 | Insights: Extract shared AI types to `packages/types/src/ai.ts` (currently only in backend `services/types.ts`) | 20m | 🟡 Medium | 🟢 | | audit:ai-advisor |
| DEV-115 | Insights: Add route-level tests for `/api/ai/chat` and `/api/ai/categorize` endpoints | 1h | 🟡 Medium | 🟢 | | audit:ai-advisor |
| DEV-116 | Insights: Add RBAC tests for AI permission enforcement (verify 403 for insufficient roles) | 30m | 🟡 Medium | 🟢 | | audit:ai-advisor |
| DEV-117 | Insights: Wire AIBrief on dashboard to show real data (generate basic insight from transaction trends) | 1h | 🟡 Medium | 📦 | [needs: DEV-112] | audit:ai-advisor |
| DEV-118 | Insights: Implement `GET /api/ai/insights` endpoint (replace 501 stub, use Insight Prisma model) | 2-4h | 🟡 Medium | 📦 | | audit:ai-advisor |
| DEV-119 | Insights: Build Policy Alerts page with real data (requires new BE endpoint for rule-based alerts) | 3-4h | ⚪ Low | 📦 | | audit:ai-advisor |
| DEV-120 | Insights: Build History page with AI interaction logging (requires new BE endpoint + model) | 2-3h | ⚪ Low | 📦 | [needs: DEV-118] | audit:ai-advisor |
| DOC-4 | Elevate source preservation to explicit 5th invariant in guardrails.md | 15m | 🟡 Medium | 🟢 | | review:smooth-floating-mountain §1.2 |
| DEV-15 | Overview: Add top expense categories widget (data exists in categorized transactions) | 1-2h | ⚪ Low | 🟢 | | audit:fe-be-parity |
| DEV-16 | Overview: Add unreconciled transaction count badge to dashboard | 1h | ⚪ Low | 🟢 | | audit:fe-be-parity |
| PERF-4 | PDF generation: move to worker thread (unblock event loop) | 2h | ⚪ Low | 📦 | | review:performance |
| PERF-11 | Distributed rate limiting (Redis-backed) for multi-instance | 2h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.1.4 |
| DRY-5 | `window.Clerk` triple-cast in downloadReport: clean up type assertion | 30m | ⚪ Low | 📦 | | review:typescript |
| DOC-5 | Add double-entry bookkeeping check to guardrails.md anti-patterns | 15m | ⚪ Low | 🟢 | | review:smooth-floating-mountain §1.2 |
| DOC-6 | Update version dates across CLAUDE.md files (inconsistent: 2026-02-15 vs 2026-02-09) | 15m | ⚪ Low | 🟢 | | review:smooth-floating-mountain §1.2 |
| FIN-11 | Consolidation/elimination accounting (multi-entity) | 8h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.3.1 |
| FIN-12 | GAAP-compliant GL export format (XBRL/ixBRL regulatory reporting) | 6h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.3.3 |
| SEC-15 | Duplicate file detection for uploads | 1h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.2.3 |
| SEC-16 | File retention policies (auto-cleanup of old uploads) | 1h | 🟡 Medium | 📦 | | review:smooth-floating-mountain §2.2.3 |
| INFRA-11 | Database migration testing in CI pipeline | 2h | 🟡 Medium | 📦 | | review:smooth-floating-mountain §2.4.4 |
| INFRA-12 | Usage analytics (companies, transactions, reports generated) | 2h | ⚪ Low | 📦 | | review:smooth-floating-mountain §2.4.5 |
| FIN-6 | Cash Flow: document hardcoded account code ranges for categorization | doc | ⚪ Low | 📦 | | review:financial |

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
| 6: Launch MVP | 🔵 ███░░░░░░░ 30% | — |

**Total Backend Tests:** 1010 (verified 2026-02-17)

---

> **Legend:** 🟢 ready · 📦 backlog · 🔒 blocked (has unmet deps) · ⏳ pending · ✅ done
> **Priority:** 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low











<!-- TASK-INDEX:START (auto-generated, do not edit manually)
{
  "version": "1.0",
  "generated": "2026-02-20T17:13:00.609Z",
  "summary": {
    "total": 266,
    "ready": 89,
    "blocked": 7,
    "backlog": 122,
    "done": 46
  },
  "byPriority": {
    "critical": [
      "DEV-1",
      "PERF-18",
      "PERF-19",
      "PERF-20"
    ],
    "high": [
      "SEC-8",
      "SEC-9",
      "PERF-1",
      "PERF-5",
      "PERF-6",
      "PERF-8",
      "INFRA-14",
      "SEC-23",
      "DRY-1",
      "UX-1",
      "UX-2",
      "TEST-1",
      "TEST-2",
      "TEST-3",
      "DEV-2",
      "PERF-9",
      "UX-8",
      "ARCH-2",
      "ARCH-6",
      "SEC-11",
      "SEC-13",
      "INFRA-9",
      "INFRA-10",
      "SEC-17",
      "SEC-18",
      "SEC-19",
      "FIN-13",
      "DOC-1",
      "UX-11",
      "UX-12",
      "FIN-15",
      "DEV-10",
      "DEV-43",
      "DEV-44",
      "UX-13",
      "UX-14",
      "DEV-45",
      "DEV-46",
      "UX-15",
      "INFRA-13",
      "UX-16",
      "UX-17",
      "UX-18",
      "DEV-59",
      "DEV-60",
      "UX-29",
      "UX-30",
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
      "UX-66",
      "DEV-112",
      "DEV-113",
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
      "UX-33",
      "UX-34",
      "UX-35",
      "UX-36",
      "UX-37",
      "UX-38",
      "UX-39",
      "UX-40",
      "UX-41",
      "UX-42",
      "UX-43",
      "UX-44",
      "DEV-83",
      "DEV-84",
      "UX-19",
      "UX-20",
      "UX-21",
      "UX-22",
      "UX-23",
      "UX-24",
      "UX-25",
      "UX-26",
      "UX-27",
      "UX-28",
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
      "PERF-21",
      "PERF-22",
      "PERF-7",
      "DRY-2",
      "DRY-3",
      "UX-3",
      "UX-4",
      "DOC-2",
      "DOC-3",
      "SEC-10",
      "UX-6",
      "UX-7",
      "SEC-12",
      "SEC-14",
      "INFRA-15",
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
      "DRY-6",
      "DRY-7",
      "UX-9",
      "UX-10",
      "DEV-3",
      "DEV-4",
      "DS-3",
      "DS-4",
      "DS-5",
      "DS-6",
      "DEV-5",
      "DEV-6",
      "DEV-8",
      "DEV-9",
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
      "UX-50",
      "UX-51",
      "UX-52",
      "UX-53",
      "DEV-95",
      "DEV-96",
      "DEV-85",
      "DEV-86",
      "DEV-87",
      "DEV-88",
      "DEV-89",
      "UX-54",
      "UX-55",
      "UX-56",
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
      "DS-2",
      "MKT-2",
      "CNT-1",
      "INFRA-4",
      "INFRA-6"
    ],
    "low": [
      "DEV-70",
      "DOC-7",
      "DOC-8",
      "DEV-40",
      "DEV-41",
      "DEV-42",
      "DEV-92",
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
      "FIN-6"
    ]
  },
  "byEffort": {
    "quick": [
      "FIN-13",
      "UX-41",
      "UX-20",
      "UX-28",
      "UX-4",
      "DOC-3",
      "DOC-8",
      "UX-9",
      "DEV-3",
      "DEV-4",
      "DS-3",
      "DS-5",
      "DS-6",
      "DEV-5",
      "DEV-6",
      "DEV-8",
      "DEV-9",
      "DEV-114",
      "DOC-4",
      "DOC-5",
      "DOC-6"
    ],
    "short": [
      "DEV-1",
      "PERF-18",
      "PERF-19",
      "PERF-20",
      "SEC-9",
      "PERF-1",
      "PERF-5",
      "PERF-6",
      "PERF-8",
      "SEC-23",
      "DRY-1",
      "UX-2",
      "TEST-3",
      "PERF-9",
      "UX-8",
      "ARCH-6",
      "INFRA-9",
      "INFRA-10",
      "SEC-17",
      "SEC-18",
      "SEC-19",
      "DOC-1",
      "UX-11",
      "UX-12",
      "DEV-44",
      "UX-14",
      "DEV-45",
      "UX-15",
      "UX-16",
      "DEV-60",
      "UX-29",
      "UX-30",
      "UX-32",
      "DEV-72",
      "DEV-78",
      "UX-45",
      "DEV-112",
      "UX-35",
      "UX-36",
      "UX-37",
      "UX-38",
      "UX-39",
      "UX-40",
      "UX-42",
      "DEV-84",
      "UX-19",
      "UX-21",
      "UX-22",
      "UX-23",
      "UX-24",
      "UX-25",
      "UX-26",
      "UX-27",
      "DEV-70",
      "PERF-2",
      "PERF-3",
      "PERF-21",
      "PERF-22",
      "PERF-7",
      "DRY-2",
      "DRY-3",
      "UX-3",
      "DOC-2",
      "DOC-7",
      "UX-6",
      "UX-7",
      "SEC-12",
      "SEC-14",
      "INFRA-15",
      "PERF-12",
      "DRY-6",
      "DRY-7",
      "UX-10",
      "DS-4",
      "FIN-14",
      "DEV-19",
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
      "UX-53",
      "UX-54",
      "UX-55",
      "UX-56",
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
      "INFRA-14",
      "TEST-1",
      "TEST-2",
      "DEV-2",
      "ARCH-2",
      "SEC-11",
      "SEC-13",
      "UX-17",
      "DEV-59",
      "DEV-76",
      "UX-58",
      "UX-59",
      "UX-34",
      "UX-43",
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
      "DEV-94",
      "DEV-99",
      "DEV-100",
      "UX-61",
      "DEV-104",
      "DEV-118",
      "DEV-119",
      "DS-2",
      "MKT-1",
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
      "DEV-83",
      "DEV-65",
      "DEV-41",
      "DEV-42",
      "DEV-89",
      "DEV-92",
      "DEV-102",
      "DEV-107",
      "DEV-110",
      "FIN-11",
      "FIN-12"
    ]
  },
  "byDomain": {
    "development": [
      "DEV-1",
      "DEV-2",
      "DEV-10",
      "DEV-43",
      "DEV-44",
      "DEV-45",
      "DEV-46",
      "DEV-59",
      "DEV-60",
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
      "DEV-3",
      "DEV-4",
      "DEV-5",
      "DEV-6",
      "DEV-7",
      "DEV-8",
      "DEV-9",
      "DEV-11",
      "DEV-12",
      "DEV-13",
      "DEV-14",
      "DEV-17",
      "DEV-18",
      "DEV-19",
      "DEV-20",
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
      "DEV-95",
      "DEV-96",
      "DEV-85",
      "DEV-86",
      "DEV-87",
      "DEV-88",
      "DEV-89",
      "DEV-90",
      "DEV-91",
      "DEV-92",
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
      "DEV-16"
    ],
    "performance": [
      "PERF-18",
      "PERF-19",
      "PERF-20",
      "PERF-1",
      "PERF-5",
      "PERF-6",
      "PERF-8",
      "PERF-9",
      "PERF-2",
      "PERF-3",
      "PERF-21",
      "PERF-22",
      "PERF-7",
      "PERF-10",
      "PERF-12",
      "PERF-4",
      "PERF-11"
    ],
    "security": [
      "SEC-8",
      "SEC-9",
      "SEC-23",
      "SEC-11",
      "SEC-13",
      "SEC-17",
      "SEC-18",
      "SEC-19",
      "SEC-10",
      "SEC-12",
      "SEC-14",
      "SEC-15",
      "SEC-16"
    ],
    "infrastructure": [
      "INFRA-14",
      "INFRA-9",
      "INFRA-10",
      "INFRA-13",
      "INFRA-15",
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
    "code-quality": [
      "DRY-1",
      "DRY-2",
      "DRY-3",
      "DRY-6",
      "DRY-7",
      "DRY-5"
    ],
    "ux": [
      "UX-1",
      "UX-2",
      "UX-8",
      "UX-11",
      "UX-12",
      "UX-13",
      "UX-14",
      "UX-15",
      "UX-16",
      "UX-17",
      "UX-18",
      "UX-29",
      "UX-30",
      "UX-31",
      "UX-32",
      "UX-45",
      "UX-58",
      "UX-59",
      "UX-60",
      "UX-66",
      "UX-33",
      "UX-34",
      "UX-35",
      "UX-36",
      "UX-37",
      "UX-38",
      "UX-39",
      "UX-40",
      "UX-41",
      "UX-42",
      "UX-43",
      "UX-44",
      "UX-19",
      "UX-20",
      "UX-21",
      "UX-22",
      "UX-23",
      "UX-24",
      "UX-25",
      "UX-26",
      "UX-27",
      "UX-28",
      "UX-3",
      "UX-4",
      "UX-6",
      "UX-7",
      "UX-9",
      "UX-10",
      "UX-50",
      "UX-51",
      "UX-52",
      "UX-53",
      "UX-54",
      "UX-55",
      "UX-56",
      "UX-57",
      "UX-61",
      "UX-62",
      "UX-63",
      "UX-64",
      "UX-65"
    ],
    "testing": [
      "TEST-1",
      "TEST-2",
      "TEST-3",
      "TEST-4"
    ],
    "architecture": [
      "ARCH-2",
      "ARCH-6",
      "ARCH-5",
      "ARCH-1",
      "ARCH-4",
      "ARCH-3"
    ],
    "financial": [
      "FIN-13",
      "FIN-15",
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
    "documentation": [
      "DOC-1",
      "DOC-2",
      "DOC-3",
      "DOC-7",
      "DOC-8",
      "DOC-4",
      "DOC-5",
      "DOC-6"
    ],
    "design-system": [
      "DS-3",
      "DS-4",
      "DS-5",
      "DS-6",
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
    "PERF-18",
    "PERF-19",
    "PERF-20",
    "PERF-8",
    "INFRA-14",
    "SEC-23",
    "UX-1",
    "TEST-1",
    "TEST-2",
    "DEV-2",
    "UX-8",
    "ARCH-2",
    "ARCH-6",
    "DEV-43",
    "DEV-44",
    "UX-13",
    "DEV-45",
    "UX-15",
    "UX-17",
    "UX-18",
    "DEV-59",
    "UX-29",
    "UX-30",
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
    "DEV-112",
    "UX-33",
    "UX-35",
    "UX-36",
    "UX-37",
    "UX-38",
    "UX-39",
    "UX-40",
    "UX-41",
    "UX-42",
    "DEV-84",
    "UX-19",
    "UX-20",
    "UX-21",
    "UX-22",
    "UX-24",
    "UX-25",
    "UX-26",
    "UX-27",
    "PERF-2",
    "PERF-3",
    "PERF-7",
    "DRY-2",
    "DRY-3",
    "UX-3",
    "UX-4",
    "DOC-2",
    "DOC-3",
    "DOC-7",
    "DOC-8",
    "SEC-12",
    "SEC-14",
    "DRY-7",
    "UX-10",
    "DS-4",
    "FIN-14",
    "DEV-11",
    "DEV-12",
    "DEV-13",
    "DEV-14",
    "UX-54",
    "UX-56",
    "DEV-114",
    "DEV-115",
    "DEV-116",
    "DOC-4",
    "DEV-15",
    "DEV-16",
    "DOC-5",
    "DOC-6",
    "DS-1",
    "INFRA-1",
    "INFRA-2",
    "INFRA-3",
    "ARCH-3"
  ],
  "quickWins": [
    "PERF-18",
    "PERF-19",
    "PERF-20",
    "PERF-8",
    "SEC-23",
    "UX-8",
    "ARCH-6",
    "DEV-44",
    "DEV-45",
    "UX-15",
    "UX-29",
    "UX-30",
    "UX-32",
    "DEV-72",
    "DEV-78",
    "UX-45",
    "DEV-112",
    "DS-1",
    "INFRA-2",
    "INFRA-3"
  ],
  "dashboard": [
    "UX-8",
    "DRY-7",
    "FIN-14",
    "DEV-11",
    "DEV-12",
    "DEV-16"
  ],
  "tasks": {
    "DEV-1": {
      "line": 25,
      "title": "Onboarding middleware fix (middleware.ts TODO — disabled, blocks resume)",
      "effort": "1h",
      "priority": "critical",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "PERF-18": {
      "line": 26,
      "title": "Add composite index on Invoice for AR aging (entityId, status, dueDate, deletedAt)",
      "effort": "2h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-19": {
      "line": 27,
      "title": "Add composite index on Transaction for date range queries (accountId, categoryId, date, deletedAt)",
      "effort": "2h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-20": {
      "line": 28,
      "title": "Add composite index on Bill for AP aging (entityId, status, dueDate, deletedAt)",
      "effort": "2h",
      "priority": "critical",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "SEC-8": {
      "line": 29,
      "title": "Complete security audit (OWASP top 10, auth, tenant isolation, input validation)",
      "effort": "4h",
      "priority": "high",
      "status": "unknown",
      "deps": [],
      "domain": "security"
    },
    "SEC-9": {
      "line": 30,
      "title": "CSRF protection review (N/A — pure JWT Bearer auth, no cookies, not vulnerable to CSRF)",
      "effort": "1h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "security"
    },
    "PERF-1": {
      "line": 31,
      "title": "Balance Sheet: combine 2 redundant heavy SQL queries into 1",
      "effort": "2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "performance"
    },
    "PERF-5": {
      "line": 32,
      "title": "Database indexes on hot paths (dashboard, reports)",
      "effort": "2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "performance"
    },
    "PERF-6": {
      "line": 33,
      "title": "Query optimization audit (dashboard + report queries)",
      "effort": "2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "performance"
    },
    "PERF-8": {
      "line": 34,
      "title": "p95 < 2s page load target verification + load testing",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "INFRA-14": {
      "line": 35,
      "title": "Add timeout to Clerk auth verification (3-second Promise.race wrapper in auth middleware)",
      "effort": "4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "SEC-23": {
      "line": 36,
      "title": "Replace console.log in webhook route with structured logging (apps/web/src/app/api/webhooks/clerk/route.ts — 7 occurrences)",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "DRY-1": {
      "line": 37,
      "title": "Report types: move shared types to `packages/types` (eliminate duplication)",
      "effort": "1h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "code-quality"
    },
    "UX-1": {
      "line": 38,
      "title": "Entity selector: replace 7+ hardcoded `entities[0]` with real selector (Accounting JE/COA, AccountFormSheet, Navbar, Invoicing, Vendors — all domains affected)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-2": {
      "line": 39,
      "title": "GL Account ID: replace raw CUID input with searchable dropdown (also: JE form uses plain Select)",
      "effort": "1h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "TEST-1": {
      "line": 40,
      "title": "Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "testing"
    },
    "TEST-2": {
      "line": 41,
      "title": "E2E tests for critical user flows (onboarding, import, posting, reports)",
      "effort": "4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "testing"
    },
    "TEST-3": {
      "line": 42,
      "title": "80%+ API test coverage target",
      "effort": "2h",
      "priority": "high",
      "status": "blocked",
      "deps": [
        "TEST-1"
      ],
      "domain": "testing"
    },
    "DEV-2": {
      "line": 43,
      "title": "Service tests for client/invoice/bill/vendor services",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "PERF-9": {
      "line": 44,
      "title": "Replace console.log with pino structured logging (7 production files — already compliant, only env.ts pre-boot)",
      "effort": "2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "performance"
    },
    "UX-8": {
      "line": 45,
      "title": "Add loading/error states to remaining dashboard pages (~30 pages)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "ARCH-2": {
      "line": 46,
      "title": "Audit log coverage expansion (bulk ops, imports, exports, reconciliation)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-6": {
      "line": 47,
      "title": "Audit logging inside DB transactions (not fire-and-forget outside TX)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "SEC-11": {
      "line": 48,
      "title": "File upload virus scanning (ClamAV integration for PDFs/CSVs)",
      "effort": "3h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "security"
    },
    "SEC-13": {
      "line": 49,
      "title": "Audit log tamper detection (immutable log storage)",
      "effort": "3h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "security"
    },
    "INFRA-9": {
      "line": 50,
      "title": "Secrets management for production (env var vault, not .env files)",
      "effort": "2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-10": {
      "line": 51,
      "title": "Security scanning in CI (SAST + dependency/supply chain checks)",
      "effort": "2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "infrastructure"
    },
    "SEC-17": {
      "line": 52,
      "title": "XSS fix: sanitize `dangerouslySetInnerHTML` in AIBrief (DOMPurify or markdown renderer)",
      "effort": "30m",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "security"
    },
    "SEC-18": {
      "line": 53,
      "title": "Dashboard routes: replace unsafe `request.tenantId as string` with `requireTenantId()` guard",
      "effort": "30m",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "security"
    },
    "SEC-19": {
      "line": 54,
      "title": "Dashboard routes: replace unsafe `as DashboardQuery` casts with Fastify generic route typing",
      "effort": "1h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "security"
    },
    "FIN-13": {
      "line": 55,
      "title": "`UpcomingPayments.amount` typed as `string` — must be `number` (integer cents violation)",
      "effort": "15m",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "financial"
    },
    "DOC-1": {
      "line": 56,
      "title": "Add plan-enforcement.md to CLAUDE.md Tier 1/2 context hierarchy",
      "effort": "30m",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "documentation"
    },
    "UX-11": {
      "line": 57,
      "title": "Overview: Wire `/overview/net-worth` page with real data (backend endpoint exists, page says \"coming soon\")",
      "effort": "1-2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-12": {
      "line": 58,
      "title": "Overview: Wire `/overview/cash-flow` page with real data (backend endpoint exists, page says \"coming soon\")",
      "effort": "1-2h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "FIN-15": {
      "line": 59,
      "title": "Performance endpoint: Wire receivables data from invoicing domain (currently hardcoded to 0)",
      "effort": "2-3h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "financial"
    },
    "DEV-10": {
      "line": 60,
      "title": "Overview: Add Accounts Payable summary to dashboard (query bills/vendor domain)",
      "effort": "2-3h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-43": {
      "line": 61,
      "title": "Banking: Add manual transaction creation form (POST endpoint exists, no UI)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-44": {
      "line": 62,
      "title": "Banking: Wire XLSX import support in import wizard (backend endpoint exists)",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "UX-13": {
      "line": 63,
      "title": "Banking: Add category management page — edit, delete, detail view (3 endpoints exist, no UI)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-14": {
      "line": 64,
      "title": "Banking: Add unmatch button to reconciliation (DELETE endpoint exists, no UI)",
      "effort": "1h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "DEV-45": {
      "line": 65,
      "title": "Banking: Add import batch detail page — drill into imported transactions (GET endpoint exists)",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-46": {
      "line": 66,
      "title": "Banking: Implement transfers page — inter-account transfers with journal entry creation",
      "effort": "4-6h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-15": {
      "line": 67,
      "title": "Banking: Add GL account linking UI on account detail (glAccountId field exists, no UI)",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "INFRA-13": {
      "line": 68,
      "title": "Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import",
      "effort": "8-12h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "UX-16": {
      "line": 69,
      "title": "Accounting: Add confirmation dialogs on Void/Delete journal entry actions (no prompt currently)",
      "effort": "30m",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-17": {
      "line": 70,
      "title": "App-wide: Add toast notifications on ALL mutations — zero toast usage across entire app (accounting, banking, invoicing, vendors, settings: ~20+ mutation points)",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-18": {
      "line": 71,
      "title": "Accounting: Add landing page at `/accounting` with summary stats (draft JEs, account count, recent activity)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-59": {
      "line": 72,
      "title": "Accounting: Add transaction posting UI — post bank txns to GL (3 backend endpoints exist, no UI)",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-60": {
      "line": 73,
      "title": "Accounting: Add journal entry sourceType filter (backend supports, UI only has status filter)",
      "effort": "30m",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "UX-29": {
      "line": 74,
      "title": "App-wide: Add confirmation dialogs on ALL destructive actions — Cancel Invoice/Bill, Bulk Delete, account deactivate (6+ unconfirmed actions)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-30": {
      "line": 75,
      "title": "Banking: Fix posted transaction link (goes to filtered list, not specific journal entry)",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-31": {
      "line": 76,
      "title": "Business: Add search/filter bar on invoice, bill, client, vendor lists (no search, status filter, or date filter)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-32": {
      "line": 77,
      "title": "Business: Add pagination controls — backend supports cursor pagination, frontend shows max 50 items with no \"Load More\"",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-71": {
      "line": 78,
      "title": "Business: Add invoice/bill edit for DRAFT status (PUT endpoints exist, no edit UI)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-72": {
      "line": 79,
      "title": "Business: Add void invoice action (POST /business/invoices/:id/void exists, no UI button)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-73": {
      "line": 80,
      "title": "Business: Add vendor CRUD — create/edit/delete (full backend API exists, frontend is read-only)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-74": {
      "line": 81,
      "title": "Business: Add client CRUD — create/edit/delete (full backend API exists, only inline from invoice form)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-75": {
      "line": 82,
      "title": "Business: Replace bills \"Coming Soon\" stub with real bill list page (API ready, `/business/bills` is placeholder)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-76": {
      "line": 83,
      "title": "Business: Wire payment allocation UI — split payment across multiple invoices (PaymentAllocation model + endpoints exist)",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-77": {
      "line": 84,
      "title": "Business: Wire edit/delete invoice/bill/payment actions (PUT/DELETE endpoints exist, no UI)",
      "effort": "2-3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-78": {
      "line": 85,
      "title": "Business: Wire \"Post to GL\" button on payment allocation (backend route exists, no frontend trigger)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "UX-45": {
      "line": 86,
      "title": "Business: Add quick \"Record Payment\" button on invoice detail page (shortcut to payment form)",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-97": {
      "line": 87,
      "title": "Planning: Build Goal service + full CRUD (create/list/get/update/delete using Goal model, migrate from Entity.metadata)",
      "effort": "4-6h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-98": {
      "line": 88,
      "title": "Planning: Build Budget service + full CRUD (create/list/get/update/delete using Budget model)",
      "effort": "4-6h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-58": {
      "line": 89,
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
      "line": 90,
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
      "line": 91,
      "title": "Planning: Add planning landing page at `/planning` with summary cards (active goals, budget utilization, forecast status)",
      "effort": "2-3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-66": {
      "line": 92,
      "title": "Rename \"AI Advisor\" → \"Insights\" across entire codebase (~29 files): frontend routes/dir rename/nav/components, RBAC comment, CLAUDE.md docs, design system docs, config/meta. Backend `domains/ai/`, API paths, permission keys, Prisma models stay as-is.",
      "effort": "2-3h",
      "priority": "high",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "DEV-112": {
      "line": 93,
      "title": "Insights: Create API client (`apps/web/src/lib/api/ai.ts`) for 5 existing AI endpoints",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-113": {
      "line": 94,
      "title": "Insights: Build AI Chat interface on Insights page (wire to existing `POST /api/ai/chat`)",
      "effort": "2-3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-33": {
      "line": 100,
      "title": "App-wide: Add cross-links between related records — Invoice↔Client, Transaction↔JournalEntry, Bill↔Vendor, Payment↔Invoice/Bill (isolated views currently)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-34": {
      "line": 101,
      "title": "App-wide: Add bulk operations to list pages — Business (batch send/approve invoices, batch approve bills), Banking (batch deactivate accounts)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-35": {
      "line": 102,
      "title": "Sidebar: Add \"Coming Soon\" badge to 17 placeholder pages or hide unimplemented nav items",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-36": {
      "line": 103,
      "title": "Business: Add standalone \"Create Client\" / \"Create Vendor\" buttons on list pages (currently only via invoice/bill forms)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-37": {
      "line": 104,
      "title": "Business: Add client/vendor edit capability in detail panels (backend PUT endpoints exist, panels are read-only)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-38": {
      "line": 105,
      "title": "Banking: Add active/inactive account filter toggle (backend supports `isActive` param, UI shows all)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-39": {
      "line": 106,
      "title": "Banking: Add aria-labels to bulk action buttons, select-all checkbox, filter dropdowns (a11y)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-40": {
      "line": 107,
      "title": "Business: Add mark-overdue button on bill detail (backend endpoint exists, no UI)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-41": {
      "line": 108,
      "title": "Business: Fix hardcoded 'CAD' currency on vendor/client pages — should use entity functional currency",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-42": {
      "line": 109,
      "title": "Business: Add \"View Journal Entry\" link after posting invoice/bill to GL",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-43": {
      "line": 110,
      "title": "Business: Add payment allocation UI~~ (merged into DEV-76)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-44": {
      "line": 111,
      "title": "Business: Add invoice/client list CSV/PDF export buttons",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-83": {
      "line": 112,
      "title": "Business: Build credit notes feature (CreditNote Prisma model exists, zero API endpoints or UI)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-84": {
      "line": 113,
      "title": "App-wide: Fix navigation.ts mismatches — Bills route points to stub, verify all nav items match real pages",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "UX-19": {
      "line": 114,
      "title": "Accounting COA: Add search input for GL accounts (backend `search` param exists, UI only has type filter)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-20": {
      "line": 115,
      "title": "Accounting COA: Add reactivate button for deactivated accounts (PATCH isActive:true works, no UI)",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-21": {
      "line": 116,
      "title": "Accounting COA: Add balance summary header (Total Assets/Liabilities/Equity cards, data already fetched)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-22": {
      "line": 117,
      "title": "Accounting JE: Fix filter auto-refresh (date/status changes don't re-fetch, only affect loadMore)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-23": {
      "line": 118,
      "title": "Accounting JE: Replace GL account Select with searchable Combobox (31+ accounts hard to scroll)",
      "effort": "1h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-24": {
      "line": 119,
      "title": "Accounting JE: Add \"Duplicate Entry\" action to pre-fill form from existing entry",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-25": {
      "line": 120,
      "title": "Accounting Reports: Add quick-generate buttons (Last Month / This Quarter / YTD) on report hub cards",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-26": {
      "line": 121,
      "title": "Accounting JE: Add source cross-links (click source type navigates to source transaction/invoice/bill)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-27": {
      "line": 122,
      "title": "Accounting COA: Replace `window.location.reload()` after seed with state update (jarring full reload)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-28": {
      "line": 123,
      "title": "Sidebar: Add \"Coming Soon\" badge or hide unimplemented pages~~ (merged into UX-35)",
      "effort": "15m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "DEV-61": {
      "line": 124,
      "title": "Accounting JE: Add multi-currency support to JE form (backend supports, form is single-currency only)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-62": {
      "line": 125,
      "title": "Accounting JE: Add batch approve (select multiple drafts → approve all, needs new backend endpoint)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-63": {
      "line": 126,
      "title": "Accounting: Add recurring journal entry templates (monthly depreciation, rent, etc.)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-64": {
      "line": 127,
      "title": "Accounting: Add journal entry CSV import (bulk import from external accounting software)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-65": {
      "line": 128,
      "title": "Accounting: Add account reconciliation page (compare GL vs bank statement balances)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-66": {
      "line": 129,
      "title": "Accounting: Add aged receivables/payables report (AR/AP aging 30/60/90+ day buckets)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-67": {
      "line": 130,
      "title": "Accounting: Add audit trail view (who approved/voided/created entries, timestamps)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-68": {
      "line": 131,
      "title": "Accounting: Add GL account merge/reclassify (move journal lines between accounts)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-69": {
      "line": 132,
      "title": "Accounting Reports: Add year-over-year comparison mode (multi-year P&L and BS trends)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-70": {
      "line": 133,
      "title": "Accounting Reports: One-click export all statements as ZIP",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "PERF-2": {
      "line": 134,
      "title": "Revenue: add JSONB expression index for extraction",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-3": {
      "line": 135,
      "title": "Recharts: code-split import (lazy load)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-21": {
      "line": 136,
      "title": "Add composite index on JournalLine for GL account filtering (glAccountId, journalEntryId, deletedAt)",
      "effort": "1h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "performance"
    },
    "PERF-22": {
      "line": 137,
      "title": "Add composite index on Payment for client/vendor filtering (clientId, vendorId, status, date, deletedAt)",
      "effort": "1h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "performance"
    },
    "PERF-7": {
      "line": 138,
      "title": "Lazy-loading heavy frontend components",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "DRY-2": {
      "line": 139,
      "title": "CSV sanitization: deduplicate between report-export and data-export",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-3": {
      "line": 140,
      "title": "Report routes: extract shared 40-line handler pattern into helper",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "UX-3": {
      "line": 141,
      "title": "Report tables: add `aria-*` attributes, caption, scope, role=\"progressbar\"",
      "effort": "45m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-4": {
      "line": 142,
      "title": "Report views: replace array index React keys with stable identifiers",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DOC-2": {
      "line": 143,
      "title": "Consolidate logging rules (full version in api-conventions.md, update guardrails.md ref)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-3": {
      "line": 144,
      "title": "Archive .reviews/ temp workspace to docs/reviews/ or delete",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-7": {
      "line": 145,
      "title": "Update test/page counts in context files (apps/api: 362→1010 tests, apps/web: 38→54 pages, root: 38→40 models)",
      "effort": "30m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-8": {
      "line": 146,
      "title": "Update domain status in apps/api/CLAUDE.md (Invoicing marked \"stub\" but is fully built)",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "SEC-10": {
      "line": 147,
      "title": "Row-Level Security (PostgreSQL) for production hardening",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "UX-6": {
      "line": 148,
      "title": "Keyboard shortcuts for power users (command palette, table nav)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-7": {
      "line": 149,
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
      "line": 150,
      "title": "File upload quota enforcement per tenant (prevent abuse/DoS)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "SEC-14": {
      "line": 151,
      "title": "Audit log retention policies (prevent unbounded growth, compliance)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "INFRA-15": {
      "line": 152,
      "title": "Add security headers to Next.js API routes (X-Frame-Options, CSP, HSTS in next.config.js)",
      "effort": "1h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "infrastructure"
    },
    "PERF-10": {
      "line": 153,
      "title": "Distributed caching (Redis) for multi-instance deployment",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-12": {
      "line": 154,
      "title": "N+1 query monitoring / slow query detection in production (APM)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "FIN-7": {
      "line": 155,
      "title": "Fiscal period enforcement (prevent posting to locked periods)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-8": {
      "line": 156,
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
      "line": 157,
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
      "line": 158,
      "title": "Invoice/bill reconciliation workflows (AP/AR aging, match/approve)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "ARCH-5": {
      "line": 159,
      "title": "Error recovery patterns (idempotency keys, circuit breakers, retry with backoff)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-1": {
      "line": 160,
      "title": "OpenAPI spec auto-generation from Zod schemas (fastify-zod-openapi)",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-4": {
      "line": 161,
      "title": "Background job processing setup (BullMQ for PDF gen, email, imports)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "TEST-4": {
      "line": 162,
      "title": "Integration tests (API → DB → API roundtrip for critical flows)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "testing"
    },
    "DRY-6": {
      "line": 163,
      "title": "Dashboard: deduplicate SparkCards/DashboardLeftRail (shared types, constants, MiniSparkline)",
      "effort": "45m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-7": {
      "line": 164,
      "title": "Dashboard page.tsx: extract 120+ lines of data transformation to `lib/dashboard/transformers.ts`",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "UX-9": {
      "line": 165,
      "title": "Dashboard: fix SVG gradient ID collision (use `React.useId()`)",
      "effort": "15m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-10": {
      "line": 166,
      "title": "Navbar: add live sync status indicator with refresh button",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-3": {
      "line": 167,
      "title": "Dashboard: delete dead `handleSkipStep` in OnboardingHeroCard + dead SparkCardsSkeleton",
      "effort": "10m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-4": {
      "line": 168,
      "title": "Dashboard: type entity maps as `Record<EntityType, ...>` for exhaustive checking",
      "effort": "15m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DS-3": {
      "line": 169,
      "title": "Dashboard: replace `hover:glass-3` with proper hover pattern",
      "effort": "10m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "design-system"
    },
    "DS-4": {
      "line": 170,
      "title": "ExpenseChart: replace inline `backgroundColor` with token-mapped CSS variables",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "design-system"
    },
    "DS-5": {
      "line": 171,
      "title": "AIBrief: change `text-primary` (amber) to AI-specific purple tokens",
      "effort": "10m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "design-system"
    },
    "DS-6": {
      "line": 172,
      "title": "Dashboard: resolve `text-[9px]` vs `text-[10px]` inconsistency with `text-micro` utility",
      "effort": "15m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "design-system"
    },
    "DEV-5": {
      "line": 173,
      "title": "Dashboard: add `cancelAnimationFrame` cleanup in DashboardLeftRail/SparkCards useEffect",
      "effort": "10m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-6": {
      "line": 174,
      "title": "Dashboard: delete duplicate `OnboardingHeroCard` in `components/dashboard/` (dead code)",
      "effort": "5m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-7": {
      "line": 175,
      "title": "DashboardRightRail: replace `\\",
      "effort": "\\",
      "priority": "unknown",
      "status": "unknown",
      "deps": [],
      "domain": "development"
    },
    "DEV-8": {
      "line": 176,
      "title": "DashboardService: add explicit return type to `getMetrics()` method",
      "effort": "15m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-9": {
      "line": 177,
      "title": "DashboardService: type `byType` as `Partial<Record<AccountType, number>>` (not `Record<string, number>`)",
      "effort": "10m",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "FIN-14": {
      "line": 178,
      "title": "DashboardService: document or fix float arithmetic in FX conversion (`Math.abs(balance) * rate`)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "financial"
    },
    "DEV-11": {
      "line": 179,
      "title": "Overview: Add upcoming payments endpoint — bills due + expected invoice payments (RightRail placeholder)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-12": {
      "line": 180,
      "title": "Overview: Add action items endpoint — unreconciled txns, overdue invoices, overdue bills (RightRail placeholder)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-13": {
      "line": 181,
      "title": "Overview: Add cash flow time-series chart endpoint — historical cash position by day/week (CashFlowChart placeholder)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-14": {
      "line": 182,
      "title": "Overview: Add expense breakdown by category endpoint for ExpenseChart (placeholder component)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-17": {
      "line": 183,
      "title": "Overview: P&L Summary mini-widget — revenue vs expense bars + YTD trend (ReportService ready)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-18": {
      "line": 184,
      "title": "Overview: Balance Sheet Snapshot widget — asset:liability donut + equity trend (ReportService ready)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-19": {
      "line": 185,
      "title": "Overview: Trial Balance Status widget — balanced alert + account type counts (ReportService ready)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "FIN-16": {
      "line": 186,
      "title": "Overview: Financial Health Ratios widget — current ratio, working capital, debt-to-equity, profit margin (computed from BS+P&L)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "DEV-20": {
      "line": 187,
      "title": "Overview: Top Revenue Clients widget — top 5 by YTD revenue + concentration % (ReportService ready)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-21": {
      "line": 188,
      "title": "Overview: Client Payment Health widget — % paid on time, avg days-to-payment, overdue count (Invoice model)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-22": {
      "line": 189,
      "title": "Overview: Invoice Aging Waterfall widget — AR buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-23": {
      "line": 190,
      "title": "Overview: Revenue by Category widget — revenue sources breakdown from InvoiceLine + Category",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-24": {
      "line": 191,
      "title": "Overview: Top Expense Vendors widget — top 5 by YTD spend + % of total (Bill + vendor aggregations)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-25": {
      "line": 192,
      "title": "Overview: Bill Aging Waterfall widget — AP buckets 0-30, 31-60, 61-90, 90+ days",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-26": {
      "line": 193,
      "title": "Overview: Vendor Payment Terms widget — on-time vs late payment performance",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-27": {
      "line": 194,
      "title": "Overview: Reconciliation Status widget — progress bar per account + unmatched count (ReconciliationService ready)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-28": {
      "line": 195,
      "title": "Overview: Import Health widget — last import date, success rate, failed imports (ImportBatch model)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-29": {
      "line": 196,
      "title": "Overview: Categorization Gap widget — % of transactions uncategorized by account (Transaction.categoryId)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-30": {
      "line": 197,
      "title": "Overview: Duplicate Detection Stats widget — duplicates detected this month (duplication.service)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-31": {
      "line": 198,
      "title": "Overview: Journal Entry Status widget — count by status (DRAFT/POSTED/VOIDED), draft aging > 7d alert",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-32": {
      "line": 199,
      "title": "Overview: GL Posting Pipeline widget — pending bank feed txns waiting to post, oldest first",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-33": {
      "line": 200,
      "title": "Overview: Ledger Spike Detection widget — accounts with unusual balance swings this month",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-34": {
      "line": 201,
      "title": "Overview: Goal Progress widget — progress bars for active goals, days to deadline (Goal model)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-35": {
      "line": 202,
      "title": "Overview: Budget vs Actual widget — % of budget used this month, over-budget alerts (Budget model)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-36": {
      "line": 203,
      "title": "Overview: Expense Forecast widget — projected monthly spend at current 3-month run rate",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-37": {
      "line": 204,
      "title": "Overview: Cash Runway widget — days of cash remaining at burn rate, healthy/monitor/critical",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-38": {
      "line": 205,
      "title": "Overview: Multi-Currency Exposure widget — portfolio breakdown by currency + FX risk %",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-39": {
      "line": 206,
      "title": "Overview: Entity KPI Comparison widget — side-by-side entity performance for multi-business users",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-40": {
      "line": 207,
      "title": "Overview: Onboarding Completion nudge widget — checklist of remaining steps (OnboardingProgress model)",
      "effort": "1-2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-41": {
      "line": 208,
      "title": "Overview: Tax Liability Estimate widget — estimated taxes due this quarter (needs tax rules engine)",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-42": {
      "line": 209,
      "title": "Overview: Subscription MRR/ARR widget — recurring revenue detection for SaaS solopreneurs",
      "effort": "4-6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-47": {
      "line": 210,
      "title": "Banking: Add transaction full-text search on description/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-48": {
      "line": 211,
      "title": "Banking: Add transaction split UI + endpoint (isSplit field exists, no implementation)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-49": {
      "line": 212,
      "title": "Banking: Show multi-currency amounts — display original + base currency on transactions",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-50": {
      "line": 213,
      "title": "Banking: Add transaction export (CSV/PDF) for filtered transaction views",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-51": {
      "line": 214,
      "title": "Banking: Add account balance history chart — historical balance trend over time",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-52": {
      "line": 215,
      "title": "Banking: Add duplicate management UI — view detected duplicates, approve/dismiss",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-53": {
      "line": 216,
      "title": "Banking: Add transaction auto-categorization rules UI (Rule model exists in AI domain)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-54": {
      "line": 217,
      "title": "Banking: Add batch transaction edit — bulk update description/category/notes",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-55": {
      "line": 218,
      "title": "Banking: Recurring transaction detection — identify frequency patterns (e.g. Netflix monthly, API subscriptions)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-56": {
      "line": 219,
      "title": "Banking: Add receipt/attachment upload per transaction (notes field exists, need file storage)",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-57": {
      "line": 220,
      "title": "Banking: Add CSV import column mapping UI (backend supports columnMappings, frontend hardcoded)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-58": {
      "line": 221,
      "title": "Banking: Add import error detail view — show per-row errors when import partially fails",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-50": {
      "line": 222,
      "title": "Business: Add search/filter bar on invoice list~~ (merged into UX-31)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-51": {
      "line": 223,
      "title": "Business: Add search/filter bar on bill list~~ (merged into UX-31)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "UX-52": {
      "line": 224,
      "title": "Business: Add sort by columns on invoice/bill/client/vendor lists (backend supports orderBy)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-53": {
      "line": 225,
      "title": "Business: Add pagination controls~~ (merged into UX-32)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "done",
      "deps": [],
      "domain": "ux"
    },
    "DEV-95": {
      "line": 226,
      "title": "Business: Add client invoice history tab — all invoices + payments for a client on detail page",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-96": {
      "line": 227,
      "title": "Business: Add vendor bill history tab — all bills + payments for a vendor on detail page",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-85": {
      "line": 228,
      "title": "Business: Add bill PDF generation (invoice PDF exists, bills have no PDF)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-86": {
      "line": 229,
      "title": "Business: Add aging drill-down — click AR/AP aging bucket to see individual invoices/bills",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-87": {
      "line": 230,
      "title": "Business: Add duplicate invoice/bill detection — flag same vendor+amount+date combinations",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-88": {
      "line": 231,
      "title": "Business: Add email reminder for overdue invoices (mark-overdue endpoint exists, no notification)",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-89": {
      "line": 232,
      "title": "Business: Add recurring invoice templates — auto-generate invoices on schedule",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-54": {
      "line": 233,
      "title": "Business: Auto-fill due date from client/vendor payment terms (terms field exists, not used in form)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-55": {
      "line": 234,
      "title": "Business: Add visual status pipeline on invoice/bill list — Draft→Sent→Partial→Paid flow",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-56": {
      "line": 235,
      "title": "Business: Add partial payment progress bar on invoice/bill detail (amountPaid vs total)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-90": {
      "line": 236,
      "title": "Business: Add top debtors/creditors summary widget — clients with most outstanding AR, vendors with most AP",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-91": {
      "line": 237,
      "title": "Business: Add invoice/bill/client/vendor CSV export",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-92": {
      "line": 238,
      "title": "Business: Build credit notes feature~~ (merged into DEV-83)",
      "effort": "4-6h",
      "priority": "low",
      "status": "done",
      "deps": [],
      "domain": "development"
    },
    "DEV-93": {
      "line": 239,
      "title": "Business: Add payment receipt PDF generation",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-94": {
      "line": 240,
      "title": "Business: Add batch invoice creation — generate multiple invoices from template",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-57": {
      "line": 241,
      "title": "Business: Add notes/activity log per client and vendor (notes field exists, no UI)",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-99": {
      "line": 242,
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
      "line": 243,
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
      "line": 244,
      "title": "Planning: Wire planning reports to existing accounting report endpoints (reuse P&L/BS/CF, don't duplicate)",
      "effort": "1-2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-61": {
      "line": 245,
      "title": "Planning: Build forecasts page — cash flow projection chart using historical transaction trends",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-102": {
      "line": 246,
      "title": "Planning: Add Forecast model to Prisma + CRUD service (scenario modeling: optimistic/pessimistic/baseline)",
      "effort": "4-6h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "UX-62": {
      "line": 247,
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
      "line": 248,
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
      "line": 249,
      "title": "Planning: Add cash runway calculator — months remaining at current burn rate, healthy/warning/critical indicator",
      "effort": "2-3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-104": {
      "line": 250,
      "title": "Planning: Add seasonal pattern detection — highlight historically high/low revenue months from transaction data",
      "effort": "3-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-105": {
      "line": 251,
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
      "line": 252,
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
      "line": 253,
      "title": "Planning: Add soft delete to Budget and Goal models (missing deletedAt — financial invariant gap)",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-107": {
      "line": 254,
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
      "line": 255,
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
      "line": 256,
      "title": "Planning: Add budget/goal export (CSV/PDF)",
      "effort": "2-3h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "DEV-109": {
      "line": 257,
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
      "line": 258,
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
      "line": 259,
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
      "line": 260,
      "title": "Insights: Extract shared AI types to `packages/types/src/ai.ts` (currently only in backend `services/types.ts`)",
      "effort": "20m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-115": {
      "line": 261,
      "title": "Insights: Add route-level tests for `/api/ai/chat` and `/api/ai/categorize` endpoints",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-116": {
      "line": 262,
      "title": "Insights: Add RBAC tests for AI permission enforcement (verify 403 for insufficient roles)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-117": {
      "line": 263,
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
      "line": 264,
      "title": "Insights: Implement `GET /api/ai/insights` endpoint (replace 501 stub, use Insight Prisma model)",
      "effort": "2-4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-119": {
      "line": 265,
      "title": "Insights: Build Policy Alerts page with real data (requires new BE endpoint for rule-based alerts)",
      "effort": "3-4h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "development"
    },
    "DEV-120": {
      "line": 266,
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
      "line": 267,
      "title": "Elevate source preservation to explicit 5th invariant in guardrails.md",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DEV-15": {
      "line": 268,
      "title": "Overview: Add top expense categories widget (data exists in categorized transactions)",
      "effort": "1-2h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-16": {
      "line": 269,
      "title": "Overview: Add unreconciled transaction count badge to dashboard",
      "effort": "1h",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "PERF-4": {
      "line": 270,
      "title": "PDF generation: move to worker thread (unblock event loop)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-11": {
      "line": 271,
      "title": "Distributed rate limiting (Redis-backed) for multi-instance",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "DRY-5": {
      "line": 272,
      "title": "`window.Clerk` triple-cast in downloadReport: clean up type assertion",
      "effort": "30m",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "code-quality"
    },
    "DOC-5": {
      "line": 273,
      "title": "Add double-entry bookkeeping check to guardrails.md anti-patterns",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-6": {
      "line": 274,
      "title": "Update version dates across CLAUDE.md files (inconsistent: 2026-02-15 vs 2026-02-09)",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "FIN-11": {
      "line": 275,
      "title": "Consolidation/elimination accounting (multi-entity)",
      "effort": "8h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-12": {
      "line": 276,
      "title": "GAAP-compliant GL export format (XBRL/ixBRL regulatory reporting)",
      "effort": "6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "SEC-15": {
      "line": 277,
      "title": "Duplicate file detection for uploads",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "SEC-16": {
      "line": 278,
      "title": "File retention policies (auto-cleanup of old uploads)",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "INFRA-11": {
      "line": 279,
      "title": "Database migration testing in CI pipeline",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-12": {
      "line": 280,
      "title": "Usage analytics (companies, transactions, reports generated)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "FIN-6": {
      "line": 281,
      "title": "Cash Flow: document hardcoded account code ranges for categorization",
      "effort": "doc",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "DS-1": {
      "line": 291,
      "title": "Figma-to-code token sync audit",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "design-system"
    },
    "DS-2": {
      "line": 297,
      "title": "Storybook setup for component documentation",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "design-system"
    },
    "MKT-1": {
      "line": 307,
      "title": "Landing page copy and design",
      "effort": "3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-2": {
      "line": 313,
      "title": "User documentation / getting started guide",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "CNT-1": {
      "line": 314,
      "title": "Competitive analysis update",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "content"
    },
    "INFRA-1": {
      "line": 324,
      "title": "CI/CD pipeline (GitHub Actions)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-2": {
      "line": 325,
      "title": "Production environment setup",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-3": {
      "line": 326,
      "title": "Database backups (automated daily)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "ARCH-3": {
      "line": 327,
      "title": "S3 cloud storage migration for file uploads (replace local filesystem)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "INFRA-5": {
      "line": 328,
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
      "line": 329,
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
      "line": 330,
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
      "line": 336,
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
      "line": 337,
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
