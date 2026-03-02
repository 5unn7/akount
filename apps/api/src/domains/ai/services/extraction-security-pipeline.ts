import { checkConsent, type ConsentFeature } from '../../system/services/ai-consent.service';
import { AIBudgetService } from './ai-budget.service';
import { redactImage, redactText, type RedactionResult } from '../../../lib/pii-redaction';
import { analyzePromptInjection, validateExtractedAmount, type DefenseResult } from '../../../lib/prompt-defense';
import { logger } from '../../../lib/logger';

/**
 * Extraction Security Pipeline (P1-21)
 *
 * Centralized security checks for document extraction.
 * Extracted from DocumentExtractionService to reduce orchestration complexity.
 *
 * **Pipeline stages:**
 * 1. Consent verification (GDPR Article 22)
 * 2. Budget enforcement (cost controls)
 * 3. File size validation (OOM prevention)
 * 4. PII redaction (image + text)
 * 5. Prompt defense (injection detection)
 *
 * @module extraction-security-pipeline
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface SecurityCheckOptions {
  userId: string;
  tenantId: string;
  entityId?: string;
  skipSecurityChecks?: boolean;
}

export interface SecurityCheckResult {
  /** Redacted image buffer */
  redactedImageBuffer: Buffer;
  /** Whether PII was found in image */
  imagePiiRedacted: boolean;
  /** Redacted OCR text (applied after extraction) */
  redactedOcrText?: string;
  /** Whether PII was found in OCR text */
  ocrPiiRedacted?: boolean;
  /** Prompt injection analysis result */
  promptDefense: DefenseResult;
  /** Amount validation result */
  amountValidation: DefenseResult;
  /** Whether manual review is required */
  requiresReview: boolean;
}

export class ExtractionSecurityPipeline {
  private budgetService: AIBudgetService;

  constructor() {
    this.budgetService = new AIBudgetService();
  }

  /**
   * Run all pre-extraction security checks.
   *
   * @param imageBuffer - Original image buffer
   * @param consentFeature - Which consent feature to check
   * @param options - Security check options
   * @returns Redacted image buffer ready for AI inference
   * @throws Error if consent denied, budget exceeded, or file too large
   */
  async runPreExtractionChecks(
    imageBuffer: Buffer,
    consentFeature: ConsentFeature,
    options: SecurityCheckOptions
  ): Promise<{ redactedBuffer: Buffer; imagePiiRedacted: boolean }> {
    // Stage 1: Consent verification (P0-4: defense-in-depth)
    if (!options.skipSecurityChecks) {
      const hasConsent = await checkConsent(options.userId, options.tenantId, consentFeature);
      if (!hasConsent) {
        logger.warn(
          { userId: options.userId, tenantId: options.tenantId, feature: consentFeature },
          'Service-layer consent check failed'
        );
        throw new Error(`AI ${consentFeature} is not enabled. Enable in Settings > AI Preferences.`);
      }
    }

    // Stage 2: Budget enforcement (P0-3)
    if (!options.skipSecurityChecks) {
      const budgetCheck = await this.budgetService.checkBudget(options.tenantId, 2000);
      if (!budgetCheck.allowed) {
        logger.warn(
          { tenantId: options.tenantId, budgetStatus: budgetCheck.status },
          'AI budget exceeded'
        );
        const error = new Error(budgetCheck.reason || 'AI budget exceeded') as Error & { statusCode?: number };
        error.statusCode = 402;
        throw error;
      }
    }

    // Stage 3: File size validation (SEC-44: OOM prevention)
    if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);

      logger.warn(
        { tenantId: options.tenantId, fileSize: imageBuffer.length, fileSizeMB, maxSizeMB },
        'File size exceeds maximum allowed'
      );

      throw new Error(`File size (${fileSizeMB} MB) exceeds maximum allowed (${maxSizeMB} MB)`);
    }

    // Stage 4: PII redaction from image (SEC-29)
    const piiResult = options.skipSecurityChecks
      ? { redactedBuffer: imageBuffer, redactionLog: [], hadPII: false }
      : redactImage(imageBuffer);

    if (piiResult.hadPII) {
      logger.info(
        { tenantId: options.tenantId, redactions: piiResult.redactionLog.length },
        'PII detected and redacted from image before AI inference'
      );
    }

    return {
      redactedBuffer: piiResult.redactedBuffer,
      imagePiiRedacted: piiResult.hadPII,
    };
  }

  /**
   * Run post-extraction security checks on OCR text and amounts.
   *
   * @param ocrText - OCR text from AI extraction
   * @param amount - Extracted amount for validation
   * @param options - Security check options
   * @returns Security analysis results
   */
  runPostExtractionChecks(
    ocrText: string,
    amount: number,
    options: SecurityCheckOptions
  ): {
    redactedOcrText: string;
    ocrPiiRedacted: boolean;
    promptDefense: DefenseResult;
    amountValidation: DefenseResult;
    requiresReview: boolean;
  } {
    // Stage 5: Redact PII from OCR text (P0-5)
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

    // Stage 6: Prompt defense analysis (SEC-30)
    const promptDefense = options.skipSecurityChecks
      ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
      : analyzePromptInjection(redactedOcrText);

    const amountValidation = options.skipSecurityChecks
      ? { safe: true, riskLevel: 'safe' as const, threats: [], requiresReview: false }
      : validateExtractedAmount(amount, redactedOcrText);

    const requiresReview = !options.skipSecurityChecks && (promptDefense.requiresReview || amountValidation.requiresReview);

    if (requiresReview) {
      logger.warn(
        { tenantId: options.tenantId, threats: [...promptDefense.threats, ...amountValidation.threats] },
        'Extraction requires manual review due to security threats'
      );
    }

    return {
      redactedOcrText,
      ocrPiiRedacted: ocrRedactionResult.hadPII,
      promptDefense,
      amountValidation,
      requiresReview,
    };
  }

  /**
   * Track AI spending after successful extraction.
   */
  async trackSpending(tenantId: string, tokensUsed?: number): Promise<void> {
    if (tokensUsed) {
      await this.budgetService.trackSpend(tenantId, tokensUsed);
    }
  }
}
