# Akount — Completed Tasks Archive

> Historical record of completed tasks. Active tasks are in [TASKS.md](TASKS.md).

---

## Completed Tasks (Most Recent First)

| ID | Task | Completed | Commit/Source |
|----|------|-----------|---------------|
| UX-3 | Report tables: add `aria-*` attributes, caption, scope, role="progressbar" | 45m | 🟡 Medium | ✅ |  | review:nextjs |
| UX-24 | Accounting JE: Add "Duplicate Entry" action to pre-fill form from existing entry | 1h | 🟡 Medium | ✅ | cb2174c | audit:acct-fe-be |
| DOC-3 | Archive .reviews/ temp workspace to docs/reviews/ or delete | 15m | 🟡 Medium | ✅ | | review:smooth-floating-mountain |
| DOC-4 | Elevate source preservation to explicit 5th invariant in guardrails.md | 15m | 🟡 Medium | ✅ | | review:smooth-floating-mountain |
| UX-18 | Accounting: Add landing page at `/accounting` with summary stats (draft JEs, account count, recent activity) | 2-3h | 🟠 High | ✅ | already built | audit:acct-fe-be |
| TEST-7 | Frontend: Fix WelcomeStep 7 failing tests (text mismatch) | 30m | 🟠 High | ✅ done | 38cfde1 | plan:frontend-test-coverage |
| TEST-8 | Frontend: Create test-utils/ dir + render helper | 30m | 🟠 High | ✅ done | 38cfde1 | plan:frontend-test-coverage |
| TEST-9 | Frontend: Create mock data factories (Account, Invoice, etc.) | 45m | 🟠 High | ✅ done | 38cfde1 | plan:frontend-test-coverage |
| TEST-10 | Frontend: Create API mock helpers (typed apiFetch wrappers) | 30m | 🟠 High | ✅ done | 38cfde1 | plan:frontend-test-coverage |
| TEST-11 | Frontend: Test currency.ts (4 functions, ~20 tests) | 45m | 🟠 High | ✅ done | 38cfde1 | plan:frontend-test-coverage |
| TEST-12 | Frontend: Test date.ts (4 functions, ~15 tests) | 45m | 🟠 High | ✅ done | 38cfde1 | plan:frontend-test-coverage |
| TEST-13 | Frontend: Test account-helpers.ts (2 functions + maps, ~15 tests) | 45m | 🟡 Medium | ✅ done | 38cfde1 | plan:frontend-test-coverage |
| TEST-14 | Frontend: Test StatCard / QuickStats / QuickActionPills | 1.5h | 🟡 Medium | ✅ done | b3dee11 | plan:frontend-test-coverage |
| TEST-15 | Frontend: Test DashboardMetrics + EntityAccountCards | 1.5h | 🟡 Medium | ✅ done | b3dee11 | plan:frontend-test-coverage |
| TEST-16 | Frontend: Test overview widgets (P&L, TrialBalance, TopRevenue) | 1.5h | 🟡 Medium | ✅ done | b3dee11 | plan:frontend-test-coverage |
| TEST-17 | Frontend: Test InvoiceTable + BillsTable + PaymentTable | 2h | 🟡 Medium | ✅ done | 4d6cc4a | plan:frontend-test-coverage |
| TEST-18 | Frontend: Test ClientForm + VendorForm | 2h | 🟡 Medium | ✅ done | 4d6cc4a | plan:frontend-test-coverage |
| TEST-19 | Frontend: Test InvoiceForm line items + totals (financial calcs) | 2.5h | 🟠 High | ✅ done | 4d6cc4a | plan:frontend-test-coverage |
| TEST-20 | Frontend: Test navigation components + E2E onboarding fix | 2h | ⚪ Low | ✅ done | fe8d986 | plan:frontend-test-coverage |
| UX-104 | Fix static key="create" bug in ClientForm/VendorForm (stale data on switch) | 20m | 🟡 Medium | ✅ done | | review:revie23feb |
| TEST-5 | Add assertIntegerCents to transfer.service.test.ts | 15m | 🟡 Medium | ✅ done | | review:revie23feb |
| UX-4 | Report views: replace array index React keys with stable identifiers | 15m | 🟡 Medium | ✅ done | | review:nextjs |
| TEST-2 | E2E tests for critical user flows (onboarding, import, posting, reports) | 4h | 🟠 High | ✅ | 9608590 | roadmap |
| TEST-3 | 80%+ API test coverage target | 2h | 🟠 High | ✅ | 9608590 | roadmap |
| UX-33 | App-wide: Add cross-links between related records — Invoice↔Client, Transaction↔JournalEntry, Bill↔Vendor, Payment↔Invoice/Bill | 2-3h | 🟡 Medium | ✅ | | audit:app-ux |
| UX-34 | App-wide: Add bulk operations to list pages — batch cancel invoices/bills, transactions already had bulk ops | 3-4h | 🟡 Medium | ✅ | | audit:app-ux |
| SEC-12 | File upload quota enforcement per tenant (prevent abuse/DoS) | 1h | 🟡 Medium | ✅ done | | review:smooth-floating-mountain |
| SEC-14 | Audit log retention policies (prevent unbounded growth, compliance) | 1h | 🟡 Medium | ✅ done | | review:smooth-floating-mountain |
| SEC-27 | Fix listTaxRates to include custom rates when entityId absent | 30m | 🟠 High | ✅ done | 35183d8 | review:revie23feb |
| SEC-25 | Global tax rate pollution: Make entityId required in create schema | 2026-02-24 | review:revie23feb |
| SEC-26 | Derive tenantId server-side in onboarding /complete endpoint | 2026-02-24 | review:revie23feb |
| DRY-18 | Sanitize invoice number in Content-Disposition header | 2026-02-24 | review:revie23feb |
| UX-105 | Move UpcomingPayments fetch to server component | 2026-02-24 | review:revie23feb |
| DRY-20 | Strengthen StatusBadge types | 2026-02-24 | review:revie23feb |
| DRY-21 | Extract inline formatCents/parseCentsInput to shared utility | 2026-02-24 | review:revie23feb |
| FIN-23 | Fix `voidTransfer` balance reversal — voiding a transfer marks JEs as VOIDED but does NOT reverse account balances | 2026-02-23 | review:transfer-service |
| SEC-24 | GL Account service: _count queries don't filter by tenant | 2026-02-23 | pm:execute/UX-19 (18d40d1) |
| TEST-1 | Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests | 2026-02-23 | review:typescript (256b647) |
| DEV-2 | Service tests for client/invoice/bill/vendor services | 2026-02-23 | audit:smooth-floating-mountain |
| UX-8 | Add loading/error states to remaining dashboard pages (~30 pages) | 2026-02-23 | plan:phase-6-tasks (364ea9b) |
| DEV-46 | Banking: Implement transfers backend API + wire transfers page | 2026-02-23 | plan:2026-02-21-banking-transfers.md |
| UX-15 | Banking: Add GL account linking UI on account detail | 2026-02-23 | audit:fe-be-parity |
| DEV-59 | Accounting: Add transaction posting UI — post bank txns to GL | 2026-02-23 | audit:acct-fe-be |
| UX-31 | Business: Add search/filter bar on invoice, bill, client, vendor lists | 2026-02-23 | cc6c96c |
| UX-32 | Business: Add pagination controls — cursor pagination + Load More | 2026-02-23 | cc6c96c |
| DEV-71 | Business: Add invoice/bill edit for DRAFT status | 2026-02-23 | audit:app-ux |
| DEV-72 | Business: Void invoice full stack — schema + service + route + frontend | 2026-02-23 | ef8ff46 |
| DEV-73 | Business: Add vendor CRUD — create/edit/delete | 2026-02-23 | audit:app-ux |
| DEV-74 | Business: Add client CRUD — create/edit/delete | 2026-02-23 | audit:app-ux |
| DEV-75 | Business: Replace bills "Coming Soon" stub with real bill list page | 2026-02-23 | 1e987ed |
| DEV-76 | Business: Wire payment allocation UI | 2026-02-23 | audit:app-ux |
| DEV-77 | Business: Wire edit/delete invoice/bill/payment actions | 2026-02-23 | audit:app-ux |
| DEV-78 | Business: Wire "Post to GL" button on payment allocation | 2026-02-23 | audit:fe-be-parity |
| UX-45 | Business: Add quick "Record Payment" button on invoice detail page | 2026-02-23 | audit:fe-be-parity |
| DEV-112 | Insights: Create API client for 5 existing AI endpoints | 2026-02-23 | commit 15a7ef4 |
| DEV-113 | Insights: Build AI Chat interface on Insights page | 2026-02-23 | commit 1abfdae |
| FIN-25 | Fix subtotal calculation bug in invoice & bill services | 2026-02-23 | 81cb868 |
| FIN-26 | Wire taxRateId to invoice/bill line items | 2026-02-23 | diagnose:invoice-form |
| FIN-27 | Fix document-posting.service.ts netAmount | 2026-02-23 | a88a2bb |
| FIN-28 | Fix transfer baseCurrency calculation | 2026-02-23 | 36c2dd8 |
| UX-102 | Replace manual tax input with tax rate dropdown + auto-calculation | 2026-02-23 | diagnose:invoice-form |
| DEV-84 | App-wide: Fix navigation.ts mismatches | 2026-02-23 | audit:app-ux |
| UX-19 | Accounting COA: Add search input for GL accounts | 2026-02-23 | d7e9e90 |
| UX-20 | Accounting COA: Add reactivate button for deactivated accounts | 2026-02-23 | audit:acct-fe-be |
| UX-21 | Accounting COA: Add balance summary header | 2026-02-23 | audit:acct-fe-be |
| UX-22 | Accounting JE: Fix filter auto-refresh | 2026-02-23 | audit:acct-fe-be |
| UX-25 | Accounting Reports: Add quick-generate buttons | 2026-02-23 | audit:acct-fe-be |
| PERF-2 | Revenue: add JSONB expression index for extraction | 2026-02-23 | review:performance |
| PERF-3 | Recharts: code-split import (lazy load) | 2026-02-23 | review:performance |
| DRY-2 | CSV sanitization: deduplicate between report-export and data-export | 2026-02-23 | review:simplicity |
| DRY-3 | Report routes: extract shared 40-line handler pattern into helper | 2026-02-23 | review:simplicity |
| DRY-8 | Transfer routes: refactor string-matching error handling | 2026-02-23 | review:transfer-service |
| DRY-9 | Remove formatCurrency duplicates | 2026-02-23 | 3860bf0 |
| DRY-11 | Extract StatusBadge components to packages/ui | 2026-02-23 | 7640e1f |
| DRY-12 | Create EmptyState component | 2026-02-23 | 913fa60 |
| DRY-17 | Refactor StatusBadges to use base Badge component | 2026-02-23 | 4ce91e4 |
| FIN-24 | Transfer service: extract overdraft-allowed account types constant | 2026-02-23 | review:transfer-service |
| DOC-2 | Consolidate logging rules | 2026-02-23 | review:smooth-floating-mountain |
| DOC-7 | Update test/page counts in context files | 2026-02-23 | audit:2026-02-20 |
| DRY-7 | Dashboard page.tsx: extract data transformation | 2026-02-23 | review:dashboard-overview |
| DS-4 | ExpenseChart: replace inline backgroundColor with tokens | 2026-02-23 | review:dashboard-overview |
| FIN-14 | DashboardService: document or fix float arithmetic in FX conversion | 2026-02-23 | review:dashboard-overview |
| DEV-179 | Overview Widgets: Add client-side API functions | 2026-02-23 | commit:b6b09b1 |
| DEV-180 | Overview Widgets: Create ProfitLossSummaryWidget component | 2026-02-23 | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-181 | Overview Widgets: Create TrialBalanceStatusWidget component | 2026-02-23 | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-182 | Overview Widgets: Create TopRevenueClientsWidget component | 2026-02-23 | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-183 | Overview Widgets: Add 3 report widgets to Overview page grid layout | 2026-02-23 | plan:2026-02-24-overview-dashboard-widgets.md |
| DEV-184 | Overview Widgets: Update Overview loading skeleton | 2026-02-23 | plan:2026-02-24-overview-dashboard-widgets.md |
| UX-54 | Business: Auto-fill due date from client/vendor payment terms | 2026-02-23 | audit:fe-be-parity |
| DEV-114 | Insights: Extract shared AI types to packages/types | 2026-02-23 | audit:ai-advisor |
| DEV-121 | Accounting: Add journal entry detail page | 2026-02-23 | 8106fcb |
| UX-77 | Routing: Move /business/invoices/bills/[id] → /business/bills/[id] | 2026-02-23 | sitemap:audit |
| UX-78 | Routing: Rename /insights/insights → /insights | 2026-02-23 | commit a799d81 |
| DEV-122 | Business: Add client detail page | 2026-02-23 | 1e987ed |
| INFRA-59 | Flinks API production readiness | 2026-02-23 | ad-hoc:flinks-production-prep |
| DEV-178 | Fix onboarding race conditions and transaction timeout (P2002/P2028) | 2026-02-23 | manual |
| DEV-1 | Onboarding middleware fix | 2026-02-21 | audit:smooth-floating-mountain |
| PERF-18 | Add composite index on Invoice for AR aging | 2026-02-21 | audit:2026-02-20 |
| PERF-19 | Add composite index on Transaction for date range queries | 2026-02-21 | audit:2026-02-20 |
| PERF-20 | Add composite index on Bill for AP aging | 2026-02-21 | audit:2026-02-20 |
| SEC-9 | CSRF protection review | 2026-02-21 | roadmap |
| PERF-1 | Balance Sheet: combine 2 redundant heavy SQL queries into 1 | 2026-02-21 | review:performance |
| PERF-5 | Database indexes on hot paths | 2026-02-21 | roadmap |
| PERF-6 | Query optimization audit | 2026-02-21 | roadmap |
| PERF-8 | p95 < 2s page load target verification + load testing | 2026-02-21 | roadmap |
| INFRA-14 | Add timeout to Clerk auth verification | 2026-02-21 | audit:2026-02-20 |
| INFRA-16 | Upgrade markdownlint-cli2 to fix markdown-it ReDoS | 2026-02-21 | 276661d |
| INFRA-17 | Upgrade eslint to v10 to fix minimatch ReDoS | 2026-02-21 | 276661d |
| INFRA-18 | Verify dev dependency fixes | 2026-02-21 | 276661d |
| INFRA-19 | Install exceljs@4.4.0 and remove vulnerable xlsx@0.18.5 | 2026-02-21 | 276661d |
| INFRA-20 | Migrate parseXLSX to async exceljs API | 2026-02-21 | 276661d |
| INFRA-21 | Verify XLSX magic bytes detection still works | 2026-02-21 | 276661d |
| INFRA-22 | Update parseXLSX tests for exceljs async API | 2026-02-21 | 276661d |
| INFRA-23 | Update XLSX import route tests | 2026-02-21 | 276661d |
| INFRA-24 | Update file scanner tests | 2026-02-21 | 276661d |
| INFRA-25 | Run full test suite | 2026-02-21 | 276661d |
| INFRA-26 | Type check | 2026-02-21 | 276661d |
| INFRA-27 | Final npm audit | 2026-02-21 | 276661d |
| INFRA-28 | Update MEMORY.md Known Issues | 2026-02-21 | 276661d |
| SEC-23 | Replace console.log in webhook route with structured logging | 2026-02-21 | audit:2026-02-20 |
| DRY-1 | Report types: move shared types to packages/types | 2026-02-21 | review:typescript |
| UX-1 | Entity selector: replace 7+ hardcoded entities[0] with real selector | 2026-02-21 | 1b338f8 |
| UX-2 | GL Account ID: replace raw CUID input with searchable dropdown | 2026-02-21 | review:nextjs |
| PERF-9 | Replace console.log with pino structured logging | 2026-02-21 | plan:phase-6-tasks |
| ARCH-2 | Audit log coverage expansion | 2026-02-21 | commit 7b709b6 |
| ARCH-6 | Audit logging inside DB transactions | 2026-02-21 | commit 86f13c4 |
| SEC-11 | File upload virus scanning (ClamAV integration) | 2026-02-21 | review:smooth-floating-mountain |
| SEC-13 | Audit log tamper detection | 2026-02-21 | review:smooth-floating-mountain |
| INFRA-9 | Secrets management for production | 2026-02-21 | review:smooth-floating-mountain |
| INFRA-10 | Security scanning in CI | 2026-02-21 | review:smooth-floating-mountain |
| SEC-17 | XSS fix: sanitize dangerouslySetInnerHTML in AIBrief | 2026-02-21 | review:dashboard-overview |
| SEC-18 | Dashboard routes: replace unsafe request.tenantId casts | 2026-02-21 | review:dashboard-overview |
| SEC-19 | Dashboard routes: replace unsafe as DashboardQuery casts | 2026-02-21 | review:dashboard-overview |
| FIN-13 | UpcomingPayments.amount typed as string | 2026-02-21 | review:dashboard-overview |
| DOC-1 | Add plan-enforcement.md to CLAUDE.md Layer 1 | 2026-02-21 | review:smooth-floating-mountain |
| UX-11 | Overview: Wire /overview/net-worth page with real data | 2026-02-21 | audit:fe-be-parity |
| UX-12 | Overview: Wire /overview/cash-flow page with real data | 2026-02-21 | audit:fe-be-parity |
| FIN-15 | Performance endpoint: Wire receivables data from invoicing domain | 2026-02-21 | audit:fe-be-parity |
| DEV-10 | Overview: Add Accounts Payable summary to dashboard | 2026-02-21 | audit:fe-be-parity |
| DEV-43 | Banking: Add manual transaction creation form | 2026-02-21 | audit:fe-be-parity |
| DEV-44 | Banking: Wire XLSX import support in import wizard | 2026-02-21 | audit:fe-be-parity |
| UX-13 | Banking: Add category management page | 2026-02-21 | session |
| UX-14 | Banking: Add unmatch button to reconciliation | 2026-02-21 | audit:fe-be-parity |
| DEV-45 | Banking: Add import batch detail page | 2026-02-21 | audit:fe-be-parity |
| UX-16 | Accounting: Add confirmation dialogs on Void/Delete journal entry | 2026-02-21 | audit:acct-fe-be |
| UX-17 | App-wide: Add toast notifications on ALL mutations | 2026-02-21 | 4990262 |
| DEV-60 | Accounting: Add journal entry sourceType filter | 2026-02-21 | audit:acct-fe-be |
| UX-29 | App-wide: Add confirmation dialogs on ALL destructive actions | 2026-02-21 | 2479218 |
| UX-30 | Banking: Fix posted transaction link | 2026-02-21 | session |
| UX-66 | Rename "AI Advisor" → "Insights" across entire codebase | 2026-02-21 | audit:ai-advisor |
| UX-72 | Dashboard: Implement cash flow projection endpoint | 2026-02-21 | 5c6d170 |
| FIN-17 | Fix missing entityId on import audit logs | 2026-02-21 | diagnose:audit-fk-bug |
| FIN-18 | Fix missing entityId on data export audit log | 2026-02-21 | diagnose:audit-fk-bug |
| ARCH-7 | Fix audit log hash chain race condition | 2026-02-21 | diagnose:audit-fk-bug |
| ARCH-8 | Pass tx to audit log calls for atomic audit+operation | 2026-02-21 | diagnose:audit-fk-bug |
| FIN-19 | Add entityId validation guard in createAuditLog | 2026-02-21 | diagnose:audit-fk-bug |
| FIN-20 | Add audit log tests for FK validation | 2026-02-21 | diagnose:audit-fk-bug |
| UX-35 | Sidebar: Add "Coming Soon" badge to placeholder pages | 2026-02-21 | session |
| UX-37 | Business: Add client/vendor edit capability | 2026-02-21 | audit:app-ux |
| UX-38 | Banking: Add active/inactive account filter toggle | 2026-02-21 | session |
| UX-39 | Banking: Add aria-labels to bulk action buttons | 2026-02-21 | session |
| UX-40 | Business: Add mark-overdue button on bill detail | 2026-02-21 | audit:app-ux |
| UX-41 | Business: Fix hardcoded 'CAD' currency | 2026-02-21 | session |
| UX-42 | Business: Add "View Journal Entry" link after posting invoice/bill | 2026-02-21 | session |
| UX-43 | Business: Add payment allocation UI | 2026-02-21 | audit:app-ux |
| UX-23 | Accounting JE: Replace GL account Select with searchable Combobox | 2026-02-21 | audit:acct-fe-be |
| UX-26 | Accounting JE: Add source cross-links | 2026-02-21 | 8106fcb |
| UX-27 | Accounting COA: Replace window.location.reload() with state update | 2026-02-21 | 2360780 |
| UX-28 | Sidebar: Add "Coming Soon" badge | 2026-02-21 | audit:acct-fe-be |
| PERF-21 | Add composite index on JournalLine | 2026-02-21 | audit:2026-02-20 |
| PERF-22 | Add composite index on Payment | 2026-02-21 | audit:2026-02-20 |
| INFRA-15 | Add security headers to Next.js API routes | 2026-02-21 | audit:2026-02-20 |
| DRY-6 | Dashboard: deduplicate SparkCards/DashboardLeftRail | 2026-02-21 | review:dashboard-overview |
| UX-9 | Dashboard: fix SVG gradient ID collision | 2026-02-21 | review:dashboard-overview |
| UX-10 | Navbar: add live sync status indicator with refresh button | 2026-02-21 | existing |
| DEV-3 | Dashboard: delete dead handleSkipStep + SparkCardsSkeleton | 2026-02-21 | review:dashboard-overview |
| DEV-4 | Dashboard: type entity maps as Record<EntityType, ...> | 2026-02-21 | review:dashboard-overview |
| DS-3 | Dashboard: replace hover:glass-3 with proper hover pattern | 2026-02-21 | review:dashboard-overview |
| DS-5 | AIBrief: change text-primary to AI-specific purple tokens | 2026-02-21 | review:dashboard-overview |
| DS-6 | Dashboard: resolve text-[9px] vs text-[10px] with text-micro utility | 2026-02-21 | review:dashboard-overview |
| DEV-5 | Dashboard: add cancelAnimationFrame cleanup | 2026-02-21 | review:dashboard-overview |
| DEV-6 | Dashboard: delete duplicate OnboardingHeroCard | 2026-02-21 | review:dashboard-overview |
| DEV-7 | DashboardRightRail: replace dead links | 2026-02-21 | review:dashboard-overview |
| DEV-8 | DashboardService: add explicit return type to getMetrics() | 2026-02-21 | review:dashboard-overview |
| DEV-9 | DashboardService: type byType as Partial<Record<AccountType, number>> | 2026-02-21 | review:dashboard-overview |
| UX-50 | Business: Add search/filter bar on invoice list | 2026-02-21 | audit:fe-be-parity |
| UX-51 | Business: Add search/filter bar on bill list | 2026-02-21 | audit:fe-be-parity |
| UX-53 | Business: Add pagination controls | 2026-02-21 | audit:fe-be-parity |
| DEV-95 | Business: Add client invoice history tab | 2026-02-21 | audit:fe-be-parity |
| DEV-96 | Business: Add vendor bill history tab | 2026-02-21 | audit:fe-be-parity |
| UX-56 | Business: Add partial payment progress bar on detail | 2026-02-21 | audit:fe-be-parity |
| DEV-92 | Business: Build credit notes feature | 2026-02-21 | audit:fe-be-parity |
| DEV-123 | Business: Add vendor detail page | 2026-02-21 | session |
| UX-80 | Sidebar: Add top 3 report shortcuts under Accounting | 2026-02-21 | existing |
| SEC-1 | RBAC middleware: Wire requirePermission() | 2026-02-17 | 5e18109 |
| SEC-2 | tenantScopedQuery string check — strengthen assertion | 2026-02-17 | 5e18109 |
| SEC-3 | Data export: mask bank account numbers | 2026-02-17 | 5e18109 |
| SEC-4 | Error handler: stop exposing details to client | 2026-02-17 | 4e4d049 |
| SEC-5 | sanitizeFilename: guard against empty string | 2026-02-17 | 4e4d049 |
| SEC-6 | Cache TTL env var: validate against NaN | 2026-02-17 | 4e4d049 |
| SEC-7 | PDF timeout timer: clean up unhandled rejection | 2026-02-17 | 5e18109 |
| FIN-1 | Balance Sheet: enforce strict balance | 2026-02-17 | 4e4d049 |
| FIN-2 | Cash Flow: add reconciliation check | 2026-02-17 | 6ad5626 |
| FIN-3 | GL Ledger: order window function by date | 2026-02-17 | 4e4d049 |
| FIN-4 | Spending/Revenue: add currency validation | 2026-02-17 | 6ad5626 |
| FIN-5 | Data export: apply includeSoftDeleted flag | 2026-02-17 | 6ad5626 |
| DRY-4 | sanitizeCsvCell: accept null in type signature | 2026-02-17 | 4e4d049 |
| UX-5 | Spending view: remove duplicate CHART_COLORS entry | 2026-02-17 | 4e4d049 |

---

**Total Archived:** 152 completed tasks
**Period Covered:** 2026-02-17 to 2026-02-24
| ID | Task | Completed | Source |
|----|------|-----------|--------|
| DOC-8 | Update domain status in apps/api/CLAUDE.md (Invoicing marked "stub" but is fully built) | 2026-02-26 | audit:2026-02-20 |
| UX-79 | Business: Add bill detail page at `/business/bills/[id]` | 2026-02-26 | sitemap:audit |
| DOC-5 | Add double-entry bookkeeping check to guardrails.md anti-patterns | 2026-02-26 | review:smooth-floating-mountain |
| DOC-6 | Update version dates across CLAUDE.md files | 2026-02-26 | review:smooth-floating-mountain |
| UX-81 | Business: Add payment detail page `/business/payments/[id]` | 2026-02-26 | sitemap:audit |
| MKT-3 | Install 3D dependencies (`@react-three/fiber`, `@react-three/drei`, `three`) | 2026-02-26 | plan:marketing-landing-page |
| MKT-4 | Create hero section with 3D orb and parallax effect | 2026-02-26 | plan:marketing-landing-page |
| MKT-5 | Create problem statement section (3 pain point cards) | 2026-02-26 | plan:marketing-landing-page |
| MKT-6 | Create solution pillars section (3 GlowCard components) | 2026-02-26 | plan:marketing-landing-page |
| MKT-7 | Create 3D feature showcase (interactive card grid) | 2026-02-26 | plan:marketing-landing-page |
| MKT-8 | Create stats/social proof section (animated counters) | 2026-02-26 | plan:marketing-landing-page |
| MKT-9 | Create final CTA section (gradient background, glass container) | 2026-02-26 | plan:marketing-landing-page |
| MKT-10 | Create landing page layout (minimal nav + footer) | 2026-02-26 | plan:marketing-landing-page |
| MKT-11 | Replace root page with landing (remove redirect) | 2026-02-26 | plan:marketing-landing-page |
| MKT-12 | Add scroll animations and performance optimization (Lighthouse >90) | 2026-02-26 | plan:marketing-landing-page |
