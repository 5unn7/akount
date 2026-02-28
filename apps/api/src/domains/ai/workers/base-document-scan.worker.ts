import { Worker, Job } from 'bullmq';
import { prisma, AIRoutingResult, Prisma } from '@akount/db';
import { createHash } from 'crypto';
import { getRedisConnection } from '../../../lib/queue/queue-manager';
import { DocumentExtractionService, type ExtractionResult } from '../services/document-extraction.service';
import { logger } from '../../../lib/logger';

/**
 * Base Document Scan Worker (P1-18)
 *
 * Abstract base class for document scanning workers.
 * Eliminates 258-line duplication between bill-scan and invoice-scan workers (93% identical).
 *
 * **Template Method Pattern:**
 * - Common logic: entity validation, extraction, idempotency, logging (shared)
 * - Unique logic: vendor/client lookup, bill/invoice creation (abstract methods)
 *
 * @module base-document-scan-worker
 */

export interface BaseJobData {
  tenantId: string;
  entityId: string;
  userId: string;
  imageBase64: string;
  filename: string;
  mimeType: string;
}

export interface BaseJobResult {
  documentId?: string;
  relatedEntityId?: string; // vendorId or clientId
  confidence: number;
  status: string;
  error?: string;
  decisionLogId?: string;
}

export abstract class BaseDocumentScanWorker<TData extends BaseJobData, TResult extends BaseJobResult, TExtraction> {
  protected abstract queueName: string;
  protected abstract decisionType: 'BILL_EXTRACTION' | 'INVOICE_EXTRACTION';
  protected abstract confidenceThreshold: number;

  /**
   * Extract document-specific data from image.
   * Implemented by subclasses (extractBill vs extractInvoice).
   */
  protected abstract extractDocument(
    imageBuffer: Buffer,
    options: { userId: string; tenantId: string; entityId: string }
  ): Promise<ExtractionResult<TExtraction>>;

  /**
   * Find or create related entity (vendor for bills, client for invoices).
   * Implemented by subclasses.
   */
  protected abstract findOrCreateRelatedEntity(
    extraction: TExtraction,
    entityId: string,
    job: Job<TData>
  ): Promise<{ id: string; name: string; created: boolean }>;

  /**
   * Create the document record (Bill or Invoice).
   * Implemented by subclasses.
   */
  protected abstract createDocument(
    extraction: TExtraction,
    relatedEntityId: string,
    entityId: string,
    routingResult: AIRoutingResult
  ): Promise<{ id: string; number: string }>;

  /**
   * Get document type name for logging.
   */
  protected abstract get documentTypeName(): string;

  /**
   * Process job - common logic for all document scans.
   *
   * This is the template method that orchestrates the workflow.
   */
  async process(job: Job<TData>): Promise<TResult> {
    const { tenantId, entityId, userId, imageBase64, filename } = job.data;

    logger.info(
      { jobId: job.id, tenantId, entityId, filename },
      `${this.documentTypeName} scan job started`
    );

    // Update progress: 10%
    await job.updateProgress(10);

    // P0-9: Entity ownership validation
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId },
      select: { id: true },
    });

    if (!entity) {
      logger.error(
        { jobId: job.id, entityId, tenantId },
        'Entity ownership validation failed'
      );
      throw new Error(`Entity ${entityId} not found or access denied for tenant ${tenantId}`);
    }

    try {
      // Decode base64 image
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      // Generate content hash for deduplication
      const inputHash = createHash('sha256').update(imageBuffer).digest('hex');

      logger.info(
        { jobId: job.id, bufferSize: imageBuffer.length, inputHash: inputHash.substring(0, 16) },
        'Image buffer decoded'
      );

      // Update progress: 20%
      await job.updateProgress(20);

      // Extract document data
      const extractionService = new DocumentExtractionService();
      const extraction = await this.extractDocument(imageBuffer, {
        userId,
        tenantId,
        entityId,
      });

      logger.info(
        { jobId: job.id, confidence: extraction.confidence },
        `${this.documentTypeName} extraction complete`
      );

      // Update progress: 50%
      await job.updateProgress(50);

      // P0-6: Idempotency check
      const existingDecision = await prisma.aIDecisionLog.findFirst({
        where: {
          inputHash,
          decisionType: this.decisionType,
          tenantId,
        },
        select: { id: true, documentId: true, createdAt: true },
      });

      if (existingDecision && existingDecision.documentId) {
        logger.info(
          {
            jobId: job.id,
            existingDecisionId: existingDecision.id,
            existingDocumentId: existingDecision.documentId,
          },
          `${this.documentTypeName} already processed (idempotency check)`
        );

        return {
          confidence: extraction.confidence,
          status: 'ALREADY_PROCESSED',
          documentId: existingDecision.documentId,
          decisionLogId: existingDecision.id,
        } as TResult;
      }

      // Determine routing based on confidence
      let routingResult: AIRoutingResult;

      if (extraction.confidence < this.confidenceThreshold) {
        // Low confidence — don't auto-create
        logger.warn(
          { jobId: job.id, confidence: extraction.confidence },
          `${this.documentTypeName} confidence too low — manual review required`
        );

        const decisionLog = await prisma.aIDecisionLog.create({
          data: {
            tenantId,
            entityId,
            decisionType: this.decisionType,
            inputHash,
            modelVersion: extraction.modelVersion,
            confidence: extraction.confidence,
            extractedData: extraction.data as unknown as Prisma.InputJsonValue,
            routingResult: AIRoutingResult.MANUAL_ENTRY,
            aiExplanation: `Confidence ${extraction.confidence}% below threshold (${this.confidenceThreshold}%)`,
            processingTimeMs: extraction.processingTimeMs,
          },
        });

        return {
          confidence: extraction.confidence,
          status: 'REVIEW_REQUIRED',
          decisionLogId: decisionLog.id,
        } as TResult;
      }

      routingResult = extraction.confidence >= 80 ? AIRoutingResult.AUTO_CREATED : AIRoutingResult.QUEUED_FOR_REVIEW;

      // Update progress: 60%
      await job.updateProgress(60);

      // Find or create related entity (vendor/client)
      const relatedEntity = await this.findOrCreateRelatedEntity(extraction.data, entityId, job);

      // Update progress: 75%
      await job.updateProgress(75);

      // Create document (bill/invoice)
      const document = await this.createDocument(extraction.data, relatedEntity.id, entityId, routingResult);

      // Update progress: 90%
      await job.updateProgress(90);

      // Log AI decision
      await prisma.aIDecisionLog.create({
        data: {
          tenantId,
          entityId,
          documentId: document.id,
          decisionType: this.decisionType,
          inputHash,
          modelVersion: extraction.modelVersion,
          confidence: extraction.confidence,
          extractedData: extraction.data as unknown as Prisma.InputJsonValue,
          routingResult,
          aiExplanation: `Auto-created from ${this.documentTypeName} scan (${filename})`,
          processingTimeMs: extraction.processingTimeMs,
        },
      });

      // Update progress: 100%
      await job.updateProgress(100);

      logger.info(
        {
          jobId: job.id,
          documentId: document.id,
          relatedEntityId: relatedEntity.id,
          confidence: extraction.confidence,
          routingResult,
        },
        `${this.documentTypeName} created successfully`
      );

      return {
        documentId: document.id,
        relatedEntityId: relatedEntity.id,
        confidence: extraction.confidence,
        status: routingResult === AIRoutingResult.AUTO_CREATED ? 'DRAFT' : 'PENDING',
        decisionLogId: 'logged',
      } as TResult;
    } catch (error: unknown) {
      logger.error(
        { err: error, jobId: job.id, tenantId, entityId },
        `${this.documentTypeName} scan job failed`
      );
      throw error;
    }
  }

  /**
   * Start the worker with graceful shutdown handlers.
   */
  public startWorker(
    processor: (job: Job<TData>) => Promise<TResult>
  ): Worker<TData, TResult> {
    const connection = getRedisConnection();

    const worker = new Worker<TData, TResult>(
      this.queueName,
      processor,
      {
        connection,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );

    worker.on('completed', (job) => {
      logger.info(
        { jobId: job.id, documentId: job.returnvalue?.documentId },
        `${this.documentTypeName} scan worker: Job completed`
      );
    });

    worker.on('failed', (job, error) => {
      logger.error(
        { jobId: job?.id, err: error },
        `${this.documentTypeName} scan worker: Job failed`
      );
    });

    worker.on('error', (error) => {
      logger.error({ err: error }, `${this.documentTypeName} scan worker: Worker error`);
    });

    logger.info({ concurrency: 5 }, `${this.documentTypeName} scan worker started`);

    // P1-16: Graceful shutdown
    const shutdownHandler = async (signal: string) => {
      logger.info({ signal }, `${this.documentTypeName} worker received shutdown signal`);
      await worker.close();
      logger.info(`${this.documentTypeName} worker shut down gracefully`);
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));

    return worker;
  }
}
