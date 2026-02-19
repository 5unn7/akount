# Akount — Task Board

**Last Updated:** 2026-02-19
**Current Phase:** Phase 6 — Launch MVP

> **85 tasks** · 🔴 0 critical · 🟠 23 high · 🟡 33 medium · ⚪ 9 low · ✅ 27 done
> 🟢 45 ready · 📦 21 backlog · 🔒 6 blocked

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
| SEC-8 | Complete security audit (OWASP top 10, auth, tenant isolation, input validation) | 4h | 🟠 High | 🟢 | | roadmap |
| SEC-9 | CSRF protection review | 1h | 🟠 High | 🟢 | | roadmap |
| PERF-1 | Balance Sheet: combine 2 redundant heavy SQL queries into 1 | 2h | 🟠 High | 🟢 | | review:performance |
| PERF-5 | Database indexes on hot paths (dashboard, reports) | 2h | 🟠 High | 🟢 | | roadmap |
| PERF-6 | Query optimization audit (dashboard + report queries) | 2h | 🟠 High | 🟢 | | roadmap |
| PERF-8 | p95 < 2s page load target verification + load testing | 2h | 🟠 High | 🟢 | | roadmap |
| ~~DRY-1~~ | ~~Report types: move shared types to `packages/types` (eliminate duplication)~~ | 1h | 🟠 High | ✅ | | review:typescript |
| UX-1 | Entity selector: replace hardcoded dropdown with real entity options | 1-2h | 🟠 High | 🟢 | | review:nextjs |
| UX-2 | GL Account ID: replace raw CUID input with searchable dropdown | 1h | 🟠 High | 🟢 | | review:nextjs |
| TEST-1 | Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests | 3-4h | 🟠 High | 🟢 | | review:typescript |
| TEST-2 | E2E tests for critical user flows (onboarding, import, posting, reports) | 4h | 🟠 High | 🟢 | | roadmap |
| TEST-3 | 80%+ API test coverage target | 2h | 🟠 High | 🔒 | [needs: TEST-1] | roadmap |
| DEV-2 | Service tests for client/invoice/bill/vendor services | 3h | 🟠 High | 🟢 | | audit:smooth-floating-mountain |
| PERF-9 | Replace console.log with pino structured logging (7 production files) | 2h | 🟠 High | 🟢 | | plan:phase-6-tasks |
| UX-8 | Add loading/error states to remaining dashboard pages (~30 pages) | 2h | 🟠 High | 🟢 | | plan:phase-6-tasks |
| ARCH-2 | Audit log coverage expansion (bulk ops, imports, exports, reconciliation) | 3h | 🟠 High | 🟢 | | review:smooth-floating-mountain |
| ARCH-6 | Audit logging inside DB transactions (not fire-and-forget outside TX) | 2h | 🟠 High | 🟢 | | review:smooth-floating-mountain §2.2.1 |
| SEC-11 | File upload virus scanning (ClamAV integration for PDFs/CSVs) | 3h | 🟠 High | 🟢 | | review:smooth-floating-mountain §2.2.3 |
| SEC-13 | Audit log tamper detection (immutable log storage) | 3h | 🟠 High | 🟢 | | review:smooth-floating-mountain §2.2.4 |
| INFRA-9 | Secrets management for production (env var vault, not .env files) | 2h | 🟠 High | 🟢 | | review:smooth-floating-mountain §2.4.4 |
| INFRA-10 | Security scanning in CI (SAST + dependency/supply chain checks) | 2h | 🟠 High | 🟢 | | review:smooth-floating-mountain §2.4.4 |
| ~~SEC-17~~ | ~~XSS fix: sanitize `dangerouslySetInnerHTML` in AIBrief (DOMPurify or markdown renderer)~~ | 30m | 🟠 High | ✅ | | review:dashboard-overview |
| ~~SEC-18~~ | ~~Dashboard routes: replace unsafe `request.tenantId as string` with `requireTenantId()` guard~~ | 30m | 🟠 High | ✅ | | review:dashboard-overview |
| ~~SEC-19~~ | ~~Dashboard routes: replace unsafe `as DashboardQuery` casts with Fastify generic route typing~~ | 1h | 🟠 High | ✅ | | review:dashboard-overview |
| ~~FIN-13~~ | ~~`UpcomingPayments.amount` typed as `string` — must be `number` (integer cents violation)~~ | 15m | 🟠 High | ✅ | | review:dashboard-overview |
| ~~DOC-1~~ | ~~Add plan-enforcement.md to CLAUDE.md Tier 1/2 context hierarchy~~ | 30m | 🟠 High | ✅ | | review:smooth-floating-mountain |

### Medium / Low

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| PERF-2 | Revenue: add JSONB expression index for extraction | 30m | 🟡 Medium | 🟢 | | review:performance |
| PERF-3 | Recharts: code-split import (lazy load) | 30m | 🟡 Medium | 🟢 | | review:performance |
| PERF-7 | Lazy-loading heavy frontend components | 1h | 🟡 Medium | 🟢 | | roadmap |
| DRY-2 | CSV sanitization: deduplicate between report-export and data-export | 30m | 🟡 Medium | 🟢 | | review:simplicity |
| DRY-3 | Report routes: extract shared 40-line handler pattern into helper | 1h | 🟡 Medium | 🟢 | | review:simplicity |
| UX-3 | Report tables: add `aria-*` attributes, caption, scope, role="progressbar" | 45m | 🟡 Medium | 🟢 | | review:nextjs |
| UX-4 | Report views: replace array index React keys with stable identifiers | 15m | 🟡 Medium | 🟢 | | review:nextjs |
| DOC-2 | Consolidate logging rules (full version in api-conventions.md, update guardrails.md ref) | 30m | 🟡 Medium | 🟢 | | review:smooth-floating-mountain |
| DOC-3 | Archive .reviews/ temp workspace to docs/reviews/ or delete | 15m | 🟡 Medium | 🟢 | | review:smooth-floating-mountain |
| SEC-10 | Row-Level Security (PostgreSQL) for production hardening | 3h | 🟡 Medium | 📦 | | roadmap |
| UX-6 | Keyboard shortcuts for power users (command palette, table nav) | 2h | 🟡 Medium | 📦 | | roadmap |
| UX-7 | Help overlay documenting keyboard shortcuts | 1h | 🟡 Medium | 🔒 | [needs: UX-6] | roadmap |
| SEC-12 | File upload quota enforcement per tenant (prevent abuse/DoS) | 1h | 🟡 Medium | 🟢 | | review:smooth-floating-mountain §2.2.3 |
| SEC-14 | Audit log retention policies (prevent unbounded growth, compliance) | 1h | 🟡 Medium | 🟢 | | review:smooth-floating-mountain §2.2.4 |
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
| UX-9 | Dashboard: fix SVG gradient ID collision (use `React.useId()`) | 15m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| ~~DEV-3~~ | ~~Dashboard: delete dead `handleSkipStep` in OnboardingHeroCard + dead SparkCardsSkeleton~~ | 10m | 🟡 Medium | ✅ | | review:dashboard-overview |
| DEV-4 | Dashboard: type entity maps as `Record<EntityType, ...>` for exhaustive checking | 15m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DS-3 | Dashboard: replace `hover:glass-3` with proper hover pattern (`hover:border-ak-border-3`) | 10m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DS-4 | ExpenseChart: replace inline `backgroundColor` with token-mapped CSS variables | 30m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| ~~DS-5~~ | ~~AIBrief: change `text-primary` (amber) to AI-specific purple tokens~~ | 10m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DS-6~~ | ~~Dashboard: resolve `text-[9px]` vs `text-[10px]` inconsistency with `text-micro` utility~~ | 15m | 🟡 Medium | ✅ | | review:dashboard-overview |
| ~~DEV-5~~ | ~~Dashboard: add `cancelAnimationFrame` cleanup in DashboardLeftRail/SparkCards useEffect~~ | 10m | 🟡 Medium | ✅ | | review:dashboard-overview |
| DEV-6 | Dashboard: delete duplicate `OnboardingHeroCard` in `components/dashboard/` (dead code) | 5m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DEV-7 | DashboardRightRail: replace `\|\|` className with `cn()` for proper class merging | 5m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DEV-8 | DashboardService: add explicit return type to `getMetrics()` method | 15m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DEV-9 | DashboardService: type `byType` as `Partial<Record<AccountType, number>>` (not `Record<string, number>`) | 10m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| FIN-14 | DashboardService: document or fix float arithmetic in FX conversion (`Math.abs(balance) * rate`) | 30m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DOC-4 | Elevate source preservation to explicit 5th invariant in guardrails.md | 15m | 🟡 Medium | 🟢 | | review:smooth-floating-mountain §1.2 |
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
| ✅ FIN-13 | Change UpcomingPayments.amount to integer cents | 2026-02-19 | 8ec6cf5 |
| ✅ DRY-1 | Move report types to packages/types | 2026-02-19 | 9503c36 |
| ✅ DOC-1 | Add plan-enforcement.md to CLAUDE.md Layer 1 | 2026-02-19 | 2d1dce0 |
| ✅ DRY-6 | Dashboard: deduplicate SparkCards/DashboardLeftRail | 2026-02-19 | 53d2db6 |
| ✅ DEV-5 | Dashboard: add cancelAnimationFrame cleanup | 2026-02-19 | 53d2db6 |
| ✅ DS-5 | AIBrief: change text-primary to AI purple tokens | 2026-02-19 | 53d2db6 |
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
  "generated": "2026-02-19T16:59:24.724Z",
  "summary": {
    "total": 84,
    "ready": 50,
    "blocked": 7,
    "backlog": 26,
    "done": 0
  },
  "byPriority": {
    "critical": [],
    "high": [
      "SEC-8",
      "SEC-9",
      "PERF-1",
      "PERF-5",
      "PERF-6",
      "PERF-8",
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
      "FIN-13",
      "DOC-1",
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
      "PERF-2",
      "PERF-3",
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
      "UX-9",
      "DEV-4",
      "DS-3",
      "DS-4",
      "DEV-6",
      "DEV-8",
      "DEV-9",
      "FIN-14",
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
      "UX-4",
      "DOC-3",
      "UX-9",
      "DEV-4",
      "DS-3",
      "DEV-6",
      "DEV-8",
      "DEV-9",
      "DOC-4",
      "DOC-5",
      "DOC-6"
    ],
    "short": [
      "SEC-9",
      "PERF-1",
      "PERF-5",
      "PERF-6",
      "PERF-8",
      "DRY-1",
      "UX-1",
      "UX-2",
      "TEST-3",
      "PERF-9",
      "UX-8",
      "ARCH-6",
      "INFRA-9",
      "INFRA-10",
      "DOC-1",
      "PERF-2",
      "PERF-3",
      "PERF-7",
      "DRY-2",
      "DRY-3",
      "UX-3",
      "DOC-2",
      "UX-6",
      "UX-7",
      "SEC-12",
      "SEC-14",
      "PERF-12",
      "DRY-7",
      "DS-4",
      "FIN-14",
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
      "TEST-1",
      "TEST-2",
      "DEV-2",
      "ARCH-2",
      "SEC-11",
      "SEC-13",
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
      "DS-2",
      "MKT-1",
      "INFRA-1",
      "ARCH-3",
      "INFRA-7",
      "INFRA-8"
    ],
    "long": [
      "FIN-11",
      "FIN-12"
    ]
  },
  "byDomain": {
    "security": [
      "SEC-8",
      "SEC-9",
      "SEC-11",
      "SEC-13",
      "SEC-10",
      "SEC-12",
      "SEC-14",
      "SEC-15",
      "SEC-16"
    ],
    "performance": [
      "PERF-1",
      "PERF-5",
      "PERF-6",
      "PERF-8",
      "PERF-9",
      "PERF-2",
      "PERF-3",
      "PERF-7",
      "PERF-10",
      "PERF-12",
      "PERF-4",
      "PERF-11"
    ],
    "code-quality": [
      "DRY-1",
      "DRY-2",
      "DRY-3",
      "DRY-7",
      "DRY-5"
    ],
    "ux": [
      "UX-1",
      "UX-2",
      "UX-8",
      "UX-3",
      "UX-4",
      "UX-6",
      "UX-7",
      "UX-9"
    ],
    "testing": [
      "TEST-1",
      "TEST-2",
      "TEST-3",
      "TEST-4"
    ],
    "development": [
      "DEV-2",
      "DEV-4",
      "DEV-6",
      "DEV-7",
      "DEV-8",
      "DEV-9"
    ],
    "architecture": [
      "ARCH-2",
      "ARCH-6",
      "ARCH-5",
      "ARCH-1",
      "ARCH-4",
      "ARCH-3"
    ],
    "infrastructure": [
      "INFRA-9",
      "INFRA-10",
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
    "financial": [
      "FIN-13",
      "FIN-7",
      "FIN-8",
      "FIN-9",
      "FIN-10",
      "FIN-14",
      "FIN-11",
      "FIN-12",
      "FIN-6"
    ],
    "documentation": [
      "DOC-1",
      "DOC-2",
      "DOC-3",
      "DOC-4",
      "DOC-5",
      "DOC-6"
    ],
    "design-system": [
      "DS-3",
      "DS-4",
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
    "SEC-8",
    "SEC-9",
    "PERF-1",
    "PERF-5",
    "PERF-6",
    "PERF-8",
    "DRY-1",
    "UX-1",
    "UX-2",
    "TEST-1",
    "TEST-2",
    "DEV-2",
    "PERF-9",
    "UX-8",
    "ARCH-2",
    "ARCH-6",
    "SEC-11",
    "SEC-13",
    "INFRA-9",
    "INFRA-10",
    "FIN-13",
    "DOC-1",
    "PERF-2",
    "PERF-3",
    "PERF-7",
    "DRY-2",
    "DRY-3",
    "UX-3",
    "UX-4",
    "DOC-2",
    "DOC-3",
    "SEC-12",
    "SEC-14",
    "DRY-7",
    "UX-9",
    "DEV-4",
    "DS-3",
    "DS-4",
    "DEV-6",
    "DEV-8",
    "DEV-9",
    "FIN-14",
    "DOC-4",
    "DOC-5",
    "DOC-6",
    "DS-1",
    "INFRA-1",
    "INFRA-2",
    "INFRA-3",
    "ARCH-3"
  ],
  "quickWins": [
    "SEC-9",
    "PERF-1",
    "PERF-5",
    "PERF-6",
    "PERF-8",
    "DRY-1",
    "UX-1",
    "UX-2",
    "PERF-9",
    "UX-8",
    "ARCH-6",
    "INFRA-9",
    "INFRA-10",
    "FIN-13",
    "DOC-1",
    "DS-1",
    "INFRA-2",
    "INFRA-3"
  ],
  "dashboard": [
    "PERF-5",
    "PERF-6",
    "UX-8",
    "DRY-7",
    "UX-9",
    "DEV-4",
    "DS-3",
    "DEV-6",
    "DEV-8",
    "DEV-9",
    "FIN-14"
  ],
  "tasks": {
    "SEC-8": {
      "line": 26,
      "title": "Complete security audit (OWASP top 10, auth, tenant isolation, input validation)",
      "effort": "4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "SEC-9": {
      "line": 27,
      "title": "CSRF protection review",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "PERF-1": {
      "line": 28,
      "title": "Balance Sheet: combine 2 redundant heavy SQL queries into 1",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-5": {
      "line": 29,
      "title": "Database indexes on hot paths (dashboard, reports)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-6": {
      "line": 30,
      "title": "Query optimization audit (dashboard + report queries)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-8": {
      "line": 31,
      "title": "p95 < 2s page load target verification + load testing",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "DRY-1": {
      "line": 32,
      "title": "Report types: move shared types to `packages/types` (eliminate duplication)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "UX-1": {
      "line": 33,
      "title": "Entity selector: replace hardcoded dropdown with real entity options",
      "effort": "1-2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-2": {
      "line": 34,
      "title": "GL Account ID: replace raw CUID input with searchable dropdown",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "TEST-1": {
      "line": 35,
      "title": "Service tests for 4 remaining reports (BS, CF, TB, GL) + route tests",
      "effort": "3-4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "testing"
    },
    "TEST-2": {
      "line": 36,
      "title": "E2E tests for critical user flows (onboarding, import, posting, reports)",
      "effort": "4h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "testing"
    },
    "TEST-3": {
      "line": 37,
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
      "line": 38,
      "title": "Service tests for client/invoice/bill/vendor services",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "PERF-9": {
      "line": 39,
      "title": "Replace console.log with pino structured logging (7 production files)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "UX-8": {
      "line": 40,
      "title": "Add loading/error states to remaining dashboard pages (~30 pages)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "ARCH-2": {
      "line": 41,
      "title": "Audit log coverage expansion (bulk ops, imports, exports, reconciliation)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-6": {
      "line": 42,
      "title": "Audit logging inside DB transactions (not fire-and-forget outside TX)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "SEC-11": {
      "line": 43,
      "title": "File upload virus scanning (ClamAV integration for PDFs/CSVs)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "SEC-13": {
      "line": 44,
      "title": "Audit log tamper detection (immutable log storage)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "INFRA-9": {
      "line": 45,
      "title": "Secrets management for production (env var vault, not .env files)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-10": {
      "line": 46,
      "title": "Security scanning in CI (SAST + dependency/supply chain checks)",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "FIN-13": {
      "line": 50,
      "title": "`UpcomingPayments.amount` typed as `string` — must be `number` (integer cents violation)",
      "effort": "15m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "financial"
    },
    "DOC-1": {
      "line": 51,
      "title": "Add plan-enforcement.md to CLAUDE.md Tier 1/2 context hierarchy",
      "effort": "30m",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "PERF-2": {
      "line": 57,
      "title": "Revenue: add JSONB expression index for extraction",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-3": {
      "line": 58,
      "title": "Recharts: code-split import (lazy load)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "PERF-7": {
      "line": 59,
      "title": "Lazy-loading heavy frontend components",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "performance"
    },
    "DRY-2": {
      "line": 60,
      "title": "CSV sanitization: deduplicate between report-export and data-export",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "DRY-3": {
      "line": 61,
      "title": "Report routes: extract shared 40-line handler pattern into helper",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "UX-3": {
      "line": 62,
      "title": "Report tables: add `aria-*` attributes, caption, scope, role=\"progressbar\"",
      "effort": "45m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "UX-4": {
      "line": 63,
      "title": "Report views: replace array index React keys with stable identifiers",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DOC-2": {
      "line": 64,
      "title": "Consolidate logging rules (full version in api-conventions.md, update guardrails.md ref)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-3": {
      "line": 65,
      "title": "Archive .reviews/ temp workspace to docs/reviews/ or delete",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "SEC-10": {
      "line": 66,
      "title": "Row-Level Security (PostgreSQL) for production hardening",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "UX-6": {
      "line": 67,
      "title": "Keyboard shortcuts for power users (command palette, table nav)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "ux"
    },
    "UX-7": {
      "line": 68,
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
      "line": 69,
      "title": "File upload quota enforcement per tenant (prevent abuse/DoS)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "SEC-14": {
      "line": 70,
      "title": "Audit log retention policies (prevent unbounded growth, compliance)",
      "effort": "1h",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "security"
    },
    "PERF-10": {
      "line": 71,
      "title": "Distributed caching (Redis) for multi-instance deployment",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-12": {
      "line": 72,
      "title": "N+1 query monitoring / slow query detection in production (APM)",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "FIN-7": {
      "line": 73,
      "title": "Fiscal period enforcement (prevent posting to locked periods)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-8": {
      "line": 74,
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
      "line": 75,
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
      "line": 76,
      "title": "Invoice/bill reconciliation workflows (AP/AR aging, match/approve)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "ARCH-5": {
      "line": 77,
      "title": "Error recovery patterns (idempotency keys, circuit breakers, retry with backoff)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-1": {
      "line": 78,
      "title": "OpenAPI spec auto-generation from Zod schemas (fastify-zod-openapi)",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "ARCH-4": {
      "line": 79,
      "title": "Background job processing setup (BullMQ for PDF gen, email, imports)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "architecture"
    },
    "TEST-4": {
      "line": 80,
      "title": "Integration tests (API → DB → API roundtrip for critical flows)",
      "effort": "4h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "testing"
    },
    "DRY-7": {
      "line": 82,
      "title": "Dashboard page.tsx: extract 120+ lines of data transformation to `lib/dashboard/transformers.ts`",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "code-quality"
    },
    "UX-9": {
      "line": 83,
      "title": "Dashboard: fix SVG gradient ID collision (use `React.useId()`)",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "ux"
    },
    "DEV-4": {
      "line": 85,
      "title": "Dashboard: type entity maps as `Record<EntityType, ...>` for exhaustive checking",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DS-3": {
      "line": 86,
      "title": "Dashboard: replace `hover:glass-3` with proper hover pattern (`hover:border-ak-border-3`)",
      "effort": "10m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "design-system"
    },
    "DS-4": {
      "line": 87,
      "title": "ExpenseChart: replace inline `backgroundColor` with token-mapped CSS variables",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "design-system"
    },
    "DEV-6": {
      "line": 91,
      "title": "Dashboard: delete duplicate `OnboardingHeroCard` in `components/dashboard/` (dead code)",
      "effort": "5m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-7": {
      "line": 92,
      "title": "DashboardRightRail: replace `\\",
      "effort": "\\",
      "priority": "unknown",
      "status": "unknown",
      "deps": [],
      "domain": "development"
    },
    "DEV-8": {
      "line": 93,
      "title": "DashboardService: add explicit return type to `getMetrics()` method",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "DEV-9": {
      "line": 94,
      "title": "DashboardService: type `byType` as `Partial<Record<AccountType, number>>` (not `Record<string, number>`)",
      "effort": "10m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "development"
    },
    "FIN-14": {
      "line": 95,
      "title": "DashboardService: document or fix float arithmetic in FX conversion (`Math.abs(balance) * rate`)",
      "effort": "30m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "financial"
    },
    "DOC-4": {
      "line": 96,
      "title": "Elevate source preservation to explicit 5th invariant in guardrails.md",
      "effort": "15m",
      "priority": "medium",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "PERF-4": {
      "line": 97,
      "title": "PDF generation: move to worker thread (unblock event loop)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "PERF-11": {
      "line": 98,
      "title": "Distributed rate limiting (Redis-backed) for multi-instance",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "performance"
    },
    "DRY-5": {
      "line": 99,
      "title": "`window.Clerk` triple-cast in downloadReport: clean up type assertion",
      "effort": "30m",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "code-quality"
    },
    "DOC-5": {
      "line": 100,
      "title": "Add double-entry bookkeeping check to guardrails.md anti-patterns",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "DOC-6": {
      "line": 101,
      "title": "Update version dates across CLAUDE.md files (inconsistent: 2026-02-15 vs 2026-02-09)",
      "effort": "15m",
      "priority": "low",
      "status": "ready",
      "deps": [],
      "domain": "documentation"
    },
    "FIN-11": {
      "line": 102,
      "title": "Consolidation/elimination accounting (multi-entity)",
      "effort": "8h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "FIN-12": {
      "line": 103,
      "title": "GAAP-compliant GL export format (XBRL/ixBRL regulatory reporting)",
      "effort": "6h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "SEC-15": {
      "line": 104,
      "title": "Duplicate file detection for uploads",
      "effort": "1h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "SEC-16": {
      "line": 105,
      "title": "File retention policies (auto-cleanup of old uploads)",
      "effort": "1h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "security"
    },
    "INFRA-11": {
      "line": 106,
      "title": "Database migration testing in CI pipeline",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-12": {
      "line": 107,
      "title": "Usage analytics (companies, transactions, reports generated)",
      "effort": "2h",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "infrastructure"
    },
    "FIN-6": {
      "line": 108,
      "title": "Cash Flow: document hardcoded account code ranges for categorization",
      "effort": "doc",
      "priority": "low",
      "status": "backlog",
      "deps": [],
      "domain": "financial"
    },
    "DS-1": {
      "line": 118,
      "title": "Figma-to-code token sync audit",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "design-system"
    },
    "DS-2": {
      "line": 124,
      "title": "Storybook setup for component documentation",
      "effort": "3h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "design-system"
    },
    "MKT-1": {
      "line": 134,
      "title": "Landing page copy and design",
      "effort": "3h",
      "priority": "high",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "MKT-2": {
      "line": 140,
      "title": "User documentation / getting started guide",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "marketing"
    },
    "CNT-1": {
      "line": 141,
      "title": "Competitive analysis update",
      "effort": "2h",
      "priority": "medium",
      "status": "backlog",
      "deps": [],
      "domain": "content"
    },
    "INFRA-1": {
      "line": 151,
      "title": "CI/CD pipeline (GitHub Actions)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-2": {
      "line": 152,
      "title": "Production environment setup",
      "effort": "2h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "INFRA-3": {
      "line": 153,
      "title": "Database backups (automated daily)",
      "effort": "1h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "infrastructure"
    },
    "ARCH-3": {
      "line": 154,
      "title": "S3 cloud storage migration for file uploads (replace local filesystem)",
      "effort": "3h",
      "priority": "high",
      "status": "ready",
      "deps": [],
      "domain": "architecture"
    },
    "INFRA-5": {
      "line": 155,
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
      "line": 156,
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
      "line": 157,
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
      "line": 163,
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
      "line": 164,
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
