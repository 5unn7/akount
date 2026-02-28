import { Worker, Job } from 'bullmq';
import { prisma, BillStatus, AIRoutingResult, Prisma } from '@akount/db';
import { createHash } from 'crypto';
import { queueManager, getRedisConnection } from '../../../lib/queue/queue-manager';
import { DocumentExtractionService } from '../services/document-extraction.service';
import { logger } from '../../../lib/logger';
import { env } from '../../../lib/env';

/**
 * Bill Scan Worker (DEV-238)
 *
 * P1-18 TODO: Extract BaseDocumentScanWorker to eliminate 258-line duplication (93% identical to invoice-scan.worker.ts)
 * - Common: entity validation, hash calculation, extraction, idempotency, decision logging
 * - Unique: vendor vs client lookup, Bill vs Invoice creation (30 lines each)
 * - Refactor: abstract class BaseDocumentScanWorker<TData, TResult> with template methods
 *
 * BullMQ worker for processing bill/receipt uploads via Mistral vision AI.
 *
 * **Processing Flow (AP):**
 * 1. Extract structured data from image (DocumentExtractionService)
 * 2. Validate extraction confidence (threshold: 60%)
 * 3. Match or create vendor record
 * 4. Create Bill with DRAFT status
 * 5. Log AI decision to AIDecisionLog
 * 6. Update job progress (0% → 100%)
 *
 * **Routing:**
 * - High confidence (≥80%) → Create Bill (DRAFT status)
 * - Medium confidence (60-79%) → Create Bill (REVIEW status)
 * - Low confidence (<60%) → REVIEW_REQUIRED
 *
 * **Queue:** bill-scan
 * **Concurrency:** 5 concurrent jobs
 * **Timeout:** 60 seconds per job
 *
 * @module bill-scan-worker
 */

export interface BillScanJobData {
  /** Unique job identifier */
  jobId: string;
  /** Tenant ID for isolation */
  tenantId: string;
  /** Entity ID for business context */
  entityId: string;
  /** User ID who initiated the scan */
  userId: string;
  /** Image buffer (base64-encoded for queue serialization) */
  imageBase64: string;
  /** Original filename */
  filename: string;
  /** MIME type (image/jpeg, image/png, application/pdf) */
  mimeType: string;
}

export interface BillScanJobResult {
  /** Created bill ID (if successful) */
  billId?: string;
  /** Created vendor ID (if new vendor) */
  vendorId?: string;
  /** Extraction confidence (0-100) */
  confidence: number;
  /** Routing decision */
  status: 'DRAFT' | 'PENDING' | 'REVIEW_REQUIRED';
  /** Error message (if failed) */
  error?: string;
  /** AI decision log ID */
  decisionLogId: string;
}

/**
 * Process a bill scan job.
 *
 * @param job - BullMQ job with bill scan data
 * @returns Bill creation result
 */
async function processBillScan(job: Job<BillScanJobData>): Promise<BillScanJobResult> {
  const { tenantId, entityId, userId, imageBase64, filename, mimeType } = job.data;

  logger.info(
    { jobId: job.id, tenantId, entityId, filename },
    'Bill scan job started'
  );

  // Update progress: 10%
  await job.updateProgress(10);

  // P0-9: Entity ownership validation - prevent cross-tenant pollution
  const entity = await prisma.entity.findFirst({
    where: { id: entityId, tenantId },
    select: { id: true },
  });

  if (!entity) {
    logger.error(
      { jobId: job.id, entityId, tenantId },
      'Entity ownership validation failed: Entity does not belong to tenant'
    );
    throw new Error(`Entity ${entityId} not found or access denied for tenant ${tenantId}`);
  }

  try {
    // Decode base64 image
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Generate content hash for deduplication (PII-safe)
    const inputHash = createHash('sha256').update(imageBuffer).digest('hex');

    logger.info(
      { jobId: job.id, bufferSize: imageBuffer.length, mimeType, inputHash: inputHash.substring(0, 16) },
      'Image buffer decoded'
    );

    // Update progress: 20%
    await job.updateProgress(20);

    // Extract bill data via DocumentExtractionService (DEV-235)
    const extractionService = new DocumentExtractionService();
    const extraction = await extractionService.extractBill(imageBuffer, {
      userId,
      tenantId,
      entityId,
    });

    logger.info(
      {
        jobId: job.id,
        vendor: extraction.data.vendor,
        amount: extraction.data.totalAmount,
        confidence: extraction.confidence,
      },
      'Bill extraction complete'
    );

    // Update progress: 50%
    await job.updateProgress(50);

    // P0-6: Idempotency check - prevent duplicate bill creation on retry
    const existingDecision = await prisma.aIDecisionLog.findFirst({
      where: {
        inputHash,
        decisionType: 'BILL_EXTRACTION',
        tenantId,
      },
      select: {
        id: true,
        documentId: true,
        createdAt: true,
      },
    });

    if (existingDecision && existingDecision.documentId) {
      logger.info(
        {
          jobId: job.id,
          existingDecisionId: existingDecision.id,
          existingBillId: existingDecision.documentId,
          originalCreatedAt: existingDecision.createdAt,
        },
        'Bill already processed (idempotency check) - skipping creation'
      );

      return {
        confidence: extraction.confidence,
        status: 'ALREADY_PROCESSED',
        billId: existingDecision.documentId,
        decisionLogId: existingDecision.id,
      };
    }

    // Determine routing based on confidence
    let billStatus: BillStatus;
    let routingResult: AIRoutingResult;

    if (extraction.confidence >= 80) {
      billStatus = BillStatus.DRAFT; // High confidence — auto-create as draft
      routingResult = AIRoutingResult.AUTO_CREATED;
    } else if (extraction.confidence >= 60) {
      billStatus = BillStatus.PENDING; // Medium confidence — needs review
      routingResult = AIRoutingResult.QUEUED_FOR_REVIEW;
    } else {
      // Low confidence — don't auto-create, return for manual entry
      logger.warn(
        { jobId: job.id, confidence: extraction.confidence },
        'Bill extraction confidence too low — manual review required'
      );

      // Log AI decision (even for rejected extractions)
      const decisionLog = await prisma.aIDecisionLog.create({
        data: {
          tenantId,
          entityId,
          decisionType: 'BILL_EXTRACTION',
          inputHash,
          modelVersion: extraction.modelVersion,
          confidence: extraction.confidence,
          extractedData: extraction.data as unknown as Prisma.InputJsonValue,
          routingResult: AIRoutingResult.MANUAL_ENTRY,
          aiExplanation: `Confidence ${extraction.confidence}% below threshold (60%)`,
          processingTimeMs: extraction.processingTimeMs,
        },
      });

      return {
        confidence: extraction.confidence,
        status: 'REVIEW_REQUIRED',
        decisionLogId: decisionLog.id,
      };
    }

    // Update progress: 60%
    await job.updateProgress(60);

    // Find or create vendor (SEC-46: Use entityId directly for tenant isolation)
    let vendor = await prisma.vendor.findFirst({
      where: {
        entityId,
        name: extraction.data.vendor,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    let vendorCreated = false;

    if (!vendor) {
      // P0-8: TODO - Replace with vendorService.findOrCreate() (P1-18)
      // Create new vendor
      vendor = await prisma.vendor.create({
        data: {
          entityId,
          name: extraction.data.vendor,
          status: 'ACTIVE',
          paymentTerms: extraction.data.paymentTerms?.terms || 'NET 30',
        },
        select: { id: true, name: true },
      });

      vendorCreated = true;

      logger.info(
        { jobId: job.id, vendorId: vendor.id, vendorName: vendor.name },
        'New vendor created from bill extraction'
      );
    }

    // Update progress: 75%
    await job.updateProgress(75);

    // P0-8: TODO - Replace with billService.create() (consolidates validation, P1-18)
    // Create Bill
    const bill = await prisma.bill.create({
      data: {
        entityId,
        vendorId: vendor.id,
        billNumber: extraction.data.billNumber || `AI-${Date.now()}`,
        issueDate: new Date(extraction.data.date),
        dueDate: extraction.data.paymentTerms?.dueDate
          ? new Date(extraction.data.paymentTerms.dueDate)
          : new Date(extraction.data.date), // Default: due same day
        currency: extraction.data.currency,
        subtotal: extraction.data.subtotal,
        taxAmount: extraction.data.taxAmount,
        total: extraction.data.totalAmount,
        paidAmount: 0,
        status: billStatus,
        notes: `AI-extracted from ${filename}`,
        // Line items
        billLines: {
          create: extraction.data.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            taxAmount: item.taxAmount || 0,
          })),
        },
      },
      select: {
        id: true,
        billNumber: true,
        status: true,
      },
    });

    logger.info(
      { jobId: job.id, billId: bill.id, billNumber: bill.billNumber, status: bill.status },
      'Bill created from extraction'
    );

    // Update progress: 90%
    await job.updateProgress(90);

    // Log AI decision (DEV-232)
    const decisionLog = await prisma.aIDecisionLog.create({
      data: {
        tenantId,
        entityId,
        documentId: bill.id,
        decisionType: 'BILL_EXTRACTION',
        inputHash,
        modelVersion: extraction.modelVersion,
        confidence: extraction.confidence,
        extractedData: extraction.data as unknown as Prisma.InputJsonValue,
        routingResult,
        aiExplanation: `Confidence ${extraction.confidence}% → ${billStatus} status`,
        processingTimeMs: extraction.processingTimeMs,
      },
    });

    // Update progress: 100%
    await job.updateProgress(100);

    logger.info(
      {
        jobId: job.id,
        billId: bill.id,
        vendorId: vendor.id,
        vendorCreated,
        confidence: extraction.confidence,
        status: billStatus,
      },
      'Bill scan job completed'
    );

    return {
      billId: bill.id,
      vendorId: vendor.id,
      confidence: extraction.confidence,
      status: billStatus,
      decisionLogId: decisionLog.id,
    };
  } catch (error: unknown) {
    logger.error(
      { err: error, jobId: job.id, tenantId, entityId },
      'Bill scan job failed'
    );

    // Re-throw for BullMQ retry mechanism
    throw error;
  }
}

/**
 * Initialize Bill Scan Worker.
 *
 * Call this during application startup to start processing bill-scan jobs.
 *
 * @returns Worker instance (for graceful shutdown)
 */
export function startBillScanWorker(): Worker {
  // ARCH-16: Use shared Redis config (DRY)
  const connection = getRedisConnection();

  const worker = new Worker<BillScanJobData, BillScanJobResult>(
    'bill-scan',
    processBillScan,
    {
      connection,
      concurrency: 5, // Process 5 jobs in parallel
      limiter: {
        max: 10, // Max 10 jobs per second
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(
      { jobId: job.id, billId: job.returnvalue?.billId },
      'Bill scan worker: Job completed'
    );
  });

  worker.on('failed', (job, error) => {
    logger.error(
      { jobId: job?.id, err: error },
      'Bill scan worker: Job failed'
    );
  });

  worker.on('error', (error) => {
    logger.error({ err: error }, 'Bill scan worker: Worker error');
  });

  logger.info({ concurrency: 5 }, 'Bill scan worker started');

  // P1-16: Graceful shutdown - wait for in-progress jobs before exit
  const shutdownHandler = async (signal: string) => {
    logger.info({ signal }, 'Bill scan worker received shutdown signal');
    await worker.close();
    logger.info('Bill scan worker shut down gracefully');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));

  return worker;
}
