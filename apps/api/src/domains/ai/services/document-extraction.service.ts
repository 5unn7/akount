import { MistralProvider } from './providers/mistral.provider';
import { redactImage, redactText } from '../../../lib/pii-redaction';
import {
  analyzePromptInjection,
  validateExtractedAmount,
  createSecureSystemPrompt,
  type DefenseResult,
} from '../../../lib/prompt-defense';
import { BillExtractionSchema, validateBillTotals, type BillExtraction } from '../schemas/bill-extraction.schema';
import { InvoiceExtractionSchema, validateInvoiceTotals, type InvoiceExtraction } from '../schemas/invoice-extraction.schema';
import { logger } from '../../../lib/logger';
import { env } from '../../../lib/env';

/**
 * Document Extraction Service
 *
 * Core service for extracting structured data from financial documents using
 * Mistral vision AI with integrated security pipeline.
 *
 * **Security Pipeline:**
 * 0. File Size Validation (SEC-44) — Prevent OOM attacks via large files
 * 1. PII Redaction (SEC-29) — Remove credit cards, SSN, emails before AI inference
 * 2. Prompt Defense (SEC-30) — Detect adversarial content, validate amounts
 * 3. Mistral Vision (DEV-230/231) — OCR + structured extraction
 * 4. Zod Validation (DEV-236/237) — Enforce integer cents, required fields
 * 5. Business Rules — Validate totals, confidence scoring
 *
 * **Used by:** BillScanWorker (B4), InvoiceScanWorker (B5), StatementParser (B8)
 *
 * @module document-extraction
 */

/**
 * Maximum allowed file size for document uploads (10 MB).
 * Prevents out-of-memory attacks and ensures reasonable processing times.
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ExtractionOptions {
  /** Tenant ID for logging and context */
  tenantId: string;
  /** Entity ID for business context (optional) */
  entityId?: string;
  /** Skip security checks (ONLY for testing) */
  skipSecurityChecks?: boolean;
}

export interface ExtractionResult<T> {
  /** Extracted and validated data */
  data: T;
  /** Confidence score (0-100) */
  confidence: number;
  /** Model version used */
  modelVersion: string;
  /** Security analysis results */
  security: {
    piiRedacted: boolean;
    threats: DefenseResult;
    amountValidation: DefenseResult;
  };
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

export class DocumentExtractionService {
  private mistralProvider: MistralProvider;

  constructor() {
    const apiKey = env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY not configured');
    }
    this.mistralProvider = new MistralProvider(apiKey);
  }

  /**
   * Extract bill data from receipt image/PDF.
   *
   * @param imageBuffer - Receipt image as Buffer (JPEG, PNG, or PDF)
   * @param options - Extraction options (tenantId required)
   * @returns Validated bill extraction with security analysis
   *
   * @example
   * ```typescript
   * const service = new DocumentExtractionService();
   * const result = await service.extractBill(receiptBuffer, { tenantId: 'xxx' });
   * // => { data: { vendor: "Starbucks", amount: 1550, ... }, confidence: 92, ... }
   * ```
   */
  async extractBill(
    imageBuffer: Buffer,
    options: ExtractionOptions
  ): Promise<ExtractionResult<BillExtraction>> {
    const startTime = Date.now();

    try {
      // Step 0: File Size Validation (SEC-44)
      if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);

        logger.warn(
          {
            tenantId: options.tenantId,
            fileSize: imageBuffer.length,
            fileSizeMB,
            maxSizeMB,
          },
          'File size exceeds maximum allowed'
        );

        throw new Error(
          `File size (${fileSizeMB} MB) exceeds maximum allowed (${maxSizeMB} MB)`
        );
      }

      // Step 1: PII Redaction (SEC-29)
      const piiResult = options.skipSecurityChecks
        ? { redactedBuffer: imageBuffer, redactionLog: [], hadPII: false }
        : redactImage(imageBuffer);

      logger.info(
        {
          tenantId: options.tenantId,
          entityId: options.entityId,
          piiDetected: piiResult.hadPII,
          redactions: piiResult.redactionLog.length,
        },
        'Bill extraction: PII redaction complete'
      );

      // Step 2: Prompt Defense - will be checked post-extraction on OCR text

      // Step 3: Mistral Vision Extraction (DEV-230/231)
      const extractionPrompt = createSecureSystemPrompt(`
Extract structured bill/receipt data from this image.

Required fields:
- vendor: Business name (string)
- date: Transaction date in YYYY-MM-DD format
- currency: 3-letter ISO code (USD, CAD, EUR, etc.)
- subtotal: Pre-tax amount in integer cents (e.g., 1550 for $15.50)
- taxAmount: Total tax in integer cents
- totalAmount: Grand total in integer cents (subtotal + tax)
- lineItems: Array of items with description, quantity, unitPrice (cents), amount (cents)
- confidence: Your confidence level 0-100

Optional fields:
- billNumber: Receipt/bill number if visible
- taxBreakdown: Itemized taxes if multiple rates
- paymentTerms: Payment terms if present

Return ONLY valid JSON. All amounts MUST be integer cents, never decimals.
      `.trim());

      const extracted = await this.mistralProvider.extractFromImage(
        piiResult.redactedBuffer,
        BillExtractionSchema,
        extractionPrompt
      );

      // Step 4: Prompt Defense Analysis (SEC-30)
      const promptDefense = options.skipSecurityChecks
        ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
        : analyzePromptInjection(extracted.ocrText || '');

      const amountDefense = options.skipSecurityChecks
        ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
        : validateExtractedAmount(extracted.totalAmount, extracted.ocrText);

      // Step 5: Business Rule Validation
      validateBillTotals(extracted);

      // Step 6: Security Review Gate
      const requiresReview =
        !options.skipSecurityChecks && (promptDefense.requiresReview || amountDefense.requiresReview);

      if (requiresReview) {
        logger.warn(
          {
            tenantId: options.tenantId,
            threats: [...promptDefense.threats, ...amountDefense.threats],
          },
          'Bill extraction requires manual review due to security threats'
        );
      }

      const processingTimeMs = Date.now() - startTime;

      logger.info(
        {
          tenantId: options.tenantId,
          vendor: extracted.vendor,
          amount: extracted.totalAmount,
          confidence: extracted.confidence,
          processingTimeMs,
          requiresReview,
        },
        'Bill extraction complete'
      );

      return {
        data: extracted,
        confidence: extracted.confidence,
        modelVersion: extracted.modelVersion,
        security: {
          piiRedacted: piiResult.hadPII,
          threats: promptDefense,
          amountValidation: amountDefense,
        },
        processingTimeMs,
      };
    } catch (error: unknown) {
      const processingTimeMs = Date.now() - startTime;

      logger.error(
        {
          err: error,
          tenantId: options.tenantId,
          processingTimeMs,
        },
        'Bill extraction failed'
      );

      throw error;
    }
  }

  /**
   * Extract invoice data from uploaded invoice image/PDF.
   *
   * @param imageBuffer - Invoice image as Buffer (JPEG, PNG, or PDF)
   * @param options - Extraction options (tenantId required)
   * @returns Validated invoice extraction with security analysis
   */
  async extractInvoice(
    imageBuffer: Buffer,
    options: ExtractionOptions
  ): Promise<ExtractionResult<InvoiceExtraction>> {
    const startTime = Date.now();

    try {
      // Step 0: File Size Validation (SEC-44)
      if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);

        logger.warn(
          {
            tenantId: options.tenantId,
            fileSize: imageBuffer.length,
            fileSizeMB,
            maxSizeMB,
          },
          'File size exceeds maximum allowed'
        );

        throw new Error(
          `File size (${fileSizeMB} MB) exceeds maximum allowed (${maxSizeMB} MB)`
        );
      }

      // Step 1: PII Redaction (SEC-29)
      const piiResult = options.skipSecurityChecks
        ? { redactedBuffer: imageBuffer, redactionLog: [], hadPII: false }
        : redactImage(imageBuffer);

      logger.info(
        {
          tenantId: options.tenantId,
          entityId: options.entityId,
          piiDetected: piiResult.hadPII,
          redactions: piiResult.redactionLog.length,
        },
        'Invoice extraction: PII redaction complete'
      );

      // Step 2: Mistral Vision Extraction
      const extractionPrompt = createSecureSystemPrompt(`
Extract structured invoice data from this image.

Required fields:
- clientName: Customer/client name (string)
- date: Invoice date in YYYY-MM-DD format
- currency: 3-letter ISO code (USD, CAD, EUR, etc.)
- subtotal: Pre-tax amount in integer cents
- taxAmount: Total tax in integer cents
- totalAmount: Grand total in integer cents (subtotal + tax)
- lineItems: Array of services/products with description, quantity, unitPrice (cents), amount (cents)
- confidence: Your confidence level 0-100

Optional fields:
- invoiceNumber: Invoice number if visible
- paymentTerms: Payment terms (NET 30, due date, discount terms)
- taxBreakdown: Itemized taxes if multiple rates
- clientContact: Client email, phone, address if visible

Return ONLY valid JSON. All amounts MUST be integer cents, never decimals.
      `.trim());

      const extracted = await this.mistralProvider.extractFromImage(
        piiResult.redactedBuffer,
        InvoiceExtractionSchema,
        extractionPrompt
      );

      // Step 3: Prompt Defense Analysis
      const promptDefense = options.skipSecurityChecks
        ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
        : analyzePromptInjection(extracted.ocrText || '');

      const amountDefense = options.skipSecurityChecks
        ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
        : validateExtractedAmount(extracted.totalAmount, extracted.ocrText);

      // Step 4: Business Rule Validation
      validateInvoiceTotals(extracted);

      // Step 5: Security Review Gate
      const requiresReview =
        !options.skipSecurityChecks && (promptDefense.requiresReview || amountDefense.requiresReview);

      if (requiresReview) {
        logger.warn(
          {
            tenantId: options.tenantId,
            threats: [...promptDefense.threats, ...amountDefense.threats],
          },
          'Invoice extraction requires manual review due to security threats'
        );
      }

      const processingTimeMs = Date.now() - startTime;

      logger.info(
        {
          tenantId: options.tenantId,
          client: extracted.clientName,
          amount: extracted.totalAmount,
          confidence: extracted.confidence,
          processingTimeMs,
          requiresReview,
        },
        'Invoice extraction complete'
      );

      return {
        data: extracted,
        confidence: extracted.confidence,
        modelVersion: extracted.modelVersion,
        security: {
          piiRedacted: piiResult.hadPII,
          threats: promptDefense,
          amountValidation: amountDefense,
        },
        processingTimeMs,
      };
    } catch (error: unknown) {
      const processingTimeMs = Date.now() - startTime;

      logger.error(
        {
          err: error,
          tenantId: options.tenantId,
          processingTimeMs,
        },
        'Invoice extraction failed'
      );

      throw error;
    }
  }

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
  ): Promise<ExtractionResult<{ transactions: unknown[] }>> {
    const startTime = Date.now();

    logger.info(
      { tenantId: options.tenantId },
      'Statement extraction: Not yet implemented (planned for B8)'
    );

    // Placeholder response for B8
    throw new Error(
      'Statement extraction not yet implemented. Will be completed in Task B8 (Bank Statement Parsing - Mistral Primary)'
    );
  }
}
