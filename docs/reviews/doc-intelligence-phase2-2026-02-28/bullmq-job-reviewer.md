# BullMQ Job Safety Review — Document Intelligence Phase 2

**Reviewer:** bullmq-job-reviewer
**Review Date:** 2026-02-28
**Scope:** BullMQ job queues, workers, idempotency, retry logic, memory management
**Files Analyzed:** 976 changed files (last 24 hours)

---

## Executive Summary

**Overall Risk:** 🟡 MEDIUM (5 P1 findings, 3 P2 findings)

**Key Findings:**
- ✅ Good: Retry config, rate limiting, tenant isolation, progress tracking
- ⚠️ P1: No idempotency checks (duplicate bills/invoices on retry)
- ⚠️ P1: Base64 job data creates memory pressure (10MB+ per job)
- ⚠️ P1: Missing dead letter queue monitoring
- ⚠️ P1: No graceful shutdown handlers for workers
- ⚠️ P1: Job cleanup config will exhaust Redis (1000 jobs × 10MB = 10GB)

**Overall Assessment:**
The Document Intelligence platform implements BullMQ workers for bill/invoice scanning with **good foundation** (retry logic, rate limiting, structured logging) but **critical gaps in production readiness**. The workers will create duplicate documents on retry failures and consume excessive memory. These issues MUST be addressed before production deployment to prevent data corruption and OOM crashes.

---

## Critical Findings (P0/P1)

### [P1] No Idempotency Checks — Duplicate Bills/Invoices on Retry

**Files:**
- `apps/api/src/domains/ai/workers/bill-scan.worker.ts:72-287`
- `apps/api/src/domains/ai/workers/invoice-scan.worker.ts:72-290`

**Issue:**
Workers create bills/invoices WITHOUT checking for duplicates. If a job fails AFTER creating the bill (e.g., line 229 crashes) but BEFORE completing (line 257), BullMQ retries will create duplicate records.

**Current Flow (Bill Scan):**
```typescript
async function processBillScan(job: Job<BillScanJobData>): Promise<BillScanJobResult> {
  // Line 88: Generate content hash
  const inputHash = createHash('sha256').update(imageBuffer).digest('hex');

  // Line 100: Extract data via AI
  const extraction = await extractionService.extractBill(imageBuffer, ...);

  // Line 197: Create Bill record (NO DUPLICATE CHECK)
  const bill = await prisma.bill.create({
    data: { ... },
  });

  // ❌ DANGER ZONE: If job fails here (e.g., decisionLog insert fails line 240),
  // retry will create ANOTHER bill with same data!
}
```

**Impact:**
- **Data Corruption:** Duplicate bills/invoices for the same document
- **Financial Reporting Errors:** Overstated AP/AR totals
- **User Confusion:** Users see 2+ identical bills, don't know which is real
- **Audit Trail Gaps:** No way to trace which bill came from which retry

**Proof of Vulnerability:**
1. User uploads bill `receipt-001.jpg`
2. Job extracts data, creates Bill record (billId: `abc-123`)
3. Job crashes at line 240 (AIDecisionLog insert fails — DB timeout)
4. BullMQ retries job (attempt 2)
5. Retry re-extracts SAME data, creates ANOTHER Bill record (billId: `def-456`)
6. Result: 2 bills for 1 receipt

**Why Current Hash Doesn't Help:**
The `inputHash` is logged to AIDecisionLog (line 142) but **never used for deduplication**. The hash is PII-safe and perfect for idempotency checks, but it's currently write-only.

**Fix (Required Before Production):**

```typescript
// ✅ SAFE — Check for existing bill using inputHash
async function processBillScan(job: Job<BillScanJobData>): Promise<BillScanJobResult> {
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const inputHash = createHash('sha256').update(imageBuffer).digest('hex');

  // Check if this image was already processed
  const existingDecision = await prisma.aIDecisionLog.findFirst({
    where: {
      tenantId,
      entityId,
      decisionType: 'BILL_EXTRACTION',
      inputHash,
      routingResult: {
        in: [AIRoutingResult.AUTO_CREATED, AIRoutingResult.QUEUED_FOR_REVIEW],
      },
    },
    select: { documentId: true },
  });

  if (existingDecision?.documentId) {
    logger.info({ jobId: job.id, billId: existingDecision.documentId, inputHash },
      'Bill already exists (idempotent retry)');

    // Return existing bill instead of creating duplicate
    const bill = await prisma.bill.findUnique({
      where: { id: existingDecision.documentId },
      select: { id: true, status: true, vendor: { select: { id: true } } },
    });

    return {
      billId: bill.id,
      vendorId: bill.vendor.id,
      confidence: 100, // Already processed
      status: bill.status as 'DRAFT' | 'PENDING',
      decisionLogId: existingDecision.id,
    };
  }

  // Continue with extraction only if not already processed...
}
```

**Verification:**
Add integration test for retry scenario:
```typescript
it('should not create duplicate bills on retry', async () => {
  const jobData = { imageBase64: 'abc...', tenantId, entityId };

  // Process job once
  const result1 = await processBillScan(mockJob(jobData));

  // Simulate retry (same job data)
  const result2 = await processBillScan(mockJob(jobData));

  // Should return SAME billId
  expect(result1.billId).toBe(result2.billId);

  // Should only create 1 bill in DB
  const billCount = await prisma.bill.count({ where: { tenantId, entityId } });
  expect(billCount).toBe(1);
});
```

---

### [P1] Base64 Job Data Creates Memory Pressure (10MB+ Per Job)

**Files:**
- `apps/api/src/domains/ai/workers/bill-scan.worker.ts:44` (imageBase64 field)
- `apps/api/src/domains/business/routes/bill-scan.ts:157` (encoding)
- `apps/api/src/lib/queue/queue-manager.ts:89` (removeOnComplete keeps 1000 jobs)

**Issue:**
Job data stores entire image as base64 string. With max file size 10MB (common for scanned PDFs), each job consumes **~13.3MB in Redis** (base64 = 1.33× binary size). Combined with `removeOnComplete: { count: 1000 }`, this creates **13GB memory footprint** for completed jobs alone.

**Current Flow:**
```typescript
// bill-scan.ts line 157
const job = await queue.add('scan-bill', {
  imageBase64: fileBuffer.toString('base64'), // ❌ 10MB file → 13.3MB string
  filename,
  mimeType,
  // ... other fields
});

// queue-manager.ts line 89
removeOnComplete: {
  age: 86400,   // Keep 24 hours
  count: 1000,  // Keep max 1000 jobs
},
```

**Impact:**
- **Redis OOM:** 1000 completed jobs × 13MB = **13GB Redis memory** (just for completed jobs!)
- **Worker Memory Spikes:** 5 concurrent workers × 13MB = 65MB base memory (before image decoding)
- **Job Deserialization Cost:** 13MB JSON parse on every job fetch
- **Network Overhead:** 13MB transferred from Redis → worker on each job

**Why This Is Dangerous:**
- Free Redis tiers cap at **512MB** (e.g., Upstash, Redis Labs free)
- Production Redis with 2GB RAM → 13GB job data = **constant eviction thrashing**
- Worker memory: 5× 13MB base64 + 5× 10MB decoded buffers = **116MB minimum** (before AI model)

**Fix (Required Before Production):**

**Option A: S3 Reference Pattern (Recommended)**
```typescript
// 1. Upload image to S3 first
const s3Key = `bill-uploads/${tenantId}/${Date.now()}-${filename}`;
await s3.putObject({
  Bucket: env.S3_BUCKET_UPLOADS,
  Key: s3Key,
  Body: fileBuffer,
  ServerSideEncryption: 'AES256',
});

// 2. Enqueue job with S3 reference (tiny payload)
const job = await queue.add('scan-bill', {
  s3Key,           // ✅ Just a string path (~50 bytes)
  s3Bucket: env.S3_BUCKET_UPLOADS,
  tenantId,
  entityId,
  userId,
  filename,
  mimeType,
});

// 3. Worker downloads from S3 on demand
async function processBillScan(job: Job<BillScanJobData>) {
  const { s3Key, s3Bucket } = job.data;

  // Download only when processing (not stored in Redis)
  const response = await s3.getObject({ Bucket: s3Bucket, Key: s3Key });
  const imageBuffer = Buffer.from(await response.Body.transformToByteArray());

  // ... process as normal

  // Cleanup S3 file after processing
  await s3.deleteObject({ Bucket: s3Bucket, Key: s3Key });
}
```

**Option B: Aggressive Cleanup (If S3 Not Available)**
```typescript
// queue-manager.ts
removeOnComplete: {
  age: 3600,     // ✅ 1 hour instead of 24 (14× less retention)
  count: 50,     // ✅ 50 jobs instead of 1000 (20× less retention)
},
removeOnFail: {
  age: 86400,    // Keep failed jobs longer for debugging
  count: 200,    // But still cap at 200
},
```

**Cost Analysis:**
| Approach | Redis Memory (1000 jobs) | Savings |
|----------|-------------------------|---------|
| Current (base64) | **13GB** | Baseline |
| Option A (S3) | **~50KB** | **99.996% reduction** |
| Option B (cleanup) | **650MB** | 95% reduction |

**Recommendation:** Implement Option A (S3) before scaling past 10 users/day. Option B buys time but doesn't solve root cause.

---

### [P1] Missing Dead Letter Queue (DLQ) Monitoring

**Files:**
- `apps/api/src/lib/queue/queue-manager.ts:80-96` (retry config)
- No DLQ consumer or alert handler found

**Issue:**
Failed jobs after 3 retries go to `{queue}:failed` set in Redis with NO monitoring, alerting, or recovery workflow. In production, this creates **silent data loss** — users upload bills that silently fail and never notify anyone.

**Current Config:**
```typescript
// queue-manager.ts line 82
defaultJobOptions: {
  attempts: 3,                    // ✅ Retry 3 times
  backoff: { type: 'exponential', delay: 2000 }, // ✅ Exponential backoff
  removeOnFail: {
    age: 604800,                 // ✅ Keep 7 days
  },
  // ❌ NO dead letter handler, NO alerts, NO recovery
},
```

**Impact:**
- **Silent Failures:** User uploads bill → job fails 3 times → no notification
- **Lost Revenue:** Invoice scan fails → user doesn't know → invoice not sent
- **No Observability:** How many jobs are failing? What error patterns?
- **No Recovery:** Failed jobs sit in Redis for 7 days then vanish

**Production Scenario:**
1. User uploads 10 bills
2. 8 succeed, 2 fail (AI API timeout)
3. Failed jobs retry 3× (all timeout again)
4. Jobs move to DLQ silently
5. User sees 8/10 bills, assumes 2 are "processing"
6. After 7 days, failed jobs auto-delete (data loss)
7. User discovers missing bills in monthly reconciliation → files complaint

**Fix (Required Before Production):**

**1. Add DLQ Event Handler:**
```typescript
// lib/queue/dlq-handler.ts
import { Queue, QueueEvents } from 'bullmq';
import { logger } from '../logger';
import { sendAlert } from '../alerts'; // Slack/email/PagerDuty

export function registerDLQHandler(queue: Queue, queueName: string) {
  const events = new QueueEvents(queueName, { connection: queue.opts.connection });

  events.on('failed', async ({ jobId, failedReason }) => {
    const job = await queue.getJob(jobId);

    if (!job) return;

    // Check if job exhausted retries
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      logger.error(
        {
          queueName,
          jobId,
          jobData: job.data,
          failedReason,
          attemptsMade: job.attemptsMade,
        },
        '🚨 Job moved to dead letter queue after max retries'
      );

      // Alert engineering team
      await sendAlert({
        severity: 'error',
        title: `DLQ: ${queueName} job ${jobId} failed permanently`,
        message: `Job failed after ${job.attemptsMade} attempts. Reason: ${failedReason}`,
        metadata: {
          queueName,
          jobId,
          tenantId: job.data.tenantId,
          entityId: job.data.entityId,
        },
      });

      // Store DLQ record for user notification
      await prisma.jobFailure.create({
        data: {
          jobId,
          queueName,
          tenantId: job.data.tenantId,
          entityId: job.data.entityId,
          userId: job.data.userId,
          failureReason: failedReason,
          jobData: job.data,
          attemptsMade: job.attemptsMade,
        },
      });
    }
  });

  logger.info({ queueName }, 'DLQ handler registered');
}
```

**2. Add User Notification:**
```typescript
// domains/system/services/job-failure-notifier.ts
export class JobFailureNotifier {
  /**
   * Check for failed jobs and notify users.
   * Run via cron every 5 minutes.
   */
  async notifyFailures() {
    const failures = await prisma.jobFailure.findMany({
      where: {
        notifiedAt: null,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 min
      },
      include: { user: true },
    });

    for (const failure of failures) {
      // Send in-app notification
      await prisma.notification.create({
        data: {
          userId: failure.userId,
          type: 'JOB_FAILED',
          title: 'Document Upload Failed',
          message: `Your ${failure.queueName.replace('-scan', '')} upload failed after 3 attempts. Please try again or contact support.`,
          metadata: { jobId: failure.jobId, queueName: failure.queueName },
        },
      });

      // Mark as notified
      await prisma.jobFailure.update({
        where: { id: failure.id },
        data: { notifiedAt: new Date() },
      });
    }
  }
}
```

**3. Add Bull Board DLQ View:**
```typescript
// Already exists in lib/queue/bull-board.ts but needs DLQ tab
// Verify Bull Board shows failed jobs with retry button
```

---

### [P1] No Graceful Shutdown Handlers

**Files:**
- `apps/api/src/domains/ai/workers/bill-scan.worker.ts:296-334`
- `apps/api/src/domains/ai/workers/invoice-scan.worker.ts:299-337`
- `apps/api/src/index.ts` (no shutdown handler registration found)

**Issue:**
Workers don't handle `SIGTERM` or `SIGINT` gracefully. On deployment or container shutdown, in-flight jobs are interrupted mid-processing, leaving **partial database state** (e.g., Bill created but AIDecisionLog missing).

**Current Code:**
```typescript
// bill-scan.worker.ts line 296
export function startBillScanWorker(): Worker {
  const worker = new Worker<BillScanJobData, BillScanJobResult>(
    'bill-scan',
    processBillScan,
    { connection, concurrency: 5 }
  );

  // Event handlers registered...

  return worker;
  // ❌ NO shutdown handler — worker abandoned on SIGTERM
}
```

**Impact:**
- **Partial Data:** Job creates Bill, then killed before AIDecisionLog insert → orphaned bill
- **Job Re-processing:** Killed jobs auto-retry → duplicate bills (see P1 #1)
- **Connection Leaks:** Redis connections not closed → exhausts connection pool
- **Long Deploys:** Kubernetes waits 30s for pods to exit → kills forcefully

**Production Scenario:**
1. Deploy new version while 5 jobs in-flight
2. K8s sends SIGTERM to old pod
3. Worker ignores signal, continues processing
4. After 30s, K8s sends SIGKILL (force kill)
5. Job crashes mid-execution (bill created, no decision log)
6. Job retries on new pod → creates duplicate bill

**Fix (Required Before Production):**

```typescript
// index.ts — Register shutdown handlers
import { logger } from './lib/logger';
import { startBillScanWorker } from './domains/ai/workers/bill-scan.worker';
import { startInvoiceScanWorker } from './domains/ai/workers/invoice-scan.worker';

const workers: Worker[] = [];

async function startWorkers() {
  workers.push(startBillScanWorker());
  workers.push(startInvoiceScanWorker());
  logger.info({ workerCount: workers.length }, 'All workers started');
}

async function gracefulShutdown() {
  logger.info('SIGTERM received, shutting down gracefully...');

  // Close workers (waits for in-flight jobs to complete, max 30s)
  await Promise.all(
    workers.map(async (worker) => {
      try {
        await worker.close(false, 30000); // Don't force, wait max 30s
        logger.info({ workerName: worker.name }, 'Worker closed gracefully');
      } catch (error) {
        logger.error({ err: error, workerName: worker.name }, 'Worker shutdown error');
      }
    })
  );

  // Close queue manager
  await queueManager.close();

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

// Register signal handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start everything
await startWorkers();
```

**Why 30s Timeout:**
- Mistral vision API: ~10-15s per image
- Database operations: ~2-5s
- Margin for retries: ~10s
- Total: 30s is safe upper bound

**Verification:**
```bash
# Test graceful shutdown locally
node dist/index.js &
PID=$!

# Send SIGTERM
kill -TERM $PID

# Should see logs:
# "SIGTERM received, shutting down gracefully..."
# "Worker closed gracefully"
# "Graceful shutdown complete"
```

---

### [P1] Job Cleanup Config Will Exhaust Redis

**File:** `apps/api/src/lib/queue/queue-manager.ts:88-95`

**Issue:**
Default `removeOnComplete: { count: 1000 }` + large base64 payloads = **13GB Redis usage** (see P1 #2). Even with S3 fix, keeping 1000 jobs is excessive for debugging needs.

**Current Config:**
```typescript
removeOnComplete: {
  age: 86400,      // 24 hours
  count: 1000,     // Max 1000 jobs
},
removeOnFail: {
  age: 604800,     // 7 days
  // ❌ NO count limit — failed jobs accumulate forever until 7 days
},
```

**Impact:**
- **Redis Memory Growth:** Completed jobs never fully purge (whichever hits first: 24h OR 1000 jobs)
- **Failed Jobs Accumulate:** No `count` on removeOnFail → if 10 jobs/sec fail, 7 days = **6 million failed jobs**
- **Search Performance:** Bull Board "Failed" tab crawls with 1000+ jobs

**Fix (Required):**

```typescript
// ✅ SAFE — Aggressive cleanup with forensic retention
removeOnComplete: {
  age: 3600,       // 1 hour (enough for "where's my job?" debugging)
  count: 100,      // Keep last 100 (not 1000)
},
removeOnFail: {
  age: 86400,      // 1 day (not 7 — failed jobs go to DLQ handler)
  count: 500,      // ✅ ADD COUNT LIMIT — prevent accumulation
},
```

**Rationale:**
- Completed jobs: Bull Board + SSE already show real-time progress → 1h retention sufficient
- Failed jobs: DLQ handler logs to database → Redis retention can be short

---

## Medium Priority Findings (P2)

### [P2] No Job Data Size Validation

**File:** `apps/api/src/domains/business/routes/bill-scan.ts:113`

**Issue:**
Route accepts file uploads up to Fastify's default limit (1MB) but doesn't enforce a documented maximum. Combined with base64 encoding, a 10MB PDF → 13MB Redis entry.

**Current Code:**
```typescript
// bill-scan.ts line 113
const fileBuffer = await data.toBuffer();
// ❌ No size check — relies on Fastify default
```

**Fix:**
```typescript
// Add explicit limit before base64 encoding
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const fileBuffer = await data.toBuffer();

if (fileBuffer.length > MAX_FILE_SIZE) {
  return reply.status(413).send({
    error: 'File too large',
    message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    size: fileBuffer.length,
    limit: MAX_FILE_SIZE,
  });
}
```

**Also add to Fastify config:**
```typescript
// index.ts
const app = Fastify({
  bodyLimit: 10 * 1024 * 1024, // 10MB max
  logger: true,
});
```

---

### [P2] Missing Job Timeout Enforcement

**File:** `apps/api/src/lib/queue/queue-manager.ts:196`

**Issue:**
Job timeout set to 60s, but DocumentExtractionService has no timeout on Mistral API calls. If Mistral hangs, job runs indefinitely (not killed after 60s).

**Current Config:**
```typescript
// queue-manager.ts line 196
defaultJobOptions: {
  timeout: 60000, // 60 seconds
},
```

**Why This Doesn't Work:**
BullMQ `timeout` only marks job as failed after 60s but **doesn't kill the worker process**. If Mistral API call hangs, the worker remains blocked.

**Fix:**
```typescript
// domains/ai/services/document-extraction.service.ts
export class DocumentExtractionService {
  async extractBill(imageBuffer: Buffer, context: TenantContext) {
    // ✅ Wrap Mistral call with timeout
    const EXTRACTION_TIMEOUT = 45000; // 45s (leaves 15s for DB ops)

    const extractionPromise = this.mistralProvider.extractBill(imageBuffer);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Extraction timeout')), EXTRACTION_TIMEOUT)
    );

    const extraction = await Promise.race([extractionPromise, timeoutPromise]);

    return extraction;
  }
}
```

---

### [P2] No Worker Health Checks

**Files:**
- `apps/api/src/domains/ai/workers/bill-scan.worker.ts` (no health endpoint)
- `apps/api/src/lib/queue/queue-manager.ts:322-339` (has Redis health check, no worker check)

**Issue:**
No way to verify workers are running and processing jobs. In production, a crashed worker goes unnoticed until users report "stuck jobs."

**Fix:**
```typescript
// routes/health.ts
fastify.get('/health/workers', async (request, reply) => {
  const workers = [
    { name: 'bill-scan', worker: billScanWorker },
    { name: 'invoice-scan', worker: invoiceScanWorker },
  ];

  const statuses = await Promise.all(
    workers.map(async ({ name, worker }) => {
      try {
        // Check if worker is running
        const isRunning = !worker.isRunning() ? false : true;

        // Get queue stats
        const queue = queueManager.getQueue(name);
        const counts = await queue.getJobCounts();

        return {
          name,
          status: isRunning ? 'healthy' : 'stopped',
          active: counts.active,
          waiting: counts.waiting,
          failed: counts.failed,
        };
      } catch (error) {
        return {
          name,
          status: 'error',
          error: error.message,
        };
      }
    })
  );

  const allHealthy = statuses.every((s) => s.status === 'healthy');

  return reply.status(allHealthy ? 200 : 503).send({
    status: allHealthy ? 'healthy' : 'degraded',
    workers: statuses,
  });
});
```

---

## Positive Findings ✅

### ✅ Retry Configuration

**File:** `apps/api/src/lib/queue/queue-manager.ts:82-87`

**Good:**
- 3 retry attempts (reasonable for transient failures)
- Exponential backoff (2s, 4s, 8s) prevents thundering herd
- Backoff delay appropriate for AI API timeouts

---

### ✅ Rate Limiting

**File:** `apps/api/src/lib/queue/queue-manager.ts:104-157`

**Good:**
- Per-tenant rate limiting (100 jobs/minute)
- Sliding window implementation (prevents burst abuse)
- Rate limit status exposed for API responses
- Protects against DoS via unlimited job submission

**Note:** In-memory limiter won't scale horizontally (multiple API pods). Migrate to Redis-backed limiter (e.g., `ioredis-rate-limiter`) before adding second API pod.

---

### ✅ Tenant Isolation

**Files:**
- `apps/api/src/domains/ai/workers/bill-scan.worker.ts:162-169`
- `apps/api/src/domains/business/routes/bill-scan.ts:102-110`

**Good:**
- entityId validated against tenantId before job enqueue (IDOR prevention)
- Worker queries filter by entityId (inherits tenant via entity.tenantId FK)
- Vendor/client creation scoped to entityId

---

### ✅ Progress Tracking

**Files:**
- `apps/api/src/domains/ai/workers/bill-scan.worker.ts:81,96,116,159,194,237,257`

**Good:**
- 7 progress updates (10% → 100%) for granular UX feedback
- Progress logged before slow operations (extraction, DB inserts)
- Enables real-time frontend updates via SSE

---

### ✅ Structured Logging

**Files:**
- `apps/api/src/domains/ai/workers/bill-scan.worker.ts:75,90,105,187,231,259,279`
- Uses pino (via `logger.info/error`)
- Includes structured context (jobId, tenantId, entityId, confidence)
- Error logs include full stack traces

---

## Recommendations

### Immediate (Before Production)

1. **[P1 #1] Add Idempotency Checks**
   - Use inputHash to deduplicate bills/invoices
   - Add integration tests for retry scenarios
   - Estimated effort: 4 hours

2. **[P1 #2] Migrate to S3 Job Data**
   - Replace base64 payloads with S3 references
   - Add S3 lifecycle policy (auto-delete after 7 days)
   - Estimated effort: 8 hours

3. **[P1 #3] Implement DLQ Handler**
   - Add JobFailure model to schema
   - Add DLQ event handler with alerts
   - Add user notification cron
   - Estimated effort: 6 hours

4. **[P1 #4] Add Graceful Shutdown**
   - Register SIGTERM/SIGINT handlers
   - Test with `kill -TERM` locally
   - Estimated effort: 2 hours

5. **[P1 #5] Fix Job Cleanup Config**
   - Reduce removeOnComplete to 100 jobs / 1 hour
   - Add removeOnFail count limit (500)
   - Estimated effort: 30 minutes

### Short-Term (Next Sprint)

6. **[P2 #1] Add File Size Validation**
   - Enforce 10MB limit before base64 encoding
   - Add to Fastify bodyLimit config
   - Estimated effort: 1 hour

7. **[P2 #2] Add Extraction Timeout**
   - Wrap Mistral calls with Promise.race
   - Set 45s timeout (leaves 15s margin)
   - Estimated effort: 1 hour

8. **[P2 #3] Add Worker Health Checks**
   - Add `/health/workers` endpoint
   - Monitor via uptime checker (Pingdom, etc.)
   - Estimated effort: 2 hours

### Long-Term (Production Readiness)

9. **Migrate Rate Limiter to Redis**
   - Current in-memory limiter won't scale horizontally
   - Use `ioredis-rate-limiter` or Bull's built-in limiter
   - Estimated effort: 4 hours

10. **Add Job Metrics Dashboard**
    - Track job success/failure rates
    - Alert on anomalies (>10% failure rate)
    - Use Bull Board or Grafana + Prometheus exporter
    - Estimated effort: 1 day

11. **Add Job Deduplication at Enqueue Time**
    - Check if same inputHash job is already queued/processing
    - Reject duplicate submissions with 409 Conflict
    - Prevents wasting AI API credits on duplicate scans
    - Estimated effort: 3 hours

---

## Testing Recommendations

### Required Tests (Before Production)

1. **Idempotency Test:**
   ```typescript
   it('should not create duplicate bills on job retry', async () => {
     const jobData = createMockJobData();
     const result1 = await processBillScan(jobData);
     const result2 = await processBillScan(jobData); // Retry

     expect(result1.billId).toBe(result2.billId);

     const billCount = await prisma.bill.count({ where: { tenantId } });
     expect(billCount).toBe(1);
   });
   ```

2. **Graceful Shutdown Test:**
   ```typescript
   it('should complete in-flight jobs on SIGTERM', async () => {
     const worker = startBillScanWorker();

     // Start job
     await queue.add('scan-bill', mockJobData);
     await sleep(100); // Job in-flight

     // Send shutdown signal
     process.emit('SIGTERM');

     await sleep(5000); // Wait for shutdown

     // Job should complete (not abandoned)
     const job = await queue.getJob(jobId);
     expect(job.returnvalue).toBeDefined();
     expect(job.failedReason).toBeUndefined();
   });
   ```

3. **Rate Limit Test:**
   ```typescript
   it('should reject 101st job in 1 minute window', async () => {
     for (let i = 0; i < 100; i++) {
       await queue.add('scan-bill', mockJobData);
     }

     const response = await app.inject({
       method: 'POST',
       url: '/api/business/bills/scan',
       payload: formData,
     });

     expect(response.statusCode).toBe(429);
     expect(response.json().error).toMatch(/rate limit/i);
   });
   ```

---

## Summary

**Production Readiness:** ❌ **NOT READY**

**Blockers:**
1. No idempotency (will create duplicate bills/invoices)
2. Memory pressure from base64 job data (13GB Redis usage)
3. No DLQ monitoring (silent failures)
4. No graceful shutdown (partial data on deploy)
5. Job cleanup will exhaust Redis

**Estimated Effort to Production:**
- P1 fixes: ~21 hours (2.5 days)
- P2 fixes: ~4 hours
- Testing: ~4 hours
- **Total: ~29 hours (3.5 days)**

**Recommendation:**
Do NOT deploy to production until P1 findings are resolved. The idempotency issue (#1) will cause immediate user-facing bugs (duplicate bills). The memory issue (#2) will cause Redis OOM within days of moderate usage.

---

**Reviewed by:** bullmq-job-reviewer
**Next Review:** After P1 fixes implemented
