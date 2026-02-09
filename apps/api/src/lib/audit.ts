import { prisma, AuditAction } from '@akount/db';

/**
 * Audit Logging Service
 *
 * Creates audit trail for financial operations.
 * Required for compliance (SOC 2, GDPR) and forensic analysis.
 */
export interface AuditLogParams {
  tenantId: string;
  userId: string;
  entityId?: string;
  model: string;
  recordId: string;
  action: AuditAction;
  before?: Record<string, any>;
  after?: Record<string, any>;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        entityId: params.entityId,
        model: params.model,
        recordId: params.recordId,
        action: params.action,
        before: params.before ? JSON.parse(JSON.stringify(params.before)) : null,
        after: params.after ? JSON.parse(JSON.stringify(params.after)) : null,
      },
    });
  } catch (error) {
    // Don't fail the operation if audit logging fails, but log the error
    console.error('Failed to create audit log:', error);
  }
}
