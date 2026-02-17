# Akount - Task List

**Last Updated:** 2026-02-17
**Current Phase:** Phase 6 — Launch MVP

---

## Today's Focus (2026-02-17)

**Primary Goal:** Continue Phase 6 — resolve review findings, commit uncommitted work

**Completed Today:**
- [x] Phase 5 review resolution: All 5 P0, 13/13 P1 issues fixed (2fa29d7, d6e3523)
- [x] Merged `feature/phase5-reports` to main (c12657b)
- [x] Merged `fix/cash-flow-p1-issues` to main (65324f6)
- [x] Quick wins batch: FIN-1, FIN-3, SEC-4, SEC-5, SEC-6, DRY-4, UX-5 (4e4d049)
- [x] Security batch: SEC-1, SEC-2, SEC-3, SEC-7 (5e18109)
- [x] Financial batch: FIN-2, FIN-4, FIN-5 (6ad5626)

**Remaining:**
1. [ ] Review and commit dashboard redesign (NetWorthHero, RecentTransactions, 7-stat left rail)
2. [ ] Review and commit onboarding personal-first redesign (3 new steps, conditional flow)
3. [ ] Continue Phase 6 work (pick from remaining task list below)

---

## Phase 6: Launch MVP

### Track 1: Security Hardening

| ID | Task | Effort | Source | Priority |
|----|------|--------|--------|----------|
| ~~SEC-1~~ | ~~RBAC middleware: Wire `requirePermission()` to canonical `PERMISSION_MATRIX`~~ | ~~1 hr~~ | ~~Review P1-11~~ | ✅ 5e18109 |
| ~~SEC-2~~ | ~~`tenantScopedQuery` string check bypassable — strengthen runtime assertion~~ | ~~30 min~~ | ~~Review P2-14~~ | ✅ 5e18109 |
| ~~SEC-3~~ | ~~Data export: mask bank account numbers (show last 4 only)~~ | ~~15 min~~ | ~~Review P2-15~~ | ✅ 5e18109 |
| ~~SEC-4~~ | ~~Error handler: stop exposing `details` object to client~~ | ~~15 min~~ | ~~Review P2-16~~ | ✅ 4e4d049 |
| ~~SEC-5~~ | ~~`sanitizeFilename`: guard against empty string result~~ | ~~5 min~~ | ~~Review P2-17~~ | ✅ 4e4d049 |
| ~~SEC-6~~ | ~~Cache TTL env var: validate against NaN (prevents permanent cache)~~ | ~~10 min~~ | ~~Review P2-18~~ | ✅ 4e4d049 |
| ~~SEC-7~~ | ~~PDF timeout timer: clean up unhandled rejection~~ | ~~15 min~~ | ~~Review P2-9~~ | ✅ 5e18109 |
| SEC-8 | Complete security audit (OWASP top 10, auth, tenant isolation, input validation) | 4 hr | Roadmap | High |
| SEC-9 | CSRF protection review | 1 hr | Roadmap | High |
| SEC-10 | Row-Level Security (PostgreSQL) for production hardening | 3 hr | Roadmap | Medium |

### Track 2: Performance Optimization

| ID | Task | Effort | Source | Priority |
|----|------|--------|--------|----------|
| PERF-1 | Balance Sheet: combine 2 redundant heavy SQL queries into 1 | 2 hr | Review P2-1 | High |
| PERF-2 | Revenue: add JSONB expression index for extraction | 30 min | Review P2-19 | Medium |
| PERF-3 | Recharts: code-split import (lazy load) | 30 min | Review P2-24 | Medium |
| PERF-4 | PDF generation: move to worker thread (unblock event loop) | 2 hr | Review P2-20 | Low |
| PERF-5 | Database indexes on hot paths (dashboard, reports) | 2 hr | Roadmap | High |
| PERF-6 | Query optimization audit (dashboard + report queries) | 2 hr | Roadmap | High |
| PERF-7 | Lazy-loading heavy frontend components | 1 hr | Roadmap | Medium |
| PERF-8 | p95 < 2s page load target verification + load testing | 2 hr | Roadmap | High |

### Track 3: Financial Correctness

| ID | Task | Effort | Source | Priority |
|----|------|--------|--------|----------|
| ~~FIN-1~~ | ~~Balance Sheet: enforce strict balance (remove 1-cent tolerance)~~ | ~~15 min~~ | ~~Review P2-2~~ | ✅ 4e4d049 |
| ~~FIN-2~~ | ~~Cash Flow: add reconciliation check (opening + net = closing)~~ | ~~30 min~~ | ~~Review P2-3~~ | ✅ 6ad5626 |
| ~~FIN-3~~ | ~~GL Ledger: order window function by date, not CUID~~ | ~~15 min~~ | ~~Review P2-4~~ | ✅ 4e4d049 |
| ~~FIN-4~~ | ~~Spending/Revenue: add currency validation for multi-entity~~ | ~~15 min~~ | ~~Review P2-5~~ | ✅ 6ad5626 |
| ~~FIN-5~~ | ~~Data export: apply `includeSoftDeleted` flag~~ | ~~15 min~~ | ~~Review P2-6~~ | ✅ 6ad5626 |
| FIN-6 | Cash Flow: document hardcoded account code ranges for categorization | Doc only | Review P2-8 | Low |

### Track 4: Code Quality & DRY

| ID | Task | Effort | Source | Priority |
|----|------|--------|--------|----------|
| DRY-1 | Report types: move shared types to `packages/types` (eliminate API/frontend duplication) | 1 hr | Review P2-7 | High |
| DRY-2 | CSV sanitization: deduplicate between `report-export` and `data-export` services | 30 min | Review P2-10 | Medium |
| DRY-3 | Report routes: extract shared 40-line handler pattern into helper | 1 hr | Review P2-12 | Medium |
| ~~DRY-4~~ | ~~`sanitizeCsvCell`: accept `null` in type signature~~ | ~~5 min~~ | ~~Review P2-13~~ | ✅ 4e4d049 |
| DRY-5 | `window.Clerk` triple-cast in `downloadReport`: clean up type assertion | 30 min | Review P2-11 | Low |

### Track 5: Frontend UX Polish

| ID | Task | Effort | Source | Priority |
|----|------|--------|--------|----------|
| UX-1 | Entity selector: replace hardcoded dropdown with real entity options | 1-2 hr | Review P2-22 | High |
| UX-2 | GL Account ID: replace raw CUID input with searchable dropdown | 1 hr | Review P2-23 | High |
| UX-3 | Report tables: add `aria-*` attributes, `caption`, `scope`, `role="progressbar"` | 45 min | Review P1-17 | Medium |
| UX-4 | Report views: replace array index React keys with stable identifiers | 15 min | Review P2-21 | Medium |
| ~~UX-5~~ | ~~Spending view: remove duplicate CHART_COLORS entry~~ | ~~2 min~~ | ~~Review P2-25~~ | ✅ 4e4d049 |
| UX-6 | Keyboard shortcuts for power users (command palette, table nav) | 2 hr | Roadmap | Medium |
| UX-7 | Help overlay documenting keyboard shortcuts | 1 hr | Roadmap | Medium |

### Track 6: Test Coverage

| ID | Task | Effort | Source | Priority |
|----|------|--------|--------|----------|
| TEST-1 | Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests | 3-4 hr | Review P2-26 | High |
| TEST-2 | E2E tests for critical user flows (onboarding, import, posting, reports) | 4 hr | Roadmap | High |
| TEST-3 | 80%+ API test coverage target | 2 hr | Roadmap | High |

### Track 7: Infrastructure & DevOps

| ID | Task | Effort | Source | Priority |
|----|------|--------|--------|----------|
| INFRA-1 | CI/CD pipeline (GitHub Actions) | 3 hr | Roadmap | High |
| INFRA-2 | Production environment setup | 2 hr | Roadmap | High |
| INFRA-3 | Database backups (automated daily) | 1 hr | Roadmap | High |
| INFRA-4 | Disaster recovery procedure + documentation | 2 hr | Roadmap | Medium |
| INFRA-5 | Monitoring (Sentry error tracking, Vercel Analytics, uptime alerts) | 2 hr | Roadmap | High |
| INFRA-6 | Deployment documentation | 1 hr | Roadmap | Medium |

---

## Uncommitted Work (needs review + commit)

**Dashboard Redesign (14 modified + 4 new files):**
- [ ] NetWorthHero component (replaces LiquidityHero)
- [ ] RecentTransactions component
- [ ] DashboardLeftRail with 7 stats (scrollable)
- [ ] Enhanced EntitiesList (country, currency display)
- [ ] Overview page layout update

**Onboarding Personal-First Redesign (6 modified + 3 new files):**
- [ ] EmploymentStep (7 employment options, auto-advance)
- [ ] BusinessSetupStep (conditional Yes/No + business form)
- [ ] AddressStep (IP country detection, auto-currency)
- [ ] OnboardingWizard (5-6 step conditional flow)
- [ ] onboardingStore (new types, dynamic getTotalSteps)
- [ ] CompletionStep (calls /initialize + /complete)
- [ ] WelcomeStep + IntentStep copy updates
- [ ] Backend onboarding route (accepts intents, employmentStatus, address)

**Other uncommitted:**
- [ ] console.error -> swallowed catch in document-posting.service.ts (3 instances)
- [ ] dialog.tsx UI component

---

## Suggested Work Order

~~**Quick wins first (< 30 min each, high impact):**~~
~~1. FIN-1, FIN-3, FIN-4, SEC-5, SEC-6, DRY-4, UX-5 (~1.5 hr total)~~ ✅ Done (4e4d049)

~~**Security batch:**~~
~~2. SEC-1 through SEC-7 (~3 hr)~~ ✅ Done (5e18109)

~~**Financial correctness batch:**~~
~~3. FIN-2, FIN-5 (~45 min)~~ ✅ Done (6ad5626)

**Performance batch:**
4. PERF-1, PERF-2, PERF-3 (~3 hr)

**DRY / architecture batch:**
5. DRY-1, DRY-2, DRY-3 (~2.5 hr)

**Frontend UX batch:**
6. UX-1 through UX-5 (~5 hr)

**Tests:**
7. TEST-1 through TEST-3 (~9 hr)

**Infrastructure:**
8. INFRA-1 through INFRA-6 (~11 hr)

**Larger items (schedule separately):**
9. SEC-8 (full security audit), SEC-10 (RLS), PERF-8 (load testing)

---

## Completed Work

### Phase 5 Review Resolution (2026-02-17)
- [x] P0-1: Data export tenant isolation (2fa29d7)
- [x] P0-2: GL Ledger opening balance (2fa29d7)
- [x] P0-3: GL "Load More" Server Action (2fa29d7)
- [x] P0-4: Split reports.ts server/client/shared (2fa29d7)
- [x] P0-5: CSV injection defense (2fa29d7)
- [x] P1-6: Cash Flow sign convention (d6e3523)
- [x] P1-7: Spending aggregation fix (2fa29d7)
- [x] P1-8: Revenue aggregation fix (2fa29d7)
- [x] P1-9: Frontend types alignment (2fa29d7, d6e3523)
- [x] P1-10: Format param Zod validation (2fa29d7)
- [x] P1-12: Cache all 7 reports (2fa29d7)
- [x] P1-13: Cache invalidation in journal-entry service (2fa29d7)
- [x] P1-14: Hardcoded CAD currency fix (2fa29d7)
- [x] P1-15: GLLedgerReport currency field (2fa29d7)
- [x] P1-16: validateMultiEntityCurrency tenantId (2fa29d7)
- [x] P1-18: Empty entity array guard (2fa29d7)

### Phase 5: Understand Your Money — COMPLETE
- [x] Sprint 0: Infrastructure (tenantScopedQuery, indexes, RBAC, hooks)
- [x] Sprint 1: Core Reports Backend (P&L, BS, CF + tests)
- [x] Sprint 2: Supporting Reports + Cache (TB, GL, Spending, Revenue)
- [x] Sprint 3-4: Frontend Report Pages (7 pages)
- [x] Sprint 5: Export (PDF + CSV)
- [x] Sprint 6: Charts + Data Backup

### Phase 4: Bill & Get Paid — COMPLETE
- [x] Sprint 1-6 backend + frontend (2026-02-15)
- [x] Payment allocation GL posting route (8bd9d2e)
- [x] Category Engine (CRUD, auto-categorization, dedup)

### Code Audit — COMPLETE (2026-02-16)
- [x] Deleted 4,308 lines dead code, type safety fixes, module splits, archived 21 plans

### Test Coverage — COMPLETE (2026-02-16)
- [x] 100% service coverage (27/27), 1010 tests total

---

## Phase Progress

| Phase | Backend | Frontend | Status |
|-------|---------|----------|--------|
| Foundation | COMPLETE | COMPLETE | COMPLETE |
| 1: See Your Money | COMPLETE (62 tests) | COMPLETE | COMPLETE |
| 2: Track Your Money | COMPLETE (117 tests) | COMPLETE | COMPLETE |
| Onboarding Redesign | COMPLETE | COMPLETE (55 tests) | COMPLETE |
| 3: Post Your Money | COMPLETE (33 posting tests) | COMPLETE | COMPLETE |
| 4: Bill & Get Paid | COMPLETE (21 category + sprints) | COMPLETE | COMPLETE |
| 5: Understand Your Money | COMPLETE (18 report + 249 service) | COMPLETE (7 pages) | COMPLETE |
| 6: Launch MVP | IN PROGRESS | IN PROGRESS | ~15% |

**Total Backend Tests:** 1010 (verified 2026-02-17, all passing)

---

**Next Update:** After next work session
