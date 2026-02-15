import { prisma, Prisma } from '@akount/db';
import type { TenantContext } from '@/lib/middleware/tenant';
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesInput,
} from '../schemas/invoice.schema';

/**
 * Invoice service — Business logic for invoice CRUD operations.
 *
 * CRITICAL RULES:
 * - Tenant isolation: All queries MUST filter by tenantId via entity relation
 * - Soft delete: Use deletedAt field, filter deletedAt: null
 * - Integer cents: All monetary amounts are integers
 * - AR aging: Calculate buckets based on dueDate
 */

export async function createInvoice(
  data: CreateInvoiceInput,
  ctx: TenantContext
) {
  // Verify client belongs to tenant's entity
  const client = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  return prisma.invoice.create({
    data: {
      entityId: client.entityId,
      clientId: data.clientId,
      invoiceNumber: data.invoiceNumber,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      currency: data.currency,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      total: data.total,
      status: data.status,
      paidAmount: 0,
      notes: data.notes,
      invoiceLines: {
        create: data.lines,
      },
    },
    include: {
      invoiceLines: true,
      client: true,
      entity: true,
    },
  });
}

export async function listInvoices(
  filters: ListInvoicesInput,
  ctx: TenantContext
) {
  const where: Prisma.InvoiceWhereInput = {
    entity: { tenantId: ctx.tenantId },
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.dateFrom) where.issueDate = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    where.issueDate = {
      ...(where.issueDate || {}),
      lte: new Date(filters.dateTo),
    };
  }
  if (filters.cursor) where.id = { gt: filters.cursor };

  const invoices = await prisma.invoice.findMany({
    where,
    include: { client: true, entity: true, invoiceLines: true },
    orderBy: { createdAt: 'desc' },
    take: filters.limit,
  });

  const nextCursor =
    invoices.length === filters.limit
      ? invoices[invoices.length - 1].id
      : null;

  return { invoices, nextCursor };
}

export async function getInvoice(id: string, ctx: TenantContext) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
    include: {
      client: true,
      entity: true,
      invoiceLines: true,
    },
  });

  if (!invoice) throw new Error('Invoice not found');
  return invoice;
}

export async function updateInvoice(
  id: string,
  data: UpdateInvoiceInput,
  ctx: TenantContext
) {
  // Verify exists and tenant owns
  await getInvoice(id, ctx);

  return prisma.invoice.update({
    where: { id },
    data: {
      ...(data.invoiceNumber && { invoiceNumber: data.invoiceNumber }),
      ...(data.issueDate && { issueDate: new Date(data.issueDate) }),
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      ...(data.currency && { currency: data.currency }),
      ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
      ...(data.taxAmount !== undefined && { taxAmount: data.taxAmount }),
      ...(data.total !== undefined && { total: data.total }),
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: { client: true, entity: true, invoiceLines: true },
  });
}

export async function deleteInvoice(id: string, ctx: TenantContext) {
  // Verify exists and tenant owns
  await getInvoice(id, ctx);

  return prisma.invoice.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getInvoiceStats(ctx: TenantContext) {
  // Outstanding AR, collected this month, overdue
  const [total, paid, overdue] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: { in: ['SENT', 'OVERDUE'] },
      },
      _sum: { total: true, paidAmount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'PAID',
      },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
      },
      _sum: { total: true },
    }),
  ]);

  // AR Aging buckets
  const now = new Date();
  const aging = await Promise.all([
    // Current (not yet due)
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { gte: now },
      },
      _sum: { total: true, paidAmount: true },
    }),
    // 1-30 days overdue
    prisma.invoice.aggregate({
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
    prisma.invoice.aggregate({
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
    prisma.invoice.aggregate({
      where: {
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
        status: 'OVERDUE',
        dueDate: { lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
      },
      _sum: { total: true, paidAmount: true },
    }),
  ]);

  const outstandingAR = (total._sum.total || 0) - (total._sum.paidAmount || 0);
  const totalAging = aging.reduce(
    (sum, bucket) =>
      sum + (bucket._sum.total || 0) - (bucket._sum.paidAmount || 0),
    0
  );

  return {
    outstandingAR,
    collectedThisMonth: paid._sum.total || 0,
    overdue: overdue._sum.total || 0,
    aging: {
      current: {
        amount: (aging[0]._sum.total || 0) - (aging[0]._sum.paidAmount || 0),
        percentage:
          totalAging > 0
            ? Math.round(
                (((aging[0]._sum.total || 0) - (aging[0]._sum.paidAmount || 0)) /
                  totalAging) *
                  100
              )
            : 0,
      },
      '1-30': {
        amount: (aging[1]._sum.total || 0) - (aging[1]._sum.paidAmount || 0),
        percentage:
          totalAging > 0
            ? Math.round(
                (((aging[1]._sum.total || 0) - (aging[1]._sum.paidAmount || 0)) /
                  totalAging) *
                  100
              )
            : 0,
      },
      '31-60': {
        amount: (aging[2]._sum.total || 0) - (aging[2]._sum.paidAmount || 0),
        percentage:
          totalAging > 0
            ? Math.round(
                (((aging[2]._sum.total || 0) - (aging[2]._sum.paidAmount || 0)) /
                  totalAging) *
                  100
              )
            : 0,
      },
      '60+': {
        amount: (aging[3]._sum.total || 0) - (aging[3]._sum.paidAmount || 0),
        percentage:
          totalAging > 0
            ? Math.round(
                (((aging[3]._sum.total || 0) - (aging[3]._sum.paidAmount || 0)) /
                  totalAging) *
                  100
              )
            : 0,
      },
    },
  };
}
