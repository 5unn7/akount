# Akount — Task Board

**Last Updated:** 2026-02-19
**Current Phase:** Phase 6 — Launch MVP

> **85 tasks** · 🔴 0 critical · 🟠 29 high · 🟡 38 medium · ⚪ 9 low · ✅ 16 done
> 🟢 56 ready · 📦 21 backlog · 🔒 6 blocked

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
| DRY-1 | Report types: move shared types to `packages/types` (eliminate duplication) | 1h | 🟠 High | 🟢 | | review:typescript |
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
| SEC-17 | XSS fix: sanitize `dangerouslySetInnerHTML` in AIBrief (DOMPurify or markdown renderer) | 30m | 🟠 High | 🟢 | | review:dashboard-overview |
| SEC-18 | Dashboard routes: replace unsafe `request.tenantId as string` with `requireTenantId()` guard | 30m | 🟠 High | 🟢 | | review:dashboard-overview |
| SEC-19 | Dashboard routes: replace unsafe `as DashboardQuery` casts with Fastify generic route typing | 1h | 🟠 High | 🟢 | | review:dashboard-overview |
| FIN-13 | `UpcomingPayments.amount` typed as `string` — must be `number` (integer cents violation) | 15m | 🟠 High | 🟢 | | review:dashboard-overview |
| DOC-1 | Add plan-enforcement.md to CLAUDE.md Tier 1/2 context hierarchy | 30m | 🟠 High | 🟢 | | review:smooth-floating-mountain |

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
| DRY-6 | Dashboard: deduplicate SparkCards/DashboardLeftRail (shared types, constants, MiniSparkline) | 45m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DRY-7 | Dashboard page.tsx: extract 120+ lines of data transformation to `lib/dashboard/transformers.ts` | 30m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| UX-9 | Dashboard: fix SVG gradient ID collision (use `React.useId()`) | 15m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DEV-3 | Dashboard: delete dead `handleSkipStep` in OnboardingHeroCard + dead SparkCardsSkeleton | 10m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DEV-4 | Dashboard: type entity maps as `Record<EntityType, ...>` for exhaustive checking | 15m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DS-3 | Dashboard: replace `hover:glass-3` with proper hover pattern (`hover:border-ak-border-3`) | 10m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DS-4 | ExpenseChart: replace inline `backgroundColor` with token-mapped CSS variables | 30m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DS-5 | AIBrief: change `text-primary` (amber) to AI-specific purple tokens | 10m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DS-6 | Dashboard: resolve `text-[9px]` vs `text-[10px]` inconsistency with `text-micro` utility | 15m | 🟡 Medium | 🟢 | | review:dashboard-overview |
| DEV-5 | Dashboard: add `cancelAnimationFrame` cleanup in DashboardLeftRail/SparkCards useEffect | 10m | 🟡 Medium | 🟢 | | review:dashboard-overview |
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
