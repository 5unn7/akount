import { prisma } from '@akount/db';
import { MistralProvider } from './providers/mistral.provider';
import { AIDecisionLogService } from './ai-decision-log.service';
import { logger } from '../../../lib/logger';
import { mistralTransactionFunctionSchema } from '../schemas/natural-bookkeeping.schema';

/**
 * Natural Language Bookkeeping Service
 *
 * Parse natural language input into structured transaction data using Mistral AI.
 *
 * **Example inputs:**
 * - "Paid $47 for Uber to airport"
 * - "Bought lunch at Starbucks yesterday, $15.50"
 * - "Received payment from ACME Corp, $2500"
 *
 * **Confidence-based routing:**
 * - >80% confidence + <$5000: Auto-approve (requiresReview: false)
 * - 50-80% OR >$5000: Review required (requiresReview: true)
 * - <50%: Error with explanation
 *
 * @module natural-bookkeeping.service
 */

export interface ParsedTransactionData {
  vendor: string;
  amount: number; // Integer cents
  category?: string;
  glAccountId?: string;
  date: string; // ISO 8601
  description?: string;
}

export interface ParseResult {
  parsed: ParsedTransactionData;
  confidence: number;
  explanation: string;
  requiresReview: boolean;
}

export class NaturalBookkeepingService {
  private mistralProvider: MistralProvider;
  private decisionLogService: AIDecisionLogService;

  constructor() {
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      throw new Error('MISTRAL_API_KEY environment variable is required');
    }

    this.mistralProvider = new MistralProvider(mistralApiKey);
    this.decisionLogService = new AIDecisionLogService();
  }

  /**
   * Parse natural language input into structured transaction data.
   *
   * @param text - Natural language input
   * @param tenantId - Tenant ID (for isolation)
   * @param entityId - Entity ID (business context)
   * @param consentStatus - Consent status from middleware
   * @returns Parsed transaction data with confidence and routing decision
   *
   * @throws Error if confidence is too low (<50%) or parsing fails
   */
  async parseNaturalLanguage(
    text: string,
    tenantId: string,
    entityId: string,
    consentStatus?: string
  ): Promise<ParseResult> {
    const startTime = Date.now();

    try {
      // Call Mistral with function calling to extract structured data
      const response = await this.mistralProvider.chat(
        [
          {
            role: 'user',
            content: `Parse this natural language transaction into structured data: "${text}"`,
          },
        ],
        {
          model: 'mistral-large-latest',
          temperature: 0.1, // Low temperature for precise extraction
          maxTokens: 512,
          responseFormat: { type: 'json_object' },
        }
      );

      // Parse Mistral response
      const rawData = JSON.parse(response.content);

      // Validate and transform data
      const vendor = rawData.vendor;
      const amountDollars = rawData.amountDollars;

      if (!vendor || typeof amountDollars !== 'number') {
        throw new Error('Failed to extract vendor or amount from text');
      }

      // Convert dollars to integer cents (Invariant #2)
      const amount = Math.round(amountDollars * 100);

      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      // Parse or default date
      const date = this.parseDate(rawData.date);

      // Infer category and GL account
      const { category, glAccountId } = await this.inferCategoryAndAccount(
        vendor,
        amount,
        tenantId,
        entityId
      );

      // Calculate confidence based on data completeness and amount
      const confidence = this.calculateConfidence(rawData, amount);

      // Determine if review is required
      const requiresReview = this.shouldRequireReview(confidence, amount);

      // Generate explanation
      const explanation = this.generateExplanation(
        vendor,
        category,
        amount,
        date,
        rawData
      );

      const parsed: ParsedTransactionData = {
        vendor,
        amount,
        category: category || rawData.category,
        glAccountId,
        date,
        description: rawData.description || text,
      };

      const result: ParseResult = {
        parsed,
        confidence,
        explanation,
        requiresReview,
      };

      // Log AI decision for audit trail
      const processingTimeMs = Date.now() - startTime;
      await this.decisionLogService.logDecision({
        tenantId,
        entityId,
        decisionType: 'NL_BOOKKEEPING',
        input: text,
        modelVersion: 'mistral-large-latest',
        confidence,
        extractedData: parsed as unknown as Record<string, unknown>,
        routingResult: requiresReview ? 'QUEUED_FOR_REVIEW' : 'AUTO_CREATED',
        aiExplanation: explanation,
        consentStatus,
        processingTimeMs,
      });

      logger.info(
        {
          tenantId,
          entityId,
          vendor,
          amount,
          confidence,
          requiresReview,
          processingTimeMs,
        },
        'Natural language transaction parsed'
      );

      return result;
    } catch (error: unknown) {
      const processingTimeMs = Date.now() - startTime;

      logger.error(
        {
          err: error,
          tenantId,
          entityId,
          text: text.substring(0, 100), // Truncate for logging
          processingTimeMs,
        },
        'Failed to parse natural language transaction'
      );

      // Log failed decision
      await this.decisionLogService.logDecision({
        tenantId,
        entityId,
        decisionType: 'NL_BOOKKEEPING',
        input: text,
        modelVersion: 'mistral-large-latest',
        confidence: 0,
        extractedData: {},
        routingResult: 'REJECTED',
        aiExplanation:
          error instanceof Error ? error.message : 'Unknown parsing error',
        consentStatus,
        processingTimeMs,
      });

      throw error;
    }
  }

  /**
   * Parse date string or default to today.
   * Supports relative dates: "yesterday", "last Monday", etc.
   */
  private parseDate(dateStr?: string): string {
    if (!dateStr) {
      return new Date().toISOString();
    }

    // Try parsing ISO 8601 first
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    // Handle relative dates
    const now = new Date();
    const lowerDate = dateStr.toLowerCase();

    if (lowerDate.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString();
    }

    if (lowerDate.includes('today')) {
      return now.toISOString();
    }

    // Default to today if parsing fails
    logger.warn({ dateStr }, 'Failed to parse date, defaulting to today');
    return now.toISOString();
  }

  /**
   * Infer category and GL account from vendor and amount.
   * Uses pattern matching against existing categories.
   */
  private async inferCategoryAndAccount(
    vendor: string,
    amount: number,
    tenantId: string,
    entityId: string
  ): Promise<{ category?: string; glAccountId?: string }> {
    try {
      // Search for matching categories by vendor name patterns
      const categories = await prisma.category.findMany({
        where: {
          tenantId,
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          type: true,
          defaultGLAccountId: true,
        },
      });

      // Simple pattern matching (can be enhanced with ML later)
      const vendorLower = vendor.toLowerCase();

      // Travel patterns
      if (
        vendorLower.includes('uber') ||
        vendorLower.includes('lyft') ||
        vendorLower.includes('airline') ||
        vendorLower.includes('airport')
      ) {
        const travelCat = categories.find((c) =>
          c.name.toLowerCase().includes('travel')
        );
        if (travelCat) {
          return {
            category: travelCat.name,
            glAccountId: travelCat.defaultGLAccountId || undefined,
          };
        }
        return { category: 'Travel' };
      }

      // Food patterns
      if (
        vendorLower.includes('starbucks') ||
        vendorLower.includes('restaurant') ||
        vendorLower.includes('cafe') ||
        vendorLower.includes('food')
      ) {
        const foodCat = categories.find((c) =>
          c.name.toLowerCase().includes('food')
        );
        if (foodCat) {
          return {
            category: foodCat.name,
            glAccountId: foodCat.defaultGLAccountId || undefined,
          };
        }
        return { category: 'Meals & Entertainment' };
      }

      // Office patterns
      if (
        vendorLower.includes('office') ||
        vendorLower.includes('staples') ||
        vendorLower.includes('supplies')
      ) {
        const officeCat = categories.find((c) =>
          c.name.toLowerCase().includes('office')
        );
        if (officeCat) {
          return {
            category: officeCat.name,
            glAccountId: officeCat.defaultGLAccountId || undefined,
          };
        }
        return { category: 'Office Supplies' };
      }

      // No match found
      return { category: 'Uncategorized' };
    } catch (error: unknown) {
      logger.error(
        { err: error, vendor, tenantId },
        'Failed to infer category from vendor'
      );
      return { category: 'Uncategorized' };
    }
  }

  /**
   * Calculate confidence score (0-100) based on data completeness.
   */
  private calculateConfidence(rawData: Record<string, unknown>, amount: number): number {
    let confidence = 50; // Base confidence

    // Vendor extracted: +20
    if (rawData.vendor) confidence += 20;

    // Amount extracted: +20
    if (rawData.amountDollars) confidence += 20;

    // Date provided: +10
    if (rawData.date) confidence += 10;

    // Category inferred: +10
    if (rawData.category) confidence += 10;

    // Penalize very large amounts (reduce confidence)
    if (amount > 500000) {
      // >$5000
      confidence -= 10;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Determine if transaction requires human review.
   *
   * Rules:
   * - >80% confidence + <$5000: Auto-approve
   * - 50-80% OR >$5000: Review required
   * - <50%: Reject (error thrown before this)
   */
  private shouldRequireReview(confidence: number, amount: number): boolean {
    // Low confidence always requires review
    if (confidence < 50) {
      throw new Error(
        `Confidence too low (${confidence}%). Unable to parse transaction reliably.`
      );
    }

    // Medium confidence or high amount requires review
    if (confidence < 80 || amount > 500000) {
      // >$5000
      return true;
    }

    // High confidence + reasonable amount: auto-approve
    return false;
  }

  /**
   * Generate human-readable explanation of AI reasoning.
   */
  private generateExplanation(
    vendor: string,
    category: string | undefined,
    amount: number,
    date: string,
    rawData: Record<string, unknown>
  ): string {
    const parts: string[] = [];

    // Vendor
    parts.push(`Identified vendor: "${vendor}"`);

    // Category
    if (category) {
      parts.push(
        `Categorized as "${category}" based on vendor pattern matching`
      );
    } else if (rawData.category) {
      parts.push(`Suggested category: "${rawData.category}"`);
    } else {
      parts.push('Category: Uncategorized (manual selection required)');
    }

    // Amount
    const dollars = (amount / 100).toFixed(2);
    parts.push(`Amount: $${dollars}`);

    // Date
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    if (rawData.date) {
      parts.push(`Date: ${dateStr} (from input)`);
    } else {
      parts.push(`Date: ${dateStr} (defaulted to today)`);
    }

    return parts.join('. ') + '.';
  }
}
