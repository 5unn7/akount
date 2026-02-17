# Akount - Task List

**Last Updated:** 2026-02-16
**Current Phase:** Phase 5 COMPLETE | Phase 6 Next

---

## Tomorrow's Focus (2026-02-17)

**Primary Goal:** Commit uncommitted work (dashboard + onboarding redesign), begin Phase 6 planning

**Tasks:**
1. [ ] Review and commit dashboard redesign (NetWorthHero, RecentTransactions, 7-stat left rail)
2. [ ] Review and commit onboarding personal-first redesign (3 new steps, conditional flow)
3. [ ] Clean up .reviews/ directory (keep or archive)
4. [ ] Plan Phase 6 (Launch MVP) — security audit, performance, CI/CD

**Context:** All core features (Phases 1-5) are complete. Uncommitted changes are dashboard UX + onboarding UX redesigns. Phase 6 is the final MVP phase.

---

## Active Work

### Uncommitted Changes (needs review + commit)

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
- [ ] console.error → swallowed catch in document-posting.service.ts (3 instances)
- [ ] dialog.tsx UI component

---

### Phase 5: Understand Your Money — COMPLETE

**Sprint 0: Infrastructure**
- [x] tenantScopedQuery wrapper for secure raw SQL (117c040)
- [x] Composite indexes for report performance (76bdd3a)
- [x] RBAC accounting:reports permission key (ae9b18c)
- [x] Block $queryRawUnsafe hook (d8d5456)

**Sprint 1: Core Reports (Backend)**
- [x] P&L report service + tests (dedec5e)
- [x] Balance Sheet report service + tests (17d832f)
- [x] Cash Flow Statement report service + tests (1077076)
- [x] Report service foundation with helpers (c775dc2)
- [x] Zod schemas for reports (c0e8efc)
- [x] Report routes with rate limiting (21ccb5b)
- [x] Comprehensive report service tests + fixes (2d82d25)

**Sprint 2: Supporting Reports + Cache**
- [x] Trial Balance + GL Ledger reports (54f345f)
- [x] Spending + Revenue management reports (e4eac68)
- [x] In-memory report cache with bounded growth (0344955)
- [x] Supporting report routes (c9c1034)

**Sprint 3-4: Frontend Report Pages**
- [x] Reports Home, P&L, Balance Sheet pages (bf572a2)
- [x] Cash Flow, Trial Balance, GL Ledger, Spending, Revenue pages (e429674)

**Sprint 5: Export**
- [x] PDF + CSV export with download buttons (4962165)

**Sprint 6: Charts + Data Backup**
- [x] Data backup service (streaming ZIP, 12 tables, cursor-paginated)
- [x] P&L trend bar chart, BS composition chart, Spending donut chart
- [x] Settings data export card (26d7a8b)

### Phase 4: Bill & Get Paid — COMPLETE

- [x] Sprint 1-6 backend + frontend (2026-02-15)
- [x] Payment allocation GL posting route (8bd9d2e)
- [x] E2E verified: invoice → payment → GL posting
- [x] Category Engine (CRUD, auto-categorization, dedup)
- [x] All forms wired to API clients

### Code Audit — COMPLETE (2026-02-16)

- [x] P0: Deleted 4,308 lines of dead code (0925fb8)
- [x] P1: Type safety fixes (0925fb8)
- [x] P2: Backend module split — parser.service.ts → 3 modules (fb900d5)
- [x] P2: Frontend splits — 3 oversized components (fb900d5)
- [x] P3: Archived 21 completed plans (fb900d5)

### Test Coverage — COMPLETE (2026-02-16)

- [x] Sprint 1: EntityService, CategoryService, CategorizationService (89 tests, already existed)
- [x] Sprint 2: DuplicationService (30), UserService (13) — c2b4b3b, ba6b2d7
- [x] Sprint 3: ParserShared (42), AIService (17), AuditQueryService (27), HealthService (10) — 4219894, 1b42fab, 4714e52, 15b6181
- [x] Sprint 4: Enhancement tests (6) — 515885c
- [x] Service coverage: 100% (27/27 services)

---

## Completed Work (Prior Phases)

### Phase 3: Post Your Money (COMPLETE — 2026-02-15)
- [x] COA API (7 endpoints), Journal Entry API (12 endpoints), PostingService
- [x] Frontend: tree view, JE form, posting UI, API client + server actions

### Phase 2: Track Your Money (COMPLETE — 2026-02-12)
- [x] Transaction CRUD, CSV/PDF import, reconciliation (117 tests)
- [x] Frontend: upload, column mapping, reconciliation, import history

### Phase 1: See Your Money (COMPLETE — 2026-02-09)
- [x] Dashboard, account management, multi-currency (62 tests)

### Foundation (COMPLETE — 2026-02-01)
- [x] Auth, DB, API, design system, monorepo

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

**Total Backend Tests:** 1009 (verified 2026-02-16, all passing)

---

## Notes

**Task Naming Convention:**
- FE-X.Y: Frontend task in Phase X
- BE-X.Y: Backend task in Phase X
- OB-Y: Onboarding redesign (cross-cutting)

**Next Phase:** Phase 6 (Launch MVP) — security, performance, CI/CD, monitoring

---

**Next Update:** 2026-02-17
