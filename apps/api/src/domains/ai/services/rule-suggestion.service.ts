import { prisma, Prisma, RuleSuggestionStatus, RuleSource } from '@akount/db';
import { AIActionService, type CreateActionInput } from './ai-action.service';
import { RuleService, type RuleConditions, type RuleAction } from './rule.service';
import { createAuditLog } from '../../../lib/audit';
import { logger } from '../../../lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetectedPattern {
  keyword: string;
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  patternStrength: number;
  exampleTransactions: Array<{ id: string; description: string; amount: number }>;
  suggestedConditions: RuleConditions;
  suggestedAction: RuleAction;
}

export interface RuleSuggestionWithDetails {
  id: string;
  entityId: string;
  triggeredBy: string;
  suggestedRule: {
    name: string;
    conditions: RuleConditions;
    action: RuleAction;
    patternSummary: string;
    exampleTransactions: Array<{ id: string; description: string; amount: number }>;
    estimatedImpact: number;
  };
  aiReasoning: string;
  aiConfidence: number;
  aiModelVersion: string;
  status: RuleSuggestionStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

interface ListSuggestionsParams {
  entityId: string;
  status?: RuleSuggestionStatus;
  cursor?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Rule Suggestion Service
 *
 * Manages the lifecycle of AI-generated rule suggestions:
 * - Creates suggestions from detected patterns (with linked AIAction)
 * - Lists suggestions with cursor pagination
 * - Approves suggestions (creates active Rule)
 * - Rejects suggestions (with optional reason)
 * - Expires stale suggestions (30 days)
 */
export class RuleSuggestionService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  /**
   * Create a rule suggestion from a detected pattern.
   * Also creates a linked AIAction (type: RULE_SUGGESTION) for the Action Feed.
   */
  async createSuggestion(
    pattern: DetectedPattern,
    entityId: string
  ): Promise<{ suggestionId: string; actionId: string | null }> {
    const suggestedRule = {
      name: `Auto: ${pattern.categoryName} (${pattern.keyword})`,
      conditions: pattern.suggestedConditions,
      action: pattern.suggestedAction,
      patternSummary: `${pattern.transactionCount} transactions matching "${pattern.keyword}" → ${pattern.categoryName}`,
      exampleTransactions: pattern.exampleTransactions.slice(0, 5),
      estimatedImpact: pattern.transactionCount,
    };

    const aiReasoning = `Detected ${pattern.transactionCount} transactions containing "${pattern.keyword}" ` +
      `categorized as "${pattern.categoryName}" with ${Math.round(pattern.patternStrength * 100)}% consistency. ` +
      `Creating a rule would auto-categorize future matching transactions.`;

    // Create the RuleSuggestion record
    const suggestion = await prisma.ruleSuggestion.create({
      data: {
        entityId,
        triggeredBy: this.userId,
        suggestedRule: suggestedRule as unknown as Prisma.InputJsonValue,
        aiReasoning,
        aiConfidence: Math.round(pattern.patternStrength * 100),
        aiModelVersion: 'pattern-detection-v1',
        status: 'PENDING',
      },
      select: { id: true },
    });

    // Create linked AIAction (non-critical — if this fails, suggestion still exists)
    let actionId: string | null = null;
    try {
      const actionService = new AIActionService(this.tenantId, entityId);
      const actionInput: CreateActionInput = {
        entityId,
        type: 'RULE_SUGGESTION',
        title: `Rule suggestion: ${pattern.categoryName}`,
        description: aiReasoning,
        confidence: Math.round(pattern.patternStrength * 100),
        priority: pattern.transactionCount >= 10 ? 'HIGH' : 'MEDIUM',
        payload: {
          ruleSuggestionId: suggestion.id,
          suggestedRule,
          patternSummary: suggestedRule.patternSummary,
          exampleTransactions: suggestedRule.exampleTransactions,
          estimatedImpact: suggestedRule.estimatedImpact,
        } as unknown as Prisma.InputJsonValue,
        aiProvider: 'pattern-detection',
        aiModel: 'pattern-detection-v1',
      };

      const action = await actionService.createAction(actionInput);
      actionId = action.id;
    } catch (error) {
      // Non-critical — log but don't fail
      logger.warn(
        { err: error, suggestionId: suggestion.id },
        'Failed to create AIAction for rule suggestion'
      );
    }

    logger.info(
      { suggestionId: suggestion.id, actionId, keyword: pattern.keyword, entityId },
      'Created rule suggestion from detected pattern'
    );

    return { suggestionId: suggestion.id, actionId };
  }

  /**
   * List rule suggestions with optional status filter and cursor pagination.
   */
  async listSuggestions(params: ListSuggestionsParams): Promise<{
    suggestions: RuleSuggestionWithDetails[];
    nextCursor: string | undefined;
    hasMore: boolean;
  }> {
    const limit = Math.min(params.limit ?? 20, 100);

    const where: Prisma.RuleSuggestionWhereInput = {
      entityId: params.entityId,
      entity: { tenantId: this.tenantId },
      ...(params.status && { status: params.status }),
    };

    const suggestions = await prisma.ruleSuggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
    });

    const hasMore = suggestions.length > limit;
    const items = hasMore ? suggestions.slice(0, limit) : suggestions;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return {
      suggestions: items.map((s) => ({
        id: s.id,
        entityId: s.entityId,
        triggeredBy: s.triggeredBy,
        suggestedRule: s.suggestedRule as unknown as RuleSuggestionWithDetails['suggestedRule'],
        aiReasoning: s.aiReasoning,
        aiConfidence: s.aiConfidence,
        aiModelVersion: s.aiModelVersion,
        status: s.status,
        createdAt: s.createdAt,
        reviewedAt: s.reviewedAt,
        reviewedBy: s.reviewedBy,
      })),
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get a single suggestion by ID.
   */
  async getSuggestion(id: string): Promise<RuleSuggestionWithDetails | null> {
    const s = await prisma.ruleSuggestion.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
    });

    if (!s) return null;

    return {
      id: s.id,
      entityId: s.entityId,
      triggeredBy: s.triggeredBy,
      suggestedRule: s.suggestedRule as unknown as RuleSuggestionWithDetails['suggestedRule'],
      aiReasoning: s.aiReasoning,
      aiConfidence: s.aiConfidence,
      aiModelVersion: s.aiModelVersion,
      status: s.status,
      createdAt: s.createdAt,
      reviewedAt: s.reviewedAt,
      reviewedBy: s.reviewedBy,
    };
  }

  /**
   * Approve a suggestion: creates an active Rule from the suggested data.
   *
   * Uses WHERE status=PENDING to prevent concurrent double-approval.
   */
  async approveSuggestion(id: string): Promise<{ ruleId: string }> {
    // Atomically update status to APPROVED (concurrent-safe)
    const suggestion = await prisma.ruleSuggestion.updateMany({
      where: {
        id,
        entity: { tenantId: this.tenantId },
        status: 'PENDING',
      },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: this.userId,
      },
    });

    if (suggestion.count === 0) {
      throw new Error('Suggestion not found, already reviewed, or access denied');
    }

    // Re-fetch to get the suggestedRule JSON
    const approved = await prisma.ruleSuggestion.findUniqueOrThrow({
      where: { id },
      select: { entityId: true, suggestedRule: true },
    });

    const suggestedRule = approved.suggestedRule as unknown as RuleSuggestionWithDetails['suggestedRule'];

    // Create the actual Rule
    const ruleService = new RuleService(this.tenantId, this.userId);
    const rule = await ruleService.createRule({
      entityId: approved.entityId,
      name: suggestedRule.name,
      conditions: suggestedRule.conditions,
      action: suggestedRule.action,
      source: 'AI_SUGGESTED' as RuleSource,
      aiConfidence: suggestion.count > 0 ? 85 : undefined,
      aiModelVersion: 'pattern-detection-v1',
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: approved.entityId,
      model: 'RuleSuggestion',
      recordId: id,
      action: 'UPDATE',
      after: { status: 'APPROVED', ruleId: rule.id },
    });

    logger.info(
      { suggestionId: id, ruleId: rule.id },
      'Approved rule suggestion — created active rule'
    );

    return { ruleId: rule.id };
  }

  /**
   * Reject a suggestion with an optional reason.
   */
  async rejectSuggestion(id: string, reason?: string): Promise<void> {
    const result = await prisma.ruleSuggestion.updateMany({
      where: {
        id,
        entity: { tenantId: this.tenantId },
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: this.userId,
      },
    });

    if (result.count === 0) {
      throw new Error('Suggestion not found, already reviewed, or access denied');
    }

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      model: 'RuleSuggestion',
      recordId: id,
      action: 'UPDATE',
      after: { status: 'REJECTED', ...(reason && { reason }) },
    });

    logger.info({ suggestionId: id, reason }, 'Rejected rule suggestion');
  }

  /**
   * Expire stale PENDING suggestions (older than 30 days).
   */
  async expireStaleSuggestions(entityId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.ruleSuggestion.updateMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        status: 'PENDING',
        createdAt: { lt: thirtyDaysAgo },
      },
      data: {
        status: 'EXPIRED',
        reviewedAt: new Date(),
      },
    });

    if (result.count > 0) {
      logger.info(
        { entityId, expiredCount: result.count },
        'Expired stale rule suggestions'
      );
    }

    return result.count;
  }
}
