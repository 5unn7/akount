# Akount - Development Roadmap

**Version:** 2.0
**Last Updated:** 2026-02-15
**Current Phase:** Phase 4 IN PROGRESS (~80%) — Bill & Get Paid

---

## Overview

Akount is an AI-powered financial command center for globally-operating solopreneurs.

This roadmap defines the path from current state to a shippable MVP and beyond. Phases are ordered by **user value** — each phase gives users a new capability they can immediately use.

**Principles:**

- Complete one phase before starting the next
- Each phase results in working, testable functionality
- Build vertical slices (API + DB + UI together)
- Ship MVP before perfecting — post-launch phases add depth

---

## Progress Summary

| Phase | Name | Status | Tests |
|-------|------|--------|-------|
| Foundation | Infrastructure | COMPLETE | 362 total |
| 1 | See Your Money | COMPLETE | 62 |
| 2 | Track Your Money | COMPLETE | 117 |
| 3 | Post Your Money | COMPLETE | 33 posting + COA/JE |
| 4 | Bill & Get Paid | IN PROGRESS (~80%) | 21 category + Sprint 1-6 |
| 5 | Understand Your Money | Not started | — |
| 6 | Launch MVP | Not started | — |
| Post-Launch | Plan & Automate | Not started | — |

**MVP = Phases 1-6.** Post-launch phases add planning, budgeting, and AI features.

---

## Foundation (COMPLETE)

**Goal:** Authentication, database, API foundation, and design system.

**Completed:** 2026-02-01

**What was built:**

- Clerk authentication (passkeys/WebAuthn)
- PostgreSQL + Prisma (38 models, 26 enums)
- Fastify API with middleware chain (Auth → Tenant → Validation)
- Design system in Figma (76 variables, 41+ components, glass morphism)
- shadcn/ui + shadcn-glass-ui integration, Tailwind v4
- Turborepo monorepo structure
- AI categorization foundation (Perplexity integration)
- Bank statement import foundation (PDF parsing)
- Performance optimization (50x query reduction)

---

## Phase 1: See Your Money (COMPLETE)

**Goal:** Users can view all accounts, see net worth, and manage their financial overview.

**Completed:** 2026-02-09 | **Effort:** ~35 hours

**What was delivered:**

- Dashboard with real-time metrics (net worth, cash position, total assets/liabilities)
- Account list page with cursor pagination + type filtering
- Account CRUD (create, edit, soft-delete via Sheet panel)
- Account detail page with transaction history and running balance
- Entity filter dropdown for multi-entity support
- Currency toggle (base currency vs USD)
- FX rate service with caching
- 62 backend tests (services + routes)
- Loading states, error boundaries, SEO metadata

**Endpoints:** 10 (GET/POST/PATCH/DELETE accounts, dashboard metrics, FX rates)

---

## Phase 2: Track Your Money (COMPLETE)

**Goal:** Users can import bank transactions, view transaction history, and reconcile against their records.

**Completed:** 2026-02-12 | **Effort:** ~70 hours

**What was delivered:**

### Backend (COMPLETE — 117 tests)

| Sprint | What | Tests | Commit |
|--------|------|-------|--------|
| Sprint 1 | Transaction CRUD (GET/POST/PATCH/DELETE, filtering, pagination) | 55 | ff37830 |
| Sprint 2 | CSV/PDF import (parsing, column mapping, deduplication) | 19 | 376a030 |
| Sprint 3 | Reconciliation (matching algorithm, match/unmatch, status) | 43 | a1e3340 |

**Services:** TransactionService, ImportService, ParserService, DuplicationService, ReconciliationService

### Frontend (COMPLETE)

- CSV/PDF upload component with drag-and-drop and validation
- Column mapping interface for CSV imports
- Import history page (list batches, status, errors)
- Transaction matching UI (suggestions table, match/unmatch buttons, confidence scores)
- Reconciliation status display (matched/unmatched counts, filters)
- Transaction list improvements (bulk actions, category badges)

### Onboarding Redesign (COMPLETE)

- 2-step wizard (Welcome + Essential Info) — 60 seconds to dashboard
- Dashboard hero card with circular progress (tracks 5 completion steps)
- Sidebar progress indicator (color-coded bar)
- OnboardingProgress API routes and database model
- 55 frontend tests across 7 files

### Phase 2 Exit Criteria

- [x] CSV/PDF import works end-to-end in UI
- [x] Users can match transactions manually via UI
- [x] Auto-match suggestions displayed with confidence scores
- [x] Reconciliation status visible on accounts page
- [x] Onboarding wizard completes in < 90 seconds
- [x] Dashboard hero card shows onboarding progress
- [x] All backend tests pass (117+), frontend tests added

---

## Phase 3: Post Your Money (COMPLETE)

**Goal:** Users can manage their chart of accounts, post transactions with proper double-entry bookkeeping, and maintain a general ledger.

**Completed:** 2026-02-15 | **Effort:** ~45 hours

**Success Criteria:**

- [x] Chart of accounts with hierarchy (tree view)
- [x] Manual transaction posting with double-entry validation
- [x] Journal entries auto-created from transactions
- [x] Multi-currency transaction support
- [x] Split transaction support
- [x] Transaction list with GL posting status

**What was delivered:**

### Backend (COMPLETE — 33 posting tests + COA/JE endpoints)

- Chart of Accounts API: CRUD, hierarchy, balances, default COA seeding (7 endpoints)
- Transaction Posting Service: serializable isolation, multi-currency FX, split transactions (852 lines)
- Journal Entry API: CRUD, approve, void, post transaction, bulk post (12 endpoints)
- Multi-currency posting: FX rate lookup, nearest-date fallback, manual rate override
- Split transaction support: largest-remainder rounding, 2-way/3-way/N-way splits
- 33 posting tests (11 basic + 7 multi-currency + 5 bulk + 10 split)

### Frontend (COMPLETE)

- Chart of Accounts page (tree view, CRUD Sheet, type filter, seed button, account balances)
- Journal Entry form (dynamic lines, GL account dropdowns, live balance indicator)
- Journal entries list (expandable rows, approve/void/delete, status badges, cursor pagination)
- Transaction posting UI (PostingStatusBadge, GL account Sheet, single + bulk posting)
- API client (accounting.ts, 12 functions) + server actions (COA: 6, JE: 4)

---

## Phase 4: Bill & Get Paid

**Goal:** Users can create invoices for clients, track bills from vendors, and record payments with proper allocation.

**Success Criteria:**

- Client and vendor management (CRUD)
- Invoice creation with line items and tax
- Invoice sending via email + PDF generation
- Bill tracking with payment status
- Payment recording with allocation to invoices/bills
- Partial payment support
- AR/AP aging reports

**Scope:**

### Backend

- Client/Vendor APIs (CRUD, tenant-scoped)
- Invoice API (create, update, send, status tracking, line items, tax calculation)
- Bill API (create, update, status tracking)
- Payment API (record, allocate to invoices/bills, partial payments)
- Journal entry auto-generation from invoices/bills/payments

### Frontend

- Client/Vendor list and detail pages
- Invoice form (line items, tax, preview)
- Invoice list with status filters (Draft, Sent, Paid, Overdue)
- Bill form and list
- Payment recording interface
- AR/AP aging report views

**Dependencies:** Phase 3 complete (journal entries needed for payment posting)
**Estimated Effort:** 40-50 hours
**Feature Specs:** [docs/design-system/03-screens/invoicing.md](docs/design-system/03-screens/invoicing.md)

---

## Phase 5: Understand Your Money

**Goal:** Users can generate the three core financial statements and export their data.

**Success Criteria:**

- Profit & Loss statement (by entity, by date range, period comparison)
- Balance Sheet (as of date, entity filtering)
- Cash Flow statement (operating/investing/financing activities)
- Reports exportable to PDF and CSV
- Full data export (JSON/CSV/ZIP) for data portability

**Scope:**

### Backend

- P&L calculation service (revenue - expenses by GL account hierarchy)
- Balance Sheet calculation service (assets = liabilities + equity)
- Cash Flow calculation service (categorized by activity type)
- Report API with date range, entity, and period comparison support
- Report caching (Redis or in-memory)
- Data export service (full JSON/CSV backup with ZIP packaging)

### Frontend

- P&L view with drill-down
- Balance Sheet view
- Cash Flow view
- Date range picker + entity filter + comparison toggle
- Export buttons (PDF/CSV per report)
- Data export page in settings (full backup download)
- Charts/visualizations (Recharts)

**Dependencies:** Phase 3 complete (GL data needed for reports)
**Estimated Effort:** 45-55 hours
**Feature Specs:** [docs/design-system/03-screens/reports.md](docs/design-system/03-screens/reports.md)

---

## Phase 6: Launch MVP

**Goal:** Production-ready application — secure, performant, tested, and deployable.

**Success Criteria:**

- Security audit complete (OWASP top 10 addressed)
- Performance targets met (p95 < 2s page load)
- 80%+ test coverage across API
- E2E tests for all critical user flows
- CI/CD pipeline operational
- Database backup and recovery tested
- Monitoring and alerting in place (Sentry, Vercel Analytics)
- Keyboard shortcuts for power users
- User documentation (getting started guide)

**Scope:**

### Security

- Complete security audit (auth, tenant isolation, input validation)
- Rate limiting per user
- CSRF protection
- Input sanitization review
- SQL injection / XSS testing

### Performance

- Database indexes on hot paths
- Query optimization for dashboard and reports
- Caching strategy (FX rates, reports, dashboard metrics)
- Pagination on all list endpoints
- Lazy-loading heavy frontend components

### Quality of Life

- Keyboard shortcuts (command palette, table navigation, quick actions)
- Help overlay documenting shortcuts
- Data export accessible from settings

### Infrastructure

- CI/CD pipeline (GitHub Actions)
- Production environment setup
- Database backups (automated daily)
- Disaster recovery procedure
- Monitoring (Sentry error tracking, Vercel Analytics, uptime alerts)
- Deployment documentation

**Dependencies:** Phases 3-5 complete (all core features built)
**Estimated Effort:** 40-50 hours

---

## Post-Launch: Plan Your Money

**Goal:** Users can create budgets, set financial goals, forecast cash flow, and automate recurring transactions.

**Not required for MVP.** These features add depth after users have the core accounting workflow.

**Scope:**

- Budget creation by category with variance tracking
- Financial goals with progress visualization
- Cash flow forecasting (7/30/90 day projections, confidence levels, low balance warnings)
- Recurring transactions (daily/weekly/monthly/yearly, skip/pause, background generation)
- Goal vs. actual reporting

**Estimated Effort:** 35-45 hours
**Feature Specs:** [docs/design-system/03-screens/budgets-goals.md](docs/design-system/03-screens/budgets-goals.md)

---

## Post-Launch: Automate Your Money

**Goal:** AI-powered transaction categorization, financial insights, and automated rules.

**Not required for MVP.** AI features enhance the experience after core data is flowing.

**Scope:**

- AI transaction categorization with confidence scores
- User feedback loop (correct/incorrect → learning)
- Categorization rules engine (create rules from patterns)
- Financial insights feed (spending patterns, anomaly detection)
- AI-powered cash flow predictions
- Smart recommendations

**Estimated Effort:** 30-40 hours

---

## Timeline Summary

| Phase | Effort (Hours) | Status |
|-------|---------------|--------|
| Foundation | ~30 | COMPLETE |
| 1: See Your Money | ~35 | COMPLETE |
| 2: Track Your Money | ~70 | COMPLETE |
| 3: Post Your Money | ~45 | COMPLETE |
| 4: Bill & Get Paid | 40-50 | IN PROGRESS (~80%) |
| 5: Understand Your Money | 45-55 | Not started |
| 6: Launch MVP | 40-50 | Not started |
| **MVP Total** | **300-340** | **~70% complete** |
| Post-Launch: Plan | 35-45 | Post-launch |
| Post-Launch: Automate | 30-40 | Post-launch |
| **Full Product** | **365-425** | |

---

## Cross-Cutting Concerns

These are tracked but not phase-gated — they happen alongside phase work:

| Concern | When | Status |
|---------|------|--------|
| Onboarding redesign | Phase 2 | COMPLETE |
| RBAC role expansion (4 → 6 roles) | Phase 4 (needs multi-user) | Schema designed |
| FX rate historical lookup (nearest-date) | Phase 3 (multi-currency posting) | COMPLETE (PostingService) |
| Row-Level Security (PostgreSQL) | Phase 6 (production hardening) | Not started |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Double-entry bookkeeping bugs (Phase 3) | Validation function + database constraint + comprehensive tests |
| Scope creep before MVP | Phases clearly defined — post-launch features are post-launch |
| Performance with large datasets | Pagination from day 1, indexes in Phase 6, load testing |
| Security vulnerabilities | Audit in Phase 6, but secure-by-default patterns throughout |
| Schema migrations breaking production | Test migrations in staging, have rollback plan |

---

## Monthly Cost Estimate

| Stage | Cost |
|-------|------|
| Development (free tiers) | $0-10/mo |
| MVP with 10 users | $50-100/mo |
| Growth with 100 users | $150-300/mo |

---

**Last Updated:** 2026-02-15
**Next Review:** 2026-02-22
