import { prisma, Prisma, type BillStatus } from '@akount/db';
import type { TenantContext } from '../../../middleware/tenant.js';
import type {
  CreateBillInput,
  UpdateBillInput,
  ListBillsInput,
} from '../schemas/bill.schema';

/**
 * Bill service — Business logic for bill CRUD + status transitions (AP side).
 *
 * Mirrors invoice.service.ts but uses Vendor instead of Client.
 *
 * CRITICAL RULES:
 * - Tenant isolation: All queries MUST filter by tenantId via entity relation
 * - Soft delete: Use deletedAt field, filter deletedAt: null
 * - Integer cents: All monetary amounts are integers
 * - AP aging: Calculate buckets based on dueDate
 *
 * Bill lifecycle: DRAFT → PENDING → PARTIALLY_PAID → PAID
 *                 DRAFT/PENDING → CANCELLED (if no payments)
 *                 PENDING/PARTIALLY_PAID → OVERDUE
 */

const VALID_TRANSITIONS: Record<string, BillStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'OVERDUE'],
  OVERDUE: ['PARTIALLY_PAID', 'PAID'],
};

function assertTransition(current: BillStatus, target: BillStatus): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new Error(`Invalid status transition: ${current} → ${target}`);
  }
}

export async function createBill(data: CreateBillInput, ctx: TenantContext) {
  // Verify vendor belongs to tenant's entity
  const vendor = await prisma.vendor.findFirst({
    where: {
      id: data.vendorId,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
  });

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  // SECURITY FIX M-2: Validate totals match line items to prevent amount manipulation
  const calculatedSubtotal = data.lines.reduce((sum, line) => sum + line.amount, 0);
  const calculatedTaxAmount = data.lines.reduce((sum, line) => sum + line.taxAmount, 0);
  const calculatedTotal = calculatedSubtotal + calculatedTaxAmount;

  if (data.subtotal !== calculatedSubtotal) {
    throw new Error(`Subtotal mismatch: provided ${data.subtotal}, calculated ${calculatedSubtotal}`);
  }
  if (data.taxAmount !== calculatedTaxAmount) {
    throw new Error(`Tax amount mismatch: provided ${data.taxAmount}, calculated ${calculatedTaxAmount}`);
  }
  if (data.total !== calculatedTotal) {
    throw new Error(`Total mismatch: provided ${data.total}, calculated ${calculatedTotal}`);
  }

  return prisma.bill.create({
    data: {
      entityId: vendor.entityId,
      vendorId: data.vendorId,
      billNumber: data.billNumber,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      currency: data.currency,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      total: data.total,
      status: data.status as BillStatus,
      paidAmount: 0,
      notes: data.notes,
      billLines: {
        create: data.lines,
      },
    },
    include: {
      billLines: true,
      vendor: true,
      entity: true,
    },
  });
}

export async function listBills(filters: ListBillsInput, ctx: TenantContext) {
  const where: Prisma.BillWhereInput = {
    entity: {
      tenantId: ctx.tenantId,
      ...(filters.entityId && { id: filters.entityId }),
    },
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status as BillStatus;
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.dateFrom) where.issueDate = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    where.issueDate = {
      ...(typeof where.issueDate === 'object' && where.issueDate !== null ? where.issueDate : {}),
      lte: new Date(filters.dateTo),
    };
  }
  if (filters.cursor) where.id = { gt: filters.cursor };

  const bills = await prisma.bill.findMany({
    where,
    include: { vendor: true, entity: true, billLines: true },
    orderBy: { createdAt: 'desc' },
    take: filters.limit,
  });

  const nextCursor =
    bills.length === filters.limit ? bills[bills.length - 1].id : null;

  return { bills, nextCursor };
}

export async function getBill(id: string, ctx: TenantContext) {
  const bill = await prisma.bill.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
    include: {
      vendor: true,
      entity: true,
      billLines: true,
    },
  });

  if (!bill) throw new Error('Bill not found');
  return bill;
}

export async function updateBill(
  id: string,
  data: UpdateBillInput,
  ctx: TenantContext
) {
  // Verify exists and tenant owns
  await getBill(id, ctx);

  return prisma.bill.update({
    where: { id },
    data: {
      ...(data.billNumber && { billNumber: data.billNumber }),
      ...(data.issueDate && { issueDate: new Date(data.issueDate) }),
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      ...(data.currency && { currency: data.currency }),
      ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
      ...(data.taxAmount !== undefined && { taxAmount: data.taxAmount }),
      ...(data.total !== undefined && { total: data.total }),
      ...(data.status && { status: data.status as BillStatus }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: { vendor: true, entity: true, billLines: true },
  });
}

export async function deleteBill(id: string, ctx: TenantContext) {
  // Verify exists and tenant owns
  await getBill(id, ctx);

  return prisma.bill.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getBillStats(ctx: TenantContext) {
  // Outstanding AP, paid this month, overdue
  const [total, paid, overdue] = await Promise.all([
    prisma.bill.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      _sum: { total: true, paidAmount: true },
    }),
    prisma.bill.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'PAID',
      },
      _sum: { total: true },
    }),
    prisma.bill.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
      },
      _sum: { total: true },
    }),
  ]);

  // AP Aging buckets
  const now = new Date();
  const aging = await Promise.all([
    // Current (not yet due)
    prisma.bill.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        dueDate: { gte: now },
      },
      _sum: { total: true, paidAmount: true },
    }),
    // 1-30 days overdue
    prisma.bill.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
        dueDate: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: now,
        },
      },
      _sum: { total: true, paidAmount: true },
    }),
    // 31-60 days overdue
    prisma.bill.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
        dueDate: {
          gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { total: true, paidAmount: true },
    }),
    // 60+ days overdue
    prisma.bill.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
        dueDate: { lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
      },
      _sum: { total: true, paidAmount: true },
    }),
  ]);

  const outstandingAP = (total._sum?.total || 0) - (total._sum?.paidAmount || 0);
  const totalAging = aging.reduce(
    (sum, bucket) =>
      sum + (bucket._sum?.total || 0) - (bucket._sum?.paidAmount || 0),
    0
  );

  return {
    outstandingAP,
    paidThisMonth: paid._sum?.total || 0,
    overdue: overdue._sum?.total || 0,
    aging: {
      current: {
        amount: (aging[0]._sum?.total || 0) - (aging[0]._sum?.paidAmount || 0),
        percentage:
          totalAging > 0
            ? Math.round(
                (((aging[0]._sum?.total || 0) - (aging[0]._sum?.paidAmount || 0)) /
                  totalAging) *
                  100
              )
            : 0,
      },
      '1-30': {
        amount: (aging[1]._sum?.total || 0) - (aging[1]._sum?.paidAmount || 0),
        percentage:
          totalAging > 0
            ? Math.round(
                (((aging[1]._sum?.total || 0) - (aging[1]._sum?.paidAmount || 0)) /
                  totalAging) *
                  100
              )
            : 0,
      },
      '31-60': {
        amount: (aging[2]._sum?.total || 0) - (aging[2]._sum?.paidAmount || 0),
        percentage:
          totalAging > 0
            ? Math.round(
                (((aging[2]._sum?.total || 0) - (aging[2]._sum?.paidAmount || 0)) /
                  totalAging) *
                  100
              )
            : 0,
      },
      '60+': {
        amount: (aging[3]._sum?.total || 0) - (aging[3]._sum?.paidAmount || 0),
        percentage:
          totalAging > 0
            ? Math.round(
                (((aging[3]._sum?.total || 0) - (aging[3]._sum?.paidAmount || 0)) /
                  totalAging) *
                  100
              )
            : 0,
      },
    },
  };
}

// ─── Status Transitions ───────────────────────────────────────────

/**
 * Approve bill: DRAFT → PENDING
 * Bill is ready to be paid.
 */
export async function approveBill(id: string, ctx: TenantContext) {
  const bill = await getBill(id, ctx);
  assertTransition(bill.status, 'PENDING');

  return prisma.bill.update({
    where: { id },
    data: { status: 'PENDING' },
    include: { vendor: true, entity: true, billLines: true },
  });
}

/**
 * Cancel bill: DRAFT/PENDING → CANCELLED
 * Cannot cancel if payments have been allocated.
 */
export async function cancelBill(id: string, ctx: TenantContext) {
  const bill = await getBill(id, ctx);
  assertTransition(bill.status, 'CANCELLED');

  if (bill.paidAmount > 0) {
    throw new Error('Cannot cancel bill with existing payments');
  }

  return prisma.bill.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { vendor: true, entity: true, billLines: true },
  });
}

/**
 * Mark bill overdue: PENDING/PARTIALLY_PAID → OVERDUE
 * Typically triggered when dueDate has passed.
 */
export async function markBillOverdue(id: string, ctx: TenantContext) {
  const bill = await getBill(id, ctx);
  assertTransition(bill.status, 'OVERDUE');

  return prisma.bill.update({
    where: { id },
    data: { status: 'OVERDUE' },
    include: { vendor: true, entity: true, billLines: true },
  });
}

/**
 * Apply payment to bill — updates paidAmount and status.
 * Called internally by PaymentService when allocating payments.
 */
export async function applyPaymentToBill(
  id: string,
  amount: number,
  ctx: TenantContext
) {
  const bill = await getBill(id, ctx);

  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  const newPaidAmount = bill.paidAmount + amount;
  if (newPaidAmount > bill.total) {
    throw new Error(
      `Payment of ${amount} would exceed bill balance. Outstanding: ${bill.total - bill.paidAmount}`
    );
  }

  const newStatus: BillStatus =
    newPaidAmount >= bill.total ? 'PAID' : 'PARTIALLY_PAID';

  return prisma.bill.update({
    where: { id },
    data: { paidAmount: newPaidAmount, status: newStatus },
    include: { vendor: true, entity: true, billLines: true },
  });
}

/**
 * Reverse payment from bill — reduces paidAmount and reverts status.
 * Called internally by PaymentService when deleting a payment.
 */
export async function reversePaymentFromBill(
  id: string,
  amount: number,
  ctx: TenantContext
) {
  const bill = await getBill(id, ctx);

  const newPaidAmount = Math.max(0, bill.paidAmount - amount);
  let newStatus: BillStatus;

  if (newPaidAmount === 0) {
    newStatus = bill.dueDate < new Date() ? 'OVERDUE' : 'PENDING';
  } else {
    newStatus = 'PARTIALLY_PAID';
  }

  return prisma.bill.update({
    where: { id },
    data: { paidAmount: newPaidAmount, status: newStatus },
    include: { vendor: true, entity: true, billLines: true },
  });
}
