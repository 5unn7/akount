import { MistralProvider } from './providers/mistral.provider';
import { AIDecisionLogService } from './ai-decision-log.service';
import { logger } from '../../../lib/logger';
import type { AIRoutingResult } from '@akount/db';

/**
 * Financial Report Narration Service (DEV-250)
 *
 * Generates plain-English summaries of financial reports using AI.
 * Helps users understand financial statements without accounting expertise.
 *
 * **Supported Reports:**
 * - Profit & Loss (P&L) - Revenue, expenses, net income trends
 * - Balance Sheet (BS) - Assets, liabilities, equity snapshot
 * - Cash Flow (CF) - Operating, investing, financing activities
 * - Month-End Close - Summary of period activities
 *
 * **Features:**
 * - Natural language summaries (2-3 sentences)
 * - Trend analysis (MoM, YoY comparisons)
 * - Key driver identification (top revenue/expense categories)
 * - Actionable insights (warnings, suggestions)
 *
 * **Caching:**
 * - Narrations cached per report hash (data fingerprint)
 * - Cache invalidated when report data changes
 * - Reduces API costs for frequently-viewed reports
 *
 * @module report-narration.service
 */

export type ReportType = 'PROFIT_LOSS' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'MONTH_END';

export interface ReportNarrationInput {
  reportType: ReportType;
  reportData: unknown; // Actual report data (P&L, BS, CF, etc.)
  reportHash: string; // Hash of report data for cache keying
  entityId: string;
  tenantId: string;
  consentStatus?: string;
}

export interface ReportNarration {
  reportType: ReportType;
  reportHash: string;
  narration: string;
  disclaimer: string;
  confidence: number; // 0-100
  generatedAt: Date;
  cached: boolean;
}

// In-memory cache for narrations (keyed by reportHash)
// Future: Move to Redis for multi-instance support
const narrationCache = new Map<string, { narration: string; timestamp: number; confidence: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export class ReportNarrationService {
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
   * Generate plain-English narration for a financial report.
   *
   * Uses Mistral to summarize report data in 2-3 sentences.
   * Caches results to reduce API costs.
   *
   * @param input - Report data and metadata
   * @returns Narration with disclaimer
   */
  async generateNarration(input: ReportNarrationInput): Promise<ReportNarration> {
    const { reportType, reportData, reportHash, entityId, tenantId, consentStatus } = input;

    // Check cache first
    const cached = narrationCache.get(reportHash);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      logger.info(
        { reportType, reportHash, cached: true },
        'Report narration served from cache'
      );

      return {
        reportType,
        reportHash,
        narration: cached.narration,
        disclaimer: this.getDisclaimer(),
        confidence: cached.confidence,
        generatedAt: new Date(cached.timestamp),
        cached: true,
      };
    }

    // Generate narration using Mistral
    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(reportType, reportData);

      const response = await this.mistralProvider.chat(
        [
          {
            role: 'system',
            content: 'You are a financial analyst helping non-accountants understand financial reports. Provide concise, jargon-free summaries in 2-3 sentences. Focus on trends, key drivers, and actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          model: 'mistral-large-latest',
          temperature: 0.3, // Slightly creative but mostly factual
          maxTokens: 256, // Keep summaries concise
        }
      );

      const narration = response.content.trim();
      const processingTimeMs = Date.now() - startTime;

      // Estimate confidence (simplified - could use more sophisticated logic)
      const confidence = this.estimateConfidence(narration, reportType);

      // Cache the narration
      narrationCache.set(reportHash, {
        narration,
        timestamp: Date.now(),
        confidence,
      });

      // Log decision
      const routingResult: AIRoutingResult =
        confidence >= 80 ? 'AUTO_CREATED' : confidence >= 60 ? 'QUEUED_FOR_REVIEW' : 'MANUAL_ENTRY';

      await this.decisionLogService.logDecision({
        tenantId,
        entityId,
        decisionType: 'NL_BOOKKEEPING', // Closest existing type (future: add REPORT_NARRATION)
        input: reportHash, // Use hash as input for logging
        modelVersion: 'mistral-large-latest',
        confidence,
        extractedData: { narration, reportType },
        routingResult,
        aiExplanation: `Generated ${reportType} narration with ${confidence}% confidence`,
        consentStatus,
        processingTimeMs,
      });

      logger.info(
        { reportType, reportHash, confidence, processingTimeMs, cached: false },
        'Report narration generated successfully'
      );

      return {
        reportType,
        reportHash,
        narration,
        disclaimer: this.getDisclaimer(),
        confidence,
        generatedAt: new Date(),
        cached: false,
      };
    } catch (error) {
      logger.error(
        { err: error, reportType, reportHash },
        'Report narration generation failed'
      );

      throw new Error(
        `Failed to generate narration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build LLM prompt for report narration.
   *
   * Extracts key metrics and trends from report data.
   */
  private buildPrompt(reportType: ReportType, reportData: unknown): string {
    const data = reportData as Record<string, unknown>;

    switch (reportType) {
      case 'PROFIT_LOSS':
        return `Summarize this Profit & Loss statement in 2-3 sentences for a non-accountant:

Revenue: ${JSON.stringify(data.revenue || {})}
Expenses: ${JSON.stringify(data.expenses || {})}
Net Income: ${JSON.stringify(data.netIncome || {})}

Focus on: trends (up/down from prior period), key drivers (which categories changed most), and one actionable insight.`;

      case 'BALANCE_SHEET':
        return `Summarize this Balance Sheet in 2-3 sentences for a non-accountant:

Assets: ${JSON.stringify(data.assets || {})}
Liabilities: ${JSON.stringify(data.liabilities || {})}
Equity: ${JSON.stringify(data.equity || {})}

Focus on: financial position (strong/weak), liquidity (current ratio), and one key observation.`;

      case 'CASH_FLOW':
        return `Summarize this Cash Flow statement in 2-3 sentences for a non-accountant:

Operating Activities: ${JSON.stringify(data.operating || {})}
Investing Activities: ${JSON.stringify(data.investing || {})}
Financing Activities: ${JSON.stringify(data.financing || {})}
Net Cash Flow: ${JSON.stringify(data.netCashFlow || {})}

Focus on: cash position (improving/declining), where cash came from/went to, and one warning or positive note.`;

      case 'MONTH_END':
        return `Summarize this month-end close summary in 2-3 sentences for a business owner:

${JSON.stringify(data, null, 2)}

Focus on: what was accomplished this month, any red flags, and what needs attention next month.`;

      default:
        return `Summarize this financial report in 2-3 sentences: ${JSON.stringify(data)}`;
    }
  }

  /**
   * Estimate confidence in the generated narration.
   *
   * Simplified heuristic based on narration quality indicators.
   */
  private estimateConfidence(narration: string, reportType: ReportType): number {
    let confidence = 70; // Base confidence

    // Length check (too short or too long = lower confidence)
    const wordCount = narration.split(/\s+/).length;
    if (wordCount < 20 || wordCount > 100) confidence -= 10;

    // Contains numbers/percentages (good sign for financial summary)
    if (narration.match(/\d+%/)) confidence += 10;
    if (narration.match(/\$[\d,]+/)) confidence += 5;

    // Contains trend words (good for financial analysis)
    const trendWords = ['grew', 'increased', 'decreased', 'improved', 'declined', 'stable'];
    if (trendWords.some((w) => narration.toLowerCase().includes(w))) confidence += 10;

    // Report-specific checks
    if (reportType === 'PROFIT_LOSS' && narration.toLowerCase().includes('revenue')) confidence += 5;
    if (reportType === 'BALANCE_SHEET' && narration.toLowerCase().includes('assets')) confidence += 5;
    if (reportType === 'CASH_FLOW' && narration.toLowerCase().includes('cash')) confidence += 5;

    // Cap at 95 (never 100% - AI is never perfect)
    return Math.min(Math.max(confidence, 50), 95);
  }

  /**
   * Get standard disclaimer for AI-generated narrations.
   */
  private getDisclaimer(): string {
    return 'AI-generated summary — review underlying financial data for accuracy. Not a substitute for professional accounting advice.';
  }

  /**
   * Clear narration cache (for testing or manual refresh).
   */
  clearCache(): void {
    narrationCache.clear();
    logger.info('Report narration cache cleared');
  }

  /**
   * Get cache statistics (for monitoring).
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: narrationCache.size,
      keys: Array.from(narrationCache.keys()),
    };
  }
}
