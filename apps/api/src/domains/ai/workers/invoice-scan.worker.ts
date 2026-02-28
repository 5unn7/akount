import { Worker, Job } from 'bullmq';
import { prisma, InvoiceStatus, AIRoutingResult, Prisma } from '@akount/db';
import { createHash } from 'crypto';
import { getRedisConnection } from '../../../lib/queue/queue-manager';
import { DocumentExtractionService } from '../services/document-extraction.service';
import { logger } from '../../../lib/logger';
import { env } from '../../../lib/env';

/**
 * Invoice Scan Worker (DEV-239)
 *
 * BullMQ worker for processing invoice uploads via Mistral vision AI.
 *
 * **Processing Flow (AR):**
 * 1. Extract structured data from image (DocumentExtractionService)
 * 2. Validate extraction confidence (threshold: 60%)
 * 3. Match or create client record
 * 4. Create Invoice with DRAFT status
 * 5. Log AI decision to AIDecisionLog
 * 6. Update job progress (0% → 100%)
 *
 * **Routing:**
 * - High confidence (≥80%) → Create Invoice (DRAFT status)
 * - Medium confidence (60-79%) → Create Invoice (PENDING status for review)
 * - Low confidence (<60%) → REVIEW_REQUIRED (manual entry with hints)
 *
 * **Queue:** invoice-scan
 * **Concurrency:** 5 concurrent jobs
 * **Timeout:** 60 seconds per job
 *
 * @module invoice-scan-worker
 */

export interface InvoiceScanJobData {
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

export interface InvoiceScanJobResult {
  /** Created invoice ID (if successful) */
  invoiceId?: string;
  /** Created client ID (if new client) */
  clientId?: string;
  /** Extraction confidence (0-100) */
  confidence: number;
  /** Routing decision */
  status: 'DRAFT' | 'SENT' | 'REVIEW_REQUIRED';
  /** Error message (if failed) */
  error?: string;
  /** AI decision log ID */
  decisionLogId: string;
}

/**
 * Process an invoice scan job.
 *
 * @param job - BullMQ job with invoice scan data
 * @returns Invoice creation result
 */
async function processInvoiceScan(job: Job<InvoiceScanJobData>): Promise<InvoiceScanJobResult> {
  const { tenantId, entityId, userId, imageBase64, filename, mimeType } = job.data;

  logger.info(
    { jobId: job.id, tenantId, entityId, filename },
    'Invoice scan job started'
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

    // Extract invoice data via DocumentExtractionService (DEV-235)
    const extractionService = new DocumentExtractionService();
    const extraction = await extractionService.extractInvoice(imageBuffer, {
      userId,
      tenantId,
      entityId,
    });

    logger.info(
      {
        jobId: job.id,
        client: extraction.data.clientName,
        amount: extraction.data.totalAmount,
        confidence: extraction.confidence,
      },
      'Invoice extraction complete'
    );

    // Update progress: 50%
    await job.updateProgress(50);

    // P0-6: Idempotency check - prevent duplicate invoice creation on retry
    const existingDecision = await prisma.aIDecisionLog.findFirst({
      where: {
        inputHash,
        decisionType: 'INVOICE_EXTRACTION',
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
          existingInvoiceId: existingDecision.documentId,
          originalCreatedAt: existingDecision.createdAt,
        },
        'Invoice already processed (idempotency check) - skipping creation'
      );

      return {
        confidence: extraction.confidence,
        status: 'ALREADY_PROCESSED',
        invoiceId: existingDecision.documentId,
        decisionLogId: existingDecision.id,
      };
    }

    // Determine routing based on confidence
    let invoiceStatus: InvoiceStatus;
    let routingResult: AIRoutingResult;

    if (extraction.confidence >= 80) {
      invoiceStatus = InvoiceStatus.DRAFT; // High confidence — auto-create as draft
      routingResult = AIRoutingResult.AUTO_CREATED;
    } else if (extraction.confidence >= 60) {
      // Medium confidence — create but mark as needing review (use DRAFT with note)
      invoiceStatus = InvoiceStatus.DRAFT;
      routingResult = AIRoutingResult.QUEUED_FOR_REVIEW;
    } else {
      // Low confidence — don't auto-create, return for manual entry
      logger.warn(
        { jobId: job.id, confidence: extraction.confidence },
        'Invoice extraction confidence too low — manual review required'
      );

      // Log AI decision (even for rejected extractions)
      const decisionLog = await prisma.aIDecisionLog.create({
        data: {
          tenantId,
          entityId,
          decisionType: 'INVOICE_EXTRACTION',
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

    // Find or create client (SEC-46: Use entityId directly for tenant isolation)
    let client = await prisma.client.findFirst({
      where: {
        entityId,
        name: extraction.data.clientName,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    let clientCreated = false;

    if (!client) {
      // P0-8: TODO - Replace with clientService.findOrCreate() (P1-18)
      // Create new client
      client = await prisma.client.create({
        data: {
          entityId,
          name: extraction.data.clientName,
          status: 'ACTIVE',
          paymentTerms: extraction.data.paymentTerms?.terms || 'NET 30',
        },
        select: { id: true, name: true },
      });

      clientCreated = true;

      logger.info(
        { jobId: job.id, clientId: client.id, clientName: client.name },
        'New client created from invoice extraction'
      );
    }

    // Update progress: 75%
    await job.updateProgress(75);

    // P0-8: TODO - Replace with invoiceService.create() (consolidates validation, P1-18)
    // Create Invoice
    const invoice = await prisma.invoice.create({
      data: {
        entityId,
        clientId: client.id,
        invoiceNumber: extraction.data.invoiceNumber || `AI-${Date.now()}`,
        issueDate: new Date(extraction.data.date),
        dueDate: extraction.data.paymentTerms?.dueDate
          ? new Date(extraction.data.paymentTerms.dueDate)
          : new Date(new Date(extraction.data.date).getTime() + 30 * 24 * 60 * 60 * 1000), // Default: NET 30
        currency: extraction.data.currency,
        subtotal: extraction.data.subtotal,
        taxAmount: extraction.data.taxAmount,
        total: extraction.data.totalAmount,
        paidAmount: 0,
        status: invoiceStatus,
        notes: `AI-extracted from ${filename}${routingResult === AIRoutingResult.QUEUED_FOR_REVIEW ? ' (needs review)' : ''}`,
        // Line items
        invoiceLines: {
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
        invoiceNumber: true,
        status: true,
      },
    });

    logger.info(
      { jobId: job.id, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, status: invoice.status },
      'Invoice created from extraction'
    );

    // Update progress: 90%
    await job.updateProgress(90);

    // Log AI decision (DEV-232)
    const decisionLog = await prisma.aIDecisionLog.create({
      data: {
        tenantId,
        entityId,
        documentId: invoice.id,
        decisionType: 'INVOICE_EXTRACTION',
        inputHash,
        modelVersion: extraction.modelVersion,
        confidence: extraction.confidence,
        extractedData: extraction.data as unknown as Prisma.InputJsonValue,
        routingResult,
        aiExplanation: `Confidence ${extraction.confidence}% → ${invoiceStatus} status`,
        processingTimeMs: extraction.processingTimeMs,
      },
    });

    // Update progress: 100%
    await job.updateProgress(100);

    logger.info(
      {
        jobId: job.id,
        invoiceId: invoice.id,
        clientId: client.id,
        clientCreated,
        confidence: extraction.confidence,
        status: invoiceStatus,
      },
      'Invoice scan job completed'
    );

    return {
      invoiceId: invoice.id,
      clientId: client.id,
      confidence: extraction.confidence,
      status: invoiceStatus === InvoiceStatus.DRAFT && routingResult === AIRoutingResult.QUEUED_FOR_REVIEW
        ? 'SENT' // Use SENT to indicate "created but needs review" (Invoice doesn't have PENDING)
        : 'DRAFT',
      decisionLogId: decisionLog.id,
    };
  } catch (error: unknown) {
    logger.error(
      { err: error, jobId: job.id, tenantId, entityId },
      'Invoice scan job failed'
    );

    // Re-throw for BullMQ retry mechanism
    throw error;
  }
}

/**
 * Initialize Invoice Scan Worker.
 *
 * Call this during application startup to start processing invoice-scan jobs.
 *
 * @returns Worker instance (for graceful shutdown)
 */
export function startInvoiceScanWorker(): Worker {
  // ARCH-16: Use shared Redis config (DRY)
  const connection = getRedisConnection();

  const worker = new Worker<InvoiceScanJobData, InvoiceScanJobResult>(
    'invoice-scan',
    processInvoiceScan,
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
      { jobId: job.id, invoiceId: job.returnvalue?.invoiceId },
      'Invoice scan worker: Job completed'
    );
  });

  worker.on('failed', (job, error) => {
    logger.error(
      { jobId: job?.id, err: error },
      'Invoice scan worker: Job failed'
    );
  });

  worker.on('error', (error) => {
    logger.error({ err: error }, 'Invoice scan worker: Worker error');
  });

  logger.info({ concurrency: 5 }, 'Invoice scan worker started');

  return worker;
}
