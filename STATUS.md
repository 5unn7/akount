# Akount — Status Dashboard

**Auto-generated via `/processes:eod`** | **Last Updated:** 2026-02-23

## Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Backend Tests | 1304 passing (2 failed) | 1100+ | ⚠️ 2 test failures (invoice/bill stats entityId) |
| Test Files | 60 | — | — |
| Service Coverage | 36 services | 27+ | ✅ 133% |
| TypeScript Errors | 0 | 0 | ✅ Both apps/api and apps/web compile clean |
| NPM Vulnerabilities | 19 (minimatch dev-only + archiver transitive) | 0 | ⚠️ Accepted risk |
| Frontend Tests | 0 | 100+ | ❌ 0% |
| Loading States | 56/55 pages | 55/55 | ✅ 100% |
| Error States | 56/55 pages | 55/55 | ✅ 100% |
| Dashboard Pages | 55 | — | — |

## Task Summary (from TASKS.md)

| Domain | Total | Done | Active | Critical | High | Medium | Low |
|--------|-------|------|--------|----------|------|--------|-----|
| Dev | 216 | 132 | 84 | 0 | 16 | 104 | 23 |
| Design System | 2 | 0 | 2 | 0 | 1 | 1 | 0 |
| Marketing & Content | 13 | 10 | 3 | 0 | 1 | 2 | 0 |
| Operations | 9 | 0 | 9 | 0 | 7 | 2 | 0 |
| **TOTAL** | **240** | **142** | **98** | **0** | **25** | **109** | **25** |

> _Note: 43 Linear PM infrastructure tasks tracked separately in [LINEAR-TASKS.md](LINEAR-TASKS.md)_

## Phase 6 Progress

| Track | Total | Done | % | Trend |
|-------|-------|------|---|-------|
| Security | 21 | 14 | 67% | +SEC-24 created |
| Performance | 17 | 10 | 59% | — |
| Financial | 27 | 18 | 67% | ↑ from 59% (+5 done) |
| DRY/Quality | 10 | 7 | 70% | ↑ from 60% (+1 done) |
| UX | 69 | 38 | 55% | ↑ from 51% (+3 done) |
| Architecture | 8 | 4 | 50% | — |
| Dev Features | 121 | 27 | 22% | ↑ from 18% (+5 done) |
| Documentation | 8 | 2 | 25% | — |
| Design System | 6 | 3 | 50% | — |
| Test | 4 | 0 | 0% | — |
| Infrastructure | 57 | 19 | 33% | — |
| Marketing | 13 | 10 | 77% | NEW (landing page) |
| **Overall** | **361** | **152** | **42%** | ↑ from 38% (+24 done) |

## Completed Plans

| Plan | Tasks | Status |
|------|-------|--------|
| Banking Command Center | 28/28 (4 sprints) | ✅ COMPLETE |
| Entity Management Hub | 16/16 (3 sprints) | ✅ COMPLETE |
| New User Journey UX Overhaul | 34/34 (8 sprints) | ✅ COMPLETE |
| Command Center Dashboard Redesign | 15/15 (3 sprints) | ✅ COMPLETE |
| Onboarding Flow Overhaul | 6/6 sprints | ✅ COMPLETE |
| Banking Transfers (DEV-46) | 12/12 tasks | ✅ COMPLETE |
| Accounting Domain UX Overhaul | Phase 1-5 complete | ✅ COMPLETE |
| Marketing Landing Page | 10/10 sections | ✅ COMPLETE |

## Session Quality Insights (Feb 23)

| Metric | Value | Status |
|--------|-------|--------|
| Sessions completed | 12 | ✅ |
| Commits today | 44 | ✅ |
| Tests added | 1298 → 1306 (+8) | ✅ |
| TS errors resolved | 1 → 0 (-1) | ✅ |
| Invariant violations | 0 | ✅ |
| Pre-flight compliance | 92% (11/12) | ✅ |
| Context efficiency avg | A (10xA, 1xB, 1xB+) | ✅ |
| Loops detected | 2 minor (sizing guesses, agent monitoring) | ✅ |

### Feb 23 Summary (12 sessions, 44 commits)

**Financial Integrity (Critical):**
- FIN-25/27/28: Fixed 4 critical calculation bugs — subtotal validation, document-posting amounts, transfer base currency
- FIN-26 + UX-102: Wired tax rate dropdown to invoice/bill line items with auto-calculation
- Root cause: `line.amount` semantic mismatch (pre-tax vs post-tax) was pervasive across 4 backend services

**Business Domain CRUD:**
- DEV-71/72: Draft invoice/bill edit + cancel from list pages
- DEV-73/74: Vendor/client create+edit Sheet components (-239 lines net via extraction)
- UX-31/32: Search, filter, and pagination for all business list pages

**Onboarding (DEV-178):**
- Fixed 3 critical bugs: race condition (P2002), transaction timeout (P2028 5.3s→1s), idempotent user creation
- Converted 33 sequential DB creates to batch createMany (5x faster)

**Landing Page (MKT-3 through MKT-12):**
- Full marketing page: hero with 3D orb, problem statement, solution pillars, feature showcase, stats, CTA
- Client Component wrapper pattern for Next.js 16 SSR compatibility with WebGL

**Dashboard Polish:**
- UpcomingPayments: compact rows + client-side pagination
- RecentTransactions: compact rows + fade gradient + scrollbar-thin-glass CSS utility
- Entity cards: type-colored icon badges, glow effects, hover micro-interactions
- Height fixes: CashFlowChart + ExpenseChart + Entities sections aligned

**Layout & UX:**
- ContentPanel component + DomainTabs auto-detection centralized in root layout
- UX-19: Chart of Accounts search (first agent execution via /pm:execute)
- Entity hint messages when create buttons hidden
- First successful parallel agent execution (3 worktrees for FIN-25/27/28)

**TypeScript:** 1 remaining API error → 0 (asset.routes.test.ts fixed)

### Common Patterns (Today's Sessions)

**Strengths:**
- Perfect invariant compliance (12/12 sessions)
- High context efficiency (10/12 sessions graded A+/A)
- Deep financial diagnosis caught 4 critical bugs in one audit session
- Agent execution pipeline proven (single + parallel)

**Improvement Areas:**
- Ask size/layout preferences before implementing arbitrary pixel values
- Analyze all components before applying patterns (don't create wrappers for components that don't need them)
- Use TaskOutput with block:true from start for agent monitoring
- Start with console logs before reading code for diagnosis

### Bugs Fixed Today
- FIN-25: Subtotal validation subtracting tax from pre-tax amount (blocked all invoice/bill creation)
- FIN-27: Document-posting JE amounts under-credited Revenue / under-debited Expense
- FIN-28: Multi-currency transfer JE balance broken (exchange rate applied twice)
- DEV-178: Onboarding race condition (P2002), transaction timeout (P2028), non-idempotent user creation
- Next.js 16 build error: `ssr: false` not allowed in Server Components
- Entity hint hidden when no entity selected (silent UX failure)
- Scroll blur glitch: sticky + backdrop-blur on glass surfaces
- SEC-24 discovered: _count queries leak across tenants (created for follow-up)

### Patterns Discovered
- `line.amount` is always pre-tax (qty * unitPrice) — 4 backend services assumed otherwise
- Conservation of value for transfers — both JE sides use same baseCurrencyAmount
- Next.js 16: `ssr: false` requires Client Component wrapper + mounted state check for WebGL
- Browser-side `apiFetch` for client components, NOT server-side typed API functions
- Prisma transaction timeout: >20 sequential operations = batch with createMany + Promise.all
- Glass + sticky + backdrop-blur = visual artifacts (never combine)
- Parallel agent execution: worktree isolation prevents conflicts when files don't overlap

## Known Issues

| Issue | Status | Priority |
|-------|--------|----------|
| 2 test failures (invoice/bill stats entityId param) | Needs fix | High |
| SEC-24: _count queries don't filter by tenant | Created | High |
| NPM vulnerabilities (19 - dev-only) | Accepted risk | Low |
| Frontend tests (0) | Needs kickoff | Medium |

## Uncommitted Work

| Item | Files | Status |
|------|-------|--------|
| Business list search/filter/pagination | 5 modified (transactions, invoices, bills, API clients) | ⏳ needs commit |
| Landing page app | 1 new directory (apps/landing/) | ⏳ untracked |
| Figma plugins | 2 new directories | ⏳ untracked |
| Brand explorations | 1 new HTML file | ⏳ untracked |

## Next Session Recommendations

**High Priority:**
1. Fix 2 test failures (invoice/bill stats entityId parameter mismatch)
2. Commit remaining uncommitted business list changes
3. SEC-24: Fix _count tenant isolation in GL account service
4. Frontend tests kickoff (currently 0 — target 100+)

**Medium Priority:**
5. Business domain: DEV-76 (payment allocation), DEV-77 (edit/delete actions), DEV-78 (post to GL)
6. TEST-1 (remaining report service tests)
7. DRY-10 (formatDate consolidation)
8. Accounting: UX-18 (landing page stats), UX-20 (reactivate accounts)

**Infrastructure:**
9. INFRA-1 (CI/CD pipeline), INFRA-2 (production environment)
10. Planning domain: DEV-97 (goals), DEV-98 (budgets) — backlog

---

_For full roadmap see [ROADMAP.md](./ROADMAP.md). For task details see [TASKS.md](./TASKS.md)._
