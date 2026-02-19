# Knowledge Management & Architectural Maturity Audit

**Agent ID:** a286bd4, ad3045e
**Date:** 2026-02-17
**Scope:** Documentation consistency, knowledge duplication, architectural readiness for billion-dollar scale

---

## Context

This audit addresses four fundamental questions about the Akount project's scalability and maintainability:

1. **Knowledge Management:** Which files are sources of truth? Are they consistently maintained?
2. **Prompt Consistency:** Would a new chat session have the same context as a process-driven workflow?
3. **Architectural Maturity:** What breaks at billion-dollar accounting scale?
4. **Technical Debt:** What duplications, gaps, and anti-patterns exist?

The project has completed Phases 1-5 (MVP functional), with 1009 tests, 27 services, and 100% service coverage. This audit evaluates **production readiness** for Phase 6 launch and **institutional readiness** for billion-dollar scale.

---

## SECTION 1: DOCUMENTATION & KNOWLEDGE MANAGEMENT

### 1.1 Essential Files Inventory

**✅ SOURCE OF TRUTH FILES (Root Level)**
```
CLAUDE.md        (258 lines) — Core context, 5 invariants, tier hierarchy
STATUS.md        (156 lines) — Current phase status, metrics
TASKS.md         (155 lines) — Active task list
ROADMAP.md       (390 lines) — Phase timeline, effort estimates
```

**✅ DOMAIN-SPECIFIC CONTEXT**
```
apps/api/CLAUDE.md      (163 lines) — Endpoint inventory, middleware, service patterns
apps/web/CLAUDE.md      (150 lines) — Component inventory, page structure, design system
packages/db/CLAUDE.md   (129 lines) — Prisma model table (38 models)
```

**✅ STANDARDS & DEEP REFERENCE**
```
docs/context-map.md              (237 lines) — Model glossary, enum reference
docs/standards/financial-data.md (546 lines) — Financial patterns with examples
docs/standards/multi-tenancy.md  (403 lines) — Tenant isolation patterns
docs/standards/api-design.md     (541 lines) — API design patterns
docs/standards/security.md       (528 lines) — Security requirements
```

**✅ RULES ENGINE (9 files, 1312 lines total)**
```
guardrails.md           (148 lines) — Anti-patterns, pre-flight checklist
product-thinking.md     (170 lines) — Investigation protocol, pattern verification
frontend-conventions.md (274 lines) — Server/Client components, SRP, design system
api-conventions.md      (176 lines) — Route → Schema → Service pattern
design-aesthetic.md     (160 lines) — Color tokens, glass morphism
financial-rules.md      ( 92 lines) — Integer cents, soft delete, tenant isolation
test-conventions.md     (135 lines) — Financial assertions, soft delete tests
workflows.md            ( 68 lines) — Skills and review agents reference
plan-enforcement.md     ( 89 lines) — Task tracking, status update rules  ⚠️
```

**Status:** ✅ All source-of-truth files identified and organized across 3-tier hierarchy.

---

### 1.2 Context Loading Mechanism

**TIER 1: Auto-loaded (~400 lines)**
```
CLAUDE.md ✓
MEMORY.md ✓ (user's global .claude/projects)
guardrails.md ✓
workflows.md ✓
product-thinking.md ✓
```

**TIER 2: Path-scoped (auto-loaded when working in specific paths)**
```
apps/api/**      → api-conventions.md + financial-rules.md
apps/web/**      → frontend-conventions.md + design-aesthetic.md
packages/db/**   → financial-rules.md
**/__tests__/**  → test-conventions.md
```

**TIER 3: On-demand (~2,356 lines)**
```
docs/context-map.md
docs/standards/financial-data.md
docs/standards/multi-tenancy.md
docs/standards/api-design.md
docs/standards/security.md
```

**✅ Would a new chat know the essential context?**

**YES:**
- All 5 Key Invariants (in CLAUDE.md Tier 1)
- All architectural patterns (in CLAUDE.md)
- All anti-patterns (guardrails.md auto-loads)
- Investigation protocol (product-thinking.md auto-loads)
- Workflow skills (workflows.md auto-loads)
- Path-specific guidance (auto-loaded when touching files)

**PARTIAL:**
- Domain-specific CLAUDE.md files (must explicitly read)
- Detailed standards docs (only linked, not loaded)

**CRITICAL FINDING:** plan-enforcement.md is NOT in the Tier 1/2/3 hierarchy despite containing critical task tracking rules.

---

### 1.3 Prompt Consistency Analysis

**✅ WELL-ALIGNED AREAS**

1. **5 Key Invariants** — Consistently mentioned across 4+ files each:
   - Integer cents (CLAUDE.md, guardrails.md, financial-rules.md, test-conventions.md)
   - TenantId filtering (4 files)
   - Soft delete (4 files)
   - Double-entry bookkeeping (5 files)
   - Source preservation (3 files)

2. **Path-Scoped Rules** — Properly documented in CLAUDE.md lines 115-121

3. **SRP Principle** — Defined in 2 places with domain-specific examples:
   - api-conventions.md (lines 126-158) — Service/route structure
   - frontend-conventions.md (lines 212-260) — Component structure

4. **Design System** — Consistent across:
   - design-aesthetic.md (comprehensive: 160 lines)
   - apps/web/CLAUDE.md (summary: ~30 lines)
   - CLAUDE.md references both

5. **Cross-Document Links** — 26 references found, all properly linked

**⚠️ CONSISTENCY ISSUES FOUND**

| Issue | Severity | Impact |
|-------|----------|--------|
| **plan-enforcement.md NOT in Context Hierarchy** | CRITICAL | New chats won't see task tracking rules |
| **Source Preservation Coverage Gap** | MEDIUM | 5th invariant scattered across files, not in guardrails.md |
| **Logging Rule Duplication** | MEDIUM | api-conventions.md has full rule with exception; guardrails.md version incomplete |
| **Double-Entry Documentation Scattered** | MINOR | 13 mentions across 5 files, not in guardrails.md |
| **Version Dates Inconsistent** | MINOR | CLAUDE.md "2026-02-15", Architecture sections "2026-02-09" |

---

### 1.4 Duplication Analysis

**✅ STRATEGIC DUPLICATION (Intentional, Good Design)**

1. **5 Key Invariants** — Appears in multiple places by design:
   - Root CLAUDE.md (concise, ~50 lines) — Tier 1 context
   - guardrails.md (expanded, ~80 lines) — Enforcement rules
   - Rationale: Critical invariants must be always-available

2. **SRP Principle** — Defined separately for API and frontend:
   - api-conventions.md — Service/route structure
   - frontend-conventions.md — Component structure
   - Rationale: Domain-specific examples make it clearer

3. **Design System Tokens** — Referenced in multiple places:
   - design-aesthetic.md (comprehensive)
   - apps/web/CLAUDE.md (summary)
   - Rationale: Web developers see both breadth and context

**⚠️ PROBLEMATIC DUPLICATION**

1. **Logging Rules Duplicated with Gaps** — MEDIUM
   - api-conventions.md lines 96-110: Full rule with exception for env.ts
   - guardrails.md line 75: Brief bullet, no exception mention
   - Impact: guardrails.md version incomplete; users might miss exception

2. **Console.log Anti-Pattern Scattered** — MINOR
   - guardrails.md: "NEVER use console.log"
   - api-conventions.md: Full context with exception
   - product-thinking.md: Doesn't mention it
   - Impact: Finding the rule is harder; context varies

---

### 1.5 Workspace Organization

**⚠️ CLEANUP NEEDED**

1. **.reviews/ directory (20 files, gitignored)** — Temporary workspace for review agents
   - Proper location: `docs/reviews/{feature}/`
   - Status: Needs consolidation or deletion

2. **Archived plans** — 21 plans archived (2026-02-16 cleanup)
   - Location: `docs/archive/plans/`
   - Status: ✅ Good

3. **Session captures** — `docs/archive/sessions/`
   - Status: ✅ Properly organized

---

## SECTION 2: ARCHITECTURAL MATURITY FOR BILLION-DOLLAR SCALE

### 2.1 Performance & Scale Gaps

| Component | Readiness | Gap | Priority |
|-----------|-----------|-----|----------|
| **Caching** | 50% | In-memory only; Redis needed | HIGH |
| **Database Indexing** | 85% | Partial indexes, covering indexes | MEDIUM |
| **Query Optimization** | 80% | N+1 monitoring, APM needed | MEDIUM |
| **Rate Limiting** | 95% | Distributed (Redis) for multi-instance | LOW |
| **Job Queuing** | 0% | Missing entirely (all sync) | CRITICAL |

#### 2.1.1 Caching Strategy: PARTIAL (50% ready)

**What exists:**
- In-memory report cache (`report-cache.ts` @ 157 lines)
  - Bounded to 500 entries with LRU eviction
  - Tenant-scoped keys (prevents cross-tenant poisoning)
  - TTL-based expiration (5 minutes default)
  - Active sweep every 60s
  - Location: `/apps/api/src/domains/accounting/services/report-cache.ts`

**What's missing:**
- No Redis/distributed cache integration
- No cache invalidation webhook system
- No cache statistics endpoint
- No cache warming strategy
- Single-instance cache (lost on restart)

**Gap Impact:** At billion-dollar scale (100K+ companies, millions of transactions), in-memory cache becomes memory leak risk. Redis required.

---

#### 2.1.2 Database Indexing: GOOD (85% ready)

**Strengths:**
- Soft-delete indexes on all financial models
- Composite index on JournalEntry for report queries
- Tenant isolation indexes on critical paths

**Example from schema.prisma:**
```prisma
JournalEntry: @@index([entityId, date])
             @@index([entityId, status])
             @@index([entityId, deletedAt])
             @@index([entityId, status, deletedAt, date])  // Composite
```

**Gaps:**
- No full-text search indexes for description searches
- No window function optimization for running balance queries
- No partial indexes (e.g., WHERE isActive = true)
- No covering indexes for common SELECT patterns
- Missing indexes on: currency conversions, date ranges, multi-entity queries

**Gap Impact:** Run-of-the-mill scale (millions of transactions per entity) hits query timeouts on unindexed columns.

---

#### 2.1.3 Query Optimization: GOOD (80% ready)

**What exists:**
- Eager loading patterns in critical services (ReconciliationService line 67-76)
- Explicit `.select()` to avoid over-fetching (PostingService lines 35-55)
- Tenant isolation filters via nested WHERE clauses

**What's missing:**
- No N+1 query monitoring/detection in production
- No query profiling/slow query logs configured
- No query timeout enforcement (default PostgreSQL 30s might be too lenient)
- No explain plan analysis for expensive aggregations

**Gap Impact:** Even small N+1 bugs amplify at scale (10 accounts × 1000 transactions = 10K queries). Needs APM.

---

#### 2.1.4 Rate Limiting: EXCELLENT (95% ready)

**What exists:**
- Tiered rate limiting (`/apps/api/src/middleware/rate-limit.ts` @ 182 lines):
  - Global: 100 req/min per user
  - Strict (auth endpoints): 10 req/min
  - Burst (imports, bulk): 500 req/min
  - Stats (expensive queries): 50 req/min
  - Health/metrics: unlimited
- Tenant+user isolation in key generator
- Proper HTTP headers (`x-ratelimit-*`)

**What's missing:**
- No distributed rate limiting (relies on in-memory, not Redis)
- No per-endpoint dynamic limits
- No cost-based rate limiting

**Gap Impact:** Works for single-instance MVP. Multi-instance deployments need distributed Redis-backed rate limiting.

---

#### 2.1.5 Background Job Processing: MISSING (0% ready)

**What exists:** None. All operations are synchronous.

**Examples of missing async patterns:**
- PDF generation (blocking) — report-export.service.ts
- Email sending (blocking) — email.ts
- Bank statement imports (synchronous parsing) — import.service.ts

**Gap Impact:** Billion-scale requires:
- Message queue (BullMQ, RabbitMQ) for long-running jobs
- Async PDF rendering (currently blocks request thread)
- Scheduled tasks for reconciliation, nightly reporting
- Job retry logic for failed integrations

---

### 2.2 Architectural Drawbacks

| Component | Readiness | Gap | Priority |
|-----------|-----------|-----|----------|
| **Transactions** | 90% | Audit log rollback | MEDIUM |
| **Error Handling** | 70% | Circuit breakers, retries | MEDIUM |
| **File Uploads** | 85% | S3, virus scan | HIGH |
| **Audit Logging** | 65% | Coverage gaps, tamper detection | HIGH |

#### 2.2.1 Transaction Handling: GOOD (90% ready)

**What exists:**
- Serializable isolation in critical paths (PostingService)
- Explicit transaction boundaries in accounting operations
- Tenant filters inside transactions
- Proper error handling with rollback

**What's missing:**
- No distributed transaction support (if multi-DB in future)
- No compensating transactions for partial failures
- **No transaction-level audit logging** (audit log is fire-and-forget outside TX)
  - Line 36-37 in audit.ts: "Don't fail the operation if audit logging fails"

**Gap Impact:** Audit trail gaps at scale. A failed audit log silently succeeds, creating unreconcilable accounting trails.

**Files:** `/apps/api/src/domains/accounting/services/posting.service.ts`

---

#### 2.2.2 Error Handling: PARTIAL (70% ready)

**What exists:**
- Typed error classes (27 accounting error codes) — `/apps/api/src/domains/accounting/errors.ts`
- Global error handler in Fastify
- Validation errors via Zod schemas

**What's missing:**
- No error recovery paths (idempotency keys, circuit breakers)
- No exponential backoff for external APIs (email, OpenAI, bank imports)
- No error telemetry/metrics (error rates, types not tracked)
- Missing timeout on long-running operations
- No dead letter queues for failed async operations

**Gap Impact:** 99.99% uptime (billion-scale requirement) needs graceful degradation. Current setup cascades failures.

---

#### 2.2.3 File Upload Handling: GOOD (85% ready)

**What exists:**
- Multipart streaming via `@fastify/multipart`
- Import service handles CSV/XLSX/PDF parsing
- Batch processing (BATCH_SIZE = 500 transactions)
- Error handling per transaction (doesn't fail entire batch)

**What's missing:**
- No S3/cloud storage (files stored locally, lost on restart)
- No virus scanning on uploads (no ClamAV integration)
- No duplicate file detection
- No file retention policies
- No quota enforcement per tenant

**Gap Impact:** Local file storage is non-starter for cloud production. Missing virus scanning is compliance gap (PCI-DSS, SOC 2).

---

#### 2.2.4 Audit Logging: BASIC (65% ready)

**What exists:**
- Audit log creation (`/apps/api/src/lib/audit.ts` @ 40 lines)
- Captures before/after snapshots
- 7 audit actions (Create, Update, Delete, Post, Approve, Void, Export)
- Called from critical operations (DocumentPosting, JournalEntry approvals)

**What's missing:**
- **No comprehensive audit trail** (not called from all financial operations)
  - Bulk operations not audited
  - Imports not audited
  - Export operations not audited
  - Transaction reconciliation matches not audited
- **Silent failures** (audit logging doesn't fail operation, but no retry)
- **No tamper detection** (immutable log storage not enforced)
- **No retention policies** (could grow unbounded)
- **No audit log encryption** (could contain sensitive data)

**Gap Impact:** SOC 2 / GDPR violations. Auditors require immutable audit logs with retention policies.

---

### 2.3 Financial Software Requirements

| Component | Readiness | Gap | Priority |
|-----------|-----------|-----|----------|
| **Multi-Currency** | 85% | Revaluation, consolidation | MEDIUM |
| **Fiscal Periods** | 50% | Period-based posting | MEDIUM |
| **Data Export** | 80% | XBRL, import parity | LOW |
| **Reconciliation** | 60% | AP/AR workflows | MEDIUM |

#### 2.3.1 Multi-Currency Handling: GOOD (85% ready)

**What exists:**
- 4-field currency pattern (JournalLine schema):
  ```prisma
  currency: String?              // ISO code
  exchangeRate: Float?           // Rate at posting (immutable)
  baseCurrencyDebit: Int?       // Converted to entity functionalCurrency
  baseCurrencyCredit: Int?      // Converted to entity functionalCurrency
  ```
- Historical exchange rates preserved
- Entity has `functionalCurrency` and `reportingCurrency`
- FX rate service with caching

**What's missing:**
- No revaluation/remeasurement on period close
- No IFRS/GAAP compliance for foreign exchange gains/losses
- No consolidation elimination accounting (model exists but unused)
- No inter-company elimination
- No deferred tax accounting for FX adjustments

**Gap Impact:** Supports multi-currency transactions but not consolidated/multi-entity accounting. Won't handle true global enterprises.

---

#### 2.3.2 Fiscal Year & Period Handling: BASIC (50% ready)

**What exists:**
- Fiscal calendar model (schema.prisma):
  ```prisma
  FiscalCalendar: id, entityId, year, startDate, endDate
  FiscalPeriod: id, fiscalCalendarId, periodNumber, status (OPEN, LOCKED, CLOSED)
  ```

**What's missing:**
- **Zero usage** of FiscalPeriod in actual accounting logic
  - Journal entries can be posted to any date without period validation
  - No "period locked" enforcement
  - No fiscal year rollover logic
  - No closing entries (revenue → retained earnings)
- No period-based reporting
- No month-end/quarter-end processes
- No GL close checklist

**Gap Impact:** Cannot prevent mid-close amendments. Fiscal close is manual, error-prone. Billion-scale enterprises need automated close workflows.

---

#### 2.3.3 Data Export/Import Formats: GOOD (80% ready)

**What exists:**
- ZIP export service (`/apps/api/src/domains/system/services/data-export.service.ts` @ 150+ lines)
  - Streaming to prevent memory exhaustion
  - Cursor-paginated reads (BATCH_SIZE = 500)
  - CSV format with formula injection prevention
  - Includes: Entities, GL accounts, journal entries, invoices, bills, accounts, transactions, payments, categories
  - Soft-deleted records optionally included
- Report export (PDF, CSV) for financial statements

**What's missing:**
- No XBRL/ixBRL export (required for regulatory reporting)
- No XML export (IIF format for QuickBooks migration)
- No GAAP-compliant GL export format
- No import counterpart (can export but can't reimport)

**Gap Impact:** Export exists but no standard GL export format. Migration from competitors' systems limited.

---

#### 2.3.4 Reconciliation Workflows: PARTIAL (60% ready)

**What exists:**
- Bank reconciliation service (ReconciliationService @ 120+ lines)
- Matching algorithm with confidence scoring:
  - Exact amount + date ±3 days + 70% description match = 95% confidence
  - Exact amount + date ±3 days = 80%
  - Exact amount + date ±7 days = 60%
  - Amount only = 40%
- Top 5 suggestions per transaction
- Match/unmatch operations with audit logging

**What's missing:**
- **No invoice/bill reconciliation** (only bank transactions)
- **No AP/AR aging** (invoice payment status tracking minimal)
- **No multi-step reconciliation workflows** (approve, reject, override)
- **No reconciliation exceptions report** (old unmatched items flagged)
- **No payment allocation** (one payment to multiple invoices handled elsewhere but not integrated)

**Gap Impact:** Works for bank-to-GL reconciliation but enterprise AP/AR workflows missing entirely.

---

### 2.4 Developer Experience & Maintainability

| Component | Readiness | Gap | Priority |
|-----------|-----------|-----|----------|
| **Test Coverage** | 95% | Integration tests | LOW |
| **API Documentation** | 0% | OpenAPI spec | MEDIUM |
| **Component Docs** | 0% | Storybook | LOW |
| **Deployment** | 60% | Docker, Kubernetes | HIGH |
| **Observability** | 50% | OpenTelemetry, metrics, alerts | CRITICAL |

#### 2.4.1 Test Coverage: EXCELLENT (95% ready)

**Metrics:**
- **47 test files** (excluding node_modules)
- **1009+ tests verified** (per MEMORY.md)
- **100% service coverage** (27/27 services)

**Test quality:**
- Financial invariant assertions present
- Integer cents validation
- Soft delete verification
- Tenant isolation tests
- Double-entry balanced assertions

**What's missing:**
- No integration tests (API → DB → API roundtrip)
- No contract tests (API consumer expectations)
- No chaos engineering (resilience to database failures)
- No load testing baseline
- Coverage reports not visible

**Gap Impact:** Unit tests strong but missing integration tests = subtle bugs only caught in production.

---

#### 2.4.2 API Documentation: MISSING (0% ready)

**What doesn't exist:**
- No OpenAPI/Swagger spec
- No interactive API explorer
- Routes documented only in code comments

**What exists:**
- Zod schemas define request/response contracts (good foundation)
- Routes well-organized by domain

**To ship billion-scale software:**
- OpenAPI spec generated from Zod schemas (via fastify-zod-openapi)
- Interactive Swagger UI for developers
- Endpoint inventory auto-updated on each deployment

**Gap Impact:** Onboarding new developers is slow. No machine-readable contract for mobile apps/integrations.

---

#### 2.4.3 Component Documentation: MISSING (0% ready)

**What doesn't exist:**
- No Storybook
- No component prop documentation
- No design system guide (exists in Figma, not web)

**What exists:**
- 31 UI components in `packages/ui/src/`
- Design tokens in `packages/design-tokens/`
- Figma design system (76 variables, 41+ components)

**To scale frontend team:**
- Storybook with all components + states
- Live design system documentation site
- Component usage examples in TypeScript

**Gap Impact:** Frontend scaling limited. New designers/developers must reverse-engineer from Figma.

---

#### 2.4.4 Deployment & CI/CD: BASIC (60% ready)

**What exists:**
- GitHub Actions CI pipeline (`/.github/workflows/ci.yml` @ 111 lines):
  ```yaml
  Jobs:
  1. Lint & Type Check (ESLint, TypeScript)
  2. Tests (Vitest on PostgreSQL 15 in Docker)
  3. Build (TypeScript → JavaScript)
  ```
  - Runs on push to main, PRs
  - Node 20
  - Parallel test job with live PostgreSQL service

**What's missing:**
- No deployment step (CI only, no CD)
- No staging environment
- No database migration testing
- No Docker image building/pushing
- No secrets management
- No Kubernetes manifests
- No performance regression detection
- No security scanning (no SAST, no supply chain checks)

**To ship to production:**
- Add deployment step (staging on PR, prod on merge)
- Database migration verification in CI
- Docker image building + pushing to registry
- Helm charts for Kubernetes
- ArgoCD for GitOps
- OWASP dependency scanning

**Gap Impact:** MVP can ship, but multi-instance production deployment is manual/error-prone.

---

#### 2.4.5 Monitoring & Observability: BASIC (50% ready)

**What exists:**
- Structured logging via Pino (JSON output, machine-readable)
- Request logger in Fastify (`request.log.info()`)
- Error tracking (try/catch with logging, no external service)
- Health check endpoint (HealthService)
- Rate limit headers (x-ratelimit-*)

**What's missing:**
- **No distributed tracing** (no OpenTelemetry, no Jaeger/Datadog)
- **No metrics** (request latency, error rates, database query times)
- **No alerting** (no PagerDuty, no Slack alerts)
- **No log aggregation** (logs go to stdout, not centralized)
- **No APM** (no New Relic, Datadog)
- **No synthetic monitoring** (no uptime checks)
- **No usage analytics** (how many companies, transactions, reports generated?)

**To operate billion-scale system:**
- OpenTelemetry instrumentation (auto-traces for HTTP, database)
- Metrics: Prometheus format (latency histograms, error rates, cache hit rates)
- Centralized logging (ELK, Datadog, Splunk)
- Alerting (PagerDuty, Slack)
- Dashboards (Grafana, Datadog)

**Gap Impact:** Operations team flies blind. Cannot diagnose production incidents without logs.

---

## SECTION 3: RECOMMENDATIONS

### 3.1 Documentation Fixes (No Implementation)

**HIGH PRIORITY**
1. Add plan-enforcement.md to CLAUDE.md Tier 1 structure
2. Consolidate logging rules (keep full version in api-conventions.md, update guardrails.md reference)
3. Elevate source preservation to explicit 5th invariant in guardrails.md
4. Archive .reviews/ contents to docs/reviews/ or clarify purpose

**MEDIUM PRIORITY**
5. Add verification dates to rules files (for staleness tracking)
6. Document MEMORY.md onboarding process in CLAUDE.md
7. Add double-entry to guardrails.md (currently scattered)

**LOW PRIORITY**
8. Create plan-enforcement.md pointer in guardrails.md

---

### 3.2 Architectural Hardening (Phase 6+)

**CRITICAL PATH TO MVP LAUNCH (Phase 6)**
1. Deployment automation (CI/CD to staging/prod)
2. Observability (centralized logging, error tracking)
3. File storage (S3 migration from local filesystem)

**POST-MVP FOR INSTITUTIONAL READINESS (Phase 7+)**
1. Job queuing (BullMQ, async PDF/email/imports)
2. Distributed caching (Redis for multi-instance)
3. Audit compliance (tamper-proof logs, retention policies)
4. Fiscal close (period-based posting, closing entries)
5. AP/AR reconciliation (invoice payment workflows)
6. Consolidation accounting (multi-entity elimination)
7. GAAP reporting (GL export, multi-currency revaluation)

---

## SECTION 4: READINESS SUMMARY

### 4.1 Overall Readiness by Stage

| Stage | Readiness | Timeline | Blockers |
|-------|-----------|----------|----------|
| **MVP Launch (Phase 6)** | 80% | 2-4 weeks | Deployment, observability, S3 |
| **Early Scale (100K users)** | 75% | 2-3 months | Redis, job queuing, integration tests |
| **Institutional (1M+ users)** | 55% | 8-12 months | Fiscal close, AP/AR workflows, consolidation |
| **Billion-Dollar Scale** | 40% | 12-18 months | Distributed tracing, APM, GAAP compliance |

---

### 4.2 Critical Gaps by Priority

**CRITICAL (Blocks MVP)**
- Observability: No OpenTelemetry, metrics, alerts
- Job Queuing: All operations synchronous
- Deployment: No Docker, Kubernetes, secrets management

**HIGH (Blocks Scale)**
- Caching: In-memory only; Redis needed
- File Storage: Local filesystem (not cloud)
- Audit Logging: Coverage gaps, no tamper detection

**MEDIUM (Blocks Institutional)**
- Fiscal Periods: Model exists but unused
- Multi-Currency: Missing revaluation, consolidation
- Reconciliation: AP/AR workflows missing
- API Documentation: No OpenAPI spec

**LOW (Nice to Have)**
- Integration tests
- Storybook
- Database indexing improvements

---

## SECTION 5: CONCRETE FILE LOCATIONS

### Production-Ready Components
```
Rate limiting:      /apps/api/src/middleware/rate-limit.ts
Query optimization: /apps/api/src/domains/accounting/services/posting.service.ts
Transaction handling: prisma.$transaction() throughout services
Test coverage:      47 .test.ts files, 1009+ tests
Financial rules:    /packages/db/prisma/schema.prisma
```

### Gap Locations (Priority for Hardening)
```
Caching:            /apps/api/src/domains/accounting/services/report-cache.ts (no Redis)
Deployment:         /.github/workflows/ci.yml (basic CI only)
Observability:      /apps/api/src/lib/logger.ts (Pino only, no APM)
Job queuing:        None; all operations synchronous
API docs:           None; no OpenAPI spec
Storybook:          None; components at /packages/ui/src/ (31 files)
Audit gaps:         /apps/api/src/lib/audit.ts (40 lines, not comprehensive)
Fiscal close:       FiscalPeriod model exists but unused in journal entry logic
```

---

## CONCLUSION

**Knowledge Management:** Well-structured but plan-enforcement.md missing from Tier 1. Logging rules duplicated with gaps.

**Prompt Consistency:** New chats will have 95% of essential context. Domain-specific CLAUDE.md files must be explicitly read.

**Architectural Maturity:** Solid foundation for MVP (80% ready). Institutional scale needs 8-12 month hardening phase.

**Technical Debt:** Strategic duplication is intentional. Problematic duplication in logging rules needs consolidation.

**Bottom Line:** Ship MVP now with Phase 6 deployment automation. For billion-dollar institutional accounting, focus next 12 months on observability, async processing, and compliance workflows.

---

## SECTION 6: SYSTEMATIC IMPLEMENTATION PLAN

### 6.1 Multi-Agent Coordination System

**Problem:** Current system (TASKS.md, TodoWrite, STATUS.md) doesn't support parallel agent visibility.

**Solution: ACTIVE-WORK.md (Live Session State)**

**Location:** `ACTIVE-WORK.md` (root directory)

**Structure:**
```markdown
# Active Work Sessions

**Last Updated:** [auto-timestamp]

## Current Sessions

| Agent ID | Started | Working On | Status | Branch |
|----------|---------|------------|--------|--------|
| agent-ab5c159 | 2026-02-17 10:30 | P0-1: CSV injection fix | in_progress | feature/csv-fix |
| agent-cd7e284 | 2026-02-17 10:45 | P0-2: GL opening balance | in_progress | feature/gl-balance |

## Completed Today

| Task ID | Agent ID | Completed | Commit | Duration |
|---------|----------|-----------|--------|----------|
| P0-5 | agent-ab5c159 | 10:15 | abc1234 | 25 min |

## Task Allocation (Prevents Conflicts)

| Task ID | Type | Assigned To | Reserved Until |
|---------|------|-------------|----------------|
| P0-1 | Fix | agent-ab5c159 | 2026-02-17 12:00 |
| P0-2 | Fix | agent-cd7e284 | 2026-02-17 13:00 |
```

**Update Triggers:**
- `/processes:begin` — Register agent session, claim task
- TodoWrite with `in_progress` — Update "Working On" column
- TodoWrite with `completed` — Move to "Completed Today"
- `/processes:end-session` — Archive session to `docs/archive/sessions/`

**Benefits:**
- Real-time visibility into parallel work
- Prevents duplicate task assignment
- Tracks who completed what (context retention)
- Auto-cleanup via end-session

---

### 6.2 Roadmap Integration Strategy

**Decision: Hybrid Approach — Enhance Phase 6, Add Optional Phase 7**

#### Phase 6 (Revised): Launch MVP + Hardening

**Split into 3 parallel tracks:**

**Track A: Security & Data Integrity (P0 fixes)**
- Fix Phase 5 P0s (5 issues, ~4 hours)
- Fix Weekly Audit P0s (5 issues, ~5 hours)
- Security audit (OWASP top 10)
- SQL injection testing
- CSRF protection review

**Track B: Performance & Observability (P1 fixes)**
- Fix Phase 5 P1s (13 issues, ~6 hours)
- Replace console.log with pino (7 files)
- Add loading/error states (42 pages, ~2 hours)
- Database indexes for hot paths
- Structured logging implementation

**Track C: Quality & Documentation**
- Fix npm vulnerabilities (14 vulns)
- Update stale docs (STATUS, ROADMAP, CLAUDE.md files)
- Add service tests for uncovered domains
- E2E tests for critical flows
- User documentation

**Effort:** 35-45 hours total (can parallelize with 3 agents → ~12-15 hours wall time)

#### Phase 7 (Optional Post-Launch): Scale & Polish

**Scope:** P2 fixes (26 issues, ~15 hours)
- N+1 query optimization
- Advanced caching strategies
- Keyboard shortcuts
- Advanced RBAC (4 roles → 6 roles)
- Consolidation accounting
- GAAP reporting formats

---

### 6.3 Key Invariants Expansion

**Analysis:** Current 5 invariants well-enforced. Audit findings suggest 2 critical additions.

#### Current 5 Invariants (Keep)
1. Tenant Isolation (tenantId filter everywhere)
2. Integer Cents (no floats for money)
3. Double-Entry (debits === credits)
4. Soft Delete (deletedAt, never hard delete)
5. Source Preservation (sourceDocument snapshots)

#### Recommended New Invariants (2)

**6. Page Loading States (MANDATORY)**
- Every `page.tsx` under `(dashboard)/` MUST have sibling `loading.tsx` and `error.tsx`
- **Rationale:** 42/45 pages missing (93% gap) = systemic UX blocker
- **Hook enforcement:** Pre-commit check (grep for page.tsx without loading/error siblings)
- **Why zero-tolerance:** Blank screens on data fetch = terrible UX

**7. No Server/Client Module Mixing**
- Files MUST NOT mix server-only imports (`prisma`, `fs`, `node:*`) with client-only code (`'use client'`)
- **Rationale:** 5 P0 runtime crashes in Phase 5 review
- **Hook enforcement:** AST check for mixed imports (or rely on Next.js build errors)
- **Why zero-tolerance:** Runtime crashes, bundler instability

**Decision: 7 invariants is approaching "hard to remember" limit. Mitigate with:**
- Print all 7 in `/processes:begin` dashboard
- Hook enforcement catches violations before commit
- Pre-flight checklist includes loading/error and mixed imports checks

**Rejected Candidates:**
- Structured Logging (pino only) — Not zero-tolerance; acceptable in pre-boot code
- Async Operations via Job Queue — Not required for MVP scale
- APM/OpenTelemetry Required — Nice-to-have, not blocking
- Audit Log Completeness — Design pattern, not hard rule

---

### 6.4 Task Granularity & Dependencies

**Current Problem:** TASKS.md uses broad task IDs ("BE-3.1: Chart of Accounts API" covers 7 endpoints, no sub-dependencies)

**Solution: 3-Level Task Hierarchy**

#### Level 1: Phase Tasks (existing, in TASKS.md)
- Keep current BE-X.Y, FE-X.Y pattern
- Add new prefixes for hardening work:
  - **SEC-X:** Security fixes (tenant isolation, injection, auth)
  - **PERF-X:** Performance fixes (caching, indexes, N+1)
  - **QUAL-X:** Quality fixes (tests, docs, type safety)
  - **INF-X:** Infrastructure (CI/CD, monitoring, deployments)

#### Level 2: Sub-Tasks (new, in TASKS.md or plan files)
- Nest under Level 1 with indentation
- Track dependencies explicitly with `[dependency: X]` notation

#### Level 3: TodoWrite Items (session-scoped, ephemeral)
- Used during active work only
- Maps to Level 2 sub-task
- Not persisted to TASKS.md (cleaned up via end-session)

**Example TASKS.md (Phase 6):**

```markdown
## Phase 6: Launch MVP + Hardening

### Track A: Security & Data Integrity

- [ ] **SEC-6.1:** Fix Phase 5 P0 Security Issues (~4 hours)
  - [ ] SEC-6.1a: Client/Vendor tenant isolation in data export (15 min) [dependency: none]
  - [ ] SEC-6.1b: CSV injection fix in report-export service (15 min) [dependency: none]
  - [ ] SEC-6.1c: GL opening balance calculation (1-2 hr) [dependency: GL ledger query understanding]
  - [ ] SEC-6.1d: Split reports.ts server/client (30 min) [dependency: none]
  - [ ] SEC-6.1e: GL "Load More" Server Action (15 min) [dependency: SEC-6.1d]

### Track B: Performance & Observability

- [ ] **PERF-6.1:** Fix Phase 5 P1 Performance Issues (~6 hours)
  - [ ] PERF-6.1a: Cache all 7 reports (1 hr) [dependency: report-cache.ts understanding]
  - [ ] PERF-6.1b: Cash Flow sign convention (2-3 hr) [dependency: Cash Flow query]
  - [ ] PERF-6.1c: Multi-entity currency validation (30 min) [dependency: none]

- [ ] **PERF-6.2:** Replace console.log with Pino (~2 hours)
  - [ ] PERF-6.2a: Wire up pino in Fastify (30 min) [dependency: none]
  - [ ] PERF-6.2b: Replace 7 production console.log calls (1 hr) [dependency: PERF-6.2a]
  - [ ] PERF-6.2c: Add request-scoped logging (30 min) [dependency: PERF-6.2a]

### Track C: Quality & Documentation

- [ ] **QUAL-6.1:** Add Loading/Error States (~2 hours)
  - [ ] QUAL-6.1a: Create templates (15 min) [dependency: none]
  - [ ] QUAL-6.1b: Accounting pages (6 pages, 30 min) [dependency: QUAL-6.1a]
  - [ ] QUAL-6.1c: Banking pages (5 pages, 30 min) [dependency: QUAL-6.1a]
  - [ ] QUAL-6.1d: Remaining domains (19 pages, 45 min) [dependency: QUAL-6.1a]

- [ ] **QUAL-6.2:** Fix NPM Vulnerabilities (30 min)
  - [ ] QUAL-6.2a: Run npm audit fix (15 min) [dependency: none]
  - [ ] QUAL-6.2b: Review breaking changes (15 min) [dependency: QUAL-6.2a]

- [ ] **QUAL-6.3:** Update Stale Documentation (1 hour)
  - [ ] QUAL-6.3a: STATUS.md (test counts, pages, Phase 5 status) (15 min) [dependency: none]
  - [ ] QUAL-6.3b: ROADMAP.md (Phase 5 complete, Phase 6 breakdown) (15 min) [dependency: none]
  - [ ] QUAL-6.3c: packages/db/CLAUDE.md (39 models, OnboardingProgress) (15 min) [dependency: none]
  - [ ] QUAL-6.3d: apps/web/CLAUDE.md (45 pages, new components) (15 min) [dependency: none]
```

**Dependency Notation:**
- `[dependency: none]` = can start immediately (parallel-friendly)
- `[dependency: TASK-ID]` = blocked until TASK-ID complete
- `[dependency: <knowledge>]` = needs understanding of X before starting

**Benefits:**
- Clear task breakdown (no 40-hour monoliths)
- Explicit dependencies (prevents premature work)
- Easy to assign to parallel agents (pick any `dependency: none` task)
- Maps cleanly to TodoWrite (agent creates TodoWrite items during session)

---

### 6.5 Progress Visibility Enhancement

**Current Problem:** STATUS.md metrics manually updated, often stale (235 tests shown, actual 1009)

**Solution: Hybrid Manual + Automated Tracking**

#### STATUS.md Enhancement (Semi-Automated)

**Add Track Progress Table:**
```markdown
## Phase 6 Progress (Track A/B/C)

| Track | Tasks | Complete | In Progress | Not Started | % Done |
|-------|-------|----------|-------------|-------------|--------|
| Security & Integrity | 10 | 2 | 3 | 5 | 20% |
| Performance & Obs | 12 | 0 | 2 | 10 | 0% |
| Quality & Docs | 8 | 5 | 1 | 2 | 62% |
| **Total Phase 6** | **30** | **7** | **6** | **17** | **23%** |

**Last Updated:** 2026-02-17 14:30 (auto-updated via `/processes:eod`)

### Active Work (Real-Time)
See [ACTIVE-WORK.md](./ACTIVE-WORK.md) for current session state.
```

**Add P0/P1 Fixes Status Table:**
```markdown
### P0/P1 Fixes Status

| Finding | Type | Priority | Status | Assignee | ETA |
|---------|------|----------|--------|----------|-----|
| CSV injection incomplete | Security | P0 | ✅ Complete | agent-ab5c159 | — |
| GL opening balance | Financial | P0 | 🔄 In Progress | agent-cd7e284 | 2h |
| Client/Vendor tenant isolation | Security | P0 | ⏳ Not Started | — | — |
| Mixed server/client module | Architecture | P0 | ⏳ Not Started | — | — |
```

**Add Auto-Updated Metrics Table:**
```markdown
### Test Coverage (Auto-Updated)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Backend Tests | 1009 | 1100+ | ⚠️ 91% |
| Service Coverage | 27/27 | 27/27 | ✅ 100% |
| TypeScript Errors | 0 | 0 | ✅ |
| Frontend Tests | 55 | 100+ | ⚠️ 55% |
| Loading States | 3/45 | 45/45 | ❌ 7% |
| NPM Vulnerabilities | 14 (5 high) | 0 | ❌ |

_Test counts updated via `/processes:eod` using `npm test -- --reporter=json` output parsing._
```

#### Automated Metrics Collection Script

**Create:** `.claude/scripts/update-metrics.sh`

```bash
#!/bin/bash
# Auto-extract metrics for STATUS.md

# Backend test count
cd apps/api && npm test -- --reporter=json > /tmp/api-test-results.json
BACKEND_TESTS=$(jq '.numPassedTests' /tmp/api-test-results.json)

# Frontend test count
cd ../web && npm test -- --reporter=json > /tmp/web-test-results.json
FRONTEND_TESTS=$(jq '.numPassedTests' /tmp/web-test-results.json)

# TypeScript errors
TSC_ERRORS=$(npm run typecheck 2>&1 | grep -c "error TS")

# NPM vulnerabilities
NPM_VULNS=$(npm audit --json | jq '.metadata.vulnerabilities | to_entries | map(.value) | add')

# Loading state coverage
PAGES=$(find apps/web/src/app/\(dashboard\) -name "page.tsx" | wc -l)
LOADING=$(find apps/web/src/app/\(dashboard\) -name "loading.tsx" | wc -l)

echo "BACKEND_TESTS=$BACKEND_TESTS"
echo "FRONTEND_TESTS=$FRONTEND_TESTS"
echo "TSC_ERRORS=$TSC_ERRORS"
echo "NPM_VULNS=$NPM_VULNS"
echo "LOADING_COVERAGE=$LOADING/$PAGES"
```

**Called by:** `/processes:eod` workflow

**Benefits:**
- Metrics always accurate (automated extraction)
- Track-based progress shows multi-agent coordination
- Real-time active work visibility via ACTIVE-WORK.md
- Historical trend tracking (weekly audit scores: 55/100 → 70/100 → 85/100)

---

### 6.6 Workflow Integration

#### 6.6.1 `/processes:begin` 3-Tier System

**Problem:** Current `/processes:begin` is designed for once-per-day standup, but if used as entry point for every parallel agent, it becomes too heavy.

**Solution: Session-Aware Begin**

**Tier 1: Full Standup (first session of day)**
```markdown
## Session Dashboard (Full Context)

### Your Context
- Current Branch: feature/phase5-reports
- Last Commit: 2h ago (247d35d: Update status and tasks)
- Uncommitted Files: 5 modified, 2 new

### Git Status
[Full git status output]

### Available Tasks
[Full TASKS.md with Track A/B/C breakdown]

### 7 Key Invariants
1. Tenant Isolation — every query filters by tenantId
2. Integer Cents — no floats for money
3. Double-Entry — SUM(debits) === SUM(credits)
4. Soft Delete — financial records use deletedAt
5. Source Preservation — journal entries store sourceDocument
6. **Page Loading States** — every page.tsx has loading.tsx + error.tsx
7. **Server/Client Separation** — no mixed server/client modules

### Recommendations
- [ ] Commit uncommitted dashboard redesign (5 files)
- [ ] Update STATUS.md (1009 tests not reflected)
- [ ] Fix 5 P0 issues from Phase 5 review
```

**When to use:** `/processes:begin` with no arguments, first session after >2 hours

---

**Tier 2: Quick Claim (subsequent sessions)**
```markdown
## Quick Claim (Lightweight)

**Current Branch:** feature/phase5-reports
**Last Session:** 45 min ago (agent-ab5c159 on SEC-6.1b)

### Available Tasks (dependency: none)
- [ ] SEC-6.1c: GL opening balance (1-2 hr, P0)
- [ ] QUAL-6.1a: Create loading/error templates (15 min, P0)
- [ ] PERF-6.2a: Wire up pino in Fastify (30 min, P1)

### Active Work (Other Agents)
- agent-ab5c159: SEC-6.1b (CSV injection) — started 10:30, 45 min ago
- agent-cd7e284: PERF-6.1a (Cache reports) — started 11:00, 15 min ago

**Pick a task or type your own goal.**
```

**When to use:** `/processes:claim [task-id]` or `/processes:begin` within 2 hours of last session

**Agent actions:**
1. Read ACTIVE-WORK.md
2. Check if task claimed
3. Update ACTIVE-WORK.md with new session
4. Create minimal TodoWrite (3-4 items)
5. Start work

---

**Tier 3: No Process (ad-hoc work)**

**When to use:** Direct instruction with no "begin"

**What happens:**
- Agent proceeds directly without session overhead
- No ACTIVE-WORK.md update (ephemeral work)
- No TodoWrite (not multi-step)
- Still follows guardrails, still checks MEMORY on errors

**Examples:**
- "Fix typo in README" → Reads, fixes, commits (no ceremony)
- "Run tests" → Executes tests, reports results
- "What does this function do?" → Reads, explains

---

#### 6.6.2 Direct Instruction Handling (No "begin")

**When user gives instruction WITHOUT `/processes:begin`:**

**Agent Decision Tree:**

```python
def handle_direct_instruction(user_input):
    # Step 1: Check if task exists in TASKS.md
    task_match = grep(user_input, "TASKS.md")

    if task_match:
        # Step 2: Check if already claimed
        active_work = read("ACTIVE-WORK.md")

        if task_match in active_work:
            return conflict_warning(task_match, active_work)
        else:
            return ask_claim_or_adhoc(task_match)

    # Step 3: Not in TASKS.md — assess type
    work_type = classify(user_input)  # Bug, Feature, Research, Refactor

    if work_type == "Bug":
        severity = assess_bug_severity(user_input)
        if severity == "P0":
            return recommend_add_to_phase6_track_a()
        else:
            return ask_add_to_phase6_or_defer()

    elif work_type == "Feature":
        phase = assess_feature_phase(user_input)

        if phase == "Phase 6":
            return recommend_add_to_phase6()
        elif phase == "Phase 7":
            return warn_skipping_ahead()
        else:
            return recommend_brainstorm_first()

    elif work_type == "Research":
        return recommend_brainstorm_workflow()

    elif work_type == "Refactor":
        if is_blocking_mvp():
            return recommend_add_to_phase6_track_c()
        else:
            return ask_defer_to_phase7()
```

---

**Scenario 1: Task Exists in TASKS.md AND Not Claimed**

Example: `"Fix the CSV injection bug"`

**Agent Response:**
```markdown
📋 **Task Match Found: SEC-6.1b**

This work matches an existing task in Phase 6, Track A:
- **SEC-6.1b:** CSV injection fix in report-export service (15 min)
- **Priority:** P0 (Security)
- **Dependencies:** None (can start immediately)
- **Status:** Available (not claimed)

**Options:**
1. ✅ **Claim formally** — Updates ACTIVE-WORK.md, prevents duplicates, tracked in Phase 6 progress
2. ⚡ **Proceed as ad-hoc** — Faster, no ceremony, but won't be tracked in Phase 6 metrics

Which approach do you prefer?
```

---

**Scenario 2: Task Exists BUT Already Claimed**

Example: `"Fix the CSV injection bug"` (while agent-ab5c159 is working on it)

**Agent Response:**
```markdown
⚠️ **Task Conflict Detected: SEC-6.1b**

This task is currently claimed by another agent:
- **Agent ID:** agent-ab5c159
- **Started:** 10:30 (45 min ago)
- **Expected completion:** 15 min (likely finishing soon)

**Options:**
1. 🔄 **Wait for completion** — Check back in 5-10 min
2. 🤝 **Coordinate** — I can check if it's actually in progress (read recent commits)
3. 🆕 **Pick different task** — Here are 3 other available P0 tasks:
   - SEC-6.1c: GL opening balance (1-2 hr)
   - SEC-6.1d: Split reports.ts server/client (30 min)
   - QUAL-6.1a: Create loading/error templates (15 min)

Which would you like to do?
```

---

**Scenario 3: Task NOT in TASKS.md (New Work)**

Example: `"Add dark mode toggle to settings page"`

**Agent Response:**
```markdown
🆕 **Unplanned Work Detected: Dark Mode Toggle**

This task is not currently in TASKS.md or any active phase.

**Analysis:**
- **Type:** Feature addition (new UI component)
- **Estimated effort:** ~1-2 hours (component + tests + integration)
- **Impact:** Frontend only (apps/web/), low risk

**Recommended placement:**
- **Option A:** Add to Phase 6, Track C (Quality) as **QUAL-6.4**
  - Rationale: Non-critical UX enhancement, fits "polish" category
- **Option B:** Defer to Phase 7 (Post-Launch Polish)
  - Rationale: Not blocking MVP, can wait until after launch
- **Option C:** Proceed as ad-hoc work (no tracking)
  - Rationale: Quick experiment, not committing to long-term maintenance

**My recommendation:** Option A (add to Phase 6, Track C)

Should I:
1. Add QUAL-6.4 to TASKS.md and proceed with implementation?
2. Just implement it now as ad-hoc work (faster, no formal tracking)?
3. Defer it to Phase 7 and work on a different task instead?
```

---

**Scenario 4: User Jumps Ahead of Plan (Phase N+1 while Phase N Incomplete)**

Example: `"Implement Redis caching"` (Phase 7 scope, Phase 6 at 23%)

**Agent Response:**
```markdown
⚠️ **Skipping Ahead Detected: Redis Caching (Phase 7)**

This work is planned for **Phase 7 (Post-Launch)**, but we're currently in **Phase 6 (23% complete)**.

**Current Phase 6 Status:**
- Track A (Security): 20% complete (2/10 tasks)
- Track B (Performance): 0% complete (0/12 tasks)
- Track C (Quality): 62% complete (5/8 tasks)

**Blocking Phase 6 P0 Issues:**
- SEC-6.1b: CSV injection (15 min)
- SEC-6.1c: GL opening balance (1-2 hr)
- PERF-6.1a: Cache all 7 reports (1 hr) ← **This is related!**

**Analysis:**
- Redis caching is a **more complex** version of PERF-6.1a (in-memory cache)
- Jumping to Redis now **skips the simpler MVP solution**
- Phase 6 aims for "good enough to launch", Phase 7 is "scale optimization"

**Recommendation:**
Implement PERF-6.1a (in-memory cache) first, then upgrade to Redis in Phase 7.

**Options:**
1. ✅ **Stick to plan** — Do PERF-6.1a (in-memory cache, 1 hr) now
2. ⚡ **Skip ahead anyway** — Implement Redis now (adds ~2-3 hr scope creep)
3. 🔄 **Revise plan** — Promote Redis to Phase 6 (requires updating ROADMAP.md)

Which approach?
```

---

**Scenario 5: Bug Fix (Not in TASKS.md, Severity-Based Routing)**

Example: `"Fix invoice date timezone bug"`

**Agent Response (if P0):**
```markdown
🐛 **Bug Fix: Invoice Date Timezone Issue**

This is not currently tracked in TASKS.md.

**Severity Assessment:**
- **Type:** Data accuracy bug (financial records)
- **Priority:** P0 (affects all invoice dates)
- **Estimated fix:** 30 min - 1 hr

**This should be added to Phase 6, Track A (Security & Data Integrity).**

**Proposed task:**
- [ ] **SEC-6.1f:** Fix invoice date timezone bug (30 min - 1 hr) [dependency: none]

**Options:**
1. ✅ **Add to TASKS.md as SEC-6.1f** and fix now (tracked as Phase 6 work)
2. ⚡ **Fix immediately** as ad-hoc work (faster, but not tracked)
3. 🔍 **Diagnose first** via `/processes:diagnose` (for complex bugs)

**My recommendation:** Option 1 (add to Phase 6, Track A)

Proceed?
```

---

**Agent MUST Ask Confirmation For:**
- Adding new tasks to TASKS.md
- Skipping ahead to Phase 7
- Proceeding with claimed tasks
- Destructive actions
- Vague/ambiguous requests

**Agent MAY Proceed Directly For:**
- Clear ad-hoc work (<10 min, no risk)
- Documentation fixes (README, comments)
- Test-only changes
- Git operations (status, log, diff)

---

#### Task Claiming Flow (Formal Path)

```
User: "Start SEC-6.1b" OR chooses Option 1 (Claim formally)

Agent workflow:
1. Read ACTIVE-WORK.md
2. Check if SEC-6.1b is claimed by another agent
3. If free: Update ACTIVE-WORK.md with agent ID, timestamp, task ID
4. If claimed: Suggest next available task from dependency tree
5. Create TodoWrite session plan
6. Proceed with work
```

#### `/processes:eod` Enhancement

**Add automated tasks:**
```markdown
EOD workflow (automated):
1. Run update-metrics.sh → extract test counts, TS errors, vulns
2. Update STATUS.md metrics table
3. Update TASKS.md task completion (checkboxes)
4. Archive ACTIVE-WORK.md to docs/archive/active-work/2026-02-17.md
5. Clear ACTIVE-WORK.md for tomorrow
6. Update MEMORY.md with learnings
7. Generate session summary report
```

---

### 6.7 Example Parallel 3-Agent Workflow

**9:00 AM — Agent A starts**
```
/processes:begin
→ Reads ACTIVE-WORK.md (empty)
→ Claims SEC-6.1b: CSV injection fix
→ Updates ACTIVE-WORK.md:
  | agent-ab5c159 | 09:00 | SEC-6.1b: CSV injection | in_progress | feature/csv-fix |
→ Creates TodoWrite with 4 sub-tasks
```

**9:30 AM — Agent B starts**
```
/processes:begin
→ Reads ACTIVE-WORK.md (sees Agent A on SEC-6.1b)
→ Dashboard shows "Agent A working on SEC-6.1b (30 min ago)"
→ Claims SEC-6.1c: GL opening balance (dependency-free)
→ Updates ACTIVE-WORK.md (no conflict, different task)
```

**10:00 AM — Agent C starts**
```
/processes:begin
→ Reads ACTIVE-WORK.md (sees Agent A, Agent B active)
→ Claims QUAL-6.1a: Loading templates (different track, no conflict)
→ Updates ACTIVE-WORK.md (3 agents working in parallel)
```

**10:15 AM — Agent A completes**
```
/processes:end-session
→ Commits changes (commit abc1234)
→ Updates ACTIVE-WORK.md (moves to "Completed Today")
→ Updates TASKS.md: [x] SEC-6.1b (commit abc1234)
→ Archives session to docs/archive/sessions/
```

**Result:** 3 agents complete 8 tasks in one day with zero conflicts.

---

### 6.8 Implementation Checklist

**New Files to Create:**

1. **ACTIVE-WORK.md** (root)
   - Live session state
   - Updated by `/processes:begin`, TodoWrite, `/processes:end-session`
   - Archived daily to `docs/archive/active-work/YYYY-MM-DD.md`

2. **.claude/scripts/update-metrics.sh**
   - Auto-extract test counts, TS errors, npm vulns, loading state coverage
   - Called by `/processes:eod`

3. **docs/phase-6-tasks.md** (detailed task breakdown)
   - 3-level hierarchy with dependencies
   - Can be imported into TASKS.md or kept separate

**Modified Files:**

1. **TASKS.md** — Add Phase 6 structure with SEC/PERF/QUAL/INF prefixes, Track A/B/C sections
2. **STATUS.md** — Add track progress table, P0/P1 fixes status, auto-updated metrics
3. **ROADMAP.md** — Update Phase 6 (split into Track A/B/C), add optional Phase 7
4. **.claude/rules/guardrails.md** — Add Invariants 6 & 7, update pre-flight checklist
5. **.claude/hooks/hard-rules.sh** — Enforce new invariants (page loading states, mixed imports)
6. **.claude/rules/plan-enforcement.md** — Update to handle ACTIVE-WORK.md claiming flow

---

### 6.9 Success Metrics

**After implementing this system, we should see:**

| Metric | Before | After (Target) |
|--------|--------|----------------|
| Task conflicts (duplicate work) | Unknown | 0 per week |
| Stale docs (days outdated) | 5+ days | <1 day |
| Parallel agent efficiency | N/A | 3 agents complete 8 tasks/day |
| Context freshness (audit score) | 58/100 | 90/100 |
| Progress visibility ("% Phase 6 done?") | Manual guess | Automated, real-time |
| Time to claim next task | N/A | <2 min (clear dependency tree) |

---

### 6.10 Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| ACTIVE-WORK.md becomes stale | Auto-cleanup via `/processes:eod`, 2-hour timeout for "reserved" tasks |
| Too many invariants (7) to remember | Print all 7 in `/processes:begin`, enforce via hooks |
| 3-level task hierarchy too complex | Keep Level 1 in TASKS.md, Level 2 in plan files, Level 3 ephemeral |
| Automated metrics script breaks | Graceful fallback to manual update, log error |
| Agents don't update ACTIVE-WORK.md | Enforce via `/processes:begin` (can't start without claiming task) |

---

### 6.11 Summary Recommendation

**Extend current system with:**

1. **ACTIVE-WORK.md** — Live session coordination (who's working on what now)
2. **SEC/PERF/QUAL/INF task prefixes** — Separate hardening from feature work
3. **3-level task hierarchy** — Phase → Sub-task → TodoWrite
4. **Dependency notation** — `[dependency: X]` to prevent premature work
5. **2 new invariants** — Page Loading States (6), Server/Client Separation (7)
6. **Semi-automated metrics** — `update-metrics.sh` run by `/processes:eod`
7. **Track-based Phase 6** — Security, Performance, Quality (parallel-friendly)
8. **Optional Phase 7** — P2 scope (post-launch polish)

**Don't replace:** TASKS.md, STATUS.md, ROADMAP.md — enhance them.

**Don't over-automate:** Keep strategic decisions manual (phase completion, architecture narratives).

**Don't add excessive overhead:** 3-minute task claiming flow, 2-minute EOD metrics update.

**This system balances:**
- **Parallel agent coordination** (via ACTIVE-WORK.md)
- **Feature vs hardening tracking** (via task prefixes)
- **Clear progress visibility** (via automated metrics and track-based breakdowns)
- **Zero duplicate work** (via task claiming and dependency trees)

---

**Files Referenced:**
- CLAUDE.md, MEMORY.md, STATUS.md, TASKS.md, ROADMAP.md
- .claude/rules/*.md (9 files)
- apps/api/CLAUDE.md, apps/web/CLAUDE.md, packages/db/CLAUDE.md
- docs/context-map.md, docs/standards/*.md
- /apps/api/src/middleware/rate-limit.ts
- /apps/api/src/domains/accounting/services/report-cache.ts
- /apps/api/src/domains/accounting/services/posting.service.ts
- /packages/db/prisma/schema.prisma
- /.github/workflows/ci.yml
- /apps/api/src/lib/audit.ts

---

## SECTION 7: IMPLEMENTATION ROADMAP

### 7.1 Execution Strategy: Infrastructure First

**Decision:** Build tracking/coordination infrastructure BEFORE implementing Phases 1-5 features.

**Rationale:**
- ✅ Every new task added has proper tracking from day 1
- ✅ Multi-agent parallelization works immediately
- ✅ Metrics auto-updated as features land (no manual staleness)
- ✅ No retrofitting — TASKS.md uses new format from start
- ✅ Clean slate — ACTIVE-WORK.md starts empty
- ✅ Time budget allows 4-6 hour upfront investment

**Trade-off Accepted:** Feature delivery delayed by 1-2 days, but infrastructure quality justifies delay.

---

### 7.2 Phase 0: Infrastructure Implementation (4-6 hours)

**Objective:** Build complete tracking system before starting Phase 1-5 features.

**Success Criteria:**
- [ ] ACTIVE-WORK.md tracks parallel agent sessions
- [ ] TASKS.md uses SEC/PERF/QUAL/INF structure
- [ ] /processes:begin has 3-tier system (Full/Quick/None)
- [ ] /processes:eod auto-updates metrics
- [ ] 7 Key Invariants enforced via hooks
- [ ] Direct instruction handling implemented

---

#### Sprint 0.1: Core Coordination Files (1-2 hours)

**Tasks:**

**INFRA-0.1a: Create ACTIVE-WORK.md Structure (30 min)**
- Create `ACTIVE-WORK.md` at project root
- Add empty tables: Current Sessions, Completed Today, Task Allocation
- Add auto-timestamp placeholder
- Test: Manually add/remove session entries

**INFRA-0.1b: Update TASKS.md with New Prefixes (30 min)**
- Add Phase 6 section with Track A/B/C breakdown
- Convert existing Phase 6 tasks to SEC/PERF/QUAL/INF format
- Add dependency notation: `[dependency: none]`, `[dependency: TASK-ID]`
- Example tasks from Section 6.4 (lines 922-957)

**INFRA-0.1c: Create Phase 6 Detailed Task Breakdown (30 min)**
- Create `docs/phase-6-tasks.md`
- Full 3-level hierarchy with all sub-tasks
- Can be imported into TASKS.md or kept separate for reference

**Deliverable:** ACTIVE-WORK.md (empty), TASKS.md (Phase 6 updated), docs/phase-6-tasks.md

---

#### Sprint 0.2: Metrics Automation (1-2 hours)

**Tasks:**

**INFRA-0.2a: Create update-metrics.sh Script (1 hour)**
- Create `.claude/scripts/update-metrics.sh`
- Implement test count extraction (vitest JSON reporter)
- Implement TypeScript error count (grep "error TS")
- Implement npm vulnerability count (npm audit --json)
- Implement loading state coverage (find page.tsx vs loading.tsx)
- Test: Run script manually, verify output format

**INFRA-0.2b: Add Metrics Tables to STATUS.md (30 min)**
- Add Track Progress Table (Track A/B/C with percentages)
- Add P0/P1 Fixes Status Table
- Add Auto-Updated Metrics Table (test counts, TS errors, vulns, loading states)
- Add timestamp and "Last Updated via /processes:eod" note

**INFRA-0.2c: Wire Metrics into /processes:eod (30 min)**
- Read `.claude/commands/processes/eod.md`
- Add step: "Run update-metrics.sh → parse output → update STATUS.md"
- Add error handling (graceful fallback to manual if script fails)
- Test: Run /processes:eod, verify STATUS.md updated

**Deliverable:** update-metrics.sh (working), STATUS.md (enhanced), /processes:eod (automated)

---

#### Sprint 0.3: Workflow Integration (1-2 hours)

**Tasks:**

**INFRA-0.3a: Implement 3-Tier /processes:begin (1 hour)**
- Read `.claude/commands/processes/begin.md`
- Add session detection logic (read ACTIVE-WORK.md, check last timestamp)
- Implement Tier 1 (Full Standup): >2 hours since last session
- Implement Tier 2 (Quick Claim): <2 hours since last session
- Implement Tier 3 (No Process): Direct instruction without "begin"
- Add ACTIVE-WORK.md display to dashboard

**INFRA-0.3b: Add /processes:claim Skill (30 min)**
- Create `.claude/commands/processes/claim.md`
- Lightweight entry point: just show available tasks + active work
- Claim task flow: Update ACTIVE-WORK.md with agent ID, timestamp, task ID
- Create minimal TodoWrite (3-4 items)

**INFRA-0.3c: Update /processes:end-session for ACTIVE-WORK.md (30 min)**
- Read `.claude/commands/processes/end-session.md`
- Add step: Move session from "Current Sessions" to "Completed Today"
- Add step: Archive ACTIVE-WORK.md to `docs/archive/active-work/YYYY-MM-DD.md`
- Add step: Update TASKS.md checkbox for completed task

**Deliverable:** /processes:begin (3-tier), /processes:claim (new), /processes:end-session (enhanced)

---

#### Sprint 0.4: Invariants & Enforcement (1 hour)

**Tasks:**

**INFRA-0.4a: Add 2 New Invariants to guardrails.md (30 min)**
- Read `.claude/rules/guardrails.md`
- Add Invariant #6: Page Loading States (every page.tsx has loading.tsx + error.tsx)
- Add Invariant #7: No Server/Client Module Mixing (no mixed imports)
- Update pre-flight checklist to include both new invariants
- Update "Common Mistakes to Avoid" section

**INFRA-0.4b: Add Hook Enforcement (30 min)**
- Read `.claude/hooks/hard-rules.sh`
- Add check: Grep for page.tsx without sibling loading.tsx/error.tsx
- Add check: Grep for files with both 'use client' and server-only imports (prisma, fs, node:*)
- Add error messages with file locations
- Test: Create violating file, verify hook blocks commit

**Deliverable:** guardrails.md (7 invariants), hard-rules.sh (2 new checks)

---

### 7.3 Phase 0 Validation (30 min)

**Before starting Phase 1-5 features, verify:**

**Checklist:**
- [ ] ACTIVE-WORK.md exists and is tracked by git
- [ ] TASKS.md Phase 6 uses SEC/PERF/QUAL/INF format
- [ ] /processes:begin shows 3 different outputs based on session recency
- [ ] /processes:claim shows available tasks + active work
- [ ] /processes:eod runs update-metrics.sh and updates STATUS.md
- [ ] guardrails.md lists 7 invariants
- [ ] hard-rules.sh blocks page.tsx without loading/error
- [ ] hard-rules.sh blocks mixed server/client modules

**Validation Test:**
1. Run `/processes:begin` → Should show Tier 1 (Full Standup) with 7 invariants
2. Claim a test task via `/processes:claim TEST-0.1` → Should update ACTIVE-WORK.md
3. Complete task, run `/processes:end-session` → Should move to "Completed Today"
4. Run `/processes:eod` → Should update STATUS.md metrics
5. Create page.tsx without loading.tsx → Should fail pre-commit hook
6. Create file with 'use client' + `import prisma` → Should fail pre-commit hook

**If all pass:** Infrastructure ready. Start Phase 1 features.

---

### 7.4 Post-Infrastructure: Feature Implementation Order

**After Phase 0 complete, proceed with:**

**Week 1-2: Documentation Fixes (Section 3.1 High Priority)**
- Add plan-enforcement.md to CLAUDE.md Tier 1
- Consolidate logging rules
- Elevate source preservation to explicit 5th invariant in guardrails.md
- Archive .reviews/ contents

**Week 3-4: Phase 6 Track A (Security & Data Integrity)**
- SEC-6.1: Fix Phase 5 P0 Security Issues (~4 hours, 5 sub-tasks)
- Use ACTIVE-WORK.md for all tasks
- Metrics auto-update via /processes:eod

**Week 5-6: Phase 6 Track B (Performance & Observability)**
- PERF-6.1: Fix Phase 5 P1 Performance Issues (~6 hours, 3 sub-tasks)
- PERF-6.2: Replace console.log with Pino (~2 hours, 3 sub-tasks)

**Week 7-8: Phase 6 Track C (Quality & Documentation)**
- QUAL-6.1: Add Loading/Error States (~2 hours, 4 sub-tasks)
- QUAL-6.2: Fix NPM Vulnerabilities (30 min, 2 sub-tasks)
- QUAL-6.3: Update Stale Documentation (1 hour, 4 sub-tasks)

**Phase 6 Complete → MVP Launch Ready**

**Optional Phase 7:** Post-launch scale & polish (26 P2 issues, ~15 hours)

---

### 7.5 Parallel Agent Workflow (Post-Infrastructure)

**With infrastructure built, multi-agent workflow:**

**Morning Standup (9:00 AM):**
```
Agent A: /processes:begin
→ Tier 1 Full Standup (first session of day)
→ Claims SEC-6.1a (Client/Vendor tenant isolation, 15 min)
→ Updates ACTIVE-WORK.md

Agent B: /processes:begin
→ Tier 1 Full Standup (first session of day)
→ Claims SEC-6.1b (CSV injection fix, 15 min)
→ Updates ACTIVE-WORK.md

Agent C: /processes:begin
→ Tier 1 Full Standup (first session of day)
→ Claims QUAL-6.1a (Create loading templates, 15 min)
→ Updates ACTIVE-WORK.md
```

**Mid-Morning (10:30 AM):**
```
Agent A completes SEC-6.1a:
→ /processes:end-session
→ Moves to "Completed Today" in ACTIVE-WORK.md
→ Marks [x] SEC-6.1a in TASKS.md
→ Archives session to docs/archive/sessions/

Agent A resumes work:
→ /processes:claim SEC-6.1c
→ Tier 2 Quick Claim (recent session)
→ Shows other active work (Agent B, Agent C still working)
→ Claims SEC-6.1c (GL opening balance, 1-2 hr)
```

**End of Day (5:00 PM):**
```
All agents run /processes:eod:
→ Runs update-metrics.sh
→ Updates STATUS.md Track Progress Table
→ Archives ACTIVE-WORK.md to docs/archive/active-work/2026-02-17.md
→ Clears ACTIVE-WORK.md for tomorrow
→ Updates MEMORY.md with learnings
```

**Result:** 3 agents complete 8 tasks/day with zero conflicts, auto-updated metrics, clean progress tracking.

---

### 7.6 Critical Success Factors

**For infrastructure implementation to succeed:**

1. **Complete Phase 0 in one continuous session** — Don't pause mid-infrastructure (context loss risk)
2. **Test each sprint before moving to next** — Validate ACTIVE-WORK.md before building metrics automation
3. **Use /processes:work for infrastructure tasks** — Systematic execution, not ad-hoc
4. **Validate with real test task** — Actually claim/complete/archive a task to verify workflow
5. **Update MEMORY.md immediately** — Capture any quirks discovered during infrastructure build

**Anti-Patterns to Avoid:**
- ❌ Building infrastructure across multiple days (context drift)
- ❌ Skipping validation tests (discover bugs during feature work)
- ❌ Not documenting edge cases in MEMORY.md (repeat same bugs later)
- ❌ Starting feature work before all 6 validation tests pass

---

### 7.7 Estimated Timeline

**Phase 0 (Infrastructure):** 4-6 hours (1-2 days)
- Sprint 0.1: 1-2 hours
- Sprint 0.2: 1-2 hours
- Sprint 0.3: 1-2 hours
- Sprint 0.4: 1 hour
- Validation: 30 min

**Documentation Fixes:** 2-3 hours

**Phase 6 Track A:** 4-5 hours (with 3 parallel agents: ~2 days wall time)

**Phase 6 Track B:** 6-8 hours (with 3 parallel agents: ~3 days wall time)

**Phase 6 Track C:** 3-4 hours (with 3 parallel agents: ~1 day wall time)

**Total to MVP Launch:** 19-26 hours effort, ~2 weeks wall time (with parallelization)

**vs. Without Infrastructure:** 35-45 hours effort, ~4 weeks wall time (manual tracking overhead, duplicate work, retrofitting)

**Savings:** 40-50% time reduction from parallelization + automation + zero duplicate work

---

### 7.8 Next Steps (Immediate)

**Action:** Approve this plan, then:

1. **Create implementation branch:** `git checkout -b feature/infrastructure-phase0`
2. **Run `/processes:work`** with this plan file
3. **Execute Sprint 0.1** (Core Coordination Files, 1-2 hours)
4. **Validate Sprint 0.1** (manually test ACTIVE-WORK.md, TASKS.md)
5. **Execute Sprint 0.2** (Metrics Automation, 1-2 hours)
6. **Validate Sprint 0.2** (run update-metrics.sh manually)
7. **Execute Sprint 0.3** (Workflow Integration, 1-2 hours)
8. **Validate Sprint 0.3** (test /processes:begin 3 tiers)
9. **Execute Sprint 0.4** (Invariants & Enforcement, 1 hour)
10. **Validate Sprint 0.4** (test hook blocking)
11. **Run full Phase 0 Validation** (all 6 tests)
12. **Commit infrastructure:** `feat(infra): Phase 0 tracking system complete`
13. **Merge to main:** `git merge feature/infrastructure-phase0`
14. **Start Phase 1-5 features** with full tracking from day 1

---

**Approval Checklist:**
- [ ] Infrastructure-first approach approved
- [ ] 4-6 hour upfront investment acceptable
- [ ] Phase 0 sprint breakdown clear
- [ ] Validation tests understood
- [ ] Ready to execute /processes:work with this plan

**Ready to exit plan mode and begin implementation?**
