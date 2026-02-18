# Akount — Task Board

**Last Updated:** 2026-02-17
**Current Phase:** Phase 6 — Launch MVP

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
| SEC-8 | Complete security audit (OWASP top 10, auth, tenant isolation, input validation) | 4h | High | ready | | roadmap |
| SEC-9 | CSRF protection review | 1h | High | ready | | roadmap |
| PERF-1 | Balance Sheet: combine 2 redundant heavy SQL queries into 1 | 2h | High | ready | | review:performance |
| PERF-5 | Database indexes on hot paths (dashboard, reports) | 2h | High | ready | | roadmap |
| PERF-6 | Query optimization audit (dashboard + report queries) | 2h | High | ready | | roadmap |
| PERF-8 | p95 < 2s page load target verification + load testing | 2h | High | ready | | roadmap |
| DRY-1 | Report types: move shared types to `packages/types` (eliminate duplication) | 1h | High | ready | | review:typescript |
| UX-1 | Entity selector: replace hardcoded dropdown with real entity options | 1-2h | High | ready | | review:nextjs |
| UX-2 | GL Account ID: replace raw CUID input with searchable dropdown | 1h | High | ready | | review:nextjs |
| TEST-1 | Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests | 3-4h | High | ready | | review:typescript |
| TEST-2 | E2E tests for critical user flows (onboarding, import, posting, reports) | 4h | High | ready | | roadmap |
| TEST-3 | 80%+ API test coverage target | 2h | High | ready | [needs: TEST-1] | roadmap |
| DEV-1 | Onboarding middleware fix (middleware.ts TODO — disabled, blocks resume) | 1h | Critical | ready | | audit:smooth-floating-mountain |
| DEV-2 | Service tests for client/invoice/bill/vendor services | 3h | High | ready | | audit:smooth-floating-mountain |

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| SEC-10 | Row-Level Security (PostgreSQL) for production hardening | 3h | Medium | backlog | | roadmap |
| PERF-2 | Revenue: add JSONB expression index for extraction | 30m | Medium | ready | | review:performance |
| PERF-3 | Recharts: code-split import (lazy load) | 30m | Medium | ready | | review:performance |
| PERF-4 | PDF generation: move to worker thread (unblock event loop) | 2h | Low | backlog | | review:performance |
| PERF-7 | Lazy-loading heavy frontend components | 1h | Medium | ready | | roadmap |
| DRY-2 | CSV sanitization: deduplicate between report-export and data-export | 30m | Medium | ready | | review:simplicity |
| DRY-3 | Report routes: extract shared 40-line handler pattern into helper | 1h | Medium | ready | | review:simplicity |
| DRY-5 | `window.Clerk` triple-cast in downloadReport: clean up type assertion | 30m | Low | backlog | | review:typescript |
| UX-3 | Report tables: add `aria-*` attributes, caption, scope, role="progressbar" | 45m | Medium | ready | | review:nextjs |
| UX-4 | Report views: replace array index React keys with stable identifiers | 15m | Medium | ready | | review:nextjs |
| UX-6 | Keyboard shortcuts for power users (command palette, table nav) | 2h | Medium | backlog | | roadmap |
| UX-7 | Help overlay documenting keyboard shortcuts | 1h | Medium | backlog | [needs: UX-6] | roadmap |
| FIN-6 | Cash Flow: document hardcoded account code ranges for categorization | doc | Low | backlog | | review:financial |

---

## Design System

### Critical / High

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DS-1 | Figma-to-code token sync audit | 2h | High | ready | | audit:smooth-floating-mountain |

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DS-2 | Storybook setup for component documentation | 3h | Medium | backlog | | manual |

---

## Marketing & Content

### Critical / High

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| MKT-1 | Landing page copy and design | 3h | High | backlog | | manual |

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| MKT-2 | User documentation / getting started guide | 2h | Medium | backlog | | roadmap |
| CNT-1 | Competitive analysis update | 2h | Medium | backlog | | manual |

---

## Operations

### Critical / High

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| INFRA-1 | CI/CD pipeline (GitHub Actions) | 3h | High | ready | | roadmap |
| INFRA-2 | Production environment setup | 2h | High | ready | | roadmap |
| INFRA-3 | Database backups (automated daily) | 1h | High | ready | | roadmap |
| INFRA-5 | Monitoring (Sentry error tracking, Vercel Analytics, uptime alerts) | 2h | High | ready | [needs: INFRA-2] | roadmap |

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| INFRA-4 | Disaster recovery procedure + documentation | 2h | Medium | backlog | [needs: INFRA-3] | roadmap |
| INFRA-6 | Deployment documentation | 1h | Medium | backlog | [needs: INFRA-2] | roadmap |

---

## Uncommitted Work

| Item | Files | Status | Source |
|------|-------|--------|--------|
| Dashboard redesign (NetWorthHero, RecentTransactions, 7-stat left rail) | 14 modified + 4 new | needs review + commit | manual |
| Onboarding personal-first redesign (3 new steps, conditional flow) | 6 modified + 3 new | needs review + commit | manual |
| dialog.tsx UI component | 1 new | needs commit | manual |

---

## Done (Recent)

| ID | Task | Completed | Commit |
|----|------|-----------|--------|
| SEC-1 | RBAC middleware: Wire requirePermission() to canonical PERMISSION_MATRIX | 2026-02-17 | 5e18109 |
| SEC-2 | tenantScopedQuery string check — strengthen runtime assertion | 2026-02-17 | 5e18109 |
| SEC-3 | Data export: mask bank account numbers (show last 4 only) | 2026-02-17 | 5e18109 |
| SEC-4 | Error handler: stop exposing details object to client | 2026-02-17 | 4e4d049 |
| SEC-5 | sanitizeFilename: guard against empty string result | 2026-02-17 | 4e4d049 |
| SEC-6 | Cache TTL env var: validate against NaN | 2026-02-17 | 4e4d049 |
| SEC-7 | PDF timeout timer: clean up unhandled rejection | 2026-02-17 | 5e18109 |
| FIN-1 | Balance Sheet: enforce strict balance (remove 1-cent tolerance) | 2026-02-17 | 4e4d049 |
| FIN-2 | Cash Flow: add reconciliation check (opening + net = closing) | 2026-02-17 | 6ad5626 |
| FIN-3 | GL Ledger: order window function by date, not CUID | 2026-02-17 | 4e4d049 |
| FIN-4 | Spending/Revenue: add currency validation for multi-entity | 2026-02-17 | 6ad5626 |
| FIN-5 | Data export: apply includeSoftDeleted flag | 2026-02-17 | 6ad5626 |
| DRY-4 | sanitizeCsvCell: accept null in type signature | 2026-02-17 | 4e4d049 |
| UX-5 | Spending view: remove duplicate CHART_COLORS entry | 2026-02-17 | 4e4d049 |

---

## Phase Progress

| Phase | Status |
|-------|--------|
| Foundation | COMPLETE |
| 1: See Your Money | COMPLETE (62 tests) |
| 2: Track Your Money | COMPLETE (117 tests) |
| 3: Post Your Money | COMPLETE (33 posting tests) |
| 4: Bill & Get Paid | COMPLETE (21 category + sprints) |
| 5: Understand Your Money | COMPLETE (18 report + 249 service) |
| 6: Launch MVP | IN PROGRESS (~30%) |

**Total Backend Tests:** 1010 (verified 2026-02-17)
