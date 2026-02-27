# Active Work Tracker

**Last Updated:** 2026-02-27 00:10

---

## Current Sessions

| Agent ID | Started | Task | Status | Branch |
|----------|---------|------|--------|--------|
| agent-fin32-migration | 2026-02-27 00:10 | FIN-32: Migrate TaxRate.rate from Float to Int (basis points: 500 = 5%) | in_progress | main |
| agent-sec40-csrf | 2026-02-26 22:45 | SEC-40: Implement CSRF protection for state-changing endpoints | completed | main |
| agent-widgets-c24 | 2026-02-24 15:51 | DEV-179: Overview Widgets — Add client-side API functions for P&L, Trial Balance, and Revenue reports | completed | main |
| agent-flinks-244 | 2026-02-24 15:48 | INFRA-59: Flinks API production readiness — verify env vars, test demo mode, create deployment checklist | completed | main |
| agent-e2e-tests | 2026-02-23 15:30 | TEST-2: E2E tests for critical user flows (onboarding, import, posting, reports) | in_progress | main |
| agent-ux-search-filter | 2026-02-23 10:30 | UX-31, UX-32: Search/filter + pagination on business list pages | completed | main |
| agent-dry9-currency-641 | 2026-02-23 10:15 | DRY-9: Remove formatCurrency duplicates — consolidate 5+ inline implementations to @/lib/utils/currency | completed | main |
| agent-dry11-badges | 2026-02-22 17:00 | DRY-11: Consolidate StatusBadge components to packages/ui (6 components, 22 files) | completed | main |
| agent-atomic-batch | 2026-02-22 13:00 | 12 atomic tasks (DEV-84, PERF-2/3, FIN-14, DRY-2/7, DS-4, UX-77, DEV-114, DOC-2/7, UX-54) | completed | main |
| agent-banking-gl | 2026-02-22 12:30 | UX-15, DEV-59: GL account linking UI + Transaction posting UI (already implemented) | completed | main |
| agent-ai-chat | 2026-02-22 10:15 | DEV-113: Build AI Chat interface on Insights page | completed | main |
| agent-routing-fix | 2026-02-22 10:05 | UX-78: Fix /insights/insights → /insights routing | completed | main |
| agent-ux-693 | 2026-02-22 09:54 | UX-8: Add loading/error states to remaining dashboard pages | completed | main |
| agent-ai-client | 2026-02-22 09:47 | DEV-112: Create AI API client for 5 endpoints | completed | main |
| agent-client-detail | 2026-02-21 18:52 | DEV-122, DEV-75: Client detail + Bills page | completed | main |
| agent-banking-ui | 2026-02-20 20:15 | DEV-43, DEV-44, DEV-45: Banking transaction form, XLSX import, batch detail | completed | main |
| agent-infra-perf | 2026-02-20 12:54 | INFRA-14, PERF-8: Auth timeout + load testing | completed | main |
| agent-sec23-logging | 2026-02-20 11:47 | SEC-23: Replace console.log with structured logging in webhook | completed | main |
| opus-sec-batch | 2026-02-19 18:45 | SEC-8, SEC-11, SEC-13, INFRA-9, INFRA-10 | expired | main |
| agent-audit-arch | 2026-02-20 17:05 | ARCH-2, ARCH-6: Audit logging improvements | completed | main |
| agent-perf-indexes | 2026-02-20 17:30 | PERF-18, PERF-19, PERF-20: Critical DB indexes (launch blockers) | completed | main |

---

## Task Allocation

| Task ID | Type | Reserved By | Reserved Until |
|---------|------|-------------|----------------|
| FIN-32 | financial | agent-fin32-migration | 2026-02-27 04:10 |
| ~~SEC-40~~ | ~~security~~ | ~~agent-sec40-csrf~~ | ~~completed 185f3bd~~ |
| ~~DEV-179~~ | ~~development~~ | ~~agent-widgets-c24~~ | ~~completed b6b09b1~~ |
| ~~INFRA-59~~ | ~~infrastructure~~ | ~~agent-flinks-244~~ | ~~completed (docs only)~~ |
| ~~DRY-9~~ | ~~code-quality~~ | ~~agent-dry9-currency-641~~ | ~~completed 3860bf0~~ |
| ~~DRY-11~~ | ~~code-quality~~ | ~~agent-dry11-badges~~ | ~~completed 7640e1f~~ |
| DRY-12 | code-quality | agent-dry12-empty | 2026-02-22 20:30 |

---

## Agent Context (for smart defaults)

| Agent ID | Last Claimed Tasks | Last Domain | Last Session |
|----------|-------------------|-------------|--------------|
| agent-fin32-migration | FIN-32 | financial | 2026-02-27 00:10 |
| agent-sec40-csrf | SEC-40 | security | 2026-02-26 22:45 |
| agent-widgets-c24 | DEV-179 | overview/dashboard | 2026-02-24 15:51 |
| agent-flinks-244 | INFRA-59 | infrastructure | 2026-02-24 15:48 |
| agent-dry9-currency-641 | DRY-9 | code-quality | 2026-02-23 10:15 |
| agent-dry11-badges | DRY-11 | code-quality | 2026-02-22 19:00 |
| agent-dry12-empty | DRY-12 | code-quality | 2026-02-22 18:30 |
| agent-atomic-batch | DEV-84, PERF-2/3, DRY-2/7, UX-54/77, DEV-114 | multi-domain | 2026-02-22 14:00 |
| agent-banking-gl | UX-15, DEV-59 | banking/accounting | 2026-02-22 12:30 |
| agent-ai-chat | DEV-113 | insights | 2026-02-22 10:15 |
| agent-routing-fix | UX-78 | insights | 2026-02-22 10:05 |
| agent-ux-693 | UX-8 | ux | 2026-02-22 09:54 |
| agent-ai-client | DEV-112 | insights | 2026-02-22 09:47 |
| agent-ux-atomic | UX-27, UX-10, UX-80 | ux | 2026-02-21 18:57 |
| agent-client-detail | DEV-122, DEV-75 | business | 2026-02-21 18:52 |
| agent-infra-perf | INFRA-14, PERF-8 | infrastructure/performance | 2026-02-20 12:54 |
| agent-sec23-logging | SEC-23 | security | 2026-02-20 11:47 |
| opus-sec-batch | SEC-8, SEC-11, SEC-13, INFRA-9, INFRA-10 | security/infra | 2026-02-19 18:45 |
| agent-audit-arch | ARCH-2, ARCH-6 | architecture | 2026-02-20 17:05 |
| agent-perf-indexes | PERF-18, PERF-19, PERF-20 | performance | 2026-02-20 17:30 |

**Purpose:**
- Tracks agent's task history (rolling 5-task window)
- Identifies preferred domains
- Enables "continue where you left off" feature in `/processes:claim`

**Auto-cleanup:**
- Prune entries older than 7 days
- Keep only last 5 tasks per agent

---

## Notes

- Sessions expire after 2 hours of inactivity
- This file is auto-updated by `/processes:claim` and `/processes:end-session`
- Task conflicts are detected automatically
- Agent context powers smart task recommendations
