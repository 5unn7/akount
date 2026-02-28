import { MistralProvider } from './providers/mistral.provider';
import { AIDecisionLogService } from './ai-decision-log.service';
import { AIBudgetService } from './ai-budget.service';
import { checkConsent } from '../../system/services/ai-consent.service';
import { redactImage, redactText } from '../../../lib/pii-redaction';
import {
  analyzePromptInjection,
  validateExtractedAmount,
  type DefenseResult,
} from '../../../lib/prompt-defense';
import {
  buildBillExtractionPrompt,
  buildInvoiceExtractionPrompt,
  buildStatementExtractionPrompt,
} from './extraction-prompts';
import { BillExtractionSchema, validateBillTotals, type BillExtraction } from '../schemas/bill-extraction.schema';
import { InvoiceExtractionSchema, validateInvoiceTotals, type InvoiceExtraction } from '../schemas/invoice-extraction.schema';
import { BankStatementExtractionSchema, validateStatementBalances, type BankStatementExtraction } from '../schemas/bank-statement-extraction.schema';
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
  /** User ID for consent verification */
  userId: string;
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
  private decisionLogService: AIDecisionLogService;
  private budgetService: AIBudgetService;

  constructor() {
    const apiKey = env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY not configured');
    }
    this.mistralProvider = new MistralProvider(apiKey);
    this.decisionLogService = new AIDecisionLogService();
    this.budgetService = new AIBudgetService();
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

    // P0-4: Defense-in-depth consent check (service layer)
    const hasConsent = await checkConsent(options.userId, options.tenantId, 'autoCreateBills');
    if (!hasConsent) {
      logger.warn(
        { userId: options.userId, tenantId: options.tenantId, feature: 'bill-extraction' },
        'Service-layer consent check failed: Bill auto-creation not enabled'
      );
      throw new Error('AI bill extraction is not enabled. Enable in Settings > AI Preferences.');
    }

    // P0-3: Check AI budget before making expensive AI call
    const budgetCheck = await this.budgetService.checkBudget(options.tenantId, 2000); // Estimate 2K tokens for vision
    if (!budgetCheck.allowed) {
      logger.warn(
        { tenantId: options.tenantId, budgetStatus: budgetCheck.status },
        'AI budget exceeded for bill extraction'
      );
      const error = new Error(budgetCheck.reason || 'AI budget exceeded') as Error & { statusCode?: number };
      error.statusCode = 402; // Payment Required
      throw error;
    }

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
      const extractionPrompt = buildBillExtractionPrompt();

      const extractionResult = await this.mistralProvider.extractFromImage(
        piiResult.redactedBuffer,
        BillExtractionSchema,
        extractionPrompt
      );

      const extracted = extractionResult.data;

      // Step 4: Log token usage to AIDecisionLog (P0-2)
      await this.decisionLogService.logDecision({
        tenantId: options.tenantId,
        entityId: options.entityId,
        decisionType: 'BILL_EXTRACTION',
        input: piiResult.redactedBuffer,
        modelVersion: extractionResult.model,
        confidence: extracted.confidence,
        extractedData: {
          vendor: extracted.vendor,
          totalAmount: extracted.totalAmount,
          date: extracted.date,
          lineItemCount: extracted.lineItems?.length || 0,
        },
        routingResult: 'AUTO_CREATED',
        tokensUsed: extractionResult.usage?.totalTokens,
        processingTimeMs: Date.now() - startTime,
      });

      // P0-3: Track AI spend for budget enforcement
      if (extractionResult.usage?.totalTokens) {
        await this.budgetService.trackSpend(options.tenantId, extractionResult.usage.totalTokens);
      }

      // Step 5: Redact PII from OCR text (P0-5)
      // Even though image was redacted, OCR text might contain PII if redaction missed something
      const ocrText = extracted.ocrText || '';
      const ocrRedactionResult = options.skipSecurityChecks
        ? { redactedBuffer: Buffer.from(ocrText, 'utf-8'), hadPII: false }
        : redactText(ocrText);
      const redactedOcrText = ocrRedactionResult.redactedBuffer.toString('utf-8');

      if (ocrRedactionResult.hadPII) {
        logger.warn(
          { tenantId: options.tenantId },
          'PII detected in OCR text and redacted before analysis'
        );
      }

      // Step 6: Prompt Defense Analysis (SEC-30) - uses REDACTED OCR text
      const promptDefense = options.skipSecurityChecks
        ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
        : analyzePromptInjection(redactedOcrText);

      const amountDefense = options.skipSecurityChecks
        ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
        : validateExtractedAmount(extracted.totalAmount, redactedOcrText);

      // Step 7: Business Rule Validation
      validateBillTotals(extracted);

      // Step 8: Security Review Gate
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
        modelVersion: extracted.modelVersion || 'unknown',
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

    // P0-4: Defense-in-depth consent check (service layer)
    const hasConsent = await checkConsent(options.userId, options.tenantId, 'autoCreateInvoices');
    if (!hasConsent) {
      logger.warn(
        { userId: options.userId, tenantId: options.tenantId, feature: 'invoice-extraction' },
        'Service-layer consent check failed: Invoice auto-creation not enabled'
      );
      throw new Error('AI invoice extraction is not enabled. Enable in Settings > AI Preferences.');
    }

    // P0-3: Check AI budget before making expensive AI call
    const budgetCheck = await this.budgetService.checkBudget(options.tenantId, 2000);
    if (!budgetCheck.allowed) {
      logger.warn(
        { tenantId: options.tenantId, budgetStatus: budgetCheck.status },
        'AI budget exceeded for invoice extraction'
      );
      const error = new Error(budgetCheck.reason || 'AI budget exceeded') as Error & { statusCode?: number };
      error.statusCode = 402;
      throw error;
    }

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
      const extractionPrompt = buildInvoiceExtractionPrompt();

      const extractionResult = await this.mistralProvider.extractFromImage(
        piiResult.redactedBuffer,
        InvoiceExtractionSchema,
        extractionPrompt
      );

      const extracted = extractionResult.data;

      // Step 3: Log token usage to AIDecisionLog (P0-2)
      await this.decisionLogService.logDecision({
        tenantId: options.tenantId,
        entityId: options.entityId,
        decisionType: 'INVOICE_EXTRACTION',
        input: piiResult.redactedBuffer,
        modelVersion: extractionResult.model,
        confidence: extracted.confidence,
        extractedData: {
          clientName: extracted.clientName,
          totalAmount: extracted.totalAmount,
          date: extracted.date,
          lineItemCount: extracted.lineItems?.length || 0,
        },
        routingResult: 'AUTO_CREATED',
        tokensUsed: extractionResult.usage?.totalTokens,
        processingTimeMs: Date.now() - startTime,
      });

      // P0-3: Track AI spend for budget enforcement
      if (extractionResult.usage?.totalTokens) {
        await this.budgetService.trackSpend(options.tenantId, extractionResult.usage.totalTokens);
      }

      // Step 4: Redact PII from OCR text (P0-5)
      const ocrText = extracted.ocrText || '';
      const ocrRedactionResult = options.skipSecurityChecks
        ? { redactedBuffer: Buffer.from(ocrText, 'utf-8'), hadPII: false }
        : redactText(ocrText);
      const redactedOcrText = ocrRedactionResult.redactedBuffer.toString('utf-8');

      if (ocrRedactionResult.hadPII) {
        logger.warn(
          { tenantId: options.tenantId },
          'PII detected in OCR text and redacted before analysis'
        );
      }

      // Step 5: Prompt Defense Analysis (uses REDACTED OCR text)
      const promptDefense = options.skipSecurityChecks
        ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
        : analyzePromptInjection(redactedOcrText);

      const amountDefense = options.skipSecurityChecks
        ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
        : validateExtractedAmount(extracted.totalAmount, redactedOcrText);

      // Step 6: Business Rule Validation
      validateInvoiceTotals(extracted);

      // Step 7: Security Review Gate
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
        modelVersion: extracted.modelVersion || 'unknown',
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
  ): Promise<ExtractionResult<BankStatementExtraction>> {
    const startTime = Date.now();

    // P0-4: Defense-in-depth consent check (service layer)
    // Note: Statement extraction uses autoMatchTransactions consent
    const hasConsent = await checkConsent(options.userId, options.tenantId, 'autoMatchTransactions');
    if (!hasConsent) {
      logger.warn(
        { userId: options.userId, tenantId: options.tenantId, feature: 'statement-extraction' },
        'Service-layer consent check failed: Bank statement extraction not enabled'
      );
      throw new Error('AI statement extraction is not enabled. Enable in Settings > AI Preferences.');
    }

    // P0-3: Check AI budget before making expensive AI call
    const budgetCheck = await this.budgetService.checkBudget(options.tenantId, 2000);
    if (!budgetCheck.allowed) {
      logger.warn(
        { tenantId: options.tenantId, budgetStatus: budgetCheck.status },
        'AI budget exceeded for statement extraction'
      );
      const error = new Error(budgetCheck.reason || 'AI budget exceeded') as Error & { statusCode?: number };
      error.statusCode = 402;
      throw error;
    }

    try {
      // Step 0: File Size Validation (SEC-44)
      if (pdfBuffer.length > MAX_FILE_SIZE_BYTES) {
        throw new Error(
          `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB. Got ${pdfBuffer.length / 1024 / 1024}MB. This prevents potential OOM attacks (SEC-44).`
        );
      }

      // Step 1: PII Redaction (SEC-29)
      const piiResult = options.skipSecurityChecks
        ? { redactedBuffer: pdfBuffer, redactionLog: [], hadPII: false }
        : redactImage(pdfBuffer);

      if (piiResult.hadPII) {
        logger.warn(
          { tenantId: options.tenantId, redactionCount: piiResult.redactionLog.length },
          'PII detected and redacted from bank statement before AI inference'
        );
      }

      // Step 2: Mistral Vision Extraction
      const extractionPrompt = buildStatementExtractionPrompt();

      const extractionResult = await this.mistralProvider.extractFromImage(
        piiResult.redactedBuffer,
        BankStatementExtractionSchema,
        extractionPrompt
      );

      const extracted = extractionResult.data;

      // Step 3: Log token usage to AIDecisionLog (P0-2)
      await this.decisionLogService.logDecision({
        tenantId: options.tenantId,
        entityId: options.entityId,
        decisionType: 'STATEMENT_EXTRACTION',
        input: piiResult.redactedBuffer,
        modelVersion: extractionResult.model,
        confidence: extracted.confidence,
        extractedData: {
          institutionName: extracted.accountInfo.institutionName,
          accountType: extracted.accountInfo.accountType,
          transactionCount: extracted.transactions.length,
          periodStart: extracted.accountInfo.periodStart,
          periodEnd: extracted.accountInfo.periodEnd,
        },
        routingResult: 'AUTO_CREATED',
        tokensUsed: extractionResult.usage?.totalTokens,
        processingTimeMs: Date.now() - startTime,
      });

      // P0-3: Track AI spend for budget enforcement
      if (extractionResult.usage?.totalTokens) {
        await this.budgetService.trackSpend(options.tenantId, extractionResult.usage.totalTokens);
      }

      // Step 4: Redact PII from OCR text (P0-5)
      const ocrText = extracted.ocrText || '';
      const ocrRedactionResult = options.skipSecurityChecks
        ? { redactedBuffer: Buffer.from(ocrText, 'utf-8'), hadPII: false }
        : redactText(ocrText);
      const redactedOcrText = ocrRedactionResult.redactedBuffer.toString('utf-8');

      if (ocrRedactionResult.hadPII) {
        logger.warn(
          { tenantId: options.tenantId },
          'PII detected in OCR text and redacted before analysis'
        );
      }

      // Step 5: Prompt Defense Analysis (SEC-30) - uses REDACTED OCR text
      const promptDefense = options.skipSecurityChecks
        ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
        : analyzePromptInjection(redactedOcrText);

      if (!promptDefense.safe) {
        logger.warn(
          {
            tenantId: options.tenantId,
            threats: promptDefense.threats,
            riskLevel: promptDefense.riskLevel,
          },
          'Potential prompt injection detected in bank statement'
        );
      }

      // Step 6: Business Rule Validation (Balance Reconciliation)
      validateStatementBalances(extracted);

      const processingTimeMs = Date.now() - startTime;

      logger.info(
        {
          tenantId: options.tenantId,
          institution: extracted.accountInfo.institutionName,
          transactionCount: extracted.transactions.length,
          confidence: extracted.confidence,
          processingTimeMs,
        },
        'Bank statement extraction complete'
      );

      return {
        data: extracted,
        confidence: extracted.confidence,
        modelVersion: extracted.modelVersion || 'unknown',
        security: {
          piiRedacted: piiResult.hadPII,
          threats: promptDefense,
          amountValidation: {
            safe: true,
            riskLevel: 'safe',
            threats: [],
            requiresReview: false,
          },
        },
        processingTimeMs,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { err: error, tenantId: options.tenantId },
        'Bank statement extraction failed'
      );
      throw new Error(`Statement extraction failed: ${errorMessage}`);
    }
  }
}
