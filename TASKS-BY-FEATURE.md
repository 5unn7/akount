# Akount — Task Board (Grouped by Feature)

**Last Updated:** 2026-02-19
**Current Phase:** Phase 6 — Launch MVP

> **246 tasks** · 🔴 0 critical · 🟠 59 high · 🟡 130 medium · ⚪ 26 low · ✅ 31 done
> 🟢 91 ready · 📦 117 backlog · 🔒 7 blocked · ⚠️ 0 stale · 🎯 0 high-risk

**Legend:**
- 🟢 Ready to start
- 📦 Backlog (deferred to post-launch)
- 🔒 Blocked (needs another task first)
- ✅ Done

---

## 📊 Quick Navigation

- [🚀 Launch Blockers](#-launch-blockers) (15 tasks, 32h)
- [💼 Business Workflows](#-business-workflows) (22 tasks, 45h)
- [🏦 Banking Operations](#-banking-operations) (12 tasks, 24h)
- [📊 Accounting & Reports](#-accounting--reports) (18 tasks, 32h)
- [📈 Overview Dashboard](#-overview-dashboard) (25 tasks, 50h)
- [🎯 Planning & Goals](#-planning--goals) (5 tasks, 20h)
- [🤖 AI Insights](#-ai-insights) (3 tasks, 6h)
- [🎨 App-wide UX Polish](#-app-wide-ux-polish) (15 tasks, 20h)
- [🏗️ Infrastructure & DevOps](#️-infrastructure--devops) (8 tasks, 18h)
- [✅ Recently Completed](#-recently-completed)

---

## 🚀 Launch Blockers
**15 tasks · 32h total · ⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪ 0% complete**

> These must be done before MVP launch. No exceptions.

### Security Hardening (5 tasks, 14h) — ⚪⚪⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| SEC-8 | Complete security audit (OWASP top 10, auth, tenant isolation, input validation) | 4h | 🟠 High | 🟢 | roadmap |
| SEC-11 | File upload virus scanning (ClamAV integration for PDFs/CSVs) | 3h | 🟠 High | 🟢 | review:smooth-floating-mountain |
| SEC-13 | Audit log tamper detection (immutable log storage) | 3h | 🟠 High | 🟢 | review:smooth-floating-mountain |
| INFRA-9 | Secrets management for production (env var vault, not .env files) | 2h | 🟠 High | 🟢 | review:smooth-floating-mountain |
| INFRA-10 | Security scanning in CI (SAST + dependency/supply chain checks) | 2h | 🟠 High | 🟢 | review:smooth-floating-mountain |

### Performance Optimization (4 tasks, 8h) — ⚪⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| PERF-1 | Balance Sheet: combine 2 redundant heavy SQL queries into 1 | 2h | 🟠 High | 🟢 | review:performance |
| PERF-5 | Database indexes on hot paths (dashboard, reports) | 2h | 🟠 High | 🟢 | roadmap |
| PERF-6 | Query optimization audit (dashboard + report queries) | 2h | 🟠 High | 🟢 | roadmap |
| PERF-8 | p95 < 2s page load target verification + load testing | 2h | 🟠 High | 🟢 | roadmap |

### Testing Foundation (3 tasks, 9h) — ⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| TEST-1 | Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests | 3-4h | 🟠 High | 🟢 | | review:typescript |
| TEST-2 | E2E tests for critical user flows (onboarding, import, posting, reports) | 4h | 🟠 High | 🟢 | | roadmap |
| TEST-3 | 80%+ API test coverage target | 2h | 🟠 High | 🔒 | [needs: TEST-1] | roadmap |
| DEV-2 | Service tests for client/invoice/bill/vendor services | 3h | 🟠 High | 🟢 | | audit:smooth-floating-mountain |

### Critical Code Quality (3 tasks, 4h) — ⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| PERF-9 | Replace console.log with pino structured logging (7 production files) | 2h | 🟠 High | 🟢 | plan:phase-6-tasks |
| UX-8 | Add loading/error states to remaining dashboard pages (~30 pages) | 2h | 🟠 High | 🟢 | plan:phase-6-tasks |
| ARCH-2 | Audit log coverage expansion (bulk ops, imports, exports, reconciliation) | 3h | 🟠 High | 🟢 | review:smooth-floating-mountain |

---

## 💼 Business Workflows
**22 tasks · 45h total · 🟢⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪ 5% complete**

> Core invoicing, billing, client, and vendor management

### Invoice Management (8 tasks, 14h) — 🟢⚪⚪⚪⚪⚪⚪⚪ 12.5%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| ~~UX-16~~ | ~~Accounting: Add confirmation dialogs on Void/Delete journal entry actions~~ | 30m | 🟠 High | ✅ | audit:acct-fe-be |
| DEV-71 | Business: Add invoice/bill edit for DRAFT status (PUT endpoints exist, no edit UI) | 2-3h | 🟠 High | 🟢 | audit:app-ux |
| DEV-72 | Business: Add void invoice action (POST /business/invoices/:id/void exists, no UI button) | 1h | 🟠 High | 🟢 | audit:app-ux |
| DEV-76 | Business: Wire payment allocation UI — split payment across multiple invoices (PaymentAllocation model + endpoints exist) | 3-4h | 🟠 High | 🟢 | audit:app-ux, audit:fe-be-parity |
| DEV-77 | Business: Wire edit/delete invoice/bill/payment actions (PUT/DELETE endpoints exist, no UI) | 2-3h | 🟠 High | 🟢 | audit:app-ux, audit:fe-be-parity |
| DEV-78 | Business: Wire "Post to GL" button on payment allocation (backend route exists, no frontend trigger) | 1h | 🟠 High | 🟢 | audit:fe-be-parity |
| UX-31 | Business: Add search/filter bar on invoice, bill, client, vendor lists (no search, status filter, or date filter) | 2-3h | 🟠 High | 🟢 | audit:app-ux |
| UX-45 | Business: Add quick "Record Payment" button on invoice detail page (shortcut to payment form) | 1-2h | 🟠 High | 🟢 | audit:fe-be-parity |

<details>
<summary><strong>📦 Deferred Invoice Tasks (3 tasks, 10h)</strong></summary>

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-83 | Business: Build credit notes feature (CreditNote Prisma model exists, zero API endpoints or UI) | 4-6h | 🟡 Medium | 📦 | audit:app-ux |
| UX-44 | Business: Add invoice/client list CSV/PDF export buttons | 2-3h | 🟡 Medium | 📦 | audit:app-ux |
| DEV-62 | Accounting JE: Add batch approve (select multiple drafts → approve all, needs new backend endpoint) | 2-3h | 🟡 Medium | 📦 | audit:acct-fe-be |

</details>

### Bill Management (4 tasks, 8h) — ⚪⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-75 | Business: Replace bills "Coming Soon" stub with real bill list page (API ready, `/business/bills` is placeholder) | 2-3h | 🟠 High | 🟢 | audit:app-ux |
| UX-40 | Business: Add mark-overdue button on bill detail (backend endpoint exists, no UI) | 30m | 🟡 Medium | 🟢 | audit:app-ux |
| UX-31 | Business: Add search/filter bar (shared with invoices) | 2-3h | 🟠 High | 🟢 | audit:app-ux |
| DEV-77 | Business: Wire edit/delete actions (shared with invoices) | 2-3h | 🟠 High | 🟢 | audit:app-ux |

### Client/Vendor Management (5 tasks, 9h) — ⚪⚪⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-73 | Business: Add vendor CRUD — create/edit/delete (full backend API exists, frontend is read-only) | 2-3h | 🟠 High | 🟢 | audit:app-ux |
| DEV-74 | Business: Add client CRUD — create/edit/delete (full backend API exists, only inline from invoice form) | 2-3h | 🟠 High | 🟢 | audit:app-ux |
| UX-36 | Business: Add standalone "Create Client" / "Create Vendor" buttons on list pages (currently only via invoice/bill forms) | 1h | 🟡 Medium | 🟢 | audit:app-ux |
| UX-37 | Business: Add client/vendor edit capability in detail panels (backend PUT endpoints exist, panels are read-only) | 1-2h | 🟡 Medium | 🟢 | audit:app-ux |
| UX-41 | Business: Fix hardcoded 'CAD' currency on vendor/client pages — should use entity functional currency | 15m | 🟡 Medium | 🟢 | audit:app-ux |

### Cross-Feature Enhancements (5 tasks, 8h) — ⚪⚪⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| UX-32 | Business: Add pagination controls — backend supports cursor pagination, frontend shows max 50 items with no "Load More" | 1-2h | 🟠 High | 🟢 | audit:app-ux |
| UX-33 | App-wide: Add cross-links between related records — Invoice↔Client, Transaction↔JournalEntry, Bill↔Vendor, Payment↔Invoice/Bill | 2-3h | 🟡 Medium | 🟢 | audit:app-ux |
| UX-42 | Business: Add "View Journal Entry" link after posting invoice/bill to GL | 30m | 🟡 Medium | 🟢 | audit:app-ux |
| DEV-84 | App-wide: Fix navigation.ts mismatches — Bills route points to stub, verify all nav items match real pages | 30m | 🟡 Medium | 🟢 | audit:app-ux |

<details>
<summary><strong>📦 Deferred (1 task, 4h)</strong></summary>

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| UX-34 | App-wide: Add bulk operations to list pages — Business (batch send/approve invoices, batch approve bills), Banking (batch deactivate accounts) | 3-4h | 🟡 Medium | 📦 | audit:app-ux |

</details>

---

## 🏦 Banking Operations
**12 tasks · 24h total · 🟢⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪ 8% complete**

> Transaction import, categorization, reconciliation, and account management

### Transaction Management (5 tasks, 10h) — 🟢⚪⚪⚪⚪ 20%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| ~~UX-14~~ | ~~Banking: Add unmatch button to reconciliation (DELETE endpoint exists, no UI)~~ | 1h | 🟠 High | ✅ | audit:fe-be-parity |
| DEV-43 | Banking: Add manual transaction creation form (POST endpoint exists, no UI) | 2-3h | 🟠 High | 🟢 | audit:fe-be-parity |
| UX-30 | Banking: Fix posted transaction link (goes to filtered list, not specific journal entry) | 30m | 🟠 High | 🟢 | audit:app-ux |
| DEV-59 | Accounting: Add transaction posting UI — post bank txns to GL (3 backend endpoints exist, no UI) | 3-4h | 🟠 High | 🟢 | audit:acct-fe-be |
| UX-13 | Banking: Add category management page — edit, delete, detail view (3 endpoints exist, no UI) | 2-3h | 🟠 High | 🟢 | audit:fe-be-parity |

### Import & Reconciliation (4 tasks, 7h) — ⚪⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-44 | Banking: Wire XLSX import support in import wizard (backend endpoint exists) | 1-2h | 🟠 High | 🟢 | audit:fe-be-parity |
| DEV-45 | Banking: Add import batch detail page — drill into imported transactions (GET endpoint exists) | 1-2h | 🟠 High | 🟢 | audit:fe-be-parity |
| UX-15 | Banking: Add GL account linking UI on account detail (glAccountId field exists, no UI) | 1-2h | 🟠 High | 🟢 | audit:fe-be-parity |
| UX-38 | Banking: Add active/inactive account filter toggle (backend supports `isActive` param, UI shows all) | 30m | 🟡 Medium | 🟢 | audit:app-ux |

### Account Management (2 tasks, 1h) — ⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| UX-39 | Banking: Add aria-labels to bulk action buttons, select-all checkbox, filter dropdowns (a11y) | 30m | 🟡 Medium | 🟢 | audit:app-ux |
| DEV-10 | Overview: Add Accounts Payable summary to dashboard (query bills/vendor domain) | 2-3h | 🟠 High | 🟢 | audit:fe-be-parity |

<details>
<summary><strong>📦 Deferred Banking Tasks (2 tasks, 16h)</strong></summary>

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-46 | Banking: Implement transfers page — inter-account transfers with journal entry creation | 4-6h | 🟠 High | 📦 | audit:fe-be-parity |
| INFRA-13 | Banking: Bank connection integration (Plaid/MX) — live bank feed, auto-import | 8-12h | 🟠 High | 📦 | audit:fe-be-parity |

</details>

---

## 📊 Accounting & Reports
**18 tasks · 32h total · 🟢🟢⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪ 11% complete**

> Chart of accounts, journal entries, financial reports

### Chart of Accounts (4 tasks, 3h) — ⚪⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| UX-19 | Accounting COA: Add search input for GL accounts (backend `search` param exists, UI only has type filter) | 30m | 🟡 Medium | 🟢 | audit:acct-fe-be |
| UX-20 | Accounting COA: Add reactivate button for deactivated accounts (PATCH isActive:true works, no UI) | 15m | 🟡 Medium | 🟢 | audit:acct-fe-be |
| UX-21 | Accounting COA: Add balance summary header (Total Assets/Liabilities/Equity cards, data already fetched) | 1h | 🟡 Medium | 🟢 | audit:acct-fe-be |
| UX-27 | Accounting COA: Replace `window.location.reload()` after seed with state update (jarring full reload) | 30m | 🟡 Medium | 🟢 | audit:acct-fe-be |

### Journal Entries (6 tasks, 9h) — 🟢🟢⚪⚪⚪⚪ 33%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| ~~UX-2~~ | ~~GL Account ID: replace raw CUID input with searchable dropdown~~ | 1h | 🟠 High | ✅ | review:nextjs, audit:acct-fe-be |
| ~~UX-23~~ | ~~Accounting JE: Replace GL account Select with searchable Combobox~~ | 1h | 🟡 Medium | ✅ | audit:acct-fe-be |
| ~~DEV-60~~ | ~~Accounting: Add journal entry sourceType filter~~ | 30m | 🟠 High | ✅ | audit:acct-fe-be |
| UX-22 | Accounting JE: Fix filter auto-refresh (date/status changes don't re-fetch, only affect loadMore) | 1h | 🟡 Medium | 🟢 | audit:acct-fe-be |
| UX-24 | Accounting JE: Add "Duplicate Entry" action to pre-fill form from existing entry | 1h | 🟡 Medium | 🟢 | audit:acct-fe-be |
| UX-26 | Accounting JE: Add source cross-links (click source type navigates to source transaction/invoice/bill) | 1h | 🟡 Medium | 🟢 | audit:acct-fe-be |

<details>
<summary><strong>📦 Deferred Journal Entry Tasks (5 tasks, 14h)</strong></summary>

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-61 | Accounting JE: Add multi-currency support to JE form (backend supports, form is single-currency only) | 2-3h | 🟡 Medium | 📦 | audit:acct-fe-be |
| DEV-62 | Accounting JE: Add batch approve (select multiple drafts → approve all, needs new backend endpoint) | 2-3h | 🟡 Medium | 📦 | audit:acct-fe-be |
| DEV-63 | Accounting: Add recurring journal entry templates (monthly depreciation, rent, etc.) | 3-4h | 🟡 Medium | 📦 | audit:acct-fe-be |
| DEV-64 | Accounting: Add journal entry CSV import (bulk import from external accounting software) | 3-4h | 🟡 Medium | 📦 | audit:acct-fe-be |
| DEV-67 | Accounting: Add audit trail view (who approved/voided/created entries, timestamps) | 2-3h | 🟡 Medium | 📦 | audit:acct-fe-be |

</details>

### Financial Reports (3 tasks, 6h) — ⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| UX-25 | Accounting Reports: Add quick-generate buttons (Last Month / This Quarter / YTD) on report hub cards | 1h | 🟡 Medium | 🟢 | audit:acct-fe-be |
| TEST-1 | Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests | 3-4h | 🟠 High | 🟢 | review:typescript |
| UX-18 | Accounting: Add landing page at `/accounting` with summary stats (draft JEs, account count, recent activity) | 2-3h | 🟠 High | 🟢 | audit:acct-fe-be |

<details>
<summary><strong>📦 Deferred Reporting & Advanced Tasks (5 tasks, 19h)</strong></summary>

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-65 | Accounting: Add account reconciliation page (compare GL vs bank statement balances) | 4-6h | 🟡 Medium | 📦 | audit:acct-fe-be |
| DEV-66 | Accounting: Add aged receivables/payables report (AR/AP aging 30/60/90+ day buckets) | 3-4h | 🟡 Medium | 📦 | audit:acct-fe-be |
| DEV-68 | Accounting: Add GL account merge/reclassify (move journal lines between accounts) | 3-4h | 🟡 Medium | 📦 | audit:acct-fe-be |
| DEV-69 | Accounting Reports: Add year-over-year comparison mode (multi-year P&L and BS trends) | 2-3h | 🟡 Medium | 📦 | audit:acct-fe-be |
| DEV-70 | Accounting Reports: One-click export all statements as ZIP | 1-2h | ⚪ Low | 📦 | audit:acct-fe-be |

</details>

---

## 📈 Overview Dashboard
**25 tasks · 50h total · ⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪ 0% complete**

> Main dashboard widgets and summary views

### Quick Wins (5 tasks, 8h) — ⚪⚪⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| UX-11 | Overview: Wire `/overview/net-worth` page with real data (backend endpoint exists, page says "coming soon") | 1-2h | 🟠 High | 🟢 | audit:fe-be-parity |
| UX-12 | Overview: Wire `/overview/cash-flow` page with real data (backend endpoint exists, page says "coming soon") | 1-2h | 🟠 High | 🟢 | audit:fe-be-parity |
| FIN-15 | Performance endpoint: Wire receivables data from invoicing domain (currently hardcoded to 0) | 2-3h | 🟠 High | 🟢 | audit:fe-be-parity |
| DEV-10 | Overview: Add Accounts Payable summary to dashboard (query bills/vendor domain) | 2-3h | 🟠 High | 🟢 | audit:fe-be-parity |

### Action Items & Widgets (4 tasks, 10h) — ⚪⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-11 | Overview: Add upcoming payments endpoint — bills due + expected invoice payments (RightRail placeholder) | 2-3h | 🟡 Medium | 🟢 | audit:fe-be-parity |
| DEV-12 | Overview: Add action items endpoint — unreconciled txns, overdue invoices, overdue bills (RightRail placeholder) | 3-4h | 🟡 Medium | 🟢 | audit:fe-be-parity |
| DEV-13 | Overview: Add cash flow time-series chart endpoint — historical cash position by day/week (CashFlowChart placeholder) | 3-4h | 🟡 Medium | 🟢 | audit:fe-be-parity |
| DEV-14 | Overview: Add expense breakdown by category endpoint for ExpenseChart (placeholder component) | 2-3h | 🟡 Medium | 🟢 | audit:fe-be-parity |

<details>
<summary><strong>📦 Deferred Dashboard Widgets (16 tasks, 32h)</strong></summary>

**Financial Statements Mini-Widgets (3 tasks, 7h)**

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-17 | Overview: P&L Summary mini-widget — revenue vs expense bars + YTD trend | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-18 | Overview: Balance Sheet Snapshot widget — asset:liability donut + equity trend | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-19 | Overview: Trial Balance Status widget — balanced alert + account type counts | 1-2h | 🟡 Medium | 📦 | audit:fe-be-parity |
| FIN-16 | Overview: Financial Health Ratios widget — current ratio, working capital, debt-to-equity, profit margin | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |

**Revenue & Client Widgets (4 tasks, 9h)**

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-20 | Overview: Top Revenue Clients widget — top 5 by YTD revenue + concentration % | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-21 | Overview: Client Payment Health widget — % paid on time, avg days-to-payment, overdue count | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-22 | Overview: Invoice Aging Waterfall widget — AR buckets 0-30, 31-60, 61-90, 90+ days | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-23 | Overview: Revenue by Category widget — revenue sources breakdown from InvoiceLine + Category | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |

**Expense & Vendor Widgets (3 tasks, 7h)**

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-24 | Overview: Top Expense Vendors widget — top 5 by YTD spend + % of total | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-25 | Overview: Bill Aging Waterfall widget — AP buckets 0-30, 31-60, 61-90, 90+ days | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-26 | Overview: Vendor Payment Terms widget — on-time vs late payment performance | 2h | 🟡 Medium | 📦 | audit:fe-be-parity |

**Banking & Automation Widgets (6 tasks, 9h)**

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-27 | Overview: Reconciliation Status widget — progress bar per account + unmatched count | 1-2h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-28 | Overview: Import Health widget — last import date, success rate, failed imports | 1-2h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-29 | Overview: Categorization Gap widget — % of transactions uncategorized by account | 1-2h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-30 | Overview: Duplicate Detection Stats widget — duplicates detected this month | 1-2h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-31 | Overview: Journal Entry Status widget — count by status, draft aging > 7d alert | 1-2h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-32 | Overview: GL Posting Pipeline widget — pending bank feed txns waiting to post | 1-2h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-33 | Overview: Ledger Spike Detection widget — accounts with unusual balance swings | 3-4h | 🟡 Medium | 📦 | audit:fe-be-parity |

</details>

---

## 🎯 Planning & Goals
**5 tasks · 20h total · ⚪⚪⚪⚪⚪ 0% complete**

> Goal tracking and budget management (🚨 DEV-97/98 block 3 downstream tasks)

### Foundation (2 tasks, 12h) — ⚪⚪ 0% **⚠️ BLOCKS 3 TASKS**

| ID | Task | Effort | Priority | Status | Blocks | Source |
|----|------|--------|----------|--------|--------|--------|
| DEV-97 | Planning: Build Goal service + full CRUD (create/list/get/update/delete using Goal model, migrate from Entity.metadata) | 4-6h | 🟠 High | 📦 | UX-58, UX-60 | audit:fe-be-parity |
| DEV-98 | Planning: Build Budget service + full CRUD (create/list/get/update/delete using Budget model) | 4-6h | 🟠 High | 📦 | UX-59, UX-60 | audit:fe-be-parity |

### UI Pages (3 tasks, 8h) — 🔒🔒🔒 BLOCKED

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| UX-58 | Planning: Build goals page — list goals, create form, progress tracking, status updates | 3-4h | 🟠 High | 🔒 | [needs: DEV-97] | audit:fe-be-parity |
| UX-59 | Planning: Build budgets page — list budgets, create form, budget vs actual bars | 3-4h | 🟠 High | 🔒 | [needs: DEV-98] | audit:fe-be-parity |
| UX-60 | Planning: Add planning landing page at `/planning` with summary cards (active goals, budget utilization, forecast status) | 2-3h | 🟠 High | 🔒 | [needs: DEV-97, DEV-98] | audit:fe-be-parity |

<details>
<summary><strong>📦 Deferred Planning Features (3 tasks, 8h)</strong></summary>

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DEV-34 | Overview: Goal Progress widget — progress bars for active goals, days to deadline | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-35 | Overview: Budget vs Actual widget — % of budget used this month, over-budget alerts | 3-4h | 🟡 Medium | 📦 | audit:fe-be-parity |
| DEV-36 | Overview: Expense Forecast widget — projected monthly spend at current 3-month run rate | 2-3h | 🟡 Medium | 📦 | audit:fe-be-parity |

</details>

---

## 🤖 AI Insights
**3 tasks · 6h total · ⚪⚪⚪ 0% complete**

> AI chat, insights, and financial advisory (formerly "AI Advisor")

### Rebranding (1 task, 3h) — ⚪ 0% **⚠️ BLOCKS 1 TASK**

| ID | Task | Effort | Priority | Status | Blocks | Source |
|----|------|--------|----------|--------|--------|--------|
| UX-66 | Rename "AI Advisor" → "Insights" across entire codebase (~29 files): frontend routes/dir rename/nav/components (9), RBAC comment (1), CLAUDE.md docs (3), design system docs (9), brand/marketing (4), config/meta (2), code reviews (2). Backend `domains/ai/`, API paths, permission keys, Prisma models stay as-is. | 2-3h | 🟠 High | 🟢 | DEV-113 | audit:ai-advisor |

### Features (2 tasks, 3h) — 🔒 BLOCKED

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DEV-112 | Insights: Create API client (`apps/web/src/lib/api/ai.ts`) for 5 existing AI endpoints | 30m | 🟠 High | 🟢 | | audit:ai-advisor |
| DEV-113 | Insights: Build AI Chat interface on Insights page (wire to existing `POST /api/ai/chat`) | 2-3h | 🟠 High | 🔒 | [needs: UX-66, DEV-112] | audit:ai-advisor |

---

## 🎨 App-wide UX Polish
**15 tasks · 20h total · 🟢🟢🟢🟢⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪ 27% complete**

> Cross-cutting UI/UX improvements affecting multiple domains

### Critical UX Fixes (5 tasks, 10h) — 🟢🟢⚪⚪⚪ 40%

| ID | Task | Effort | Priority | Status | Affects | Source |
|----|------|--------|----------|--------|---------|--------|
| ~~UX-16~~ | ~~Confirmation dialogs on JE Void/Delete~~ | 30m | 🟠 High | ✅ | Accounting | audit:acct-fe-be |
| ~~DEV-60~~ | ~~Journal entry sourceType filter~~ | 30m | 🟠 High | ✅ | Accounting | audit:acct-fe-be |
| UX-1 | Entity selector: replace 7+ hardcoded `entities[0]` with real selector (Accounting JE/COA, AccountFormSheet, Navbar, Invoicing, Vendors — all domains affected) | 2-3h | 🟠 High | 🟢 | **ALL DOMAINS** | review:nextjs, audit:app-ux |
| UX-17 | App-wide: Add toast notifications on ALL mutations — zero toast usage across entire app (accounting, banking, invoicing, vendors, settings: ~20+ mutation points) | 3-4h | 🟠 High | 🟢 | **ALL DOMAINS** | audit:acct-fe-be, audit:app-ux |
| UX-29 | App-wide: Add confirmation dialogs on ALL destructive actions — Cancel Invoice/Bill, Bulk Delete, account deactivate (6+ unconfirmed actions) | 2h | 🟠 High | 🟢 | Business, Banking | audit:app-ux |
| UX-8 | Add loading/error states to remaining dashboard pages (~30 pages) | 2h | 🟠 High | 🟢 | **ALL DOMAINS** | plan:phase-6-tasks |

### Quick UX Wins (10 tasks, 3h) — 🟢🟢⚪⚪⚪⚪⚪⚪⚪⚪ 20%

| ID | Task | Effort | Priority | Status | Affects | Source |
|----|------|--------|----------|--------|---------|--------|
| ~~UX-14~~ | ~~Unmatch button in reconciliation~~ | 1h | 🟠 High | ✅ | Banking | audit:fe-be-parity |
| ~~UX-23~~ | ~~GL account searchable Combobox~~ | 1h | 🟡 Medium | ✅ | Accounting | audit:acct-fe-be |
| UX-35 | Sidebar: Add "Coming Soon" badge to 17 placeholder pages or hide unimplemented nav items | 30m | 🟡 Medium | 🟢 | **ALL DOMAINS** | audit:app-ux |
| UX-41 | Business: Fix hardcoded 'CAD' currency — should use entity functional currency | 15m | 🟡 Medium | 🟢 | Business | audit:app-ux |
| UX-20 | Accounting COA: Add reactivate button for deactivated accounts | 15m | 🟡 Medium | 🟢 | Accounting | audit:acct-fe-be |
| DEV-84 | App-wide: Fix navigation.ts mismatches — Bills route points to stub | 30m | 🟡 Medium | 🟢 | **ALL DOMAINS** | audit:app-ux |
| UX-30 | Banking: Fix posted transaction link (goes to filtered list, not specific JE) | 30m | 🟠 High | 🟢 | Banking | audit:app-ux |
| UX-38 | Banking: Add active/inactive account filter toggle | 30m | 🟡 Medium | 🟢 | Banking | audit:app-ux |
| UX-40 | Business: Add mark-overdue button on bill detail | 30m | 🟡 Medium | 🟢 | Business | audit:app-ux |
| UX-42 | Business: Add "View Journal Entry" link after posting to GL | 30m | 🟡 Medium | 🟢 | Business | audit:app-ux |
| UX-39 | Banking: Add aria-labels (a11y) | 30m | 🟡 Medium | 🟢 | Banking | audit:app-ux |
| UX-27 | Accounting COA: Replace window.reload with state update | 30m | 🟡 Medium | 🟢 | Accounting | audit:acct-fe-be |

---

## 🏗️ Infrastructure & DevOps
**8 tasks · 18h total · ⚪⚪⚪⚪⚪⚪⚪⚪ 0% complete**

> Architecture, observability, and production infrastructure

### Architecture & Observability (3 tasks, 8h) — ⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| ARCH-2 | Audit log coverage expansion (bulk ops, imports, exports, reconciliation) | 3h | 🟠 High | 🟢 | review:smooth-floating-mountain |
| ARCH-6 | Audit logging inside DB transactions (not fire-and-forget outside TX) | 2h | 🟠 High | 🟢 | review:smooth-floating-mountain |
| PERF-9 | Replace console.log with pino structured logging (7 production files) | 2h | 🟠 High | 🟢 | plan:phase-6-tasks |

### Code Quality & DX (3 tasks, 2h) — ⚪⚪⚪ 0%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| DRY-2 | CSV sanitization: deduplicate between report-export and data-export | 30m | 🟡 Medium | 🟢 | review:simplicity |
| DRY-3 | Report routes: extract shared 40-line handler pattern into helper | 1h | 🟡 Medium | 🟢 | review:simplicity |
| DRY-7 | Dashboard page.tsx: extract 120+ lines of data transformation to `lib/dashboard/transformers.ts` | 30m | 🟡 Medium | 🟢 | review:dashboard-overview |

### Design System Cleanup (2 tasks, 1h) — 🟢⚪ 50%

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| ~~DS-5~~ | ~~AIBrief: change text-primary to purple tokens~~ | 10m | 🟡 Medium | ✅ | review:dashboard-overview |
| ~~DS-6~~ | ~~Resolve text-[9px] vs text-[10px] with text-micro utility~~ | 15m | 🟡 Medium | ✅ | review:dashboard-overview |
| DS-4 | ExpenseChart: replace inline backgroundColor with token-mapped CSS variables | 30m | 🟡 Medium | 🟢 | review:dashboard-overview |

<details>
<summary><strong>📦 Deferred Infrastructure Tasks (12 tasks, 32h)</strong></summary>

**Advanced Architecture (5 tasks, 19h)**

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| ARCH-1 | OpenAPI spec auto-generation from Zod schemas (fastify-zod-openapi) | 3h | 🟡 Medium | 📦 | review:smooth-floating-mountain |
| ARCH-4 | Background job processing setup (BullMQ for PDF gen, email, imports) | 4h | 🟡 Medium | 📦 | review:smooth-floating-mountain |
| ARCH-5 | Error recovery patterns (idempotency keys, circuit breakers, retry with backoff) | 4h | 🟡 Medium | 📦 | review:smooth-floating-mountain |
| TEST-4 | Integration tests (API → DB → API roundtrip for critical flows) | 4h | 🟡 Medium | 📦 | review:smooth-floating-mountain |
| PERF-10 | Distributed caching (Redis) for multi-instance deployment | 4h | 🟡 Medium | 📦 | review:smooth-floating-mountain |

**Financial & Compliance (4 tasks, 16h)**

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| FIN-7 | Fiscal period enforcement (prevent posting to locked periods) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |
| FIN-8 | Fiscal year close process (closing entries, revenue → retained earnings) | 4h | 🟡 Medium | 📦 | [needs: FIN-7] | review:smooth-floating-mountain |
| FIN-9 | Multi-currency revaluation on period close (FX gains/losses, IFRS/GAAP) | 4h | 🟡 Medium | 📦 | [needs: FIN-8] | review:smooth-floating-mountain |
| FIN-10 | Invoice/bill reconciliation workflows (AP/AR aging, match/approve) | 4h | 🟡 Medium | 📦 | | review:smooth-floating-mountain |

**Security & Monitoring (3 tasks, 7h)**

| ID | Task | Effort | Priority | Status | Source |
|----|------|--------|----------|--------|--------|
| SEC-10 | Row-Level Security (PostgreSQL) for production hardening | 3h | 🟡 Medium | 📦 | roadmap |
| SEC-12 | File upload quota enforcement per tenant (prevent abuse/DoS) | 1h | 🟡 Medium | 🟢 | review:smooth-floating-mountain |
| SEC-14 | Audit log retention policies (prevent unbounded growth, compliance) | 1h | 🟡 Medium | 🟢 | review:smooth-floating-mountain |
| PERF-12 | N+1 query monitoring / slow query detection in production (APM) | 2h | 🟡 Medium | 📦 | review:smooth-floating-mountain |

</details>

---

## ✅ Recently Completed
**31 tasks completed**

<details>
<summary><strong>Show completed tasks</strong></summary>

| ID | Task | Completed | Source |
|----|------|-----------|--------|
| DEV-1 | Onboarding middleware fix | ✅ | audit:smooth-floating-mountain |
| SEC-9 | CSRF protection review (N/A for JWT Bearer auth) | ✅ | roadmap |
| DRY-1 | Report types: move to packages/types | ✅ | review:typescript |
| UX-2 | GL Account searchable dropdown | ✅ | review:nextjs, audit:acct-fe-be |
| UX-14 | Banking: Unmatch button | ✅ | audit:fe-be-parity |
| UX-16 | Accounting: Confirmation dialogs | ✅ | audit:acct-fe-be |
| DEV-60 | Accounting: sourceType filter | ✅ | audit:acct-fe-be |
| SEC-17 | XSS fix: sanitize dangerouslySetInnerHTML | ✅ | review:dashboard-overview |
| SEC-18 | Dashboard: requireTenantId() guard | ✅ | review:dashboard-overview |
| SEC-19 | Dashboard: Replace unsafe type casts | ✅ | review:dashboard-overview |
| FIN-13 | UpcomingPayments.amount type fix | ✅ | review:dashboard-overview |
| DOC-1 | Add plan-enforcement.md to context | ✅ | review:smooth-floating-mountain |
| UX-23 | GL account searchable Combobox | ✅ | audit:acct-fe-be |
| UX-43 | Payment allocation UI (merged into DEV-76) | ✅ | audit:app-ux |
| UX-28 | Sidebar badges (merged into UX-35) | ✅ | audit:acct-fe-be |
| DRY-6 | Dashboard: deduplicate SparkCards | ✅ | review:dashboard-overview |
| UX-9 | Dashboard: fix SVG gradient ID collision | ✅ | review:dashboard-overview |
| DEV-3 | Dashboard: delete dead handleSkipStep | ✅ | review:dashboard-overview |
| DEV-4 | Dashboard: type entity maps | ✅ | review:dashboard-overview |
| DS-3 | Dashboard: replace hover:glass-3 | ✅ | review:dashboard-overview |
| DS-5 | AIBrief: purple tokens | ✅ | review:dashboard-overview |
| DS-6 | Dashboard: text-micro utility | ✅ | review:dashboard-overview |
| DEV-5 | DashboardLeftRail: cleanup | ✅ | review:dashboard-overview |
| DEV-6 | Dashboard: delete duplicate OnboardingHeroCard | ✅ | review:dashboard-overview |
| DEV-7 | DashboardRightRail: use cn() | ✅ | review:dashboard-overview |
| DEV-8 | DashboardService: return type | ✅ | review:dashboard-overview |
| DEV-9 | DashboardService: type byType | ✅ | review:dashboard-overview |

</details>

---

## 📈 Progress by Domain

| Domain | Total Tasks | Completed | In Progress | Blocked | Backlog | % Done |
|--------|-------------|-----------|-------------|---------|---------|--------|
| 🚀 Launch Blockers | 15 | 0 | 15 | 0 | 0 | 0% |
| 💼 Business Workflows | 22 | 1 | 17 | 0 | 4 | 5% |
| 🏦 Banking Operations | 12 | 1 | 9 | 0 | 2 | 8% |
| 📊 Accounting & Reports | 18 | 2 | 11 | 0 | 5 | 11% |
| 📈 Overview Dashboard | 25 | 0 | 4 | 0 | 21 | 0% |
| 🎯 Planning & Goals | 5 | 0 | 0 | 3 | 2 | 0% |
| 🤖 AI Insights | 3 | 0 | 1 | 1 | 1 | 0% |
| 🎨 App-wide UX | 15 | 4 | 9 | 0 | 2 | 27% |
| 🏗️ Infrastructure | 8 | 2 | 4 | 0 | 2 | 25% |
| **TOTAL** | **123** | **10** | **70** | **4** | **39** | **8%** |

---

## 🎯 Next Actions

**Immediate (This Week):**
1. Start **UX-11, UX-12** (wire net-worth/cash-flow pages) — 2-4h, instant user value
2. Fix **FIN-15** (hardcoded receivables) — 2-3h, trust issue
3. Tackle **UX-1** (entity selector) — 2-3h, unblocks all domains
4. Begin **SEC-8** (security audit) in parallel — 4h, launch blocker

**Next Week:**
1. Complete **Business Workflows** quick wins (DEV-71/72/75/77/78) — 10-15h
2. Knock out **UX Quick Wins** section (10 tasks, 3h total) — psychological boost
3. Start **Performance Optimization** track (PERF-1/5/6/8) — 8h

**Blocked - Needs Decision:**
- **Planning domain** (DEV-97/98) — Start now or defer to post-launch?
- **AI Insights rename** (UX-66) — Do we rebrand before or after launch?

---

_Generated from TASKS.md on 2026-02-19. This is a **view-only** reorganization. All task updates still happen in the original TASKS.md file._
