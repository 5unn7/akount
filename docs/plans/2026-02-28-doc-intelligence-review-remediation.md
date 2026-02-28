# Document Intelligence Phase 2 — Review Remediation Plan

**Created:** 2026-02-28
**Source:** `docs/reviews/doc-intelligence-phase2-2026-02-28/` (13 agents, 976 files, 204 commits)
**Overall Grade:** B+ (85/100) — CHANGES REQUIRED before production

---

## Status Legend

- [ ] Not started
- [x] Already done (verified in git history)
- `~` Partially done

---

## Phase 1: P0 Critical Fixes (BLOCKS PRODUCTION) — ~24h

> These 11 issues MUST be fixed before any production deployment.
> Grouped into logical fix batches to minimize context-switching.

### Batch 1A: AI Provider Safety (5h)

Affects: `apps/api/src/domains/ai/services/providers/`

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P0-1 | **No timeout on AI calls** — stuck requests cost $50-100 each | `claude.provider.ts`, `mistral.provider.ts`, all AI service calls | Add `timeout: 30000` (30s) to every AI API call. Use `AbortController` with `setTimeout`. | 2h |
| P0-2 | **No token tracking** — zero cost attribution | All AI services (document-extraction, natural-search, auto-bookkeeper) | Log `tokensUsed` (input + output) to `AIDecisionLog` table after every AI call. Parse from API response `usage` field. | 2h |
| P0-5 | **PII leak in OCR text** — raw OCR sent to logs before redaction | `document-extraction.service.ts`, prompt defense logs | Reorder pipeline: OCR → PII redaction → THEN log/analyze. Never log raw OCR text. | 1h |

**Dependencies:** None. Can start immediately.

### Batch 1B: Consent & Budget Enforcement (4h)

Affects: `apps/api/src/domains/ai/`, `apps/api/src/middleware/`

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P0-3 | **No per-tenant AI budgets** — single tenant can drain $50K+ | AI routes, new `ai-budget.service.ts` | Create `AIBudget` model or config table. Check budget before AI calls. Return `402 Payment Required` when exceeded. | 3h |
| P0-4 | **Missing service-layer consent checks** — middleware bypass = GDPR violation | `natural-search.service.ts`, `auto-bookkeeper.service.ts`, `document-extraction.service.ts` | Add `verifyConsent(tenantId, userId, feature)` call at top of every AI service method. Defense-in-depth beyond middleware. | 1h |

**Dependencies:** None. Can start immediately. Can parallelize with Batch 1A.

### Batch 1C: Worker Safety — Idempotency & Ownership (4h)

Affects: `apps/api/src/domains/ai/workers/`

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P0-6 | **No idempotency checks** — retries create duplicate bills/invoices | `bill-scan.worker.ts`, `invoice-scan.worker.ts` | Before creating entities, check `AIDecisionLog.inputHash` for existing record with same hash. Skip creation if found. `inputHash` field already exists but is unused. | 2h |
| P0-9 | **Missing entity ownership validation in workers** — cross-tenant pollution if Redis compromised | `bill-scan.worker.ts:74`, `invoice-scan.worker.ts:74` | Add 5-line check: `prisma.entity.findFirst({ where: { id: entityId, tenantId } })`. Throw if null. | 1h |
| P0-8 | **Domain boundary violation** — workers create bills/invoices via Prisma instead of business services | All AI workers (bill-scan, invoice-scan) | Refactor workers to call `billService.create()`, `invoiceService.create()`, `vendorService.findOrCreate()` instead of raw Prisma. This also consolidates validation logic. | 1h (partial — full refactor in Phase 2 Batch 2C) |

**Dependencies:** P0-6 and P0-9 are independent. P0-8 is a preliminary step (mark service boundary, don't full-refactor yet — that's P1-18).

### Batch 1D: Memory & Performance (4h)

Affects: `apps/api/src/domains/ai/workers/`, `packages/db/prisma/schema.prisma`

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P0-7 | **Base64 memory bomb** — 13MB images x 1000 jobs = 13GB Redis OOM | Job data payloads, worker file handling | Store uploaded images in S3/DigitalOcean Spaces. Pass object key in job data instead of base64. Workers fetch from S3 when processing. 99.998% Redis reduction. | 3h |
| P0-10 | **N+1 + Missing Vendor.name index** — 500ms lookups with 10K vendors | `schema.prisma` (Vendor model) | Add composite index: `@@index([entityId, name, deletedAt], name: "Vendor_entityId_name_idx")`. Client already has this index. | 30m |
| P0-11 | **Missing AIDecisionLog indexes** — 2s queries at 100K+ decisions | `schema.prisma` (AIDecisionLog model) | Add 3 composite indexes: `[entityId, createdAt]`, `[entityId, feature, createdAt]`, `[entityId, inputHash]` | 30m |

**Dependencies:** P0-10 and P0-11 require Prisma migration (ask user to run). P0-7 requires S3 setup (env vars, bucket creation).

**Migration note for P0-10 + P0-11:** These can share a single migration:
```bash
cd packages/db
npx prisma migrate dev --name add_vendor_name_and_ai_decision_log_indexes
```

---

## Phase 2: P1 Important Fixes (SHOULD FIX BEFORE LAUNCH) — ~16h

> These improve reliability, maintainability, and compliance.
> 2 items already done (struck through).

### Batch 2A: AI Compliance & Cost Optimization (4h)

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P1-12 | **No AIDecisionLog in all services** — GDPR Article 30 gap | `natural-search.service.ts`, `auto-bookkeeper.service.ts` | Add `AIDecisionLog.create()` after every AI call in these services. Include: feature, model, tokensUsed, inputHash, tenantId. | 2h |
| P1-13 | **Excessive maxTokens** — Mistral uses 2048 when 800 suffices ($120/mo waste) | `mistral.provider.ts`, document extraction calls | Reduce `maxTokens` to 800 for vision/OCR tasks, 512 for categorization. | 30m |
| P1-14 | **Missing Mistral AI disclosure** — consent UI doesn't mention Mistral as processor | `apps/web/.../ai-consent-*.tsx`, consent service | Add "Mistral AI" to third-party processor list in consent UI and service. | 30m |
| P1-23 | **Type safety violations** — 3 `:any` types | `gl-account-sheet.tsx:45`, `chart-of-accounts-client.tsx:89`, `csrf.ts:104` | Fix async callback type (`() => void` → `() => void \| Promise<void>`), add proper query param types, type Fastify request extension. | 1h |

### Batch 2B: Worker Reliability (5h)

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P1-15 | **Missing DLQ monitoring** — failed jobs vanish after 3 retries | `queue-manager.ts`, new DLQ handler | Add `failed` event handler that logs to structured logging + creates notification. Add `/api/system/jobs/failed` endpoint for admin visibility. | 2h |
| P1-16 | **No graceful shutdown in workers** — partial DB state on deployments | `bill-scan.worker.ts`, `invoice-scan.worker.ts` | Add `SIGTERM`/`SIGINT` handlers that call `worker.close()` and wait for in-progress jobs. Note: `index.ts` has graceful shutdown for Fastify, but workers need their own handlers. | 1h |
| P1-17 | **Job cleanup config broken** — `removeOnComplete: { count: 1000 }` + 13MB payloads exhausts Redis | Queue configuration | After P0-7 (S3 migration), payloads shrink to ~1KB. Update to `removeOnComplete: { count: 100, age: 86400 }` (24h TTL). | 30m |
| P1-22 | **console.error in production** — bypasses structured logging | `rule-engine.service.ts:75,118` | Replace `console.error(...)` with `logger.error({ err, ... }, 'message')` using pino. | 30m |
| P1-19 | **SSE memory leak** — orphaned BullMQ event listeners on client disconnect | `jobs.ts` (SSE route) | Add connection registry. On SSE `close` event, remove all BullMQ listeners for that connection. Add `setInterval` cleanup for stale connections. | 1h |

### Batch 2C: Architecture Cleanup (4h)

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P1-18 | **Worker code duplication** — 258 lines, 93% identical between bill-scan and invoice-scan | `bill-scan.worker.ts`, `invoice-scan.worker.ts` | Extract `BaseDocumentScanWorker` class. Workers extend with only document-type-specific logic (entity creation). ~30 unique lines each. | 3h |
| P1-21 | **God Service pattern** — DocumentExtractionService handles 4 responsibilities | `document-extraction.service.ts` (258 lines) | Split into: `OcrService`, `ExtractionValidationService`, `PromptBuilder`. Keep `DocumentExtractionService` as orchestrator. | 1h |

### Batch 2D: Infrastructure (3h)

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P1-24 | **Missing Redis health check** — `/health` only checks DB | `apps/api/src/domains/system/routes.ts` | Add Redis `PING` to health endpoint. Return `{ db: 'ok', redis: 'ok' }` or degrade gracefully. | 1h |
| P1-25 | **No Dockerfile** — assumes PM2, no container deployment | New `Dockerfile` at repo root or `apps/api/` | Create multi-stage Dockerfile (build → production). Include Prisma generate step. | 2h |
| ~~P1-20~~ | ~~**In-memory rate limiter**~~ | ~~Rate limiting middleware~~ | ~~ALREADY DONE — ARCH-17 migrated to Redis-backed rate limiter (commit `4480332`)~~ | ~~0h~~ |

---

## Phase 3: P2 Nice-to-Have (OPTIONAL) — ~12h

> These are improvements, not blockers. Can be scheduled across sprints.

### Batch 3A: Data Quality & Compliance (4h)

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| ~~P2-26~~ | ~~**User deletion endpoint**~~ | ~~GDPR erasure~~ | ~~ALREADY DONE — SEC-35 (commit `fc1e1fd`)~~ | ~~0h~~ |
| P2-27 | **AIDecisionLog retention policy** — no automated cleanup | New scheduled job or cron | Add retention policy: delete AI logs >90 days old (configurable per tenant). BullMQ repeatable job. | 2h |
| P2-36 | **Insight duplicate cleanup** — migration adds unique constraint but doesn't clean existing dupes | Migration script | Add data cleanup step before unique constraint migration. Find and merge duplicates. | 1h |
| P2-37 | **Cross-scope FK validation** — `Category.defaultGLAccountId` references GLAccount (different scope) | Service layer validation | Add ownership check in category service: verify GLAccount belongs to same entity. | 1h |

### Batch 3B: Performance & Caching (3h)

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P2-28 | **No caching for AI results** — duplicate uploads re-run AI ($600/mo, 30% duplicate rate) | `document-extraction.service.ts` | Check `AIDecisionLog.inputHash` before calling AI. If match found with same hash, return cached result. | 2h |
| P2-29 | **Missing pagination on AIDecisionLog** | Future list endpoint | Add cursor pagination to any AIDecisionLog list endpoint (when built). Follow existing cursor pattern. | 1h |

### Batch 3C: Code Cleanup (3h)

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P2-30 | **Unused method** — `DocumentExtractionService.extractStatement()` has 0 callers (115 lines) | `document-extraction.service.ts` | Delete the method. If needed later, it's in git history. | 15m |
| P2-31 | **Unused queues** — 3 queues defined but never used (15 lines) | `queue-manager.ts` | Remove unused queue definitions. | 15m |
| P2-32 | **Route duplication** — invoice-scan and bill-scan routes 95% identical (30 lines) | `bill-scan.ts`, `invoice-scan.ts` | Extract shared route factory: `createScanRoute(config)`. | 1h |
| P2-38 | **Verify CSRF on multipart** — need integration test to confirm | Test file | Write integration test: POST to `/api/business/bills/scan` without CSRF token, expect 403. If SameSite=Strict works, document and close. | 1h |

### Batch 3D: Export Security (1h)

| # | Issue | Files | Fix | Effort |
|---|-------|-------|-----|--------|
| P2-33 | **UTF-8 BOM missing** — non-ASCII breaks in Excel | CSV export utilities | Add `\uFEFF` BOM prefix to CSV output. | 15m |
| P2-34 | **Tax IDs not masked** — PII exposure in exports | Export services | Mask tax IDs in exports: `***-**-1234` pattern. | 30m |
| P2-35 | **PDF line items unbounded** — 10K-line invoices could OOM | PDF generation | Add pagination to PDF line items (max 500 per page). Stream large PDFs. | 30m |

---

## Execution Order & Dependencies

```
Phase 1 (P0 — PARALLEL WHERE POSSIBLE):
  Batch 1A (AI Safety)  ──────────────┐
  Batch 1B (Consent/Budget) ──────────┤── Can all run in parallel
  Batch 1C (Worker Safety) ───────────┤
  Batch 1D (Memory/Indexes) ──────────┘
    └── P0-10, P0-11 need Prisma migration (user action)
    └── P0-7 needs S3 bucket setup

Phase 2 (P1 — AFTER Phase 1):
  Batch 2A (AI Compliance) ─── depends on P0-2 (token tracking exists)
  Batch 2B (Worker Reliability) ─── depends on P0-7 (S3 migration done)
  Batch 2C (Architecture) ─── depends on P0-8 (domain boundary marked)
  Batch 2D (Infrastructure) ─── independent

Phase 3 (P2 — AFTER Phase 2):
  All batches independent, can be done in any order.
```

---

## Summary

| Phase | Items | Already Done | Remaining | Effort |
|-------|-------|-------------|-----------|--------|
| P0 Critical | 11 | 0 | 11 | ~24h |
| P1 Important | 14 | 1 (ARCH-17) | 13 | ~16h |
| P2 Nice-to-Have | 13 | 1 (SEC-35) | 12 | ~12h |
| **TOTAL** | **38** | **2** | **36** | **~52h** |

### Recommended Timeline

- **Week 1:** Phase 1 (all P0 critical fixes) — 24h across 3-4 days
- **Week 2:** Phase 2 Batches 2A + 2B (AI compliance + worker reliability) — 9h
- **Week 3:** Phase 2 Batches 2C + 2D (architecture + infrastructure) — 7h
- **Week 3-4:** Phase 3 (nice-to-have, interleave with other work) — 12h
- **Week 4:** QA testing + performance validation
- **Week 5:** Production launch

### Cross-Agent Confidence (3+ agents flagged same issue)

These 5 issues have the highest confidence (flagged by 3+ independent agents):

1. **Base64 Memory Bomb** (P0-7) — bullmq-job-reviewer, performance-oracle, architecture-strategist
2. **No Idempotency** (P0-6) — bullmq-job-reviewer, architecture-strategist, ai-integration-reviewer
3. **Worker Duplication** (P1-18) — architecture-strategist, code-simplicity-reviewer, performance-oracle
4. **Missing AI Cost Controls** (P0-1/2/3) — ai-integration-reviewer, compliance-reviewer, performance-oracle
5. ~~In-Memory Rate Limiter~~ (DONE - ARCH-17) — architecture-strategist, performance-oracle, infrastructure-reviewer

---

_Plan generated from 13-agent review synthesis. Source: `docs/reviews/doc-intelligence-phase2-2026-02-28/`_
