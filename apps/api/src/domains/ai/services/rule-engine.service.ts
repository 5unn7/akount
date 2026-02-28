import { prisma, Rule, RuleSource } from '@akount/db';
import { RuleConditions, RuleCondition, RuleAction, RuleService } from './rule.service';
import { logger } from '../../../lib/logger';
import { logger } from '../../../lib/logger';

/**
 * Transaction data for rule evaluation
 */
export interface TransactionData {
  id: string;
  description: string;
  amount: number; // integer cents
  accountId: string;
}

/**
 * Rule match result
 */
export interface RuleMatch {
  ruleId: string;
  ruleName: string;
  categoryId: string | null;
  glAccountId: string | null;
  confidence: number;
  matchReason: string;
  flagForReview: boolean;
}

/**
 * Rule with parsed JSON fields
 */
interface RuleWithParsed extends Omit<Rule, 'conditions' | 'action'> {
  conditions: RuleConditions;
  action: RuleAction;
}

/**
 * RuleEngineService
 *
 * Evaluates transaction data against active rules to determine auto-categorization.
 * Uses first-match-wins strategy with priority ordering (USER_MANUAL > AI_SUGGESTED > SYSTEM_DEFAULT).
 *
 * Key features:
 * - Tenant-isolated via entity membership
 * - Single-query batch optimization
 * - Async side-effect tracking (incrementExecution)
 * - Case-insensitive string matching
 * - Human-readable match reasons
 */
export class RuleEngineService {
  constructor(
    private readonly tenantId: string,
    private readonly ruleService: RuleService
  ) {}

  /**
   * Evaluate a single transaction against active rules
   *
   * Returns the first matching rule (first-match-wins).
   * Calls incrementExecution async on match.
   *
   * @param transaction - Transaction data to evaluate
   * @param entityId - Entity ID for rule scoping
   * @returns RuleMatch if found, null otherwise
   */
  async evaluateRules(
    transaction: TransactionData,
    entityId: string
  ): Promise<RuleMatch | null> {
    const rules = await this.loadActiveRules(entityId);

    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, transaction)) {
        // Async side effect - fire and forget
        this.ruleService
          .incrementExecution(rule.id, true)
          .catch((err) => logger.error({ err, ruleId: rule.id }, 'Failed to increment rule execution count'));

        return this.createRuleMatch(rule, transaction);
      }
    }

    return null;
  }

  /**
   * Evaluate multiple transactions against active rules (batch)
   *
   * Optimized: single DB query for rules, then in-memory evaluation.
   * Returns Map<transactionId, RuleMatch> for matched transactions only.
   *
   * @param transactions - Array of transaction data
   * @param entityId - Entity ID for rule scoping
   * @returns Map of transaction ID to RuleMatch
   */
  async evaluateRulesBatch(
    transactions: TransactionData[],
    entityId: string
  ): Promise<Map<string, RuleMatch>> {
    const rules = await this.loadActiveRules(entityId);
    const matches = new Map<string, RuleMatch>();
    const matchedRuleIds = new Set<string>();

    for (const transaction of transactions) {
      for (const rule of rules) {
        if (this.evaluateConditions(rule.conditions, transaction)) {
          matches.set(transaction.id, this.createRuleMatch(rule, transaction));
          matchedRuleIds.add(rule.id);
          break; // First-match-wins
        }
      }
    }

    // Batch increment execution for all matched rules
    if (matchedRuleIds.size > 0) {
      Promise.all(
        Array.from(matchedRuleIds).map((ruleId) =>
          this.ruleService.incrementExecution(ruleId, true)
        )
      ).catch((err) => logger.error({ err, ruleCount: matchedRuleIds.size }, 'Failed to batch increment execution counts'));
    }

    return matches;
  }

  /**
   * Load active rules for entity, sorted by priority
   *
   * Priority order:
   * 1. USER_MANUAL (highest priority)
   * 2. AI_SUGGESTED with userApprovedAt
   * 3. SYSTEM_DEFAULT (lowest priority)
   *
   * @private
   */
  private async loadActiveRules(entityId: string): Promise<RuleWithParsed[]> {
    const rules = await prisma.rule.findMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        conditions: true,
        action: true,
        source: true,
        userApprovedAt: true,
        entityId: true,
        aiConfidence: true,
        aiModelVersion: true,
        isActive: true,
        executionCount: true,
        successRate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { createdAt: 'asc' }, // Earlier rules evaluated first
      ],
    });

    // Sort by priority in memory
    const priorityMap: Record<RuleSource, number> = {
      USER_MANUAL: 1,
      AI_SUGGESTED: 2,
      SYSTEM_DEFAULT: 3,
    };

    const sorted = rules.sort((a, b) => {
      const priorityA = priorityMap[a.source];
      const priorityB = priorityMap[b.source];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Same source: earlier created first
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Parse JSON fields
    return sorted.map((rule) => ({
      ...rule,
      conditions: rule.conditions as unknown as RuleConditions,
      action: rule.action as unknown as RuleAction,
    }));
  }

  /**
   * Evaluate conditions against transaction data
   *
   * @private
   */
  private evaluateConditions(
    conditions: RuleConditions,
    transaction: TransactionData
  ): boolean {
    const results = conditions.conditions.map((condition) =>
      this.evaluateCondition(condition, transaction)
    );

    return conditions.operator === 'AND'
      ? results.every((r) => r)
      : results.some((r) => r);
  }

  /**
   * Evaluate a single condition
   *
   * @private
   */
  private evaluateCondition(
    condition: RuleCondition,
    transaction: TransactionData
  ): boolean {
    const { field, op, value } = condition;

    // Get field value from transaction
    const fieldValue = transaction[field as keyof TransactionData];

    // Handle missing or null values
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    switch (op) {
      case 'contains':
        // Case-insensitive substring match
        return String(fieldValue)
          .toLowerCase()
          .includes(String(value).toLowerCase());

      case 'eq':
        // Exact match
        return fieldValue === value;

      case 'gt':
        // Greater than (numeric)
        return typeof fieldValue === 'number' && fieldValue > Number(value);

      case 'gte':
        // Greater than or equal (numeric)
        return typeof fieldValue === 'number' && fieldValue >= Number(value);

      case 'lt':
        // Less than (numeric)
        return typeof fieldValue === 'number' && fieldValue < Number(value);

      case 'lte':
        // Less than or equal (numeric)
        return typeof fieldValue === 'number' && fieldValue <= Number(value);

      default:
        return false;
    }
  }

  /**
   * Create a RuleMatch result from a matched rule
   *
   * @private
   */
  private createRuleMatch(
    rule: RuleWithParsed,
    transaction: TransactionData
  ): RuleMatch {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      categoryId: rule.action.setCategoryId ?? null,
      glAccountId: rule.action.setGLAccountId ?? null,
      confidence: this.getConfidence(rule),
      matchReason: this.generateMatchReason(rule, transaction),
      flagForReview: rule.action.flagForReview ?? false,
    };
  }

  /**
   * Get confidence score based on rule source
   *
   * @private
   */
  private getConfidence(rule: RuleWithParsed): number {
    switch (rule.source) {
      case 'USER_MANUAL':
        return 95;
      case 'AI_SUGGESTED':
        return rule.userApprovedAt ? 90 : 85;
      case 'SYSTEM_DEFAULT':
        return 85;
      default:
        return 75;
    }
  }

  /**
   * Generate human-readable match reason
   *
   * Example: "Description contains 'starbucks' AND amount < $50.00"
   *
   * @private
   */
  private generateMatchReason(
    rule: RuleWithParsed,
    transaction: TransactionData
  ): string {
    const parts = rule.conditions.conditions.map((condition) => {
      const field = condition.field;
      const op = this.operatorToText(condition.op);
      const value = this.formatValue(condition);

      return `${field} ${op} ${value}`;
    });

    return parts.join(` ${rule.conditions.operator} `);
  }

  /**
   * Convert operator to human-readable text
   *
   * @private
   */
  private operatorToText(op: string): string {
    switch (op) {
      case 'contains':
        return 'contains';
      case 'eq':
        return 'equals';
      case 'gt':
        return '>';
      case 'gte':
        return '>=';
      case 'lt':
        return '<';
      case 'lte':
        return '<=';
      default:
        return op;
    }
  }

  /**
   * Format condition value for display
   *
   * @private
   */
  private formatValue(condition: RuleCondition): string {
    if (condition.field === 'amount' && typeof condition.value === 'number') {
      // Convert integer cents to dollar amount
      return `$${(condition.value / 100).toFixed(2)}`;
    }

    // String values wrapped in quotes
    if (typeof condition.value === 'string') {
      return `'${condition.value}'`;
    }

    return String(condition.value);
  }
}
