import { prisma } from '@akount/db';
import { logger } from '../../../../lib/logger';
import type { InsightResult } from '../../types/insight.types';
import { MistralProvider } from '../providers/mistral.provider';
import { env } from '../../../../lib/env';
import { AIDecisionLogService } from '../ai-decision-log.service';
import { z } from 'zod';

/**
 * Missing Transactions Analyzer (DEV-252, C7.3)
 *
 * Detects when expected recurring charges (rent, utilities, subscriptions) are not seen.
 *
 * **Detection Logic:**
 * 1. Find established recurring patterns (3+ occurrences over 90+ days)
 * 2. Calculate expected next occurrence based on average frequency
 * 3. Check if expected charge is overdue (>5 days past expected date)
 * 4. Use Mistral to assess likelihood of missing payment
 * 5. Generate insight for investigation
 *
 * **Example Anomaly:**
 * - Merchant: "Property Management Co."
 * - Expected amount: $1,800
 * - Last seen: 2025-12-01
 * - Expected: 2026-01-01
 * - Days overdue: 28
 * - Confidence: 85%
 * - Insight: "Rent payment missing: $1,800 charge from Property Management Co. is 28 days overdue"
 *
 * @module missing-transactions-analyzer
 */

interface RecurringCharge {
  merchant: string;
  amount: number; // Integer cents
  occurrences: number;
  lastSeen: Date;
  avgDaysBetween: number;
  expectedNextDate: Date;
  daysOverdue: number;
}

const MissingChargeSchema = z.object({
  isMissing: z.boolean(),
  confidence: z.number().min(0).max(100),
  explanation: z.string(),
  urgency: z.enum(['critical', 'high', 'medium']),
});

export async function analyzeMissingTransactions(
  entityId: string,
  tenantId: string
): Promise<InsightResult[]> {
  const insights: InsightResult[] = [];

  logger.info({ entityId }, 'Running missing transactions analyzer');

  try {
    // 1. Query last 120 days of transactions (need history to establish patterns)
    const oneHundredTwentyDaysAgo = new Date();
    oneHundredTwentyDaysAgo.setDate(oneHundredTwentyDaysAgo.getDate() - 120);

    const transactions = await prisma.transaction.findMany({
      where: {
        account: {
          entityId,
          entity: { tenantId },
        },
        date: { gte: oneHundredTwentyDaysAgo },
        deletedAt: null,
        amount: { lt: 0 }, // Expenses only (negative amounts)
      },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
      },
      orderBy: { date: 'desc' },
    });

    logger.info(
      { entityId, transactionCount: transactions.length },
      'Fetched transactions for missing charge analysis'
    );

    // 2. Group by merchant
    const merchantGroups = new Map<string, typeof transactions>();

    for (const txn of transactions) {
      const merchant = normalizeMerchant(txn.description);
      const group = merchantGroups.get(merchant) || [];
      group.push(txn);
      merchantGroups.set(merchant, group);
    }

    // 3. Find established recurring patterns (3+ occurrences, consistent amounts)
    const recurringCharges: RecurringCharge[] = [];
    const today = new Date();

    for (const [merchant, txns] of merchantGroups.entries()) {
      // Need at least 3 occurrences to establish pattern
      if (txns.length < 3) continue;

      // Check if amounts are consistent (within 10% tolerance)
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

      // Only track monthly-ish patterns (20-40 days between charges)
      if (avgDaysBetween < 20 || avgDaysBetween > 40) continue;

      // Calculate expected next occurrence
      const lastSeen = new Date(Math.max(...sortedDates));
      const expectedNextDate = new Date(lastSeen);
      expectedNextDate.setDate(expectedNextDate.getDate() + Math.round(avgDaysBetween));

      // Check if overdue (>5 days past expected date)
      const daysOverdue = Math.floor(
        (today.getTime() - expectedNextDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue > 5) {
        recurringCharges.push({
          merchant,
          amount: Math.round(avgAmount),
          occurrences: txns.length,
          lastSeen,
          avgDaysBetween,
          expectedNextDate,
          daysOverdue,
        });
      }
    }

    logger.info(
      { entityId, overdueChargesCount: recurringCharges.length },
      'Found overdue recurring charges'
    );

    if (recurringCharges.length === 0) {
      return insights;
    }

    // 4. Use Mistral to analyze each overdue charge
    const mistral = new MistralProvider(env.MISTRAL_API_KEY);
    const decisionLog = new AIDecisionLogService();

    for (const charge of recurringCharges) {
      try {
        const prompt = `Analyze this recurring charge pattern to determine if a payment is missing:

Merchant: ${charge.merchant}
Expected amount: $${(charge.amount / 100).toFixed(2)}
Last seen: ${charge.lastSeen.toISOString().split('T')[0]}
Expected next charge: ${charge.expectedNextDate.toISOString().split('T')[0]}
Days overdue: ${charge.daysOverdue}
Historical pattern: ${charge.occurrences} charges over ~${Math.round(charge.avgDaysBetween * charge.occurrences)} days

Is this likely a missing payment that needs investigation? Consider:
1. Could the payment be legitimately late/suspended?
2. Is the overdue period concerning (e.g., rent, utilities)?
3. What's the urgency level?

Provide: isMissing (boolean), confidence (0-100), urgency (critical/high/medium), explanation.`;

        const response = await mistral.chat(
          [{ role: 'user', content: prompt }],
          {
            model: 'mistral-large-latest',
            temperature: 0.2,
            maxTokens: 512,
            responseSchema: MissingChargeSchema,
            responseFormat: { type: 'json_object' },
          }
        );

        const analysis = MissingChargeSchema.parse(JSON.parse(response.content));

        // Log AI decision
        await decisionLog.logDecision({
          tenantId,
          entityId,
          decisionType: 'ANOMALY_DETECTION',
          input: prompt,
          modelVersion: response.model,
          confidence: analysis.confidence,
          extractedData: {
            merchant: charge.merchant,
            amount: charge.amount,
            daysOverdue: charge.daysOverdue,
            isMissing: analysis.isMissing,
          },
          routingResult: analysis.isMissing && analysis.confidence >= 60 ? 'ACCEPTED' : 'REJECTED',
          aiExplanation: analysis.explanation,
          processingTimeMs: 0,
          tokensUsed: response.usage?.totalTokens,
        });

        // Create insight if Mistral confirms it's likely missing
        if (analysis.isMissing && analysis.confidence >= 60) {
          insights.push({
            triggerId: `missing-charge-${charge.merchant.toLowerCase().replace(/\s+/g, '-')}`,
            title: `Missing recurring charge: ${charge.merchant}`,
            description: `${analysis.explanation}\n\n**Expected Charge:**\n- Merchant: ${charge.merchant}\n- Amount: $${(charge.amount / 100).toFixed(2)}\n- Last seen: ${charge.lastSeen.toISOString().split('T')[0]}\n- Expected: ${charge.expectedNextDate.toISOString().split('T')[0]}\n- Days overdue: ${charge.daysOverdue}\n\n**Action Required:**\nVerify if this payment was made via another method or if it's legitimately missing.`,
            type: 'overdue_alert',
            priority: analysis.urgency,
            impact: charge.amount,
            confidence: analysis.confidence,
            actionable: true,
            status: 'active',
            metadata: {
              merchant: charge.merchant,
              amount: charge.amount,
              lastSeen: charge.lastSeen.toISOString(),
              expectedDate: charge.expectedNextDate.toISOString(),
              daysOverdue: charge.daysOverdue,
              occurrences: charge.occurrences,
              urgency: analysis.urgency,
            },
          });

          logger.info(
            {
              entityId,
              merchant: charge.merchant,
              daysOverdue: charge.daysOverdue,
              confidence: analysis.confidence,
            },
            'Missing recurring charge detected'
          );
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          { entityId, merchant: charge.merchant, error: msg },
          'Failed to analyze missing charge'
        );
      }
    }

    return insights;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ entityId, error: msg }, 'Missing transactions analyzer failed');
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
