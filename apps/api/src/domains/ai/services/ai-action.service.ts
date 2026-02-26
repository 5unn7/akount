import { prisma, type Prisma } from '@akount/db';
import { AIError } from '../errors';
import { logger } from '../../../lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateActionInput {
  entityId: string;
  type: 'CATEGORIZATION' | 'JE_DRAFT' | 'RULE_SUGGESTION' | 'ALERT';
  title: string;
  description?: string;
  confidence?: number; // 0-100 integer
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  payload: Prisma.InputJsonValue;
  aiProvider?: string;
  aiModel?: string;
  metadata?: Prisma.InputJsonValue;
  expiresAt?: Date;
}

export interface ListActionsFilter {
  entityId: string;
  tenantId: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'EXPIRED';
  type?: 'CATEGORIZATION' | 'JE_DRAFT' | 'RULE_SUGGESTION' | 'ALERT';
  limit?: number;
  offset?: number;
}

export interface ActionStats {
  pending: number;
  pendingByType: Record<string, number>;
  approved: number;
  rejected: number;
  expired: number;
}

export interface BatchResult {
  succeeded: string[];
  failed: Array<{ id: string; reason: string }>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AIActionService {
  constructor(
    private tenantId: string,
    private entityId: string
  ) {}

  /**
   * Create a new AI action (suggestion for user review).
   */
  async createAction(input: CreateActionInput): Promise<{ id: string }> {
    const action = await prisma.aIAction.create({
      data: {
        entityId: input.entityId,
        type: input.type,
        title: input.title,
        description: input.description,
        confidence: input.confidence,
        priority: input.priority ?? 'MEDIUM',
        payload: input.payload,
        aiProvider: input.aiProvider,
        aiModel: input.aiModel,
        metadata: input.metadata,
        expiresAt: input.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      },
      select: { id: true },
    });

    return action;
  }

  /**
   * List actions with filters and pagination.
   */
  async listActions(filter: ListActionsFilter) {
    const where: Prisma.AIActionWhereInput = {
      entityId: filter.entityId,
      entity: { tenantId: filter.tenantId },
    };

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.type) {
      where.type = filter.type;
    }

    const [actions, total] = await Promise.all([
      prisma.aIAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit ?? 20,
        skip: filter.offset ?? 0,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          status: true,
          confidence: true,
          priority: true,
          payload: true,
          aiProvider: true,
          reviewedAt: true,
          reviewedBy: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.aIAction.count({ where }),
    ]);

    return { actions, total };
  }

  /**
   * Get a single action by ID with tenant isolation.
   */
  async getAction(actionId: string) {
    const action = await prisma.aIAction.findFirst({
      where: {
        id: actionId,
        entityId: this.entityId,
        entity: { tenantId: this.tenantId },
      },
    });

    if (!action) {
      throw new AIError('Action not found', 'ACTION_NOT_FOUND', 404);
    }

    return action;
  }

  /**
   * Approve a pending action.
   * Validates: must be PENDING, must not be expired.
   */
  async approveAction(actionId: string, userId: string) {
    const action = await this.getAction(actionId);

    if (action.status !== 'PENDING') {
      throw new AIError(
        `Cannot approve action in ${action.status} status`,
        'ACTION_NOT_PENDING',
        409
      );
    }

    if (action.expiresAt && action.expiresAt < new Date()) {
      // Auto-mark as expired
      await prisma.aIAction.update({
        where: { id: actionId },
        data: { status: 'EXPIRED' },
      });
      throw new AIError('Action has expired', 'ACTION_EXPIRED', 410);
    }

    return prisma.aIAction.update({
      where: { id: actionId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });
  }

  /**
   * Reject a pending action.
   */
  async rejectAction(actionId: string, userId: string) {
    const action = await this.getAction(actionId);

    if (action.status !== 'PENDING') {
      throw new AIError(
        `Cannot reject action in ${action.status} status`,
        'ACTION_NOT_PENDING',
        409
      );
    }

    return prisma.aIAction.update({
      where: { id: actionId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });
  }

  /**
   * Batch approve multiple actions. Returns per-action results.
   * Uses optimistic concurrency: only updates PENDING actions.
   */
  async batchApprove(actionIds: string[], userId: string): Promise<BatchResult> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of actionIds) {
      try {
        // Optimistic: update only if still PENDING and not expired
        const result = await prisma.aIAction.updateMany({
          where: {
            id,
            entityId: this.entityId,
            entity: { tenantId: this.tenantId },
            status: 'PENDING',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: userId,
          },
        });

        if (result.count > 0) {
          succeeded.push(id);
        } else {
          failed.push({ id, reason: 'Not found, not pending, or expired' });
        }
      } catch (error) {
        logger.error({ err: error, actionId: id }, 'Failed to approve action');
        failed.push({
          id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { succeeded, failed };
  }

  /**
   * Batch reject multiple actions.
   */
  async batchReject(actionIds: string[], userId: string): Promise<BatchResult> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of actionIds) {
      try {
        const result = await prisma.aIAction.updateMany({
          where: {
            id,
            entityId: this.entityId,
            entity: { tenantId: this.tenantId },
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedBy: userId,
          },
        });

        if (result.count > 0) {
          succeeded.push(id);
        } else {
          failed.push({ id, reason: 'Not found or not pending' });
        }
      } catch (error) {
        logger.error({ err: error, actionId: id }, 'Failed to reject action');
        failed.push({
          id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { succeeded, failed };
  }

  /**
   * Get aggregated stats for the dashboard widget.
   */
  async getStats(): Promise<ActionStats> {
    const where = {
      entityId: this.entityId,
      entity: { tenantId: this.tenantId },
    };

    const [pending, approved, rejected, expired, pendingByTypeRaw] = await Promise.all([
      prisma.aIAction.count({ where: { ...where, status: 'PENDING' } }),
      prisma.aIAction.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.aIAction.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.aIAction.count({ where: { ...where, status: 'EXPIRED' } }),
      prisma.aIAction.groupBy({
        by: ['type'],
        where: { ...where, status: 'PENDING' },
        _count: true,
      }),
    ]);

    const pendingByType: Record<string, number> = {};
    for (const row of pendingByTypeRaw) {
      pendingByType[row.type] = row._count;
    }

    return { pending, pendingByType, approved, rejected, expired };
  }

  /**
   * Expire stale actions past their expiresAt.
   * Called on a schedule or before listing.
   */
  async expireStaleActions(): Promise<number> {
    const result = await prisma.aIAction.updateMany({
      where: {
        entityId: this.entityId,
        entity: { tenantId: this.tenantId },
        status: 'PENDING',
        expiresAt: { lte: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      logger.info(
        { entityId: this.entityId, expired: result.count },
        'Expired stale AI actions'
      );
    }

    return result.count;
  }
}
