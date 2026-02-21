import { prisma, Prisma } from '@akount/db';
import type { TenantContext } from '../../../middleware/tenant.js';
import type {
  CreatePaymentInput,
  UpdatePaymentInput,
  ListPaymentsInput,
  AllocatePaymentInput,
} from '../schemas/payment.schema';
import * as invoiceService from './invoice.service';
import * as billService from './bill.service';

/**
 * Payment service — Business logic for Payment CRUD + allocation.
 *
 * CRITICAL RULES:
 * - Tenant isolation: All queries filter by tenantId via entity relation
 * - Soft delete: Use deletedAt field, filter deletedAt: null
 * - Integer cents: All monetary amounts are integers
 * - Allocation: Payments are linked to invoices/bills via PaymentAllocation
 * - Overpayment guard: Allocation total cannot exceed payment amount
 *
 * AR payments: clientId set → allocations target invoices
 * AP payments: vendorId set → allocations target bills
 */

export async function createPayment(
  data: CreatePaymentInput,
  ctx: TenantContext
) {
  // Verify client/vendor belongs to tenant's entity
  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
      },
    });
    if (!client) throw new Error('Client not found');
  }

  if (data.vendorId) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: data.vendorId,
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
      },
    });
    if (!vendor) throw new Error('Vendor not found');
  }

  // Resolve entityId from client or vendor
  const relatedEntity = data.clientId
    ? await prisma.client.findFirstOrThrow({
        where: { id: data.clientId },
        select: { entityId: true },
      })
    : await prisma.vendor.findFirstOrThrow({
        where: { id: data.vendorId! },
        select: { entityId: true },
      });

  return prisma.payment.create({
    data: {
      entityId: relatedEntity.entityId,
      date: new Date(data.date),
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      clientId: data.clientId,
      vendorId: data.vendorId,
      notes: data.notes,
    },
    include: {
      client: true,
      vendor: true,
      entity: true,
      allocations: true,
    },
  });
}

export async function getPayment(id: string, ctx: TenantContext) {
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
    include: {
      client: true,
      vendor: true,
      entity: true,
      allocations: {
        include: { invoice: true, bill: true },
      },
    },
  });

  if (!payment) throw new Error('Payment not found');
  return payment;
}

export async function listPayments(
  query: ListPaymentsInput,
  ctx: TenantContext
) {
  const where: Prisma.PaymentWhereInput = {
    entity: { tenantId: ctx.tenantId },
    deletedAt: null,
    ...(query.clientId && { clientId: query.clientId }),
    ...(query.vendorId && { vendorId: query.vendorId }),
    ...(query.dateFrom || query.dateTo
      ? {
          date: {
            ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
            ...(query.dateTo && { lte: new Date(query.dateTo) }),
          },
        }
      : {}),
  };

  const payments = await prisma.payment.findMany({
    where,
    include: {
      client: true,
      vendor: true,
      allocations: true,
    },
    orderBy: { date: 'desc' },
    take: query.limit + 1,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const hasMore = payments.length > query.limit;
  const data = hasMore ? payments.slice(0, query.limit) : payments;

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
  };
}

export async function updatePayment(
  id: string,
  data: UpdatePaymentInput,
  ctx: TenantContext
) {
  // Verify payment exists and belongs to tenant
  await getPayment(id, ctx);

  return prisma.payment.update({
    where: { id },
    data: {
      ...(data.date && { date: new Date(data.date) }),
      ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
      ...(data.reference !== undefined && { reference: data.reference }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: {
      client: true,
      vendor: true,
      entity: true,
      allocations: true,
    },
  });
}

/**
 * Soft delete payment — reverses all allocations first.
 */
export async function deletePayment(id: string, ctx: TenantContext) {
  const payment = await getPayment(id, ctx);

  // Reverse all allocations before soft-deleting
  for (const alloc of payment.allocations) {
    if (alloc.invoiceId) {
      await invoiceService.reversePaymentFromInvoice(alloc.invoiceId, alloc.amount, ctx);
    }
    if (alloc.billId) {
      await billService.reversePaymentFromBill(alloc.billId, alloc.amount, ctx);
    }
  }

  // Delete allocations and soft-delete payment
  await prisma.$transaction([
    prisma.paymentAllocation.deleteMany({ where: { paymentId: id } }),
    prisma.payment.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
  ]);
}

/**
 * Allocate payment to an invoice or bill.
 *
 * Guards:
 * - Total allocations cannot exceed payment amount
 * - AR payments (clientId) → allocate to invoices only
 * - AP payments (vendorId) → allocate to bills only
 * - Document must belong to same tenant
 */
export async function allocatePayment(
  paymentId: string,
  data: AllocatePaymentInput,
  ctx: TenantContext
) {
  const payment = await getPayment(paymentId, ctx);

  // Validate direction matches payment type
  if (payment.clientId && data.billId) {
    throw new Error('AR payment (client) cannot be allocated to a bill');
  }
  if (payment.vendorId && data.invoiceId) {
    throw new Error('AP payment (vendor) cannot be allocated to an invoice');
  }

  // Check allocation doesn't exceed remaining unallocated amount
  const allocatedTotal = payment.allocations.reduce(
    (sum, a) => sum + a.amount,
    0
  );
  const remaining = payment.amount - allocatedTotal;

  if (data.amount > remaining) {
    throw new Error(
      `Allocation of ${data.amount} exceeds unallocated balance of ${remaining}`
    );
  }

  // Verify document belongs to tenant and apply payment
  if (data.invoiceId) {
    await invoiceService.applyPaymentToInvoice(data.invoiceId, data.amount, ctx);
  }
  if (data.billId) {
    await billService.applyPaymentToBill(data.billId, data.amount, ctx);
  }

  // Create allocation record
  const allocation = await prisma.paymentAllocation.create({
    data: {
      paymentId,
      invoiceId: data.invoiceId,
      billId: data.billId,
      amount: data.amount,
    },
    include: { invoice: true, bill: true, payment: true },
  });

  return allocation;
}

/**
 * Deallocate (remove) a payment allocation.
 * Reverses the payment from the linked invoice/bill.
 */
export async function deallocatePayment(
  paymentId: string,
  allocationId: string,
  ctx: TenantContext
) {
  // Verify payment belongs to tenant
  await getPayment(paymentId, ctx);

  const allocation = await prisma.paymentAllocation.findFirst({
    where: { id: allocationId, paymentId },
  });

  if (!allocation) {
    throw new Error('Allocation not found');
  }

  // Reverse payment from linked document
  if (allocation.invoiceId) {
    await invoiceService.reversePaymentFromInvoice(
      allocation.invoiceId,
      allocation.amount,
      ctx
    );
  }
  if (allocation.billId) {
    await billService.reversePaymentFromBill(
      allocation.billId,
      allocation.amount,
      ctx
    );
  }

  // Delete the allocation record
  await prisma.paymentAllocation.delete({ where: { id: allocationId } });
}
