import { prisma, AuditAction } from '@akount/db';

/**
 * Parameters for querying audit logs.
 */
export interface AuditQueryParams {
  tenantId: string;
  userId?: string;
  entityId?: string;
  model?: string;
  recordId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Audit log entry with user info.
 */
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  entityId: string | null;
  userId: string | null;
  model: string;
  recordId: string;
  action: AuditAction;
  before: unknown;
  after: unknown;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

/**
 * Audit Query Service
 *
 * Provides filtered access to audit logs for compliance and investigation.
 */
export class AuditQueryService {
  /**
   * Query audit logs with filtering.
   */
  async query(
    params: AuditQueryParams
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const {
      tenantId,
      userId,
      entityId,
      model,
      recordId,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = params;

    // Build where clause with tenant isolation (CRITICAL)
    const where = {
      tenantId, // Always filter by tenant (mandatory)
      ...(userId && { userId }),
      ...(entityId && { entityId }),
      ...(model && { model }),
      ...(recordId && { recordId }),
      ...(action && { action }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    // Execute query and count in parallel
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs: logs as AuditLogEntry[], total };
  }

  /**
   * Get audit trail for a specific record.
   * Returns all changes to the record in chronological order.
   */
  async getRecordHistory(
    tenantId: string,
    model: string,
    recordId: string
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        model,
        recordId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return logs as AuditLogEntry[];
  }

  /**
   * Get recent activity for a user.
   */
  async getUserActivity(
    tenantId: string,
    userId: string,
    limit = 50
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return logs as AuditLogEntry[];
  }

  /**
   * Get security events (RBAC denials, login attempts, etc.).
   */
  async getSecurityEvents(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        model: 'Security',
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return logs as AuditLogEntry[];
  }

  /**
   * Get daily activity summary for compliance reports.
   */
  async getDailySummary(
    tenantId: string,
    date: Date
  ): Promise<{
    date: Date;
    totalActions: number;
    byAction: Record<string, number>;
    byModel: Record<string, number>;
    uniqueUsers: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        action: true,
        model: true,
        userId: true,
      },
    });

    // Aggregate counts
    const byAction: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    const uniqueUserIds = new Set<string>();

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byModel[log.model] = (byModel[log.model] || 0) + 1;
      if (log.userId) {
        uniqueUserIds.add(log.userId);
      }
    }

    return {
      date: startOfDay,
      totalActions: logs.length,
      byAction,
      byModel,
      uniqueUsers: uniqueUserIds.size,
    };
  }
}

// Export singleton instance
export const auditQueryService = new AuditQueryService();
