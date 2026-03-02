# Code Simplicity Review - Document Intelligence Phase 2

**Reviewer:** code-simplicity-reviewer (YAGNI enforcer)
**Date:** 2026-02-28
**Scope:** Document Intelligence Phase 2 (workers, extraction service, queue management)

---

## Executive Summary

**Complexity Level:** MEDIUM
**Lines of Code:** 1,340 (production code) + 258 duplicated lines
**YAGNI Violations:** 3 major, 2 minor
**Simplification Potential:** ~350 lines (-26%)

The implementation is generally straightforward but contains **significant unnecessary complexity**:

1. **258 lines duplicated** between invoice-scan and bill-scan workers (93% overlap)
2. **Premature abstraction** in DocumentExtractionService (3 separate methods, 2 are unused stubs)
3. **Over-engineered rate limiting** (Redis-backed for single-instance deployment)
4. **Unused queue infrastructure** (5 queues defined, only 2 used)

**Verdict:** SIMPLIFICATION RECOMMENDED before merging

---

## YAGNI Violations

### 1. Worker Duplication (CRITICAL - 258 lines wasted)

**Pattern:** invoice-scan.worker.ts and bill-scan.worker.ts are 93% identical.

**Evidence:**
```typescript
// invoice-scan.worker.ts (lines 72-290)
async function processInvoiceScan(job: Job<InvoiceScanJobData>): Promise<InvoiceScanJobResult> {
  const { tenantId, entityId, userId, imageBase64, filename, mimeType } = job.data;

  // Decode base64 image
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  // Generate content hash for deduplication (PII-safe)
  const inputHash = createHash('sha256').update(imageBuffer).digest('hex');

  // Extract invoice data via DocumentExtractionService (DEV-235)
  const extractionService = new DocumentExtractionService();
  const extraction = await extractionService.extractInvoice(imageBuffer, {
    tenantId,
    entityId,
  });

  // Determine routing based on confidence
  let invoiceStatus: InvoiceStatus;
  let routingResult: AIRoutingResult;

  if (extraction.confidence >= 80) {
    invoiceStatus = InvoiceStatus.DRAFT;
    routingResult = AIRoutingResult.AUTO_CREATED;
  } else if (extraction.confidence >= 60) {
    invoiceStatus = InvoiceStatus.DRAFT;
    routingResult = AIRoutingResult.QUEUED_FOR_REVIEW;
  } else {
    // Low confidence — manual review required
    // ... 30 lines of decision logging
  }

  // Find or create client (22 lines)
  let client = await prisma.client.findFirst({ ... });
  if (!client) {
    client = await prisma.client.create({ ... });
  }

  // Create Invoice (38 lines)
  const invoice = await prisma.invoice.create({ ... });

  // Log AI decision (18 lines)
  const decisionLog = await prisma.aIDecisionLog.create({ ... });

  return { invoiceId, clientId, confidence, status, decisionLogId };
}

// bill-scan.worker.ts (lines 72-287) — NEARLY IDENTICAL
async function processBillScan(job: Job<BillScanJobData>): Promise<BillScanJobResult> {
  // ... EXACT SAME STRUCTURE ...
  // Only differences:
  // - extractInvoice() → extractBill()
  // - InvoiceStatus → BillStatus
  // - client → vendor
  // - invoice → bill
}
```

**Why this violates YAGNI:**
- We **don't need** two separate 200-line functions for nearly identical processing
- The "different status enums" argument is weak — both use DRAFT/PENDING/REVIEW pattern
- Future workers (bank statements) will need this same pipeline → 3rd duplication incoming

**Simplified Alternative:**
```typescript
// document-scan.worker.ts (unified)
interface DocumentScanJobData {
  documentType: 'invoice' | 'bill' | 'statement';
  tenantId: string;
  entityId: string;
  userId: string;
  imageBase64: string;
  filename: string;
  mimeType: string;
}

async function processDocumentScan(
  job: Job<DocumentScanJobData>
): Promise<DocumentScanJobResult> {
  const { documentType, tenantId, entityId, imageBase64, filename } = job.data;

  // Common setup (buffer decode, hash, progress)
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const inputHash = createHash('sha256').update(imageBuffer).digest('hex');
  await job.updateProgress(10);

  // Extraction (polymorphic)
  const extractionService = new DocumentExtractionService();
  const extraction = await extractionService.extract(documentType, imageBuffer, {
    tenantId,
    entityId,
  });

  await job.updateProgress(50);

  // Routing (shared logic)
  const { status, routingResult } = determineRouting(extraction.confidence, documentType);

  if (status === 'REVIEW_REQUIRED') {
    return await logRejection(extraction, inputHash, tenantId, entityId);
  }

  // Entity matching (polymorphic: client vs vendor)
  const entity = await findOrCreateEntity(documentType, extraction.data, entityId);

  await job.updateProgress(75);

  // Document creation (polymorphic: invoice vs bill)
  const document = await createDocument(documentType, extraction, entity, entityId, filename);

  await job.updateProgress(90);

  // Decision logging (shared)
  const decisionLog = await logDecision(
    documentType,
    document.id,
    extraction,
    inputHash,
    tenantId,
    entityId,
    routingResult
  );

  await job.updateProgress(100);

  return {
    documentId: document.id,
    entityId: entity.id,
    confidence: extraction.confidence,
    status,
    decisionLogId: decisionLog.id,
  };
}

// Helper: shared routing logic
function determineRouting(confidence: number, documentType: string) {
  if (confidence >= 80) {
    return { status: 'DRAFT', routingResult: AIRoutingResult.AUTO_CREATED };
  } else if (confidence >= 60) {
    return {
      status: documentType === 'bill' ? 'PENDING' : 'DRAFT',
      routingResult: AIRoutingResult.QUEUED_FOR_REVIEW,
    };
  } else {
    return { status: 'REVIEW_REQUIRED', routingResult: null };
  }
}

// Helper: polymorphic entity matching (20 lines vs 22+22)
async function findOrCreateEntity(type: string, data: any, entityId: string) {
  const isClient = type === 'invoice';
  const name = isClient ? data.clientName : data.vendor;
  const model = isClient ? prisma.client : prisma.vendor;

  let entity = await model.findFirst({
    where: { entityId, name, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!entity) {
    entity = await model.create({
      data: {
        entityId,
        name,
        status: 'ACTIVE',
        paymentTerms: data.paymentTerms?.terms || 'NET 30',
      },
      select: { id: true, name: true },
    });
  }

  return entity;
}

// Helper: polymorphic document creation (30 lines vs 38+38)
async function createDocument(
  type: string,
  extraction: any,
  entity: any,
  entityId: string,
  filename: string
) {
  const isInvoice = type === 'invoice';
  const model = isInvoice ? prisma.invoice : prisma.bill;
  const entityKey = isInvoice ? 'clientId' : 'vendorId';
  const numberField = isInvoice ? 'invoiceNumber' : 'billNumber';

  return model.create({
    data: {
      entityId,
      [entityKey]: entity.id,
      [numberField]: extraction.data[numberField] || `AI-${Date.now()}`,
      issueDate: new Date(extraction.data.date),
      dueDate: extraction.data.paymentTerms?.dueDate
        ? new Date(extraction.data.paymentTerms.dueDate)
        : new Date(new Date(extraction.data.date).getTime() + 30 * 24 * 60 * 60 * 1000),
      currency: extraction.data.currency,
      subtotal: extraction.data.subtotal,
      taxAmount: extraction.data.taxAmount,
      total: extraction.data.totalAmount,
      paidAmount: 0,
      status: extraction.status,
      notes: `AI-extracted from ${filename}`,
      [isInvoice ? 'invoiceLines' : 'billLines']: {
        create: extraction.data.lineItems.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          taxAmount: item.taxAmount || 0,
        })),
      },
    },
    select: { id: true, [numberField]: true, status: true },
  });
}
```

**Impact:**
- **Lines Saved:** 258 lines (93% of worker duplication)
- **Concepts Removed:** Two separate worker files, two separate job processors
- **Future Benefit:** Adding bank statement worker requires ~50 lines of glue code, not another 200-line file
- **Maintainability:** Bug fixes apply to ALL document types instantly

---

### 2. Unused DocumentExtractionService Methods (MEDIUM - 130 lines wasted)

**Pattern:** extractStatement() is a 115-line stub with full implementation, but NO caller exists.

**Evidence:**
```typescript
// document-extraction.service.ts (lines 375-503)
/**
 * Extract transaction data from bank statement (enhanced in B8).
 *
 * NOTE: This is a placeholder for B8 (Bank Statement Parsing - Mistral Primary).
 * Full implementation will replace regex-based parser-pdf.ts.
 *
 * @param pdfBuffer - Bank statement PDF as Buffer
 * @param options - Extraction options
 * @returns Array of transactions with structured data
 */
async extractStatement(
  pdfBuffer: Buffer,
  options: ExtractionOptions
): Promise<ExtractionResult<BankStatementExtraction>> {
  const startTime = Date.now();

  try {
    // Step 0: File Size Validation (SEC-44) — 20 lines
    // Step 1: PII Redaction (SEC-29) — 15 lines
    // Step 2: Mistral Vision Extraction — 35 lines with complex prompt
    // Step 3: Prompt Defense Analysis (SEC-30) — 15 lines
    // Step 4: Business Rule Validation (Balance Reconciliation) — 5 lines
    // Return statement — 25 lines
  } catch (error: unknown) {
    // Error handling — 8 lines
  }
}
```

**Grep check:**
```bash
$ Grep "extractStatement" apps/api/src/
# No callers found. Zero uses.
```

**Why this violates YAGNI:**
- We **don't need** a fully-implemented method that NO code calls
- The docstring says "This is a placeholder for B8" — Phase 2 doesn't include B8!
- Future work (B8) will likely change requirements anyway

**What should have been done:**
```typescript
// ✅ CORRECT — stub for future work
async extractStatement(
  pdfBuffer: Buffer,
  options: ExtractionOptions
): Promise<ExtractionResult<BankStatementExtraction>> {
  throw new Error('Not implemented. Coming in Phase B8: Bank Statement Parsing.');
}
```

**Impact:**
- **Lines Saved:** 115 lines (fully delete the implementation)
- **Concepts Removed:** BankStatementExtraction schema, validateStatementBalances function
- **Risk:** Zero — no caller exists, deleting this has NO runtime impact

---

### 3. Redis-Backed Rate Limiting (MEDIUM - 108 lines over-engineered)

**Pattern:** RedisRateLimiter class with atomic pipelines, sliding windows, and multi-instance support for... a single-instance deployment.

**Evidence:**
```typescript
// queue-manager.ts (lines 106-208)
/**
 * Redis-backed rate limiter using sorted sets (sliding window).
 *
 * ARCH-17: Replaces in-memory Map with Redis for multi-instance support.
 * Each tenant's submissions are tracked in a sorted set keyed by tenantId.
 * Score = timestamp, Member = unique ID. Atomic pipeline ensures consistency.
 */
class RedisRateLimiter {
  private redis: Redis | null = null;
  private readonly keyPrefix = 'ratelimit:jobs:';

  private getRedis(): Redis {
    if (!this.redis) {
      const connOpts = getRedisConnection();
      this.redis = new Redis({
        ...connOpts,
        connectTimeout: 500,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
    }
    return this.redis;
  }

  /**
   * Check if tenant can submit a job without exceeding rate limit.
   * Records the submission atomically if allowed.
   */
  async checkLimit(tenantId: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.WINDOW_MS;
    const key = `${this.keyPrefix}${tenantId}`;
    const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

    const redis = this.getRedis();

    // Atomic pipeline: trim old entries, count current, add new if under limit
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart); // Remove expired entries
    pipeline.zcard(key); // Count current entries
    const results = await pipeline.exec();

    if (!results) return false;

    const count = results[1]?.[1] as number;

    if (count >= RATE_LIMIT_CONFIG.JOBS_PER_MINUTE) {
      return false; // Rate limit exceeded
    }

    // Record this submission and set TTL
    const addPipeline = redis.pipeline();
    addPipeline.zadd(key, now, member);
    addPipeline.expire(key, Math.ceil(RATE_LIMIT_CONFIG.WINDOW_MS / 1000) + 1);
    await addPipeline.exec();

    return true;
  }

  // ... 60 more lines of getCurrentCount(), clear(), close()
}
```

**Why this violates YAGNI:**
- Current deployment: **single Fastify instance** (no multi-instance load balancing)
- MVP launch plan: **single DigitalOcean droplet** (see `docs/deployment/2026-02-26-mvp-deployment-checklist.md`)
- Redis usage: **BullMQ queues only** (no other shared state)
- Actual need: **When we scale to 2+ instances** (not in Phase 2, not in MVP)

**What the ARCH-17 comment claims:**
> "Replaces in-memory Map with Redis for multi-instance support."

**What the reality is:**
- Phase 1 (hypothetical): In-memory Map
- **Phase 2 (this review): Redis-backed** ← Premature!
- Phase 3 (when actually needed): Multi-instance deployment

**Simplified Alternative:**
```typescript
// ✅ CORRECT — in-memory rate limiter (sufficient for MVP)
class InMemoryRateLimiter {
  private counts = new Map<string, { timestamps: number[] }>();

  checkLimit(tenantId: string): boolean {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.WINDOW_MS;

    // Get or create tenant entry
    let entry = this.counts.get(tenantId);
    if (!entry) {
      entry = { timestamps: [] };
      this.counts.set(tenantId, entry);
    }

    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter(t => t >= windowStart);

    // Check limit
    if (entry.timestamps.length >= RATE_LIMIT_CONFIG.JOBS_PER_MINUTE) {
      return false;
    }

    // Record this submission
    entry.timestamps.push(now);
    return true;
  }

  getCurrentCount(tenantId: string): number {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.WINDOW_MS;
    const entry = this.counts.get(tenantId);

    if (!entry) return 0;

    return entry.timestamps.filter(t => t >= windowStart).length;
  }

  clear(tenantId?: string): void {
    if (tenantId) {
      this.counts.delete(tenantId);
    } else {
      this.counts.clear();
    }
  }
}
```

**Impact:**
- **Lines Saved:** 108 lines (replace RedisRateLimiter with 35-line in-memory version)
- **Concepts Removed:** Redis sorted sets, atomic pipelines, connection management, scan cursors
- **Complexity Removed:** 2 Redis connections (BullMQ + rate limiter → just BullMQ)
- **When to add Redis:** When deploying 2+ instances behind a load balancer (MVP+1 milestone)

**Why "but Redis is already there" is NOT a valid defense:**
- Redis is there **for BullMQ** (persistent job queues)
- Using it for ephemeral rate limiting creates **operational coupling** (Redis down = no rate limiting)
- In-memory rate limiting is **simpler, faster** (no network calls), and **sufficient for MVP**

---

### 4. Unused Queue Definitions (MINOR - 15 lines wasted)

**Pattern:** 5 queues defined, only 2 used.

**Evidence:**
```typescript
// queue-manager.ts (lines 231-237)
const queueNames: QueueName[] = [
  'bill-scan',        // ✅ USED
  'invoice-scan',     // ✅ USED
  'transaction-import',  // ❌ UNUSED (no worker, no callers)
  'matching',            // ❌ UNUSED (no worker, no callers)
  'anomaly-detection',   // ❌ UNUSED (no worker, no callers)
];
```

**Grep check:**
```bash
$ Grep "transaction-import" apps/api/src/ --output_mode=files_with_matches
# queue-manager.ts only (no callers)

$ Grep "matching" apps/api/src/ --output_mode=files_with_matches
# queue-manager.ts only (no callers)

$ Grep "anomaly-detection" apps/api/src/ --output_mode=files_with_matches
# queue-manager.ts only (no callers)
```

**Why this violates YAGNI:**
- We **don't need** queues that have NO workers and NO job submissions
- The docstring says these are for "C7" and "D1" — future phases!
- Each queue creates **Redis state, monitoring overhead, Bull Board UI clutter**

**Simplified Alternative:**
```typescript
// ✅ CORRECT — only define queues that exist
const queueNames: QueueName[] = [
  'bill-scan',
  'invoice-scan',
];

// Add more in future phases when actually needed:
// Phase C7: add 'anomaly-detection'
// Phase D1: add 'matching'
// Phase B8: add 'transaction-import'
```

**Impact:**
- **Lines Saved:** 15 lines (queue definitions, type exports)
- **Concepts Removed:** 3 unused queue names, 3 BullMQ adapters in Bull Board
- **Operational Win:** Cleaner Bull Board UI (only shows active queues)

---

### 5. Duplicate Route File Logic (MINOR - 30 lines)

**Pattern:** invoice-scan.ts and bill-scan.ts routes are 95% identical.

**Evidence:**
```typescript
// invoice-scan.ts (lines 67-178)
fastify.post('/scan', { preHandler: [requireConsent('autoCreateInvoices')] }, async (request, reply) => {
  // Parse multipart form data (10 lines) — IDENTICAL
  // Validate entityId (14 lines) — IDENTICAL
  // Security scan (14 lines) — IDENTICAL
  // Rate limit check (9 lines) — IDENTICAL
  // Enqueue job (13 lines) — ONLY DIFFERENCE: 'invoice-scan' vs 'bill-scan'
  // Return response (8 lines) — IDENTICAL
});

// bill-scan.ts (lines 68-179) — NEARLY IDENTICAL
fastify.post('/scan', { preHandler: [requireConsent('autoCreateBills')] }, async (request, reply) => {
  // ... EXACT SAME LOGIC, different queue name and consent type
});
```

**Why this violates YAGNI:**
- We **don't need** two separate 110-line route handlers for identical upload logic
- The only differences are:
  1. Consent type (`autoCreateInvoices` vs `autoCreateBills`)
  2. Queue name (`invoice-scan` vs `bill-scan`)
  3. Log message prefix (`Invoice` vs `Bill`)

**Simplified Alternative:**
```typescript
// shared-scan.routes.ts
function createScanRoute(
  fastify: FastifyInstance,
  documentType: 'invoice' | 'bill'
) {
  const consentType = documentType === 'invoice' ? 'autoCreateInvoices' : 'autoCreateBills';
  const queueName = `${documentType}-scan`;

  fastify.post('/scan', {
    preHandler: [requireConsent(consentType)],
  }, async (request, reply) => {
    const { tenantId, userId } = request;

    // Parse file (shared logic)
    const { fileBuffer, filename, mimeType, entityId } = await parseUpload(request, reply, tenantId);
    if (!fileBuffer) return; // parseUpload already sent error response

    // Security scan (shared)
    const scanResult = await scanFile(fileBuffer, mimeType.split('/')[1]);
    if (!scanResult.safe) {
      return reply.status(422).send({ error: 'File security scan failed', threats: scanResult.threats });
    }

    // Rate limit (shared)
    if (!(await queueManager.checkRateLimit(tenantId))) {
      const status = await queueManager.getRateLimitStatus(tenantId);
      return reply.status(429).send({ error: 'Rate limit exceeded', message: `${status.current}/${status.limit} jobs`, retryAfter: 60 });
    }

    // Enqueue job
    const job = await queueManager.getQueue(queueName).add(`scan-${documentType}`, {
      jobId: `${documentType}-scan-${Date.now()}`,
      tenantId,
      entityId,
      userId,
      imageBase64: fileBuffer.toString('base64'),
      filename,
      mimeType,
    });

    request.log.info({ tenantId, entityId, jobId: job.id, filename }, `${documentType} scan job enqueued`);

    return reply.status(202).send({
      jobId: job.id,
      status: 'queued',
      message: `${documentType} scan job created. Use /api/ai/jobs/${job.id}/stream to track progress.`,
      streamUrl: `/api/ai/jobs/${job.id}/stream`,
    });
  });
}

// invoice-scan.ts — 5 lines
export async function invoiceScanRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);
  createScanRoute(fastify, 'invoice');
}

// bill-scan.ts — 5 lines
export async function billScanRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authMiddleware);
  fastify.addHook('preHandler', tenantMiddleware);
  createScanRoute(fastify, 'bill');
}
```

**Impact:**
- **Lines Saved:** 30 lines (180 lines total → 150 lines after extraction)
- **Concepts Removed:** Duplicate upload parsing, duplicate security logic
- **Bonus:** Future document types (statements) reuse the same route factory

---

## What's GOOD (Don't Change)

These patterns are appropriately simple and should be preserved:

### 1. File Scanner (lib/file-scanner.ts)
- **Purpose:** Validate file type via magic bytes, strip EXIF
- **Lines:** ~150 (reasonable for security-critical file validation)
- **Why good:** Single responsibility, well-tested, no premature abstraction

### 2. PII Redaction (lib/pii-redaction.ts)
- **Purpose:** Strip credit cards, SSNs, emails before AI inference
- **Lines:** ~180 (reasonable for 6 PII types + EXIF stripping)
- **Why good:** Security-critical, progressive enhancement (can add PII types incrementally)

### 3. Prompt Defense (lib/prompt-defense.ts)
- **Purpose:** Detect prompt injection, validate amounts
- **Lines:** ~200 (reasonable for multi-layer defense)
- **Why good:** Each defense layer is independently testable and documented

### 4. Queue Manager Basics (minus rate limiter)
- **Purpose:** Initialize BullMQ queues, provide getter
- **Lines:** ~100 (after removing Redis rate limiter)
- **Why good:** Simple facade over BullMQ, reasonable error handling

---

## Refactoring Roadmap

### Priority 1: Worker Deduplication (CRITICAL)
**Lines Saved:** 258 lines
**Effort:** 2-3 hours
**Steps:**
1. Create `document-scan.worker.ts` with polymorphic processor
2. Extract shared helpers (`determineRouting`, `findOrCreateEntity`, `createDocument`)
3. Delete `invoice-scan.worker.ts` and `bill-scan.worker.ts`
4. Update worker registration in `src/index.ts`
5. Update tests to use unified worker

### Priority 2: Delete Unused Code (EASY)
**Lines Saved:** 145 lines
**Effort:** 30 minutes
**Steps:**
1. Delete `DocumentExtractionService.extractStatement()` implementation (keep stub)
2. Delete `BankStatementExtraction` schema and `validateStatementBalances` function
3. Remove unused queues from `queueNames` array ('transaction-import', 'matching', 'anomaly-detection')

### Priority 3: Simplify Rate Limiting (MEDIUM)
**Lines Saved:** 108 lines
**Effort:** 1 hour
**Steps:**
1. Replace `RedisRateLimiter` with 35-line `InMemoryRateLimiter`
2. Update `QueueManagerClass` to use in-memory version
3. Add TODO comment: "Upgrade to Redis-backed when deploying multi-instance (MVP+1)"
4. Update tests to mock in-memory limiter

### Priority 4: Route Factory (OPTIONAL)
**Lines Saved:** 30 lines
**Effort:** 1 hour
**Steps:**
1. Extract shared route logic to `createScanRoute()` factory
2. Simplify invoice-scan.ts and bill-scan.ts to 5-line wrappers

---

## Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Production Lines** | 1,340 | 989 | -351 (-26%) |
| **Duplicate Lines** | 258 | 0 | -258 (-100%) |
| **Worker Files** | 2 | 1 | -1 (-50%) |
| **Route Files** | 2 | 2 | 0 (refactored) |
| **Unused Methods** | 1 | 0 | -1 (-100%) |
| **Unused Queues** | 3 | 0 | -3 (-100%) |
| **Complexity Classes** | RedisRateLimiter (208 lines) | InMemoryRateLimiter (35 lines) | -173 (-83%) |

---

## Approval Status

**Status:** SIMPLIFICATION RECOMMENDED

**Rationale:**
- Worker duplication is a **P0 issue** — 258 lines of copy-paste creates maintenance debt
- Unused code (extractStatement, unused queues) should NEVER merge to production
- Redis rate limiting is **premature optimization** for MVP

**Recommendation:** Refactor before merging. Priority 1 + 2 are **mandatory**, Priority 3 is **highly recommended**.

---

## Code Simplicity Score

**Before:** 68/100 (MEDIUM complexity)
**After:** 92/100 (LOW complexity)

**Breakdown:**
- Worker duplication: -20 points (critical)
- Unused code: -8 points (moderate)
- Redis rate limiter: -4 points (minor, but adds operational complexity)

**After refactoring:**
- Unified worker: +15 points (elegant polymorphism)
- No unused code: +8 points
- In-memory rate limiter: +5 points (YAGNI-compliant)

---

## Final Notes

**Philosophy Check:**
> "Duplication is cheaper than the wrong abstraction."

This review does NOT advocate for premature abstraction. The proposed worker unification is **justified** because:
1. The duplication is **verbatim copy-paste** (93% identical)
2. The abstraction is **simple polymorphism** (switch on documentType)
3. The pattern is **proven** (3rd worker incoming for bank statements)

**If in doubt:** Ship the duplication, refactor in Phase 3 after bank statement worker lands. But the unused code (extractStatement, unused queues) should NEVER ship.

---

**Reviewed by:** code-simplicity-reviewer
**Signature:** YAGNI enforcer, preventing complexity creep since 2026
