import { prisma } from '@akount/db';
import { MistralProvider } from './providers/mistral.provider';
import { AIDecisionLogService } from './ai-decision-log.service';
import { logger } from '../../../lib/logger';
import { mistralSearchFunctionSchema } from '../schemas/natural-search.schema';

/**
 * Natural Language Search Service
 *
 * Parse natural language search queries into structured filter parameters.
 *
 * **Example queries:**
 * - "Show me all restaurant expenses over $100 in Q4"
 * - "Find Uber rides last month"
 * - "Transactions above $500 this year"
 *
 * **Confidence-based routing:**
 * - >80% confidence: High quality parsing
 * - 50-80%: Medium quality, may need refinement
 * - <50%: Low quality, suggest alternative queries
 *
 * @module natural-search.service
 */

export interface FilterChip {
  label: string;
  value: string;
  field: string;
}

export interface ParsedSearchFilters {
  category?: string[]; // Category IDs
  amountMin?: number; // Integer cents
  amountMax?: number; // Integer cents
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
  vendor?: string;
  description?: string; // Search term
  type?: 'DEBIT' | 'CREDIT' | 'all';
}

export interface SearchParseResult {
  parsed: ParsedSearchFilters;
  confidence: number; // 0-100
  explanation: string;
  filterChips: FilterChip[];
}

export class NaturalSearchService {
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
   * Parse natural language search query into filter parameters.
   *
   * @param query - Natural language search query
   * @param tenantId - Tenant ID (for isolation and category lookup)
   * @param entityId - Entity ID (business context)
   * @param consentStatus - Consent status from middleware
   * @returns Parsed filters with confidence and UI filter chips
   *
   * @throws Error if confidence is too low (<50%) or parsing fails
   */
  async parseSearchQuery(
    query: string,
    tenantId: string,
    entityId: string,
    consentStatus?: string
  ): Promise<SearchParseResult> {
    const startTime = Date.now();

    try {
      // Call Mistral with function calling to extract structured filters
      const response = await this.mistralProvider.chat(
        [
          {
            role: 'user',
            content: `Parse this natural language search query into filter parameters: "${query}"`,
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

      // Build parsed filters
      const parsed: ParsedSearchFilters = {};
      const filterChips: FilterChip[] = [];

      // Process categories (map names to IDs)
      if (rawData.categories && Array.isArray(rawData.categories)) {
        const categoryIds = await this.mapCategoryNamesToIds(
          rawData.categories,
          tenantId
        );
        if (categoryIds.length > 0) {
          parsed.category = categoryIds;
          // Create filter chips for each category
          rawData.categories.forEach((name: string, i: number) => {
            if (categoryIds[i]) {
              filterChips.push({
                label: name,
                value: categoryIds[i],
                field: 'category',
              });
            }
          });
        }
      }

      // Process amount range (convert dollars to integer cents - Invariant #2)
      if (typeof rawData.amountMinDollars === 'number') {
        parsed.amountMin = Math.round(rawData.amountMinDollars * 100);
        filterChips.push({
          label: `> $${rawData.amountMinDollars}`,
          value: rawData.amountMinDollars.toString(),
          field: 'amountMin',
        });
      }

      if (typeof rawData.amountMaxDollars === 'number') {
        parsed.amountMax = Math.round(rawData.amountMaxDollars * 100);
        filterChips.push({
          label: `< $${rawData.amountMaxDollars}`,
          value: rawData.amountMaxDollars.toString(),
          field: 'amountMax',
        });
      }

      // Process date range
      const dateRange = this.parseDateRange(rawData.dateFrom, rawData.dateTo);
      if (dateRange) {
        parsed.dateFrom = dateRange.from;
        parsed.dateTo = dateRange.to;
        filterChips.push({
          label: this.formatDateRangeLabel(dateRange.from, dateRange.to),
          value: `${dateRange.from} to ${dateRange.to}`,
          field: 'dateRange',
        });
      }

      // Process vendor
      if (rawData.vendor) {
        parsed.vendor = rawData.vendor;
        filterChips.push({
          label: `Vendor: ${rawData.vendor}`,
          value: rawData.vendor,
          field: 'vendor',
        });
      }

      // Process keywords for description search
      if (rawData.keywords) {
        parsed.description = rawData.keywords;
        filterChips.push({
          label: `Keywords: ${rawData.keywords}`,
          value: rawData.keywords,
          field: 'description',
        });
      }

      // Process transaction type (expense/income → DEBIT/CREDIT)
      if (rawData.transactionType) {
        const type = this.mapTransactionType(rawData.transactionType);
        if (type !== 'all') {
          parsed.type = type;
          const label = rawData.transactionType === 'expense' ? 'Expenses' : 'Income';
          filterChips.push({
            label,
            value: rawData.transactionType,
            field: 'type',
          });
        }
      }

      // Calculate confidence
      const confidence = this.calculateConfidence(rawData, parsed);

      // Check for low confidence
      if (confidence < 50) {
        throw new Error(
          `Unable to understand query. Try: "expenses over $100 last quarter" or "Uber rides in January"`
        );
      }

      // Generate explanation
      const explanation = this.generateExplanation(parsed, rawData);

      const result: SearchParseResult = {
        parsed,
        confidence,
        explanation,
        filterChips,
      };

      // Log AI decision for audit trail
      const processingTimeMs = Date.now() - startTime;
      await this.decisionLogService.logDecision({
        tenantId,
        entityId,
        decisionType: 'NL_SEARCH_PARSE',
        input: query,
        modelVersion: 'mistral-large-latest',
        confidence,
        extractedData: parsed as unknown as Record<string, unknown>,
        routingResult: confidence >= 80 ? 'AUTO_CREATED' : 'QUEUED_FOR_REVIEW',
        aiExplanation: explanation,
        consentStatus,
        processingTimeMs,
      });

      logger.info(
        {
          tenantId,
          entityId,
          query: query.substring(0, 100),
          confidence,
          filterCount: filterChips.length,
          processingTimeMs,
        },
        'Natural language search query parsed'
      );

      return result;
    } catch (error: unknown) {
      const processingTimeMs = Date.now() - startTime;

      logger.error(
        {
          err: error,
          tenantId,
          entityId,
          query: query.substring(0, 100),
          processingTimeMs,
        },
        'Failed to parse natural language search query'
      );

      // Log failed decision
      await this.decisionLogService.logDecision({
        tenantId,
        entityId,
        decisionType: 'NL_SEARCH_PARSE',
        input: query,
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
   * Map category names to IDs via database lookup.
   */
  private async mapCategoryNamesToIds(
    categoryNames: string[],
    tenantId: string
  ): Promise<string[]> {
    try {
      const categories = await prisma.category.findMany({
        where: {
          tenantId, // Tenant isolation (Invariant #1)
          name: { in: categoryNames },
          isActive: true,
          deletedAt: null, // Soft delete filter (Invariant #4)
        },
        select: { id: true, name: true },
      });

      // Map names back to IDs in original order
      return categoryNames.map((name) => {
        const match = categories.find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
        return match ? match.id : '';
      }).filter((id) => id !== ''); // Remove non-matches
    } catch (error: unknown) {
      logger.error(
        { err: error, categoryNames, tenantId },
        'Failed to map category names to IDs'
      );
      return [];
    }
  }

  /**
   * Parse date range expressions into ISO 8601 dates.
   * Supports: "Q1", "Q2", "Q3", "Q4", "last month", "this year", "yesterday", etc.
   */
  private parseDateRange(
    dateFromStr?: string,
    dateToStr?: string
  ): { from: string; to: string } | null {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    // Parse explicit dates first
    if (dateFromStr) {
      const parsed = new Date(dateFromStr);
      if (!isNaN(parsed.getTime())) {
        from = parsed;
      }
    }

    if (dateToStr) {
      const parsed = new Date(dateToStr);
      if (!isNaN(parsed.getTime())) {
        to = parsed;
      }
    }

    // If both explicit dates provided, return them
    if (from && to) {
      return {
        from: from.toISOString(),
        to: to.toISOString(),
      };
    }

    // Handle relative date expressions
    // Check if either date string contains relative keywords
    const combinedStr = `${dateFromStr || ''} ${dateToStr || ''}`.toLowerCase();

    // Quarters (Q1, Q2, Q3, Q4)
    if (combinedStr.includes('q1')) {
      from = new Date(now.getFullYear(), 0, 1); // Jan 1
      to = new Date(now.getFullYear(), 2, 31); // Mar 31
    } else if (combinedStr.includes('q2')) {
      from = new Date(now.getFullYear(), 3, 1); // Apr 1
      to = new Date(now.getFullYear(), 5, 30); // Jun 30
    } else if (combinedStr.includes('q3')) {
      from = new Date(now.getFullYear(), 6, 1); // Jul 1
      to = new Date(now.getFullYear(), 8, 30); // Sep 30
    } else if (combinedStr.includes('q4')) {
      from = new Date(now.getFullYear(), 9, 1); // Oct 1
      to = new Date(now.getFullYear(), 11, 31); // Dec 31
    }
    // Last month
    else if (combinedStr.includes('last month')) {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of prev month
    }
    // This month
    else if (combinedStr.includes('this month')) {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    // This year
    else if (combinedStr.includes('this year')) {
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31);
    }
    // Last year
    else if (combinedStr.includes('last year')) {
      from = new Date(now.getFullYear() - 1, 0, 1);
      to = new Date(now.getFullYear() - 1, 11, 31);
    }
    // Yesterday
    else if (combinedStr.includes('yesterday')) {
      from = new Date(now);
      from.setDate(from.getDate() - 1);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setHours(23, 59, 59, 999);
    }
    // Today
    else if (combinedStr.includes('today')) {
      from = new Date(now);
      from.setHours(0, 0, 0, 0);
      to = new Date(now);
      to.setHours(23, 59, 59, 999);
    }
    // Last 7 days
    else if (combinedStr.includes('last 7 days') || combinedStr.includes('past week')) {
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      to = new Date(now);
    }
    // Last 30 days
    else if (combinedStr.includes('last 30 days') || combinedStr.includes('past month')) {
      from = new Date(now);
      from.setDate(from.getDate() - 30);
      to = new Date(now);
    }

    if (from && to) {
      return {
        from: from.toISOString(),
        to: to.toISOString(),
      };
    }

    return null;
  }

  /**
   * Format date range for filter chip display.
   */
  private formatDateRangeLabel(fromIso: string, toIso: string): string {
    const from = new Date(fromIso);
    const to = new Date(toIso);

    const formatShort = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `${formatShort(from)} - ${formatShort(to)}`;
  }

  /**
   * Map transaction type keywords to DEBIT/CREDIT.
   */
  private mapTransactionType(type: string): 'DEBIT' | 'CREDIT' | 'all' {
    const lower = type.toLowerCase();

    if (lower === 'expense' || lower === 'debit' || lower === 'withdrawal') {
      return 'DEBIT';
    }

    if (lower === 'income' || lower === 'credit' || lower === 'deposit') {
      return 'CREDIT';
    }

    return 'all';
  }

  /**
   * Calculate confidence score (0-100) based on filter completeness.
   */
  private calculateConfidence(
    rawData: Record<string, unknown>,
    parsed: ParsedSearchFilters
  ): number {
    let confidence = 40; // Base confidence

    // Category matched: +20
    if (parsed.category && parsed.category.length > 0) {
      confidence += 20;
    }

    // Amount range specified: +15
    if (parsed.amountMin !== undefined || parsed.amountMax !== undefined) {
      confidence += 15;
    }

    // Date range specified: +20
    if (parsed.dateFrom && parsed.dateTo) {
      confidence += 20;
    }

    // Vendor specified: +10
    if (parsed.vendor) {
      confidence += 10;
    }

    // Transaction type specified: +10
    if (parsed.type && parsed.type !== 'all') {
      confidence += 10;
    }

    // Keywords specified: +5
    if (parsed.description) {
      confidence += 5;
    }

    // Penalize if no filters extracted
    const filterCount = Object.keys(parsed).length;
    if (filterCount === 0) {
      confidence = 0;
    } else if (filterCount === 1) {
      confidence -= 10; // Single filter is less confident
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Generate human-readable explanation of parsing.
   */
  private generateExplanation(
    parsed: ParsedSearchFilters,
    rawData: Record<string, unknown>
  ): string {
    const parts: string[] = [];

    // Categories
    if (parsed.category && parsed.category.length > 0) {
      const categoryNames = rawData.categories as string[];
      parts.push(`Categories: ${categoryNames.join(', ')}`);
    }

    // Amount range
    if (parsed.amountMin !== undefined) {
      const dollars = (parsed.amountMin / 100).toFixed(2);
      parts.push(`Amount > $${dollars}`);
    }
    if (parsed.amountMax !== undefined) {
      const dollars = (parsed.amountMax / 100).toFixed(2);
      parts.push(`Amount < $${dollars}`);
    }

    // Date range
    if (parsed.dateFrom && parsed.dateTo) {
      const from = new Date(parsed.dateFrom);
      const to = new Date(parsed.dateTo);
      parts.push(
        `Date range: ${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      );
    }

    // Vendor
    if (parsed.vendor) {
      parts.push(`Vendor: ${parsed.vendor}`);
    }

    // Transaction type
    if (parsed.type === 'DEBIT') {
      parts.push('Type: Expenses');
    } else if (parsed.type === 'CREDIT') {
      parts.push('Type: Income');
    }

    // Keywords
    if (parsed.description) {
      parts.push(`Keywords: "${parsed.description}"`);
    }

    if (parts.length === 0) {
      return 'No filters extracted from query.';
    }

    return `Searching for transactions: ${parts.join(', ')}.`;
  }
}
