import { prisma } from '@akount/db';
import type { TenantContext } from '../../../types/tenant-context';

/**
 * Get bill statistics for accounts payable
 *
 * CRITICAL FINANCIAL INVARIANTS:
 * - All amounts in integer cents (never floats)
 * - Tenant isolation enforced (filters by entity.tenantId)
 * - Soft delete respected (deletedAt IS NULL)
 */
export async function getBillStats(ctx: TenantContext, entityId?: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Build base where clause with tenant isolation
  const baseWhere = {
    entity: {
      tenantId: ctx.tenantId,
      ...(entityId && { id: entityId }),
    },
    deletedAt: null, // Soft delete filter
  };

  // Outstanding AP, paid this month, overdue
  const [total, paid, overdue] = await Promise.all([
    // Total outstanding
    prisma.bill.aggregate({
      where: baseWhere,
      _sum: { total: true, paidAmount: true },
    }),
    // Paid this month
    prisma.bill.aggregate({
      where: {
        ...baseWhere,
        status: 'PAID',
        updatedAt: { gte: startOfMonth },
      },
      _sum: { total: true, paidAmount: true },
    }),
    // Overdue bills
    prisma.bill.aggregate({
      where: {
        ...baseWhere,
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      _sum: { total: true, paidAmount: true },
    }),
  ]);

  const outstandingAP = (total._sum.total || 0) - (total._sum.paidAmount || 0);

  return {
    outstandingAP,
    paidThisMonth: paid._sum.total || 0,
    overdue: overdue._sum.total || 0,
  };
}
