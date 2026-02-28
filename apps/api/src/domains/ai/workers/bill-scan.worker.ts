import { Worker, Job } from 'bullmq';
import { prisma, BillStatus, AIRoutingResult } from '@akount/db';
import { BaseDocumentScanWorker, type BaseJobData, type BaseJobResult } from './base-document-scan.worker';
import { DocumentExtractionService, type ExtractionResult } from '../services/document-extraction.service';
import type { BillExtraction } from '../schemas/bill-extraction.schema';
import { logger } from '../../../lib/logger';

/**
 * Bill Scan Worker (DEV-238) - Refactored with P1-18
 *
 * Extends BaseDocumentScanWorker with bill-specific logic.
 * Eliminated 258-line duplication (93% identical to invoice worker).
 *
 * **Unique to this worker (~30 lines):**
 * - extractBill() instead of extractInvoice()
 * - Vendor lookup instead of Client
 * - Bill creation instead of Invoice
 *
 * @module bill-scan-worker
 */

export interface BillScanJobData extends BaseJobData {}

export interface BillScanJobResult extends BaseJobResult {
  billId?: string;
  vendorId?: string;
}

class BillScanWorker extends BaseDocumentScanWorker<BillScanJobData, BillScanJobResult, BillExtraction> {
  protected queueName = 'bill-scan';
  protected decisionType = 'BILL_EXTRACTION' as const;
  protected confidenceThreshold = 60;
  protected documentTypeName = 'Bill';

  protected async extractDocument(
    imageBuffer: Buffer,
    options: { userId: string; tenantId: string; entityId: string }
  ): Promise<ExtractionResult<BillExtraction>> {
    const service = new DocumentExtractionService();
    return service.extractBill(imageBuffer, options);
  }

  protected async findOrCreateRelatedEntity(
    extraction: BillExtraction,
    entityId: string,
    job: Job<BillScanJobData>
  ): Promise<{ id: string; name: string; created: boolean }> {
    // Find or create vendor
    let vendor = await prisma.vendor.findFirst({
      where: {
        entityId,
        name: extraction.vendor,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    if (!vendor) {
      // P0-8: TODO - Replace with vendorService.findOrCreate() (P1-18)
      vendor = await prisma.vendor.create({
        data: {
          entityId,
          name: extraction.vendor,
          status: 'ACTIVE',
          paymentTerms: extraction.paymentTerms?.terms || 'NET 30',
        },
        select: { id: true, name: true },
      });

      logger.info(
        { jobId: job.id, vendorId: vendor.id, vendorName: vendor.name },
        'New vendor created from bill extraction'
      );

      return { ...vendor, created: true };
    }

    return { ...vendor, created: false };
  }

  protected async createDocument(
    extraction: BillExtraction,
    vendorId: string,
    entityId: string,
    routingResult: AIRoutingResult
  ): Promise<{ id: string; number: string }> {
    // P0-8: TODO - Replace with billService.create() (consolidates validation, P1-18)
    const bill = await prisma.bill.create({
      data: {
        entityId,
        vendorId,
        billNumber: extraction.billNumber || `AI-${Date.now()}`,
        issueDate: new Date(extraction.date),
        dueDate: extraction.paymentTerms?.dueDate
          ? new Date(extraction.paymentTerms.dueDate)
          : new Date(extraction.date),
        currency: extraction.currency,
        subtotal: extraction.subtotal,
        taxAmount: extraction.taxAmount,
        total: extraction.totalAmount,
        paidAmount: 0,
        status: BillStatus.DRAFT,
        notes: routingResult === AIRoutingResult.QUEUED_FOR_REVIEW
          ? 'Medium confidence extraction — please review'
          : undefined,
      },
      select: { id: true, billNumber: true },
    });

    return { id: bill.id, number: bill.billNumber };
  }
}

/**
 * Start the bill scan worker.
 */
export function startBillScanWorker(): Worker {
  const worker = new BillScanWorker();
  return worker.startWorker((job) => worker.process(job));
}
