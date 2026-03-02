import { prisma } from '@akount/db';
import { logger } from '../../../../lib/logger';
import type { InsightResult } from '../../types/insight.types';
import { MistralProvider } from '../providers/mistral.provider';
import { env } from '../../../../lib/env';
import { AIDecisionLogService } from '../ai-decision-log.service';
import { z } from 'zod';

/**
 * Cash Flow Danger Analyzer (DEV-252, C7.2)
 *
 * Detects when projected expenses exceed projected revenue in the next 30 days.
 *
 * **Detection Logic:**
 * 1. Calculate historical average daily revenue (last 90 days)
 * 2. Calculate historical average daily expenses (last 90 days)
 * 3. Query upcoming bills/invoices (next 30 days)
 * 4. Project 30-day revenue: avg_daily_revenue * 30
 * 5. Project 30-day expenses: avg_daily_expenses * 30 + upcoming_bills
 * 6. If projected_expenses > projected_revenue: DANGER
 * 7. Use Mistral to generate actionable recommendations
 *
 * **Example Anomaly:**
 * - Projected revenue (30d): $8,500
 * - Projected expenses (30d): $12,300
 * - Deficit: -$3,800
 * - Confidence: 92%
 * - Insight: "Cash flow deficit projected: $3,800 shortfall in next 30 days"
 *
 * @module cash-flow-danger-analyzer
 */

interface CashFlowProjection {
  projectedRevenue: number; // Integer cents
  projectedExpenses: number; // Integer cents
  deficit: number; // Integer cents (negative if danger)
  upcomingBills: number; // Integer cents
  avgDailyRevenue: number; // Integer cents
  avgDailyExpenses: number; // Integer cents
}

const CashFlowAnalysisSchema = z.object({
  isDangerous: z.boolean(),
  confidence: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
  severity: z.enum(['critical', 'high', 'medium']),
});

export async function analyzeCashFlowDanger(
  entityId: string,
  tenantId: string
): Promise<InsightResult[]> {
  const insights: InsightResult[] = [];

  logger.info({ entityId }, 'Running cash flow danger analyzer');

  try {
    // 1. Calculate historical averages (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const transactions = await prisma.transaction.findMany({
      where: {
        account: {
          entityId,
          entity: { tenantId },
        },
        date: { gte: ninetyDaysAgo },
        deletedAt: null,
      },
      select: {
        amount: true,
        date: true,
      },
    });

    logger.info(
      { entityId, transactionCount: transactions.length },
      'Fetched transactions for cash flow analysis'
    );

    // Calculate daily averages
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const txn of transactions) {
      if (txn.amount > 0) {
        totalRevenue += txn.amount;
      } else {
        totalExpenses += Math.abs(txn.amount);
      }
    }

    const avgDailyRevenue = Math.round(totalRevenue / 90);
    const avgDailyExpenses = Math.round(totalExpenses / 90);

    // 2. Query upcoming bills (next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingBills = await prisma.bill.findMany({
      where: {
        entityId,
        entity: { tenantId },
        dueDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        status: { in: ['PENDING', 'DRAFT'] },
        deletedAt: null,
      },
      select: {
        total: true,
        dueDate: true,
      },
    });

    const totalUpcomingBills = upcomingBills.reduce((sum, bill) => sum + bill.total, 0);

    logger.info(
      { entityId, upcomingBillsCount: upcomingBills.length, totalUpcomingBills },
      'Queried upcoming bills'
    );

    // 3. Project 30-day cash flow
    const projectedRevenue = avgDailyRevenue * 30;
    const projectedExpenses = avgDailyExpenses * 30 + totalUpcomingBills;
    const deficit = projectedRevenue - projectedExpenses;

    const projection: CashFlowProjection = {
      projectedRevenue,
      projectedExpenses,
      deficit,
      upcomingBills: totalUpcomingBills,
      avgDailyRevenue,
      avgDailyExpenses,
    };

    logger.info(
      {
        entityId,
        projectedRevenue,
        projectedExpenses,
        deficit,
      },
      'Cash flow projection calculated'
    );

    // 4. Check if deficit exists
    if (deficit >= 0) {
      logger.info({ entityId, surplus: deficit }, 'Cash flow healthy, no danger detected');
      return insights;
    }

    // 5. Use Mistral to analyze severity and generate recommendations
    const mistral = new MistralProvider(env.MISTRAL_API_KEY);
    const decisionLog = new AIDecisionLogService();

    const prompt = `Analyze this cash flow projection and provide recommendations:

Projected Revenue (30 days): $${(projectedRevenue / 100).toFixed(2)}
Projected Expenses (30 days): $${(projectedExpenses / 100).toFixed(2)}
Deficit: $${(Math.abs(deficit) / 100).toFixed(2)}

Upcoming bills due: $${(totalUpcomingBills / 100).toFixed(2)}
Average daily revenue: $${(avgDailyRevenue / 100).toFixed(2)}
Average daily expenses: $${(avgDailyExpenses / 100).toFixed(2)}

Is this a dangerous cash flow situation? Provide:
1. isDangerous (boolean)
2. confidence (0-100)
3. severity (critical/high/medium)
4. 2-3 actionable recommendations to address the deficit`;

    const response = await mistral.chat(
      [{ role: 'user', content: prompt }],
      {
        model: 'mistral-large-latest',
        temperature: 0.2,
        maxTokens: 1024,
        responseSchema: CashFlowAnalysisSchema,
        responseFormat: { type: 'json_object' },
      }
    );

    const analysis = CashFlowAnalysisSchema.parse(JSON.parse(response.content));

    // Log AI decision
    await decisionLog.logDecision({
      tenantId,
      entityId,
      decisionType: 'ANOMALY_DETECTION',
      input: prompt,
      modelVersion: response.model,
      confidence: analysis.confidence,
      extractedData: {
        deficit,
        projectedRevenue,
        projectedExpenses,
        isDangerous: analysis.isDangerous,
        severity: analysis.severity,
      },
      routingResult: analysis.isDangerous ? 'ACCEPTED' : 'REJECTED',
      aiExplanation: analysis.recommendations.join(' '),
      processingTimeMs: 0,
      tokensUsed: response.usage?.totalTokens,
    });

    // Create insight if Mistral confirms it's dangerous
    if (analysis.isDangerous) {
      insights.push({
        triggerId: 'cash-flow-danger-30d',
        title: 'Cash flow deficit projected',
        description: `Your expenses are projected to exceed revenue by $${(Math.abs(deficit) / 100).toFixed(2)} in the next 30 days.\n\n**Projected:**\n- Revenue: $${(projectedRevenue / 100).toFixed(2)}\n- Expenses: $${(projectedExpenses / 100).toFixed(2)}\n- Deficit: $${(Math.abs(deficit) / 100).toFixed(2)}\n\n**Recommendations:**\n${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
        type: 'cash_flow_warning',
        priority: analysis.severity,
        impact: Math.abs(deficit),
        confidence: analysis.confidence,
        actionable: true,
        status: 'active',
        metadata: {
          projectedRevenue,
          projectedExpenses,
          deficit,
          upcomingBills: totalUpcomingBills,
          avgDailyRevenue,
          avgDailyExpenses,
          severity: analysis.severity,
          recommendations: analysis.recommendations,
        },
        deadline: thirtyDaysFromNow,
      });

      logger.info(
        {
          entityId,
          deficit,
          severity: analysis.severity,
          confidence: analysis.confidence,
        },
        'Cash flow danger detected'
      );
    }

    return insights;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ entityId, error: msg }, 'Cash flow danger analyzer failed');
    throw error;
  }
}
