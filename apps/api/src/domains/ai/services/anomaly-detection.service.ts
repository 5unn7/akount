import { logger } from '../../../lib/logger';
import { InsightService } from './insight.service';
import { AIActionService } from './ai-action.service';
import type { InsightResult } from '../types/insight.types';

// Analyzer imports
import { analyzeSubscriptionCreep } from './analyzers/subscription-creep.analyzer';
import { analyzeCashFlowDanger } from './analyzers/cash-flow-danger.analyzer';
import { analyzeMissingTransactions } from './analyzers/missing-transactions.analyzer';

/**
 * Anomaly Detection Service (DEV-252, C7)
 *
 * Mistral-powered anomaly detection service that identifies:
 * 1. Subscription creep — New recurring charges
 * 2. Cash flow danger — Projected expenses > revenue
 * 3. Missing transactions — Expected recurring charges not seen
 *
 * **Integration:**
 * - Creates Insight records via InsightService
 * - Runs via BullMQ queue (daily scheduled)
 * - Uses Mistral for pattern analysis and explanation generation
 * - Logs all decisions to AIDecisionLog
 *
 * **Architecture:**
 * - Pure analyzers: receive shared transaction data
 * - Each analyzer returns InsightResult[]
 * - Service upserts insights and creates AIActions for critical/high priority
 *
 * @module anomaly-detection
 */

export interface AnomalyDetectionSummary {
  generated: number;
  updated: number;
  errors: string[];
  anomalies: {
    subscriptionCreep: number;
    cashFlowDanger: number;
    missingTransactions: number;
  };
}

export type AnomalyType = 'subscription_creep' | 'cash_flow_danger' | 'missing_transactions';

interface AnalyzerEntry {
  type: AnomalyType;
  fn: (entityId: string, tenantId: string) => Promise<InsightResult[]>;
}

/** Registry of anomaly analyzers */
const ANALYZER_REGISTRY: AnalyzerEntry[] = [
  { type: 'subscription_creep', fn: analyzeSubscriptionCreep },
  { type: 'cash_flow_danger', fn: analyzeCashFlowDanger },
  { type: 'missing_transactions', fn: analyzeMissingTransactions },
];

export class AnomalyDetectionService {
  private insightService: InsightService;
  private actionService: AIActionService;

  constructor(
    private readonly tenantId: string,
    private readonly userId: string,
    private readonly entityId: string
  ) {
    this.insightService = new InsightService(tenantId, userId);
    this.actionService = new AIActionService(tenantId, entityId);
  }

  /**
   * Run all anomaly analyzers (or filtered by types).
   *
   * @param types - Optional filter for specific anomaly types
   * @returns Summary of anomaly detection results
   */
  async detectAnomalies(types?: AnomalyType[]): Promise<AnomalyDetectionSummary> {
    const summary: AnomalyDetectionSummary = {
      generated: 0,
      updated: 0,
      errors: [],
      anomalies: {
        subscriptionCreep: 0,
        cashFlowDanger: 0,
        missingTransactions: 0,
      },
    };

    logger.info(
      { entityId: this.entityId, types: types || 'all' },
      'Starting anomaly detection'
    );

    // Select analyzers (filter by types if provided)
    const analyzers = types
      ? ANALYZER_REGISTRY.filter((a) => types.includes(a.type))
      : ANALYZER_REGISTRY;

    // Run each analyzer with error isolation
    for (const analyzer of analyzers) {
      try {
        const results = await analyzer.fn(this.entityId, this.tenantId);

        logger.info(
          { entityId: this.entityId, analyzer: analyzer.type, resultCount: results.length },
          'Anomaly analyzer completed'
        );

        // Update anomaly counts
        if (analyzer.type === 'subscription_creep') {
          summary.anomalies.subscriptionCreep = results.length;
        } else if (analyzer.type === 'cash_flow_danger') {
          summary.anomalies.cashFlowDanger = results.length;
        } else if (analyzer.type === 'missing_transactions') {
          summary.anomalies.missingTransactions = results.length;
        }

        // Upsert each result
        for (const result of results) {
          try {
            await this.insightService.upsertInsight(this.entityId, result);
            summary.generated++;

            // Create AIAction for critical/high + actionable insights
            if (
              result.actionable &&
              (result.priority === 'critical' || result.priority === 'high')
            ) {
              await this.createAlertAction(result);
            }
          } catch (upsertError) {
            const msg = upsertError instanceof Error ? upsertError.message : 'Unknown error';
            logger.warn(
              { entityId: this.entityId, triggerId: result.triggerId, error: msg },
              'Failed to upsert anomaly insight'
            );
            summary.errors.push(`Upsert ${result.triggerId}: ${msg}`);
          }
        }
      } catch (analyzerError) {
        const msg = analyzerError instanceof Error ? analyzerError.message : 'Unknown error';
        logger.error(
          { entityId: this.entityId, analyzer: analyzer.type, error: msg },
          'Anomaly analyzer failed'
        );
        summary.errors.push(`${analyzer.type}: ${msg}`);
      }
    }

    logger.info(
      {
        entityId: this.entityId,
        generated: summary.generated,
        errors: summary.errors.length,
        anomalies: summary.anomalies,
      },
      'Anomaly detection complete'
    );

    return summary;
  }

  /**
   * Create AIAction for critical/high priority actionable insights.
   */
  private async createAlertAction(insight: InsightResult): Promise<void> {
    try {
      await this.actionService.createAction({
        entityId: this.entityId,
        type: 'ALERT',
        title: insight.title,
        description: insight.description,
        priority: insight.priority === 'critical' ? 'CRITICAL' : 'HIGH',
        confidence: insight.confidence ? Math.round(insight.confidence) : undefined,
        payload: {
          insightId: insight.triggerId,
          type: insight.type,
        },
        metadata: {
          source: 'anomaly_detection',
          impact: insight.impact,
        },
      });

      logger.info(
        {
          entityId: this.entityId,
          triggerId: insight.triggerId,
          priority: insight.priority,
        },
        'Created AIAction for anomaly insight'
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { entityId: this.entityId, triggerId: insight.triggerId, error: msg },
        'Failed to create AIAction for anomaly insight'
      );
    }
  }
}
