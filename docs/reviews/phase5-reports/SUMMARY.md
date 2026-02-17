---
review_id: phase5-reports
date: 2026-02-17
branch: feature/phase5-reports
verdict: changes_required
agents: [financial, architecture, security, performance, fastify, nextjs]
p0_count: 5
p1_count: 13
p2_count: 26
fix_effort_hours: 10

anti_patterns:
  - id: csv-injection-incomplete
    pattern: "CSV formula-prefix sanitization without quotes"
    files: [apps/api/src/domains/accounting/services/report-export.service.ts]
    fix: "Wrap escaped values in double quotes: \"'${escaped}\""
    severity: P0
    line: "26-39"

  - id: server-client-mixed-module
    pattern: "Single file mixing server-only and client-only code"
    files: [apps/web/src/lib/api/reports.ts]
    fix: "Split into reports.ts (server), reports-client.ts (client), reports-types.ts (shared)"
    severity: P0
    line: "13,52"

  - id: missing-entityScoped-flag
    pattern: "Entity-scoped models in data export without entityScoped flag"
    files: [apps/api/src/domains/system/services/data-export.service.ts]
    fix: "Add entityScoped: true to clients/vendors table configs"
    severity: P0
    line: "59-73"

  - id: window-function-missing-opening-balance
    pattern: "SQL window function without opening balance calculation"
    files: [apps/api/src/domains/accounting/services/report.service.ts]
    fix: "Calculate opening balance in separate query and add to window results"
    severity: P0
    line: "1017-1052"

recurring_issues:
  - issue: "Hardcoded currency values in components"
    occurrences: 2
    domains: [reports]
    files: [pl-report-view.tsx, bs-report-view.tsx]
    pattern: "Hardcoded 'CAD' instead of using currency prop"

  - issue: "Query params bypass Zod validation"
    occurrences: 7
    domains: [reports]
    files: [report.ts]
    pattern: "Routes use 'as XxxQuery & { format?: string }' cast"

  - issue: "Missing cache implementation"
    occurrences: 6
    domains: [reports]
    pattern: "Only P&L has cache get/set, other 6 reports don't"

architecture_strengths:
  - pattern: "tenantScopedQuery wrapper with runtime SQL assertion"
    effectiveness: high
    reuse: true
    location: "apps/api/src/lib/tenant-scoped-query.ts"

  - pattern: "Bounded cache (500 entries, 60s TTL, tenant-scoped keys)"
    effectiveness: high
    reuse: true
    location: "apps/api/src/domains/accounting/services/report-cache.ts"

  - pattern: "Streaming data export with cursor pagination"
    effectiveness: high
    reuse: true
    location: "apps/api/src/domains/system/services/data-export.service.ts"

  - pattern: "CSV injection prevention (OWASP-compliant)"
    effectiveness: high
    reuse: true
    location: "apps/api/src/domains/system/services/data-export.service.ts"

cross_domain_impacts:
  - change: "Report cache invalidation"
    affected:
      - apps/api/src/domains/accounting/services/posting.service.ts
      - apps/api/src/domains/accounting/services/journal-entry.service.ts
    lesson: "Any service that mutates GL data MUST call reportCache.invalidate()"

  - change: "Multi-entity currency validation"
    affected: [all report endpoints]
    lesson: "Multi-entity reports require upfront currency validation to prevent mixed-currency display"

high_confidence:
  - issue: "format param bypasses Zod validation"
    agents: [financial, architecture, security, fastify]
    priority: P1

  - issue: "validateMultiEntityCurrency missing tenantId filter"
    agents: [financial, architecture, fastify]
    priority: P1

  - issue: "GLLedgerReport missing currency field"
    agents: [financial, architecture, fastify]
    priority: P1

  - issue: "Only P&L cached, 6 other reports not cached"
    agents: [architecture, performance, security]
    priority: P1
---

# Phase 5 Reports — Review Summary

> **Quick scan for EOD/Audit agents.** Read [detailed findings](#detailed-findings) or [agent reports](./agents/) for deeper context.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Date** | 2026-02-17 |
| **Branch** | `feature/phase5-reports` |
| **Files Reviewed** | 109 changed (+21,347 / -460 lines) |
| **Agents** | 6/6 completed (financial, architecture, security, performance, fastify, nextjs) |
| **Verdict** | ⚠️ **CHANGES REQUIRED** |

---

## At-a-Glance Metrics

| Priority | Count | Effort | Blocking? |
|----------|-------|--------|-----------|
| **P0 (Critical)** | 5 | ~4 hours | ⛔ **Blocks merge** |
| **P1 (Important)** | 13 | ~6 hours | ⚠️ Fix before production |
| **P2 (Nice-to-Have)** | 26 | ~15 hours | Optional |

**Estimated fix effort:** ~4 hours for P0s, ~6 hours for P1s

---

## Top 5 Findings (Must Fix)

### 🔴 P0-1: Data Export Client/Vendor Missing Tenant Isolation
**Risk:** Cross-tenant data leak in data export
**Fix:** Add `entityScoped: true` to client/vendor configs (15 min)
**Agents:** Financial, Security

### 🔴 P0-2: GL Ledger Running Balance Omits Opening Balance
**Risk:** Incorrect account balances displayed
**Fix:** Calculate opening balance in separate query (1-2 hours)
**Agents:** Financial

### 🔴 P0-3: GL "Load More" Imports Server-Only Module
**Risk:** Runtime crash when clicking "Load More"
**Fix:** Create Server Action wrapper (15 min)
**Agents:** Next.js

### 🔴 P0-4: Mixed Server/Client Module (`reports.ts`)
**Risk:** Bundler instability, runtime crashes
**Fix:** Split into 3 files: server, client, shared (30 min)
**Agents:** Next.js

### 🔴 P0-5: CSV Injection Defense Incomplete
**Risk:** CSV column structure breaks
**Fix:** Match robust pattern from data-export service (15 min)
**Agents:** Fastify, Security

---

## High-Confidence Issues (3+ Agents Agree)

| Issue | Agents | Priority |
|-------|--------|----------|
| `format` param bypasses Zod validation | Financial, Architecture, Security, Fastify | P1 |
| `validateMultiEntityCurrency` missing tenantId | Financial, Architecture, Fastify | P1 |
| `GLLedgerReport` missing `currency` field | Financial, Architecture, Fastify | P1 |
| Only P&L cached (6/7 reports uncached) | Architecture, Performance, Security | P1 |
| CSV sanitization inconsistency | Architecture, Security, Fastify | P2 |

---

## Architecture Strengths

✅ `tenantScopedQuery` runtime SQL assertion
✅ BigInt safety checks
✅ Bounded cache (500 entries, 60s TTL)
✅ Streaming data export (no memory overflow)
✅ Complete loading/error boundaries
✅ Rate limiting (50 req/min reports, 3 req/min export)
✅ Composite indexes
✅ Soft delete filters

---

## Fix Timeline

### Before Merge (P0) — ~4 hours
1. Client/Vendor tenant isolation (15 min)
2. CSV injection fix (15 min)
3. GL "Load More" Server Action (15 min)
4. Split reports.ts (30 min)
5. GL opening balance (1-2 hr)

### Before Production (P1) — ~6 hours
6. Cash Flow sign convention (2-3 hr)
7. Spending/Revenue aggregation (30 min)
8. Frontend types alignment (30 min)
9. `format` to Zod (15 min)
10. Cache all 7 reports (1 hr)
11. + 5 more small fixes (~1.5 hr)

### Phase 6 Scope (P1 deferred)
- RBAC middleware → permission matrix (1 hr)
- Accessibility attributes (45 min)
- Entity selector real options (1-2 hr)
- Tests for 4 remaining reports (3-4 hr)

---

## Detailed Findings

See [full synthesis](./DETAILED.md) for:
- Complete P0/P1/P2 issue descriptions with file locations
- Code examples and fix approaches
- Cross-agent consensus patterns
- P2 findings table (26 items)

## Agent Reports

Individual agent analysis in [agents/](./agents/) directory:
- [financial.md](./agents/financial.md) — Financial integrity, double-entry, integer cents
- [architecture.md](./agents/architecture.md) — System design, patterns, maintainability
- [security.md](./agents/security.md) — Tenant isolation, injection, RBAC
- [performance.md](./agents/performance.md) — Query optimization, caching, N+1
- [fastify.md](./agents/fastify.md) — API patterns, validation, error handling
- [nextjs.md](./agents/nextjs.md) — Server/client boundaries, accessibility, UX

---

*Generated by `/processes:review` — 6 agents, ~3,700 lines reviewed across 42 files.*