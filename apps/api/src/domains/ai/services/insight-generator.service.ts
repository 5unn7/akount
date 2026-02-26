// AI Auto-Bookkeeper Phase 3: Insight Generator Orchestrator
// Fetches shared data once, fans out to analyzers, upserts results, creates AIActions for critical insights
import { logger } from '../../../lib/logger.js';
import { InsightService } from './insight.service.js';
import { AIActionService, type CreateActionInput } from './ai-action.service.js';
import { DashboardService } from '../../overview/services/dashboard.service.js';
import type { InsightResult, InsightType } from '../types/insight.types.js';

// Analyzer imports (created in Tasks 6-8)
import { analyzeCashFlow } from './analyzers/cash-flow.analyzer.js';
import { analyzeOverdue } from './analyzers/overdue.analyzer.js';
import { analyzeSpending } from './analyzers/spending.analyzer.js';
import { analyzeDuplicates } from './analyzers/duplicate.analyzer.js';
import { analyzeRevenue } from './analyzers/revenue.analyzer.js';
import { analyzeReconciliation } from './analyzers/reconciliation.analyzer.js';

export interface GenerationSummary {
  generated: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/** Shared data fetched once and passed to pure analyzers */
export interface SharedAnalysisData {
  metrics: Awaited<ReturnType<DashboardService['getMetrics']>>;
  cashFlowProjection: Awaited<ReturnType<DashboardService['getCashFlowProjection']>>;
  expenseBreakdown: Awaited<ReturnType<DashboardService['getExpenseBreakdown']>>;
  actionItems: Awaited<ReturnType<DashboardService['getActionItems']>>;
}

/** Analyzer function signature for pure analyzers */
type PureAnalyzer = (data: SharedAnalysisData, entityId: string) => InsightResult[];

/** Analyzer function signature for DB-access analyzers */
type DbAnalyzer = (entityId: string, tenantId: string) => Promise<InsightResult[]>;

interface AnalyzerEntry {
  type: InsightType;
  kind: 'pure' | 'db';
  fn: PureAnalyzer | DbAnalyzer;
}

/** Registry of all analyzers */
const ANALYZER_REGISTRY: AnalyzerEntry[] = [
  { type: 'cash_flow_warning', kind: 'pure', fn: analyzeCashFlow },
  { type: 'overdue_alert', kind: 'pure', fn: analyzeOverdue },
  { type: 'spending_anomaly', kind: 'pure', fn: analyzeSpending },
  { type: 'duplicate_expense', kind: 'pure', fn: analyzeDuplicates as PureAnalyzer },
  { type: 'revenue_trend', kind: 'db', fn: analyzeRevenue },
  { type: 'reconciliation_gap', kind: 'db', fn: analyzeReconciliation },
];

/**
 * InsightGeneratorService
 *
 * Orchestrates insight generation: fetches shared data once,
 * fans out to selected analyzers, upserts results, and creates
 * AIActions for critical/high actionable insights.
 */
export class InsightGeneratorService {
  private insightService: InsightService;
  private actionService: AIActionService;
  private dashboardService: DashboardService;

  constructor(
    private readonly tenantId: string,
    private readonly userId: string,
    private readonly entityId: string
  ) {
    this.insightService = new InsightService(tenantId, userId);
    this.actionService = new AIActionService(tenantId, entityId);
    this.dashboardService = new DashboardService(tenantId);
  }

  /**
   * Generate all insights (or filtered by type).
   * 1. Fetch shared data once
   * 2. Fan out to selected analyzers
   * 3. Upsert results via InsightService
   * 4. Create AIActions for critical/high actionable insights
   */
  async generateAll(types?: InsightType[]): Promise<GenerationSummary> {
    const summary: GenerationSummary = {
      generated: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    // 1. Fetch shared data once (used by pure analyzers)
    let sharedData: SharedAnalysisData;
    try {
      sharedData = await this.fetchSharedData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ entityId: this.entityId, error: message }, 'Failed to fetch shared data for insight generation');
      summary.errors.push(`Shared data fetch failed: ${message}`);
      return summary;
    }

    // 2. Select analyzers (filter by types if provided)
    const analyzers = types
      ? ANALYZER_REGISTRY.filter((a) => types.includes(a.type))
      : ANALYZER_REGISTRY;

    // 3. Run each analyzer with error isolation
    for (const analyzer of analyzers) {
      try {
        const results = await this.runAnalyzer(analyzer, sharedData);

        logger.info(
          { entityId: this.entityId, analyzer: analyzer.type, resultCount: results.length },
          'Analyzer completed'
        );

        // 4. Upsert each result
        for (const result of results) {
          try {
            await this.insightService.upsertInsight(this.entityId, result);
            summary.generated++;

            // 5. Create AIAction for critical/high + actionable insights
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
              'Failed to upsert insight'
            );
            summary.errors.push(`Upsert ${result.triggerId}: ${msg}`);
          }
        }
      } catch (analyzerError) {
        const msg = analyzerError instanceof Error ? analyzerError.message : 'Unknown error';
        logger.error(
          { entityId: this.entityId, analyzer: analyzer.type, error: msg },
          'Analyzer failed'
        );
        summary.errors.push(`${analyzer.type}: ${msg}`);
      }
    }

    logger.info(
      {
        entityId: this.entityId,
        generated: summary.generated,
        errors: summary.errors.length,
      },
      'Insight generation complete'
    );

    return summary;
  }

  /**
   * Import-triggered generation: runs only spending_anomaly + duplicate_expense
   * analyzers with the imported transaction context.
   */
  async generateForImport(transactionIds: string[]): Promise<GenerationSummary> {
    const importTypes: InsightType[] = ['spending_anomaly', 'duplicate_expense'];

    logger.info(
      { entityId: this.entityId, transactionCount: transactionIds.length },
      'Running import-triggered insight generation'
    );

    // Run only the spending and duplicate analyzers
    return this.generateAll(importTypes);
  }

  /** Fetch shared data once for all pure analyzers */
  private async fetchSharedData(): Promise<SharedAnalysisData> {
    const [metrics, cashFlowProjection, expenseBreakdown, actionItems] = await Promise.all([
      this.dashboardService.getMetrics(this.entityId),
      this.dashboardService.getCashFlowProjection(this.entityId),
      this.dashboardService.getExpenseBreakdown(this.entityId),
      this.dashboardService.getActionItems(this.entityId),
    ]);

    return { metrics, cashFlowProjection, expenseBreakdown, actionItems };
  }

  /** Run a single analyzer (pure or DB-access) */
  private async runAnalyzer(
    analyzer: AnalyzerEntry,
    sharedData: SharedAnalysisData
  ): Promise<InsightResult[]> {
    if (analyzer.kind === 'pure') {
      const fn = analyzer.fn as PureAnalyzer;
      return fn(sharedData, this.entityId);
    }

    // DB-access analyzers receive entityId and tenantId
    const fn = analyzer.fn as DbAnalyzer;
    return fn(this.entityId, this.tenantId);
  }

  /** Create an AIAction (ALERT type) for a critical/high actionable insight */
  private async createAlertAction(result: InsightResult): Promise<void> {
    try {
      const input: CreateActionInput = {
        entityId: this.entityId,
        type: 'ALERT',
        title: result.title,
        description: result.description,
        confidence: result.confidence ? Math.round(result.confidence * 100) : undefined,
        priority: this.mapPriority(result.priority),
        payload: {
          insightType: result.type,
          triggerId: result.triggerId,
          metadata: result.metadata ?? {},
        },
      };

      await this.actionService.createAction(input);
    } catch (error) {
      // Non-blocking: log but don't fail insight generation
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(
        { entityId: this.entityId, triggerId: result.triggerId, error: msg },
        'Failed to create AIAction for insight'
      );
    }
  }

  /** Map insight priority to AIAction priority */
  private mapPriority(priority: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const map: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      critical: 'CRITICAL',
    };
    return map[priority] ?? 'MEDIUM';
  }
}
