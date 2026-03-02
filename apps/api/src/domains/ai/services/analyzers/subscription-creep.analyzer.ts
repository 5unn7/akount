import { prisma } from '@akount/db';
import { logger } from '../../../../lib/logger';
import type { InsightResult } from '../../types/insight.types';
import { MistralProvider } from '../providers/mistral.provider';
import { env } from '../../../../lib/env';
import { AIDecisionLogService } from '../ai-decision-log.service';
import { z } from 'zod';

/**
 * Subscription Creep Analyzer (DEV-252, C7.1)
 *
 * Detects new recurring charges from the same merchant with similar amounts.
 *
 * **Detection Logic:**
 * 1. Query last 90 days of transactions
 * 2. Group by merchant (description normalized)
 * 3. Find recurring patterns (same merchant, similar amount, ~monthly frequency)
 * 4. Filter for patterns first seen in last 30 days (NEW subscriptions)
 * 5. Use Mistral to analyze patterns and generate explanations
 *
 * **Example Anomaly:**
 * - Merchant: "Netflix"
 * - Amount: $14.99/mo
 * - First seen: 2026-02-15
 * - Occurrences: 2 times in last 30 days
 * - Confidence: 88%
 * - Insight: "New recurring charge: $14.99/mo Netflix detected"
 *
 * @module subscription-creep-analyzer
 */

interface RecurringPattern {
  merchant: string;
  amount: number; // Integer cents
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  avgDaysBetween: number;
}

const RecurringPatternSchema = z.object({
  merchant: z.string(),
  isRecurring: z.boolean(),
  confidence: z.number().min(0).max(100),
  explanation: z.string(),
  suggestedCategory: z.string().optional(),
});

export async function analyzeSubscriptionCreep(
  entityId: string,
  tenantId: string
): Promise<InsightResult[]> {
  const insights: InsightResult[] = [];

  logger.info({ entityId }, 'Running subscription creep analyzer');

  try {
    // 1. Query last 90 days of transactions
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await prisma.transaction.findMany({
      where: {
        account: {
          entityId,
          entity: { tenantId },
        },
        date: { gte: ninetyDaysAgo },
        deletedAt: null,
        amount: { lt: 0 }, // Expenses only (negative amounts)
      },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        accountId: true,
      },
      orderBy: { date: 'desc' },
    });

    logger.info(
      { entityId, transactionCount: transactions.length },
      'Fetched transactions for subscription creep analysis'
    );

    // 2. Group by merchant (normalize description)
    const merchantGroups = new Map<string, typeof transactions>();

    for (const txn of transactions) {
      const merchant = normalizeMerchant(txn.description);
      const group = merchantGroups.get(merchant) || [];
      group.push(txn);
      merchantGroups.set(merchant, group);
    }

    // 3. Find recurring patterns
    const recurringPatterns: RecurringPattern[] = [];

    for (const [merchant, txns] of merchantGroups.entries()) {
      // Need at least 2 occurrences to be recurring
      if (txns.length < 2) continue;

      // Check if amounts are similar (within 10% tolerance)
      const amounts = txns.map((t) => Math.abs(t.amount));
      const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const maxDeviation = amounts.reduce(
        (max, a) => Math.max(max, Math.abs(a - avgAmount)),
        0
      );

      // Skip if amounts vary by more than 10%
      if (maxDeviation > avgAmount * 0.1) continue;

      // Calculate average days between occurrences
      const sortedDates = txns.map((t) => t.date.getTime()).sort((a, b) => a - b);
      const daysBetween: number[] = [];

      for (let i = 1; i < sortedDates.length; i++) {
        const days = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
        daysBetween.push(days);
      }

      const avgDaysBetween =
        daysBetween.reduce((sum, d) => sum + d, 0) / daysBetween.length;

      // Check if it's monthly-ish (20-40 days between occurrences)
      if (avgDaysBetween < 20 || avgDaysBetween > 40) continue;

      // Check if first occurrence was in last 30 days (NEW subscription)
      const firstSeen = new Date(Math.min(...sortedDates));
      if (firstSeen < thirtyDaysAgo) continue;

      recurringPatterns.push({
        merchant,
        amount: Math.round(avgAmount),
        occurrences: txns.length,
        firstSeen,
        lastSeen: new Date(Math.max(...sortedDates)),
        avgDaysBetween,
      });
    }

    logger.info(
      { entityId, patternCount: recurringPatterns.length },
      'Found recurring patterns for subscription creep'
    );

    // 4. Use Mistral to analyze each pattern
    if (recurringPatterns.length === 0) {
      return insights;
    }

    const mistral = new MistralProvider(env.MISTRAL_API_KEY);
    const decisionLog = new AIDecisionLogService();

    for (const pattern of recurringPatterns) {
      try {
        const prompt = `Analyze this transaction pattern to determine if it's a new recurring subscription:

Merchant: ${pattern.merchant}
Amount: $${(pattern.amount / 100).toFixed(2)}
Occurrences: ${pattern.occurrences} times
First seen: ${pattern.firstSeen.toISOString().split('T')[0]}
Last seen: ${pattern.lastSeen.toISOString().split('T')[0]}
Average days between charges: ${pattern.avgDaysBetween.toFixed(1)}

Is this a new recurring subscription? Provide confidence (0-100) and a brief explanation.`;

        const response = await mistral.chat(
          [{ role: 'user', content: prompt }],
          {
            model: 'mistral-large-latest',
            temperature: 0.2,
            maxTokens: 512,
            responseSchema: RecurringPatternSchema,
            responseFormat: { type: 'json_object' },
          }
        );

        const analysis = RecurringPatternSchema.parse(JSON.parse(response.content));

        // Log AI decision
        await decisionLog.logDecision({
          tenantId,
          entityId,
          decisionType: 'ANOMALY_DETECTION',
          input: prompt,
          modelVersion: response.model,
          confidence: analysis.confidence,
          extractedData: {
            merchant: pattern.merchant,
            amount: pattern.amount,
            isRecurring: analysis.isRecurring,
          },
          routingResult: analysis.isRecurring && analysis.confidence >= 60 ? 'ACCEPTED' : 'REJECTED',
          aiExplanation: analysis.explanation,
          processingTimeMs: 0,
          tokensUsed: response.usage?.totalTokens,
        });

        // Only create insight if Mistral confirms it's recurring with reasonable confidence
        if (analysis.isRecurring && analysis.confidence >= 60) {
          const monthlyAmount = pattern.amount;
          const annualImpact = monthlyAmount * 12;

          insights.push({
            triggerId: `subscription-creep-${pattern.merchant.toLowerCase().replace(/\s+/g, '-')}`,
            title: `New recurring charge detected: ${pattern.merchant}`,
            description: `${analysis.explanation}\n\nAmount: $${(monthlyAmount / 100).toFixed(2)}/mo\nFirst seen: ${pattern.firstSeen.toISOString().split('T')[0]}\nOccurrences: ${pattern.occurrences}\nEstimated annual cost: $${(annualImpact / 100).toFixed(2)}`,
            type: 'spending_anomaly',
            priority: annualImpact > 50000 ? 'high' : 'medium', // $500+/year = high priority
            impact: annualImpact,
            confidence: analysis.confidence,
            actionable: true,
            status: 'active',
            metadata: {
              merchant: pattern.merchant,
              monthlyAmount,
              annualImpact,
              firstSeen: pattern.firstSeen.toISOString(),
              occurrences: pattern.occurrences,
              suggestedCategory: analysis.suggestedCategory,
            },
          });

          logger.info(
            {
              entityId,
              merchant: pattern.merchant,
              monthlyAmount,
              confidence: analysis.confidence,
            },
            'Subscription creep detected'
          );
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          { entityId, merchant: pattern.merchant, error: msg },
          'Failed to analyze subscription pattern'
        );
      }
    }

    return insights;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ entityId, error: msg }, 'Subscription creep analyzer failed');
    throw error;
  }
}

/**
 * Normalize merchant name for grouping.
 * Removes common prefixes/suffixes and standardizes casing.
 */
function normalizeMerchant(description: string): string {
  let normalized = description.toLowerCase();

  // Remove common payment processor prefixes
  normalized = normalized.replace(/^(sq\*|tst\*|paypal\s*\*|stripe\s*)/i, '');

  // Remove trailing reference numbers
  normalized = normalized.replace(/\s+#?\d{4,}$/i, '');

  // Remove location codes (e.g., "Store #123")
  normalized = normalized.replace(/\s+#\d+/g, '');

  // Trim and capitalize first letter of each word
  normalized = normalized
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return normalized;
}
