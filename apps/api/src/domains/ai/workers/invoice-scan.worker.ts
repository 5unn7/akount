import { Worker, Job } from 'bullmq';
import { prisma, InvoiceStatus, AIRoutingResult } from '@akount/db';
import { BaseDocumentScanWorker, type BaseJobData, type BaseJobResult } from './base-document-scan.worker';
import { DocumentExtractionService, type ExtractionResult } from '../services/document-extraction.service';
import type { InvoiceExtraction } from '../schemas/invoice-extraction.schema';
import { logger } from '../../../lib/logger';

/**
 * Invoice Scan Worker (DEV-239) - Refactored with P1-18
 *
 * Extends BaseDocumentScanWorker with invoice-specific logic.
 * Eliminated 258-line duplication via base class extraction.
 *
 * **Unique to this worker (~30 lines):**
 * - extractInvoice() instead of extractBill()
 * - Client lookup instead of Vendor
 * - Invoice creation instead of Bill
 *
 * @module invoice-scan-worker
 */

export interface InvoiceScanJobData extends BaseJobData {}

export interface InvoiceScanJobResult extends BaseJobResult {
  invoiceId?: string;
  clientId?: string;
}

class InvoiceScanWorker extends BaseDocumentScanWorker<InvoiceScanJobData, InvoiceScanJobResult, InvoiceExtraction> {
  protected queueName = 'invoice-scan';
  protected decisionType = 'INVOICE_EXTRACTION' as const;
  protected confidenceThreshold = 60;
  protected documentTypeName = 'Invoice';

  protected async extractDocument(
    imageBuffer: Buffer,
    options: { userId: string; tenantId: string; entityId: string }
  ): Promise<ExtractionResult<InvoiceExtraction>> {
    const service = new DocumentExtractionService();
    return service.extractInvoice(imageBuffer, options);
  }

  protected async findOrCreateRelatedEntity(
    extraction: InvoiceExtraction,
    entityId: string,
    job: Job<InvoiceScanJobData>
  ): Promise<{ id: string; name: string; created: boolean }> {
    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        entityId,
        name: extraction.clientName,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    if (!client) {
      // P0-8: TODO - Replace with clientService.findOrCreate() (P1-18)
      client = await prisma.client.create({
        data: {
          entityId,
          name: extraction.clientName,
          status: 'ACTIVE',
          paymentTerms: extraction.paymentTerms?.terms || 'NET 30',
        },
        select: { id: true, name: true },
      });

      logger.info(
        { jobId: job.id, clientId: client.id, clientName: client.name },
        'New client created from invoice extraction'
      );

      return { ...client, created: true };
    }

    return { ...client, created: false };
  }

  protected async createDocument(
    extraction: InvoiceExtraction,
    clientId: string,
    entityId: string,
    routingResult: AIRoutingResult
  ): Promise<{ id: string; number: string }> {
    // P0-8: TODO - Replace with invoiceService.create() (consolidates validation, P1-18)
    const invoice = await prisma.invoice.create({
      data: {
        entityId,
        clientId,
        invoiceNumber: extraction.invoiceNumber || `AI-${Date.now()}`,
        issueDate: new Date(extraction.date),
        dueDate: extraction.paymentTerms?.dueDate
          ? new Date(extraction.paymentTerms.dueDate)
          : new Date(new Date(extraction.date).getTime() + 30 * 24 * 60 * 60 * 1000), // NET 30
        currency: extraction.currency,
        subtotal: extraction.subtotal,
        taxAmount: extraction.taxAmount,
        total: extraction.totalAmount,
        paidAmount: 0,
        status: InvoiceStatus.DRAFT,
        notes: routingResult === AIRoutingResult.QUEUED_FOR_REVIEW
          ? 'Medium confidence extraction — please review'
          : undefined,
      },
      select: { id: true, invoiceNumber: true },
    });

    return { id: invoice.id, number: invoice.invoiceNumber };
  }
}

/**
 * Start the invoice scan worker.
 */
export function startInvoiceScanWorker(): Worker {
  const worker = new InvoiceScanWorker();
  return worker.startWorker((job) => worker.process(job));
}
