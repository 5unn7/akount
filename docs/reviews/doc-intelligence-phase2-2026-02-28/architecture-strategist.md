# Architecture Review: Document Intelligence Phase 2

**Reviewer:** Architecture Strategist
**Scope:** System architecture, domain boundaries, design patterns, modularity
**Date:** 2026-02-28
**Commit Range:** Last 24 hours (204 commits, 976 files changed)

---

## Executive Summary

**Status:** COMPLETE
**Risk Level:** MEDIUM-HIGH (6 P0-P1 findings, 5 P2 findings)
**Architectural Alignment:** NEEDS IMPROVEMENT

### Key Findings Summary

**Critical Issues (P0-P1):** 6 findings
- Domain boundary violations (workers creating business entities directly)
- Missing idempotency for job retries (duplicate bill/invoice risk)
- Worker code duplication (90%+ shared logic)
- SSE memory leak from orphaned event listeners
- In-memory rate limiter breaks in distributed deployments
- Service layer god objects (DocumentExtractionService mixing 4 concerns)

**Medium Issues (P2):** 5 findings
- Missing database constraints for idempotency
- Console.log in production code
- Error handling via string matching instead of typed errors
- Type safety violations (`:any` in 3 files)

### Impact Assessment

**Immediate Production Risks:**
1. **Data integrity:** Job retries create duplicate bills/invoices (no idempotency)
2. **Memory leaks:** SSE connections can accumulate orphaned listeners
3. **Rate limiting ineffective:** Multi-instance deployments bypass per-tenant limits

**Medium-Term Risks:**
4. **Maintenance burden:** 258 lines of duplicated worker code
5. **Domain coupling:** AI domain tightly coupled to business domain (hard to test/change)
6. **Scalability blockers:** In-memory rate limiter, shared queue event listeners

### Review Scope
- Worker architecture (BullMQ patterns, isolation, race conditions) ✅
- Domain boundaries (AI vs Business domain separation) ✅
- Service layer design (SRP, cohesion) ✅
- Error handling patterns ✅
- State management (Redis, job state) ✅
- API design (RESTful, status codes, versioning) ✅

### Positive Observations

**Well-Designed Areas:**
1. **Security pipeline:** 5-layer defense (file size, PII redaction, prompt defense, validation, business rules)
2. **Tenant isolation:** Consistent use of `tenantId` filters in all queries
3. **Structured logging:** Mostly using `logger.error()` (3 console.log exceptions found)
4. **Test coverage:** 16 AI service files, comprehensive test suites
5. **SSE implementation:** Good heartbeat pattern, timeout safeguards, tenant validation
6. **Queue configuration:** Proper retry strategy (exponential backoff), dead letter queue, job retention

**Architecture Strengths:**
- Clear separation of AI routes/services/schemas
- Good use of middleware (auth, tenant, consent, validation, rate limit)
- Proper use of Zod schemas for input validation
- CSRF protection implemented correctly
- Prisma observer for N+1 detection (dev tool)

---

## Findings

### [P1] Worker Architecture: Duplicate Code Between Invoice/Bill Workers

**Files:** `apps/api/src/domains/ai/workers/bill-scan.worker.ts:72-287`, `apps/api/src/domains/ai/workers/invoice-scan.worker.ts:72-290`

**Issue:** Invoice and Bill scan workers share 90%+ identical code structure:
- Identical image decoding logic (lines 84-93)
- Identical hash generation for deduplication (lines 88)
- Identical extraction service calls (lines 99-103)
- Identical confidence-based routing logic (lines 118-156)
- Identical vendor/client matching pattern (lines 162-191)
- Identical document creation flow (lines 197-254)
- Nearly identical error handling (lines 278-286)

The only meaningful differences are:
1. Entity type (`Bill` vs `Invoice`, `Vendor` vs `Client`)
2. Status enum (`BillStatus` vs `InvoiceStatus`)
3. Default due date calculation (same day vs NET 30)

**Impact:**
- **Maintainability:** Bug fixes or security improvements must be duplicated across both files
- **Testing burden:** Identical logic requires duplicate test suites
- **Inconsistency risk:** Features added to one worker may be missed in the other (already happened: bill-scan uses `PENDING` status, invoice-scan misses it and uses `SENT` as workaround on line 277)

**Fix:** Extract shared worker logic into a generic document processor:

```typescript
// apps/api/src/domains/ai/workers/base-document-worker.ts
export abstract class BaseDocumentWorker<
  TJobData extends BaseDocumentJobData,
  TJobResult extends BaseDocumentJobResult,
  TExtraction,
  TEntity,
  TRelatedEntity
> {
  protected abstract extractDocument(buffer: Buffer, options: ExtractionOptions): Promise<ExtractionResult<TExtraction>>;
  protected abstract findOrCreateRelatedEntity(extraction: TExtraction, entityId: string): Promise<TRelatedEntity>;
  protected abstract createDocument(extraction: TExtraction, relatedEntityId: string): Promise<TEntity>;
  protected abstract determineStatus(confidence: number): { status: string; routingResult: AIRoutingResult };

  async process(job: Job<TJobData>): Promise<TJobResult> {
    // Shared logic: decode, hash, extract, route, log
  }
}

// apps/api/src/domains/ai/workers/bill-scan.worker.ts (refactored)
class BillDocumentWorker extends BaseDocumentWorker<BillScanJobData, BillScanJobResult, BillExtraction, Bill, Vendor> {
  protected extractDocument = this.extractionService.extractBill.bind(this.extractionService);
  // Override only bill-specific methods
}
```

**Architectural Principle Violated:** DRY (Don't Repeat Yourself). 258 lines of duplication = maintenance nightmare.

---

### [P2] Service Layer: DocumentExtractionService Mixing Concerns

**Files:** `apps/api/src/domains/ai/services/document-extraction.service.ts:1-200`

**Issue:** DocumentExtractionService violates Single Responsibility Principle by handling:
1. **Security pipeline** (PII redaction, prompt defense, file size validation)
2. **AI provider coordination** (Mistral API calls)
3. **Business validation** (totals validation, confidence scoring)
4. **Multiple document types** (bills, invoices, bank statements)

This creates a "God Service" with 4 distinct responsibilities.

**Impact:**
- **Testing complexity:** Unit tests must mock security, AI, and business logic simultaneously
- **Change amplification:** Security policy changes require touching document extraction code
- **Tight coupling:** Cannot swap AI providers without refactoring security pipeline
- **Difficult to extend:** Adding a new document type requires modifying existing extraction methods

**Fix:** Split into focused services following domain boundaries:

```typescript
// Security layer (standalone)
class DocumentSecurityService {
  validateFileSize(buffer: Buffer): void;
  redactPII(buffer: Buffer): RedactionResult;
  analyzeThreats(text: string, amount: number): DefenseResult;
}

// AI provider layer (infrastructure)
interface DocumentExtractionProvider {
  extract<T>(buffer: Buffer, schema: ZodSchema<T>, prompt: string): Promise<T>;
}
class MistralExtractionProvider implements DocumentExtractionProvider { }

// Business layer (domain)
class BillExtractionService {
  constructor(
    private security: DocumentSecurityService,
    private provider: DocumentExtractionProvider
  ) {}

  async extract(buffer: Buffer, options: ExtractionOptions): Promise<ExtractionResult<BillExtraction>> {
    // Orchestrate security + provider + validation
    const secured = await this.security.process(buffer);
    const extracted = await this.provider.extract(secured, BillExtractionSchema, ...);
    this.validateBillTotals(extracted);
    return extracted;
  }
}
```

**Architectural Principles Violated:**
- **SRP:** One class should have one reason to change
- **Open/Closed:** Should be open for extension (new providers), closed for modification

---

### [P2] Rate Limiting: In-Memory Limiter in Distributed System

**Files:** `apps/api/src/lib/queue/queue-manager.ts:104-157`

**Issue:** QueueManager uses an in-memory `RateLimiter` class (lines 104-157) that tracks tenant submission counts in a JavaScript `Map`. This pattern breaks in distributed deployments:

- **Multi-instance deployments:** Each API instance has its own rate limit counter, so a tenant can submit 100 jobs/minute to Instance A + 100 jobs/minute to Instance B = 200 jobs/minute total (2x the intended limit)
- **No persistence:** Rate limit state is lost on server restart
- **No cross-process coordination:** Workers and API servers don't share rate limit state

Code comment on line 102 acknowledges this: *"For distributed systems, migrate to Redis-backed limiter (PERF-11)"*

**Impact:**
- **Security vulnerability:** DoS protection is ineffective in production (multi-container deployments)
- **Inconsistent limits:** Different API instances enforce different limits
- **Poor scalability:** Cannot horizontally scale without losing rate limit accuracy

**Fix:** Migrate to Redis-backed sliding window counter using existing Redis connection:

```typescript
class RedisRateLimiter {
  constructor(private redis: RedisClient) {}

  async checkLimit(tenantId: string): Promise<boolean> {
    const key = `ratelimit:${tenantId}`;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.WINDOW_MS;

    // Redis sorted set with timestamps as scores
    const multi = this.redis.multi();
    multi.zremrangebyscore(key, '-inf', windowStart); // Remove old entries
    multi.zadd(key, now, `${now}-${Math.random()}`); // Add current
    multi.zcard(key); // Count entries in window
    multi.expire(key, 60); // Auto-cleanup

    const results = await multi.exec();
    const count = results[2] as number;

    return count <= RATE_LIMIT_CONFIG.JOBS_PER_MINUTE;
  }
}
```

**Why this matters:** Current code is production-ready per the documentation, but rate limiting won't work correctly in the likely deployment architecture (Kubernetes/ECS with 2+ replicas).

---

### [P0] Domain Boundary Violation: Workers Creating Business Entities Directly

**Files:** `apps/api/src/domains/ai/workers/bill-scan.worker.ts:162-229`, `apps/api/src/domains/ai/workers/invoice-scan.worker.ts:162-230`

**Issue:** Workers are directly creating `Bill`, `Invoice`, `Vendor`, and `Client` entities using Prisma (lines 162-229 in both workers). This violates domain boundaries:

**The AI domain (`domains/ai/`) should NOT:**
- Know about invoice/bill business rules (payment terms, status transitions, GL posting requirements)
- Create vendor/client records (that's the business domain's responsibility)
- Handle document numbering schemes (that's business domain logic)

**The Business domain (`domains/invoicing/`, `domains/vendors/`) should:**
- Own all bill/invoice/vendor/client creation logic
- Enforce business rules (duplicate detection, numbering, validation)
- Handle side effects (audit logging, GL posting triggers)

**Current architecture creates cross-cutting concerns:**
- Bill creation logic exists in BOTH `ai/workers/bill-scan.worker.ts` AND `domains/invoicing/services/bill.service.ts`
- Vendor matching exists in BOTH the AI worker AND the vendor service
- Future changes to bill validation must touch AI code (tight coupling)

**Impact:**
- **Boundary violation:** AI domain depends on business domain models (`Bill`, `Invoice`, `Vendor`, `Client`)
- **Duplicate logic:** Bill creation rules implemented twice (worker + service)
- **Inconsistent validation:** Worker creates bills without going through service layer validation
- **Missing audit trails:** Service layer audit logging is bypassed
- **Testing complexity:** Cannot test bill creation independently of AI extraction

**Fix:** Workers should call business domain services instead of Prisma directly:

```typescript
// bill-scan.worker.ts (refactored)
import { BillService } from '../../../domains/invoicing/services/bill.service';
import { VendorService } from '../../../domains/vendors/services/vendor.service';

async function processBillScan(job: Job<BillScanJobData>): Promise<BillScanJobResult> {
  // ... extraction logic ...

  // Delegate to business domain services
  const billService = new BillService({ tenantId, userId, role: 'SYSTEM' });
  const vendorService = new VendorService({ tenantId, userId, role: 'SYSTEM' });

  const vendor = await vendorService.findOrCreate({
    name: extraction.data.vendor,
    entityId,
  });

  const bill = await billService.create({
    vendorId: vendor.id,
    billNumber: extraction.data.billNumber,
    total: extraction.data.totalAmount,
    // ... other fields
  });

  // AI domain only logs the decision
  await aiDecisionLogService.create({ ... });

  return { billId: bill.id, vendorId: vendor.id };
}
```

**Domain Adjacency Map Violation:** AI domain → Business domain is acceptable for READ operations (categorization hints), but NOT for WRITE operations (entity creation). Workers should emit events or call service APIs, not write directly to business tables.

**Architectural Principles Violated:**
- **Domain-Driven Design:** Bounded contexts should communicate through well-defined interfaces (services/events), not direct database access
- **Separation of Concerns:** AI extraction logic should be independent of business entity lifecycle
- **Dependency Inversion:** High-level business rules should not depend on low-level AI workers

---

### [P1] Missing Idempotency Keys for Job Processing

**Files:** `apps/api/src/domains/ai/workers/bill-scan.worker.ts`, `apps/api/src/domains/ai/workers/invoice-scan.worker.ts`

**Issue:** Workers generate SHA-256 `inputHash` from image buffers for deduplication logging (lines 88), but this hash is NOT used to prevent duplicate document creation. If the same receipt is uploaded twice (or a job is retried after partial failure), the system will create duplicate bills/invoices.

**Current flow:**
1. Upload receipt → Job created with `jobId: uuid()`
2. Worker processes → Generates `inputHash` from image
3. Creates Bill + AIDecisionLog (using `inputHash` for logging only)
4. **If job fails after Bill creation but before logging**, retry will create ANOTHER Bill with the same data

**Missing safeguards:**
- No check for existing `AIDecisionLog` with same `inputHash` before creating Bill
- No unique constraint on `AIDecisionLog.inputHash` in Prisma schema
- No idempotent job processing pattern

**Impact:**
- **Data integrity:** Duplicate bills/invoices from legitimate retries or user re-uploads
- **Financial accuracy:** AR/AP totals inflated by duplicates
- **User confusion:** Same receipt appears multiple times in the system

**Fix:** Implement idempotent job processing using `inputHash`:

```typescript
async function processBillScan(job: Job<BillScanJobData>): Promise<BillScanJobResult> {
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const inputHash = createHash('sha256').update(imageBuffer).digest('hex');

  // Check for existing decision log (idempotency check)
  const existingLog = await prisma.aIDecisionLog.findFirst({
    where: {
      tenantId,
      entityId,
      inputHash,
      decisionType: 'BILL_EXTRACTION',
    },
    include: { bill: true }, // Prisma relation to fetch associated Bill
  });

  if (existingLog) {
    logger.info(
      { jobId: job.id, existingBillId: existingLog.documentId, inputHash },
      'Bill extraction idempotency: returning existing result'
    );

    return {
      billId: existingLog.documentId!,
      confidence: existingLog.confidence,
      status: existingLog.bill?.status || 'DRAFT',
      decisionLogId: existingLog.id,
    };
  }

  // Proceed with extraction only if no existing log...
}
```

**Also requires Prisma schema update:**
```prisma
model AIDecisionLog {
  // ... existing fields
  @@unique([tenantId, entityId, inputHash, decisionType])
}
```

**Why this matters:** Job retries are a core BullMQ feature (configured with 3 retries in `queue-manager.ts:83-86`). Without idempotency, retries create duplicates instead of being safe.

---

### [P2] Missing Unique Constraint on AIDecisionLog.inputHash

**Files:** `packages/db/prisma/schema.prisma` (AIDecisionLog model)

**Issue:** The `AIDecisionLog` model stores `inputHash` (SHA-256 of image buffer) for deduplication logging, but lacks a unique constraint to prevent duplicate decision logs for the same input.

**Current schema (lines from grep):**
```prisma
model AIDecisionLog {
  inputHash        String // SHA256 hash of input (for duplicate detection, PII-safe)
  // ... other fields
  @@index([tenantId, createdAt])
  @@index([tenantId, decisionType, createdAt])
  @@index([tenantId, routingResult])
  // Missing: @@unique([tenantId, entityId, inputHash, decisionType])
}
```

**Impact:**
- **Data integrity:** Multiple decision logs can be created for the same document upload
- **Duplicate bills/invoices:** Idempotency check in P1 finding cannot work without this constraint
- **Wasted AI API calls:** Same image can be processed multiple times without detection
- **Audit trail pollution:** AIDecisionLog fills with duplicate entries

**Fix:** Add composite unique constraint to schema:

```prisma
model AIDecisionLog {
  // ... existing fields
  @@unique([tenantId, entityId, inputHash, decisionType])
  @@index([tenantId, createdAt])
  @@index([tenantId, decisionType, createdAt])
  @@index([tenantId, routingResult])
}
```

**Combined with P1 idempotency fix:** This constraint makes the idempotency check in P1 truly safe:
1. Worker generates `inputHash` from image
2. Attempts to find existing `AIDecisionLog` with same `inputHash + tenantId + entityId + decisionType`
3. If found → return existing result (idempotent)
4. If not found → process and create new log (constraint prevents race conditions)

**Migration required:** This is a schema change requiring `prisma migrate dev`.

---

### [P2] Console.log in Production Code

**Files:**
- `apps/api/src/domains/ai/routes/jobs.ts:18` (comment example, not actual code)
- `apps/api/src/domains/ai/services/rule-engine.service.ts:75`
- `apps/api/src/domains/ai/services/rule-engine.service.ts:118`

**Issue:** Production services use `console.error()` instead of structured logging via `logger.error()`.

**Violations:**
```typescript
// rule-engine.service.ts:75
this.ruleService
  .incrementExecution(rule.id, true)
  .catch((err) => console.error('Failed to increment execution:', err));

// rule-engine.service.ts:118
).catch((err) => console.error('Failed to batch increment execution:', err));
```

**Impact:**
- **Lost context:** Console logs lack request IDs, tenant IDs, user IDs (pino adds these automatically)
- **No structured data:** Cannot query/filter logs in production observability tools
- **Missed alerts:** Monitoring systems configured for `logger.error()` miss these errors
- **Inconsistent formatting:** Breaks log aggregation in CloudWatch/Datadog/etc.

**Fix:** Use logger instead:

```typescript
// rule-engine.service.ts:75
this.ruleService
  .incrementExecution(rule.id, true)
  .catch((err) => logger.error({ err, ruleId: rule.id }, 'Failed to increment execution'));

// rule-engine.service.ts:118
).catch((err) => logger.error({ err, matchedRuleIds: Array.from(matchedRuleIds) }, 'Failed to batch increment execution'));
```

**Architectural Principle Violated:** All production code must use structured logging (pino via `logger`). Console methods are only allowed in:
- `apps/api/src/lib/env.ts` (pre-boot validation before logger exists)
- Test files (`__tests__/`)
- Code examples in comments (like jobs.ts:18)

---

### [P1] SSE Job Streaming: Memory Leak from Event Listeners

**Files:** `apps/api/src/domains/ai/routes/jobs.ts:164-196`

**Issue:** Server-Sent Events (SSE) endpoint registers BullMQ event listeners on the shared queue instance (lines 164-169) but cleanup on client disconnect (lines 179-195) may not execute if:
- Node process crashes before cleanup
- Client connection dies without triggering `request.raw.on('close')`
- Multiple concurrent SSE connections for different jobs (listeners accumulate)

**Current cleanup pattern:**
```typescript
// lines 164-169: Register listeners on shared queue instance
queue.on('progress', onProgress);
queue.on('completed', onCompleted);
// ... 3 more listeners

// lines 179-195: Cleanup on 'close' event
request.raw.on('close', () => {
  queue.off('progress', onProgress);
  // ... remove others
});
```

**Memory leak scenario:**
1. Client A connects to `/api/ai/jobs/123/stream` → 5 listeners registered on `bill-scan` queue
2. Client B connects to `/api/ai/jobs/456/stream` → 5 MORE listeners registered (total: 10)
3. Client A loses connection without triggering 'close' event → 5 orphaned listeners remain
4. After 100 failed disconnects → 500 orphaned listeners on queue (memory leak + performance degradation)

**Impact:**
- **Memory leak:** Each SSE connection adds 5 permanent listeners if cleanup fails
- **Performance degradation:** Queue event dispatch slows down with 100s of listeners
- **EventEmitter warning:** Node.js warns when >10 listeners registered on same event
- **Production instability:** High concurrent SSE usage = OOM crashes

**Fix:** Use a cleanup registry with process-level tracking:

```typescript
// Singleton registry to track active SSE connections
class SSEConnectionRegistry {
  private connections = new Map<string, CleanupFunction>();

  register(connectionId: string, cleanup: CleanupFunction): void {
    this.connections.set(connectionId, cleanup);
  }

  cleanup(connectionId: string): void {
    const cleanup = this.connections.get(connectionId);
    if (cleanup) {
      cleanup();
      this.connections.delete(connectionId);
    }
  }

  cleanupAll(): void {
    for (const cleanup of this.connections.values()) {
      cleanup();
    }
    this.connections.clear();
  }
}

// In route handler:
const connectionId = `${jobId}-${Date.now()}`;
const cleanup = () => {
  queue.off('progress', onProgress);
  queue.off('completed', onCompleted);
  // ... remove all listeners
  if (heartbeatInterval) clearInterval(heartbeatInterval);
};

sseRegistry.register(connectionId, cleanup);

// Multiple triggers for cleanup (redundancy):
request.raw.on('close', () => sseRegistry.cleanup(connectionId));
reply.raw.on('close', () => sseRegistry.cleanup(connectionId));
setTimeout(() => sseRegistry.cleanup(connectionId), 5 * 60 * 1000); // 5-min timeout

// Process shutdown: cleanup all
process.on('SIGTERM', () => sseRegistry.cleanupAll());
```

**Alternative solution:** Use Redis Pub/Sub instead of queue events for SSE:
- Workers publish progress to Redis channels (per-job)
- SSE endpoint subscribes to Redis channel (not queue events)
- Redis automatically cleans up subscriptions on disconnect
- No shared queue listener accumulation

**Architectural issue:** Shared stateful resources (queue event emitters) + ephemeral connections (SSE) = cleanup complexity. Prefer stateless pub/sub patterns for event streaming.

---

### [P2] Error Handling: Domain-Specific Errors Not Used Consistently

**Files:** `apps/api/src/domains/ai/errors.ts`, `apps/api/src/domains/ai/routes/natural-bookkeeping.routes.ts:86-119`

**Issue:** The AI domain defines a shared error handler `handleAIError()` in `errors.ts`, but routes implement inline error handling with string matching instead of using typed error classes.

**Current pattern in natural-bookkeeping.routes.ts:**
```typescript
catch (error: unknown) {
  // Inline string matching
  if (error instanceof Error && error.message.includes('Confidence too low')) {
    return reply.status(422).send({ ... });
  }
  if (error instanceof Error && error.message.includes('Mistral API Error')) {
    return reply.status(503).send({ ... });
  }
  // Fall through to shared handler
  return handleAIError(error, reply);
}
```

**Problems:**
- **Fragile:** String matching on error messages breaks when message format changes
- **Inconsistent:** Different routes may interpret same error differently
- **Not type-safe:** `unknown` type + string checks bypass TypeScript
- **Duplicate logic:** Same error patterns handled in multiple route files

**Better pattern (from accounting domain):**
```typescript
// errors.ts
export class ConfidenceTooLowError extends Error {
  constructor(public confidence: number, public threshold: number) {
    super(`Confidence ${confidence}% below threshold ${threshold}%`);
    this.name = 'ConfidenceTooLowError';
  }
}

export class MistralAPIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'MistralAPIError';
  }
}

// Service throws typed errors
if (confidence < 60) {
  throw new ConfidenceTooLowError(confidence, 60);
}

// Route uses handleAIError with type discrimination
catch (error: unknown) {
  return handleAIError(error, reply); // Handles all typed errors consistently
}

// handleAIError implementation
export function handleAIError(error: unknown, reply: FastifyReply) {
  if (error instanceof ConfidenceTooLowError) {
    return reply.status(422).send({ error: 'Unprocessable Entity', confidence: error.confidence });
  }
  if (error instanceof MistralAPIError) {
    return reply.status(error.statusCode).send({ error: 'AI Service Error', message: error.message });
  }
  // ... other domain errors
  throw error; // Re-throw unknown errors
}
```

**Impact:**
- **Maintainability:** Easier to change error responses (single location)
- **Type safety:** TypeScript can verify error handling coverage
- **Consistency:** All routes handle errors identically
- **Testing:** Can throw typed errors in tests instead of mocking strings

**Architectural Principle Violated:** Error handling should use typed domain exceptions, not string matching on generic `Error.message`.

---

### [P2] Type Safety: `:any` Violations

**Files:**
- `apps/api/src/lib/prisma-observer.ts:200` (event: any)
- `apps/api/src/middleware/csrf.ts:104` (request: any)
- `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/chart-of-accounts-client.tsx:89` (params: any)

**Issue:** Three `:any` type annotations bypass TypeScript's type checking.

**Analysis by file:**

1. **prisma-observer.ts:200** — Prisma event type
   ```typescript
   prisma.$on('query', (event: any) => {
   ```
   **Justification:** Acceptable. Prisma's `query` event type is not exported by the library. This is a dev-only tool (activated via `PRISMA_QUERY_LOG=true`).

2. **csrf.ts:104** — Fastify request extension
   ```typescript
   export function getCsrfToken(request: any): string {
     return request.generateCsrf();
   }
   ```
   **Fix:** Use proper Fastify types:
   ```typescript
   export function getCsrfToken(request: FastifyRequest): string {
     // @fastify/csrf-protection extends FastifyRequest
     return (request as any).generateCsrf(); // Still needs cast, but isolated
   }
   ```

3. **chart-of-accounts-client.tsx:89** — Query params object
   ```typescript
   const params: any = { entityId };
   ```
   **Fix:** Type the params object properly:
   ```typescript
   const params: Record<string, string> = { entityId };
   // Or better: use URLSearchParams
   const params = new URLSearchParams({ entityId });
   ```

**Impact:**
- **Type safety:** Bypasses compile-time checks
- **Refactoring risk:** Changes to these interfaces won't trigger errors
- **IDE support:** No autocomplete or type hints

**Recommendation:** Fix #2 and #3 (medium effort, high value). Accept #1 as technical debt with comment explaining why.

---

## Architectural Recommendations

### Immediate Actions (Next Sprint)

1. **Add idempotency to workers** (P0 — 4 hours)
   - Add `@@unique([tenantId, entityId, inputHash, decisionType])` to AIDecisionLog
   - Implement idempotency check in both workers before creating Bill/Invoice
   - Add integration test for retry safety

2. **Fix domain boundary violations** (P0 — 8 hours)
   - Create `BillService.createFromExtraction()` in business domain
   - Create `VendorService.findOrCreate()` in business domain
   - Workers call services instead of Prisma directly
   - Add service-level tests

3. **Migrate rate limiter to Redis** (P1 — 4 hours)
   - Implement Redis-backed sliding window counter
   - Add integration test with multiple API instances
   - Deploy config: verify Redis connection available

### Medium-Term Refactoring (Next 2-3 Sprints)

4. **Extract base document worker** (P1 — 6 hours)
   - Create `BaseDocumentWorker` abstract class
   - Migrate invoice/bill workers to extend base
   - Delete 258 lines of duplication
   - Verify tests still pass

5. **Split DocumentExtractionService** (P2 — 6 hours)
   - Create `DocumentSecurityService` (security pipeline)
   - Create `MistralExtractionProvider` interface
   - Create separate `BillExtractionService`, `InvoiceExtractionService`
   - Maintain backward compatibility

6. **Fix SSE memory leak** (P1 — 4 hours)
   - Implement `SSEConnectionRegistry` singleton
   - Add cleanup on SIGTERM
   - Add monitoring for active listener counts
   - Load test with 100 concurrent SSE connections

### Low-Priority Improvements (Technical Debt)

7. **Typed error classes** (P2 — 3 hours)
   - Define `ConfidenceTooLowError`, `MistralAPIError`, etc.
   - Refactor routes to use `handleAIError()` consistently
   - Remove string-based error matching

8. **Fix type safety violations** (P2 — 1 hour)
   - Fix csrf.ts:104 and chart-of-accounts-client.tsx:89
   - Add comment to prisma-observer.ts:200 explaining exception

9. **Replace console.log** (P2 — 30 mins)
   - Fix rule-engine.service.ts:75 and :118
   - Use `logger.error()` with structured context

---

## Architecture Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Domain Boundaries** | 4/10 | AI domain violates business domain (P0 issue) |
| **Service Layer Design** | 5/10 | God services, duplicated code |
| **Worker Architecture** | 6/10 | Solid queue config, but missing idempotency |
| **Error Handling** | 7/10 | Good structured logging, but string-based errors |
| **State Management** | 5/10 | In-memory rate limiter, SSE memory leak risk |
| **API Design** | 8/10 | RESTful, proper middleware, good SSE implementation |
| **Type Safety** | 7/10 | Mostly good, 3 `:any` violations |
| **Security** | 9/10 | Excellent 5-layer defense, CSRF, tenant isolation |
| **Scalability** | 5/10 | In-memory limiter, shared listeners block horizontal scaling |

**Overall Architecture Grade:** C+ (Needs Improvement)

**Key Strengths:**
- Security-first design
- Proper use of middleware and authentication
- Good test coverage

**Key Weaknesses:**
- Domain boundary violations (tight coupling)
- Missing idempotency (data integrity risk)
- Worker code duplication (maintenance burden)
- In-memory rate limiter (scalability blocker)

---

## Compliance with Project Rules

### 9 Key Invariants

| Invariant | Status | Notes |
|-----------|--------|-------|
| 1. Tenant Isolation | ✅ PASS | All queries filter by `tenantId` |
| 2. Integer Cents | ✅ PASS | All monetary fields use integer cents |
| 3. Double-Entry | ⚠️ N/A | Not applicable to AI domain |
| 4. Soft Delete | ✅ PASS | Bills/Invoices use soft delete |
| 5. Source Preservation | ✅ PASS | AIDecisionLog stores input snapshots |
| 6. Page Loading States | ⚠️ N/A | Backend-only changes |
| 7. Server/Client Separation | ⚠️ N/A | Backend-only changes |
| 8. Atomic Task IDs | ⚠️ N/A | Not applicable to code review |
| 9. Task Requirement | ⚠️ N/A | Not applicable to code review |

### Anti-Patterns Detected

- ❌ **God Service:** DocumentExtractionService handles 4 responsibilities (P2)
- ❌ **Code Duplication:** 258 lines duplicated between workers (P1)
- ❌ **Domain Coupling:** AI domain creates business entities directly (P0)
- ❌ **In-Memory State:** Rate limiter won't scale horizontally (P1)
- ⚠️ **Type Safety:** 3 `:any` violations (P2)
- ⚠️ **Console.log:** 2 violations in production code (P2)

### Architectural Principles

| Principle | Adherence | Evidence |
|-----------|-----------|----------|
| **DRY** | ❌ FAIL | 90% duplication between workers |
| **SRP** | ⚠️ PARTIAL | DocumentExtractionService violates, others OK |
| **Domain-Driven Design** | ❌ FAIL | AI domain violates business domain boundaries |
| **Dependency Inversion** | ⚠️ PARTIAL | Workers depend on Prisma directly (should use services) |
| **Open/Closed** | ✅ PASS | Provider pattern allows easy AI model swapping |

---

## Conclusion

Document Intelligence Phase 2 delivers a **functional but architecturally immature** system. The code works correctly for single-instance deployments, but has structural issues that will cause problems at scale:

1. **Data integrity risk:** Missing idempotency means job retries create duplicate bills/invoices
2. **Scalability blockers:** In-memory rate limiter and SSE listener accumulation prevent horizontal scaling
3. **Maintenance burden:** Code duplication and tight coupling make future changes expensive

**Recommended path forward:**
- **Immediate:** Fix P0 issues (idempotency, domain boundaries) before production deployment
- **Next sprint:** Address P1 issues (rate limiter, SSE leak, worker duplication)
- **Next quarter:** Refactor P2 issues during planned AI feature work

The security architecture (5-layer defense) and tenant isolation are **excellent**. The core extraction logic works well. The issues are primarily structural—fixable with targeted refactoring.

**Overall Assessment:** APPROVE with required P0 fixes before production.

---

## Related Agent Findings

This review focuses on **system architecture**. Other agents in this multi-agent review cover:

- **security-sentinel:** Authentication, authorization, CSRF, XSS, injection attacks
- **fastify-api-reviewer:** Route patterns, middleware, request validation, response formats
- **ai-integration-reviewer:** LLM prompt engineering, token optimization, model selection
- **bullmq-job-reviewer:** Queue configuration, worker safety, retry strategies, job state
- **compliance-reviewer:** GDPR compliance, audit trails, data retention, consent management

Cross-reference these reviews for complete coverage of Document Intelligence Phase 2.

---

_Architecture review completed: 2026-02-28. 976 files reviewed (focus: AI domain workers, services, routes)._

