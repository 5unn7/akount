import { prisma, Prisma, RuleSource } from '@akount/db';
import { z } from 'zod';
import { createAuditLog } from '../../../lib/audit';

/**
 * Condition field allowlist (security: no arbitrary field access)
 */
const ALLOWED_FIELDS = ['description', 'amount', 'accountId'] as const;
type AllowedField = typeof ALLOWED_FIELDS[number];

/**
 * Operator allowlist (security amendment: no regex support)
 */
const ALLOWED_OPERATORS = ['contains', 'eq', 'gt', 'lt', 'gte', 'lte'] as const;
type AllowedOperator = typeof ALLOWED_OPERATORS[number];

/**
 * Single rule condition
 */
export interface RuleCondition {
  field: AllowedField;
  op: AllowedOperator;
  value: string | number;
}

/**
 * Rule conditions structure (AND/OR logic)
 */
export interface RuleConditions {
  operator: 'AND' | 'OR';
  conditions: RuleCondition[];
}

/**
 * Rule action structure
 */
export interface RuleAction {
  setCategoryId?: string;
  setGLAccountId?: string;
  flagForReview?: boolean;
}

/**
 * Zod schema for condition validation
 */
const RuleConditionSchema = z.object({
  field: z.enum(ALLOWED_FIELDS),
  op: z.enum(ALLOWED_OPERATORS),
  value: z.union([z.string(), z.number()]),
});

const RuleConditionsSchema = z.object({
  operator: z.enum(['AND', 'OR']),
  conditions: z.array(RuleConditionSchema).min(1, 'At least one condition required'),
});

/**
 * Zod schema for action validation
 */
const RuleActionSchema = z.object({
  setCategoryId: z.string().optional(),
  setGLAccountId: z.string().optional(),
  flagForReview: z.boolean().optional(),
}).refine(
  (data) => data.setCategoryId || data.setGLAccountId || data.flagForReview,
  { message: 'At least one action field must be set' }
);

export interface CreateRuleInput {
  entityId: string;
  name: string;
  conditions: unknown; // Validated via validateConditions
  action: unknown; // Validated via validateAction
  source: RuleSource;
  aiConfidence?: number;
  aiModelVersion?: string;
  categoryId?: string; // For FK validation
  glAccountId?: string; // For FK validation
}

export interface UpdateRuleInput {
  name?: string;
  conditions?: unknown;
  action?: unknown;
  isActive?: boolean;
  categoryId?: string;
  glAccountId?: string;
}

export interface ListRulesParams {
  entityId: string;
  isActive?: boolean;
  source?: RuleSource;
  search?: string;
  take?: number;
  cursor?: string;
}

export interface ListRulesResult {
  rules: Array<{
    id: string;
    entityId: string;
    name: string;
    conditions: unknown;
    action: unknown;
    isActive: boolean;
    source: RuleSource;
    executionCount: number;
    successRate: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  nextCursor: string | null;
}

/**
 * RuleService
 *
 * Manages user-defined automation rules for AI Auto-Bookkeeper.
 * Rules define conditions (e.g., "description contains Starbucks") and actions
 * (e.g., "set category to Meals & Entertainment").
 *
 * Key features:
 * - Tenant-isolated via entity membership
 * - FK ownership validation (categoryId, glAccountId)
 * - JSON schema validation for conditions and actions
 * - Audit logging on all mutations
 * - Hard delete (rules are config, not financial data)
 * - Success rate tracking for rule effectiveness
 */
export class RuleService {
  constructor(
    private readonly tenantId: string,
    private readonly userId: string
  ) {}

  /**
   * List rules with cursor pagination and filters
   */
  async listRules(params: ListRulesParams): Promise<ListRulesResult> {
    const take = params.take ?? 50;

    const where: Prisma.RuleWhereInput = {
      entityId: params.entityId,
      entity: { tenantId: this.tenantId },
    };

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.source) {
      where.source = params.source;
    }

    if (params.search) {
      where.name = {
        contains: params.search,
        mode: 'insensitive',
      };
    }

    const rules = await prisma.rule.findMany({
      where,
      take: take + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: [
        { isActive: 'desc' },
        { executionCount: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        entityId: true,
        name: true,
        conditions: true,
        action: true,
        isActive: true,
        source: true,
        executionCount: true,
        successRate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = rules.length > take;
    const items = hasMore ? rules.slice(0, take) : rules;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { rules: items, nextCursor };
  }

  /**
   * Get a single rule by ID
   */
  async getRule(id: string) {
    return prisma.rule.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
      select: {
        id: true,
        entityId: true,
        name: true,
        conditions: true,
        action: true,
        isActive: true,
        source: true,
        aiConfidence: true,
        aiModelVersion: true,
        userApprovedAt: true,
        executionCount: true,
        successRate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Create a new rule
   */
  async createRule(data: CreateRuleInput) {
    // Validate entity ownership
    const entity = await prisma.entity.findFirst({
      where: {
        id: data.entityId,
        tenantId: this.tenantId,
      },
    });
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    // Validate conditions JSON structure
    const validatedConditions = this.validateConditions(data.conditions);

    // Validate action JSON structure
    const validatedAction = this.validateAction(data.action);

    // Validate FK ownership: categoryId
    if (validatedAction.setCategoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validatedAction.setCategoryId,
          tenantId: this.tenantId,
          deletedAt: null,
        },
      });
      if (!category) {
        throw new Error('Category not found or access denied');
      }
    }

    // Validate FK ownership: glAccountId
    if (validatedAction.setGLAccountId) {
      const glAccount = await prisma.gLAccount.findFirst({
        where: {
          id: validatedAction.setGLAccountId,
          entity: { tenantId: this.tenantId },
        },
      });
      if (!glAccount) {
        throw new Error('GL account not found or access denied');
      }
    }

    const rule = await prisma.rule.create({
      data: {
        entityId: data.entityId,
        name: data.name,
        conditions: validatedConditions as unknown as Prisma.InputJsonValue,
        action: validatedAction as unknown as Prisma.InputJsonValue,
        isActive: true,
        source: data.source,
        aiConfidence: data.aiConfidence,
        aiModelVersion: data.aiModelVersion,
        executionCount: 0,
        successRate: 0,
      },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: data.entityId,
      model: 'Rule',
      recordId: rule.id,
      action: 'CREATE',
      after: {
        name: data.name,
        source: data.source,
        isActive: true,
      },
    });

    return rule;
  }

  /**
   * Update an existing rule (partial updates)
   */
  async updateRule(id: string, data: UpdateRuleInput) {
    const existing = await prisma.rule.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
      select: {
        id: true,
        entityId: true,
        name: true,
        conditions: true,
        action: true,
        isActive: true,
      },
    });

    if (!existing) {
      throw new Error('Rule not found or access denied');
    }

    // Validate conditions if provided
    let validatedConditions: RuleConditions | undefined;
    if (data.conditions !== undefined) {
      validatedConditions = this.validateConditions(data.conditions);
    }

    // Validate action if provided
    let validatedAction: RuleAction | undefined;
    if (data.action !== undefined) {
      validatedAction = this.validateAction(data.action);
    }

    // Validate FK ownership: categoryId (if changed)
    if (validatedAction?.setCategoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validatedAction.setCategoryId,
          tenantId: this.tenantId,
          deletedAt: null,
        },
      });
      if (!category) {
        throw new Error('Category not found or access denied');
      }
    }

    // Validate FK ownership: glAccountId (if changed)
    if (validatedAction?.setGLAccountId) {
      const glAccount = await prisma.gLAccount.findFirst({
        where: {
          id: validatedAction.setGLAccountId,
          entity: { tenantId: this.tenantId },
        },
      });
      if (!glAccount) {
        throw new Error('GL account not found or access denied');
      }
    }

    const rule = await prisma.rule.update({
      where: { id },
      data: {
        name: data.name,
        conditions: validatedConditions ? (validatedConditions as unknown as Prisma.InputJsonValue) : undefined,
        action: validatedAction ? (validatedAction as unknown as Prisma.InputJsonValue) : undefined,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: existing.entityId,
      model: 'Rule',
      recordId: id,
      action: 'UPDATE',
      before: {
        name: existing.name,
        isActive: existing.isActive,
      },
      after: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return rule;
  }

  /**
   * Delete a rule (hard delete - rules are config, not financial data)
   */
  async deleteRule(id: string): Promise<void> {
    const existing = await prisma.rule.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
      select: {
        id: true,
        entityId: true,
        name: true,
        isActive: true,
      },
    });

    if (!existing) {
      throw new Error('Rule not found or access denied');
    }

    await prisma.rule.delete({
      where: { id },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: existing.entityId,
      model: 'Rule',
      recordId: id,
      action: 'DELETE',
      before: {
        name: existing.name,
        isActive: existing.isActive,
      },
    });
  }

  /**
   * Toggle rule active status
   */
  async toggleRule(id: string) {
    const existing = await prisma.rule.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
      select: {
        id: true,
        entityId: true,
        isActive: true,
      },
    });

    if (!existing) {
      throw new Error('Rule not found or access denied');
    }

    const rule = await prisma.rule.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: existing.entityId,
      model: 'Rule',
      recordId: id,
      action: 'UPDATE',
      before: { isActive: existing.isActive },
      after: { isActive: !existing.isActive },
    });

    return rule;
  }

  /**
   * Increment execution count and update success rate
   *
   * Called async from rule engine after rule execution.
   * Non-critical operation (no audit log to avoid noise).
   */
  async incrementExecution(id: string, success: boolean): Promise<void> {
    const existing = await prisma.rule.findUnique({
      where: { id },
      select: {
        executionCount: true,
        successRate: true,
      },
    });

    if (!existing) {
      // Rule may have been deleted - not an error
      return;
    }

    const newCount = existing.executionCount + 1;
    const currentSuccesses = Math.round(existing.executionCount * existing.successRate);
    const newSuccesses = currentSuccesses + (success ? 1 : 0);
    const newSuccessRate = newSuccesses / newCount;

    await prisma.rule.update({
      where: { id },
      data: {
        executionCount: newCount,
        successRate: newSuccessRate,
      },
    });
  }

  /**
   * Get rule statistics for an entity
   *
   * Returns total count, active count, and top 5 rules by execution count.
   * Used for dashboard widgets and analytics.
   */
  async getRuleStats(entityId: string) {
    const [total, active, topRules] = await Promise.all([
      prisma.rule.count({
        where: { entityId, entity: { tenantId: this.tenantId } },
      }),
      prisma.rule.count({
        where: { entityId, entity: { tenantId: this.tenantId }, isActive: true },
      }),
      prisma.rule.findMany({
        where: { entityId, entity: { tenantId: this.tenantId } },
        orderBy: { executionCount: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          executionCount: true,
          successRate: true,
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      topRules,
    };
  }

  /**
   * Validate conditions JSON structure
   *
   * Security: allowlist-based field and operator validation
   */
  private validateConditions(conditions: unknown): RuleConditions {
    const result = RuleConditionsSchema.safeParse(conditions);
    if (!result.success) {
      throw new Error(`Invalid conditions: ${result.error.message}`);
    }
    return result.data as RuleConditions;
  }

  /**
   * Validate action JSON structure
   *
   * At least one field must be set
   */
  private validateAction(action: unknown): RuleAction {
    const result = RuleActionSchema.safeParse(action);
    if (!result.success) {
      throw new Error(`Invalid action: ${result.error.message}`);
    }
    return result.data;
  }
}
