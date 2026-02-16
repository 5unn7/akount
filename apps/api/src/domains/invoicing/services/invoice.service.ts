import { prisma, Prisma, type InvoiceStatus } from '@akount/db';
import type { TenantContext } from '@/lib/middleware/tenant';
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesInput,
} from '../schemas/invoice.schema';
import { generateInvoicePdf } from './pdf.service';
import { sendEmail } from '../../../lib/email';

/**
 * Invoice service — Business logic for invoice CRUD + status transitions.
 *
 * CRITICAL RULES:
 * - Tenant isolation: All queries MUST filter by tenantId via entity relation
 * - Soft delete: Use deletedAt field, filter deletedAt: null
 * - Integer cents: All monetary amounts are integers
 * - AR aging: Calculate buckets based on dueDate
 *
 * Invoice lifecycle: DRAFT → SENT → PARTIALLY_PAID → PAID
 *                    DRAFT/SENT → CANCELLED (if no payments)
 *                    SENT/PARTIALLY_PAID → OVERDUE
 */

const VALID_TRANSITIONS: Record<string, InvoiceStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'OVERDUE'],
  OVERDUE: ['PARTIALLY_PAID', 'PAID'],
};

function assertTransition(current: InvoiceStatus, target: InvoiceStatus): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new Error(`Invalid status transition: ${current} → ${target}`);
  }
}

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

  // SECURITY FIX M-2: Validate totals match line items to prevent amount manipulation
  const calculatedSubtotal = data.lines.reduce((sum, line) => sum + line.amount - line.taxAmount, 0);
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

// ─── Status Transitions ───────────────────────────────────────────

/**
 * Send invoice: DRAFT → SENT
 *
 * 1. Validates DRAFT status and client email
 * 2. Generates PDF attachment
 * 3. Sends email to client via Resend
 * 4. Transitions status to SENT
 *
 * @param logger - Pino logger instance for structured logging
 */
export async function sendInvoice(
  id: string,
  ctx: TenantContext,
  logger?: { info: (obj: Record<string, unknown>, msg?: string) => void; error: (obj: Record<string, unknown>, msg?: string) => void; warn: (obj: Record<string, unknown>, msg?: string) => void }
) {
  const invoice = await getInvoice(id, ctx);
  assertTransition(invoice.status, 'SENT');

  if (!invoice.client.email) {
    throw new Error('Client email required for sending');
  }

  // Generate PDF
  const pdfBuffer = await generateInvoicePdf(invoice);

  // Send email with PDF attachment
  if (logger) {
    const emailResult = await sendEmail(
      {
        to: invoice.client.email,
        subject: `Invoice ${invoice.invoiceNumber} from ${invoice.entity.name}`,
        html: buildInvoiceEmailHtml(invoice),
        text: `Please find attached invoice ${invoice.invoiceNumber} for ${formatCentsSimple(invoice.total, invoice.currency)}. Due: ${new Date(invoice.dueDate).toLocaleDateString('en-CA')}.`,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      },
      logger
    );

    if (!emailResult.success) {
      throw new Error(`Failed to send invoice email: ${emailResult.error}`);
    }
  }

  return prisma.invoice.update({
    where: { id },
    data: { status: 'SENT' },
    include: { client: true, entity: true, invoiceLines: true },
  });
}

/**
 * Generate invoice PDF buffer for download.
 */
export async function getInvoicePdf(id: string, ctx: TenantContext): Promise<Buffer> {
  const invoice = await getInvoice(id, ctx);
  return generateInvoicePdf(invoice);
}

// ─── Email Template Helpers ────────────────────────────────────────

function formatCentsSimple(cents: number, currency: string): string {
  const symbols: Record<string, string> = { CAD: 'CA$', USD: '$', EUR: '€', GBP: '£' };
  const sym = symbols[currency] ?? currency;
  return `${sym}${(cents / 100).toFixed(2)}`;
}

function buildInvoiceEmailHtml(invoice: {
  invoiceNumber: string;
  total: number;
  currency: string;
  dueDate: Date | string;
  entity: { name: string };
  client: { name: string };
}): string {
  const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #374151;">
  <div style="border-bottom: 3px solid #F59E0B; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 20px; color: #0f0f17;">${invoice.entity.name}</h1>
  </div>

  <p>Hi ${invoice.client.name},</p>

  <p>Please find attached invoice <strong>${invoice.invoiceNumber}</strong> for <strong>${formatCentsSimple(invoice.total, invoice.currency)}</strong>.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr>
      <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Invoice Number</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">${invoice.invoiceNumber}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Amount Due</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #F59E0B;">${formatCentsSimple(invoice.total, invoice.currency)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Due Date</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">${dueDate}</td>
    </tr>
  </table>

  <p>The PDF invoice is attached to this email for your records.</p>

  <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
    Sent via Akount — ${invoice.entity.name}
  </p>
</body>
</html>`.trim();
}

/**
 * Cancel invoice: DRAFT/SENT → CANCELLED
 * Cannot cancel if payments have been allocated.
 */
export async function cancelInvoice(id: string, ctx: TenantContext) {
  const invoice = await getInvoice(id, ctx);
  assertTransition(invoice.status, 'CANCELLED');

  if (invoice.paidAmount > 0) {
    throw new Error('Cannot cancel invoice with existing payments');
  }

  return prisma.invoice.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { client: true, entity: true, invoiceLines: true },
  });
}

/**
 * Mark invoice overdue: SENT/PARTIALLY_PAID → OVERDUE
 * Typically triggered when dueDate has passed.
 */
export async function markInvoiceOverdue(id: string, ctx: TenantContext) {
  const invoice = await getInvoice(id, ctx);
  assertTransition(invoice.status, 'OVERDUE');

  return prisma.invoice.update({
    where: { id },
    data: { status: 'OVERDUE' },
    include: { client: true, entity: true, invoiceLines: true },
  });
}

/**
 * Apply payment to invoice — updates paidAmount and status.
 * Called internally by PaymentService when allocating payments.
 *
 * @param amount - Payment amount in integer cents to apply
 */
export async function applyPaymentToInvoice(
  id: string,
  amount: number,
  ctx: TenantContext
) {
  const invoice = await getInvoice(id, ctx);

  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  const newPaidAmount = invoice.paidAmount + amount;
  if (newPaidAmount > invoice.total) {
    throw new Error(
      `Payment of ${amount} would exceed invoice balance. Outstanding: ${invoice.total - invoice.paidAmount}`
    );
  }

  const newStatus: InvoiceStatus =
    newPaidAmount >= invoice.total ? 'PAID' : 'PARTIALLY_PAID';

  return prisma.invoice.update({
    where: { id },
    data: { paidAmount: newPaidAmount, status: newStatus },
    include: { client: true, entity: true, invoiceLines: true },
  });
}

/**
 * Reverse payment from invoice — reduces paidAmount and reverts status.
 * Called internally by PaymentService when deleting a payment.
 */
export async function reversePaymentFromInvoice(
  id: string,
  amount: number,
  ctx: TenantContext
) {
  const invoice = await getInvoice(id, ctx);

  const newPaidAmount = Math.max(0, invoice.paidAmount - amount);
  let newStatus: InvoiceStatus;

  if (newPaidAmount === 0) {
    newStatus = invoice.dueDate < new Date() ? 'OVERDUE' : 'SENT';
  } else {
    newStatus = 'PARTIALLY_PAID';
  }

  return prisma.invoice.update({
    where: { id },
    data: { paidAmount: newPaidAmount, status: newStatus },
    include: { client: true, entity: true, invoiceLines: true },
  });
}
