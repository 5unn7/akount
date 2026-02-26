// AI Auto-Bookkeeper Phase 3: Insight CRUD Service
import { prisma } from '@akount/db';
import { createAuditLog } from '../../../lib/audit.js';
import type {
  InsightType,
  InsightPriority,
  InsightStatus,
  InsightResult,
  InsightMetadata,
} from '../types/insight.types.js';

export interface ListInsightsParams {
  entityId: string;
  type?: InsightType;
  priority?: InsightPriority;
  status?: InsightStatus;
  cursor?: string;
  limit?: number;
}

export interface InsightCounts {
  total: number;
  byPriority: Record<InsightPriority, number>;
  byType: Record<InsightType, number>;
}

/**
 * Insight Service
 *
 * Manages AI-generated financial insights with deduplication, dismiss/snooze lifecycle.
 * Entity-scoped (tenant-isolated via entity relation).
 */
export class InsightService {
  constructor(
    private readonly tenantId: string,
    private readonly userId: string
  ) {}

  /**
   * List insights with optional filters and cursor pagination
   */
  async listInsights(params: ListInsightsParams) {
    const where: Record<string, unknown> = {
      entity: { tenantId: this.tenantId },
      entityId: params.entityId,
    };

    // Apply optional filters
    if (params.type) {
      where.type = params.type;
    }
    if (params.priority) {
      where.priority = params.priority;
    }
    if (params.status) {
      where.status = params.status;
    }

    // Cursor pagination
    const insights = await prisma.insight.findMany({
      where,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      skip: params.cursor ? 1 : 0,
      take: params.limit || 20,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      insights,
      nextCursor: insights.length === (params.limit || 20) ? insights[insights.length - 1]?.id : null,
    };
  }

  /**
   * Get a single insight by ID
   */
  async getInsight(id: string) {
    const insight = await prisma.insight.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
    });

    if (!insight) {
      throw new Error('Insight not found');
    }

    return insight;
  }

  /**
   * Upsert an insight (deduplication via entityId + triggerId unique constraint)
   * If an active insight with same triggerId exists, update it.
   * Otherwise, create new.
   */
  async upsertInsight(entityId: string, result: InsightResult) {
    // Verify entity belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId: this.tenantId },
    });
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    const insight = await prisma.insight.upsert({
      where: {
        entityId_triggerId: {
          entityId,
          triggerId: result.triggerId,
        },
      },
      create: {
        entityId,
        triggerId: result.triggerId,
        title: result.title,
        description: result.description,
        type: result.type,
        priority: result.priority,
        impact: result.impact,
        confidence: result.confidence,
        actionable: result.actionable,
        status: 'active',
        deadline: result.deadline,
        metadata: result.metadata as Record<string, unknown> | undefined,
      },
      update: {
        title: result.title,
        description: result.description,
        priority: result.priority,
        impact: result.impact,
        confidence: result.confidence,
        actionable: result.actionable,
        status: 'active', // Reactivate if it was dismissed/snoozed
        deadline: result.deadline,
        metadata: result.metadata as Record<string, unknown> | undefined,
        updatedAt: new Date(),
      },
    });

    return insight;
  }

  /**
   * Dismiss an insight (sets dismissedAt, dismissedBy, status = dismissed)
   */
  async dismissInsight(id: string) {
    const existing = await prisma.insight.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
    });

    if (!existing) {
      throw new Error('Insight not found');
    }

    const insight = await prisma.insight.update({
      where: { id },
      data: {
        status: 'dismissed',
        dismissedAt: new Date(),
        dismissedBy: this.userId,
      },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      model: 'Insight',
      recordId: id,
      action: 'UPDATE',
      before: { status: existing.status },
      after: { status: 'dismissed', dismissedAt: insight.dismissedAt },
    });

    return insight;
  }

  /**
   * Snooze an insight until a future date
   */
  async snoozeInsight(id: string, snoozedUntil: Date) {
    const existing = await prisma.insight.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
    });

    if (!existing) {
      throw new Error('Insight not found');
    }

    if (snoozedUntil <= new Date()) {
      throw new Error('Snooze date must be in the future');
    }

    const insight = await prisma.insight.update({
      where: { id },
      data: {
        status: 'snoozed',
        snoozedUntil,
      },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      model: 'Insight',
      recordId: id,
      action: 'UPDATE',
      before: { status: existing.status },
      after: { status: 'snoozed', snoozedUntil },
    });

    return insight;
  }

  /**
   * Resolve an insight (mark as resolved)
   */
  async resolveInsight(id: string) {
    const existing = await prisma.insight.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
      },
    });

    if (!existing) {
      throw new Error('Insight not found');
    }

    const insight = await prisma.insight.update({
      where: { id },
      data: { status: 'resolved' },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      model: 'Insight',
      recordId: id,
      action: 'UPDATE',
      before: { status: existing.status },
      after: { status: 'resolved' },
    });

    return insight;
  }

  /**
   * Expire stale insights (snoozed past date → reactivate, active > 30 days → expire)
   * Called periodically by generator service or server timer
   */
  async expireStaleInsights(entityId: string) {
    // Verify entity belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId: this.tenantId },
    });
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Reactivate snoozed insights past their snooze date
    const reactivated = await prisma.insight.updateMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        status: 'snoozed',
        snoozedUntil: { lte: now },
      },
      data: { status: 'active', snoozedUntil: null },
    });

    // Expire old active insights (30+ days)
    const expired = await prisma.insight.updateMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        status: 'active',
        createdAt: { lte: thirtyDaysAgo },
      },
      data: { status: 'expired' },
    });

    return { reactivated: reactivated.count, expired: expired.count };
  }

  /**
   * Get insight counts grouped by type and priority (for dashboard widget)
   */
  async getInsightCounts(entityId: string): Promise<InsightCounts> {
    // Verify entity belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId: this.tenantId },
    });
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    const insights = await prisma.insight.findMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        status: 'active', // Only count active insights
      },
      select: {
        priority: true,
        type: true,
      },
    });

    const byPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const byType: Record<string, number> = {
      cash_flow_warning: 0,
      spending_anomaly: 0,
      duplicate_expense: 0,
      overdue_alert: 0,
      tax_estimate: 0,
      revenue_trend: 0,
      reconciliation_gap: 0,
    };

    insights.forEach((insight) => {
      byPriority[insight.priority] = (byPriority[insight.priority] || 0) + 1;
      byType[insight.type] = (byType[insight.type] || 0) + 1;
    });

    return {
      total: insights.length,
      byPriority: byPriority as Record<InsightPriority, number>,
      byType: byType as Record<InsightType, number>,
    };
  }
}
