import { prisma, type Prisma } from '@akount/db';
import { AIError } from '../errors';
import { ActionExecutorService, type ExecutionResult } from './action-executor.service';
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
   * Approve a pending action, then execute it.
   * Validates: must be PENDING, must not be expired.
   *
   * Execution is dispatched by ActionExecutorService:
   * - JE_DRAFT: approves the linked draft journal entry
   * - CATEGORIZATION: applies the suggested category to the transaction
   * - RULE_SUGGESTION/ALERT: acknowledged (no automated execution)
   */
  async approveAction(
    actionId: string,
    userId: string
  ): Promise<{ action: Record<string, unknown>; execution?: ExecutionResult }> {
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

    const updated = await prisma.aIAction.update({
      where: { id: actionId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });

    // Execute the approved action
    const executor = new ActionExecutorService(this.tenantId, this.entityId, userId);
    const execution = await executor.execute({
      id: action.id,
      type: action.type,
      payload: action.payload,
    });

    if (!execution.success) {
      logger.warn(
        { actionId, executionError: execution.error },
        'Action approved but execution failed'
      );
    }

    return { action: updated as unknown as Record<string, unknown>, execution };
  }

  /**
   * Reject a pending action and handle side-effects.
   * For JE_DRAFT: soft-deletes the linked draft journal entry.
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

    const updated = await prisma.aIAction.update({
      where: { id: actionId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });

    // Handle rejection side-effects (e.g., soft-delete draft JE)
    const executor = new ActionExecutorService(this.tenantId, this.entityId, userId);
    await executor.handleRejection({
      id: action.id,
      type: action.type,
      payload: action.payload,
    });

    return updated;
  }

  /**
   * Batch approve multiple actions, then execute each.
   * Uses optimistic concurrency: only updates PENDING actions.
   * Execution runs after status update; failures are logged but don't revert approval.
   */
  async batchApprove(actionIds: string[], userId: string): Promise<BatchResult> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];
    const approvedActions: Array<{ id: string; type: string; payload: unknown }> = [];

    for (const id of actionIds) {
      try {
        // Fetch the action first (need payload for execution)
        const action = await prisma.aIAction.findFirst({
          where: {
            id,
            entityId: this.entityId,
            entity: { tenantId: this.tenantId },
          },
          select: { id: true, type: true, payload: true, status: true, expiresAt: true },
        });

        if (!action || action.status !== 'PENDING') {
          failed.push({ id, reason: 'Not found or not pending' });
          continue;
        }

        if (action.expiresAt && action.expiresAt < new Date()) {
          await prisma.aIAction.update({
            where: { id },
            data: { status: 'EXPIRED' },
          });
          failed.push({ id, reason: 'Action expired' });
          continue;
        }

        // Update status to APPROVED
        await prisma.aIAction.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: userId,
          },
        });

        succeeded.push(id);
        approvedActions.push({ id: action.id, type: action.type, payload: action.payload });
      } catch (error) {
        logger.error({ err: error, actionId: id }, 'Failed to approve action');
        failed.push({
          id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Execute all approved actions
    if (approvedActions.length > 0) {
      const executor = new ActionExecutorService(this.tenantId, this.entityId, userId);
      for (const action of approvedActions) {
        const result = await executor.execute(action);
        if (!result.success) {
          logger.warn(
            { actionId: action.id, executionError: result.error },
            'Batch-approved action execution failed'
          );
        }
      }
    }

    return { succeeded, failed };
  }

  /**
   * Batch reject multiple actions with side-effect handling.
   * For JE_DRAFT actions: soft-deletes linked draft journal entries.
   */
  async batchReject(actionIds: string[], userId: string): Promise<BatchResult> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];
    const rejectedActions: Array<{ id: string; type: string; payload: unknown }> = [];

    for (const id of actionIds) {
      try {
        // Fetch action for rejection side-effects
        const action = await prisma.aIAction.findFirst({
          where: {
            id,
            entityId: this.entityId,
            entity: { tenantId: this.tenantId },
            status: 'PENDING',
          },
          select: { id: true, type: true, payload: true },
        });

        if (!action) {
          failed.push({ id, reason: 'Not found or not pending' });
          continue;
        }

        await prisma.aIAction.update({
          where: { id },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedBy: userId,
          },
        });

        succeeded.push(id);
        rejectedActions.push({ id: action.id, type: action.type, payload: action.payload });
      } catch (error) {
        logger.error({ err: error, actionId: id }, 'Failed to reject action');
        failed.push({
          id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Handle rejection side-effects for all rejected actions
    if (rejectedActions.length > 0) {
      const executor = new ActionExecutorService(this.tenantId, this.entityId, userId);
      for (const action of rejectedActions) {
        await executor.handleRejection(action);
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
