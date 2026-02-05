import { prisma, AuditAction } from '@akount/db';
import type { FastifyRequest } from 'fastify';

/**
 * Audit event parameters.
 */
export interface AuditEventParams {
  tenantId: string;
  userId?: string;
  entityId?: string;
  model: string;
  recordId: string;
  action: AuditAction;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * Audit Service
 *
 * Provides comprehensive audit logging for all data modifications.
 * Essential for SOC 2 compliance and financial data integrity.
 *
 * @example
 * ```typescript
 * // Log a create action
 * await auditService.logCreate({
 *   tenantId: request.tenantId,
 *   userId: request.userId,
 *   model: 'JournalEntry',
 *   recordId: journalEntry.id,
 *   after: journalEntry,
 * });
 *
 * // Log an update with before/after diff
 * await auditService.logUpdate({
 *   tenantId: request.tenantId,
 *   userId: request.userId,
 *   model: 'Invoice',
 *   recordId: invoice.id,
 *   before: previousInvoice,
 *   after: updatedInvoice,
 * });
 * ```
 */
export class AuditService {
  /**
   * Log a raw audit event.
   */
  async log(params: AuditEventParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          entityId: params.entityId,
          model: params.model,
          recordId: params.recordId,
          action: params.action,
          before: params.before ?? undefined,
          after: params.after ?? undefined,
        },
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      // But log the error for investigation
      console.error('[Audit] Failed to log event:', {
        error,
        params: {
          tenantId: params.tenantId,
          model: params.model,
          recordId: params.recordId,
          action: params.action,
        },
      });
    }
  }

  /**
   * Log a CREATE action.
   */
  async logCreate(params: {
    tenantId: string;
    userId?: string;
    entityId?: string;
    model: string;
    recordId: string;
    after: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      ...params,
      action: 'CREATE',
      before: null,
    });
  }

  /**
   * Log an UPDATE action with before/after values.
   */
  async logUpdate(params: {
    tenantId: string;
    userId?: string;
    entityId?: string;
    model: string;
    recordId: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      ...params,
      action: 'UPDATE',
    });
  }

  /**
   * Log a DELETE action (soft delete in Akount).
   */
  async logDelete(params: {
    tenantId: string;
    userId?: string;
    entityId?: string;
    model: string;
    recordId: string;
    before: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      ...params,
      action: 'DELETE',
      after: null,
    });
  }

  /**
   * Log a VIEW action (for sensitive data access tracking).
   */
  async logView(params: {
    tenantId: string;
    userId?: string;
    entityId?: string;
    model: string;
    recordId: string;
  }): Promise<void> {
    await this.log({
      ...params,
      action: 'VIEW',
      before: null,
      after: null,
    });
  }

  /**
   * Log a security-related event.
   * Uses a special model name for security events.
   */
  async logSecurity(params: {
    tenantId: string;
    userId?: string;
    action: string;
    metadata: Record<string, unknown>;
    request?: FastifyRequest;
  }): Promise<void> {
    const securityMetadata = {
      ...params.metadata,
      ...(params.request && {
        ipAddress: params.request.ip,
        userAgent: params.request.headers['user-agent'],
        path: params.request.url,
        method: params.request.method,
      }),
    };

    await this.log({
      tenantId: params.tenantId,
      userId: params.userId,
      model: 'Security',
      recordId: params.action,
      action: 'CREATE',
      after: securityMetadata,
    });
  }

  /**
   * Convenience method for logging from a request context.
   */
  fromRequest(request: FastifyRequest) {
    return {
      logCreate: async (params: {
        entityId?: string;
        model: string;
        recordId: string;
        after: Record<string, unknown>;
      }) => {
        await this.logCreate({
          tenantId: request.tenantId,
          userId: request.userId,
          ...params,
        });
      },

      logUpdate: async (params: {
        entityId?: string;
        model: string;
        recordId: string;
        before: Record<string, unknown>;
        after: Record<string, unknown>;
      }) => {
        await this.logUpdate({
          tenantId: request.tenantId,
          userId: request.userId,
          ...params,
        });
      },

      logDelete: async (params: {
        entityId?: string;
        model: string;
        recordId: string;
        before: Record<string, unknown>;
      }) => {
        await this.logDelete({
          tenantId: request.tenantId,
          userId: request.userId,
          ...params,
        });
      },

      logView: async (params: {
        entityId?: string;
        model: string;
        recordId: string;
      }) => {
        await this.logView({
          tenantId: request.tenantId,
          userId: request.userId,
          ...params,
        });
      },

      logSecurity: async (action: string, metadata: Record<string, unknown>) => {
        await this.logSecurity({
          tenantId: request.tenantId,
          userId: request.userId,
          action,
          metadata,
          request,
        });
      },
    };
  }
}

// Export singleton instance
export const auditService = new AuditService();
