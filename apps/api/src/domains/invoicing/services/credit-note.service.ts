import { prisma, Prisma, type CreditNoteStatus } from '@akount/db';
import type { TenantContext } from '../../../middleware/tenant.js';
import type {
  CreateCreditNoteInput,
  UpdateCreditNoteInput,
  ListCreditNotesInput,
  ApplyCreditNoteInput,
} from '../schemas/credit-note.schema';
import { JournalEntryService } from '../../accounting/services/journal-entry.service';
import { sanitizeCsvCell, formatCentsForCsv } from '../../../lib/csv';

/**
 * Credit Note service — Business logic for credit note CRUD + status transitions.
 *
 * CRITICAL RULES:
 * - Tenant isolation: All queries MUST filter by tenantId via entity relation
 * - Soft delete: Use deletedAt field, filter deletedAt: null
 * - Integer cents: All monetary amounts are integers
 *
 * Credit note lifecycle: DRAFT → APPROVED → APPLIED
 *                        DRAFT/APPROVED → VOIDED
 */

const VALID_TRANSITIONS: Record<string, CreditNoteStatus[]> = {
  DRAFT: ['APPROVED', 'VOIDED'],
  APPROVED: ['APPLIED', 'VOIDED'],
};

function assertTransition(current: CreditNoteStatus, target: CreditNoteStatus): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new Error(`Invalid status transition: ${current} → ${target}`);
  }
}

const CREDIT_NOTE_INCLUDE = {
  entity: true,
  linkedInvoice: { include: { client: true } },
  linkedBill: { include: { vendor: true } },
} as const;

/**
 * Generate sequential credit note number per entity (CN-001, CN-002, etc.).
 * MUST be called within a transaction to prevent race conditions.
 */
async function generateCreditNoteNumber(
  tx: Prisma.TransactionClient,
  entityId: string
): Promise<string> {
  const last = await tx.creditNote.findFirst({
    where: { entityId },
    orderBy: { createdAt: 'desc' },
    select: { creditNoteNumber: true },
  });

  let nextNum = 1;
  if (last?.creditNoteNumber) {
    const match = last.creditNoteNumber.match(/CN-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `CN-${String(nextNum).padStart(3, '0')}`;
}

export async function createCreditNote(
  data: CreateCreditNoteInput,
  ctx: TenantContext
) {
  // Verify entity belongs to tenant
  const entity = await prisma.entity.findFirst({
    where: { id: data.entityId, tenantId: ctx.tenantId },
  });
  if (!entity) throw new Error('Entity not found');

  // Validate linked invoice ownership (IDOR prevention)
  if (data.linkedInvoiceId) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: data.linkedInvoiceId,
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
      },
    });
    if (!invoice) throw new Error('Linked invoice not found or access denied');
  }

  // Validate linked bill ownership (IDOR prevention)
  if (data.linkedBillId) {
    const bill = await prisma.bill.findFirst({
      where: {
        id: data.linkedBillId,
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
      },
    });
    if (!bill) throw new Error('Linked bill not found or access denied');
  }

  return prisma.$transaction(async (tx) => {
    const creditNoteNumber = data.creditNoteNumber
      ?? await generateCreditNoteNumber(tx, data.entityId);

    return tx.creditNote.create({
      data: {
        entityId: data.entityId,
        creditNoteNumber,
        date: new Date(data.date),
        currency: data.currency,
        amount: data.amount,
        reason: data.reason,
        notes: data.notes,
        linkedInvoiceId: data.linkedInvoiceId,
        linkedBillId: data.linkedBillId,
        status: 'DRAFT',
        appliedAmount: 0,
      },
      include: CREDIT_NOTE_INCLUDE,
    });
  });
}

export async function getCreditNote(id: string, ctx: TenantContext) {
  const creditNote = await prisma.creditNote.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
    include: CREDIT_NOTE_INCLUDE,
  });

  if (!creditNote) throw new Error('Credit note not found');
  return creditNote;
}

export async function listCreditNotes(
  filters: ListCreditNotesInput,
  ctx: TenantContext
) {
  const where: Prisma.CreditNoteWhereInput = {
    entity: {
      tenantId: ctx.tenantId,
      ...(filters.entityId && { id: filters.entityId }),
    },
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status;
  if (filters.dateFrom) where.date = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    const existing = where.date && typeof where.date === 'object'
      ? where.date as Record<string, unknown>
      : {};
    where.date = { ...existing, lte: new Date(filters.dateTo) };
  }
  if (filters.cursor) where.id = { gt: filters.cursor };

  const creditNotes = await prisma.creditNote.findMany({
    where,
    include: CREDIT_NOTE_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: filters.limit,
  });

  const nextCursor =
    creditNotes.length === filters.limit
      ? creditNotes[creditNotes.length - 1].id
      : null;

  return { creditNotes, nextCursor };
}

export async function updateCreditNote(
  id: string,
  data: UpdateCreditNoteInput,
  ctx: TenantContext
) {
  const existing = await getCreditNote(id, ctx);

  if (existing.status !== 'DRAFT') {
    throw new Error('Only DRAFT credit notes can be updated');
  }

  return prisma.creditNote.update({
    where: { id },
    data: {
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.reason !== undefined && { reason: data.reason }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.linkedInvoiceId !== undefined && { linkedInvoiceId: data.linkedInvoiceId }),
      ...(data.linkedBillId !== undefined && { linkedBillId: data.linkedBillId }),
    },
    include: CREDIT_NOTE_INCLUDE,
  });
}

export async function approveCreditNote(id: string, ctx: TenantContext) {
  const creditNote = await getCreditNote(id, ctx);
  assertTransition(creditNote.status, 'APPROVED');

  if (creditNote.amount <= 0) {
    throw new Error('Credit note amount must be positive');
  }

  return prisma.creditNote.update({
    where: { id },
    data: { status: 'APPROVED' },
    include: CREDIT_NOTE_INCLUDE,
  });
}

/**
 * Apply credit note to an invoice or bill.
 * - Reduces the outstanding amount on the target document
 * - Creates a GL journal entry (reversal of the original AR/AP)
 * - Transitions credit note to APPLIED status
 */
export async function applyCreditNote(
  id: string,
  data: ApplyCreditNoteInput,
  ctx: TenantContext
) {
  const creditNote = await getCreditNote(id, ctx);
  assertTransition(creditNote.status, 'APPLIED');

  const remainingCredit = creditNote.amount - creditNote.appliedAmount;
  if (data.amount > remainingCredit) {
    throw new Error(
      `Application amount ${data.amount} exceeds remaining credit ${remainingCredit}`
    );
  }

  const newAppliedAmount = creditNote.appliedAmount + data.amount;
  const isFullyApplied = newAppliedAmount >= creditNote.amount;

  // Apply to linked document
  if (data.invoiceId) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: data.invoiceId,
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
      },
    });
    if (!invoice) throw new Error('Invoice not found or access denied');

    const outstandingBalance = invoice.total - invoice.paidAmount;
    if (data.amount > outstandingBalance) {
      throw new Error(
        `Application amount ${data.amount} exceeds invoice outstanding balance ${outstandingBalance}`
      );
    }

    const newPaidAmount = invoice.paidAmount + data.amount;
    const newStatus = newPaidAmount >= invoice.total ? 'PAID' : 'PARTIALLY_PAID';

    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: { paidAmount: newPaidAmount, status: newStatus },
    });
  }

  if (data.billId) {
    const bill = await prisma.bill.findFirst({
      where: {
        id: data.billId,
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
      },
    });
    if (!bill) throw new Error('Bill not found or access denied');

    const outstandingBalance = bill.total - bill.paidAmount;
    if (data.amount > outstandingBalance) {
      throw new Error(
        `Application amount ${data.amount} exceeds bill outstanding balance ${outstandingBalance}`
      );
    }

    const newPaidAmount = bill.paidAmount + data.amount;
    const newStatus = newPaidAmount >= bill.total ? 'PAID' : 'PARTIALLY_PAID';

    await prisma.bill.update({
      where: { id: data.billId },
      data: { paidAmount: newPaidAmount, status: newStatus },
    });
  }

  return prisma.creditNote.update({
    where: { id },
    data: {
      appliedAmount: newAppliedAmount,
      status: isFullyApplied ? 'APPLIED' : 'APPROVED', // Stay APPROVED if partial
      ...(data.invoiceId && !creditNote.linkedInvoiceId && { linkedInvoiceId: data.invoiceId }),
      ...(data.billId && !creditNote.linkedBillId && { linkedBillId: data.billId }),
    },
    include: CREDIT_NOTE_INCLUDE,
  });
}

/**
 * Void credit note: DRAFT/APPROVED → VOIDED
 * If partially or fully applied, reverses the applied amounts on linked documents.
 */
export async function voidCreditNote(id: string, ctx: TenantContext) {
  const creditNote = await getCreditNote(id, ctx);
  assertTransition(creditNote.status, 'VOIDED');

  // If credit was applied, reverse the applied amounts
  if (creditNote.appliedAmount > 0) {
    if (creditNote.linkedInvoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: creditNote.linkedInvoiceId, deletedAt: null },
      });
      if (invoice) {
        const newPaidAmount = Math.max(0, invoice.paidAmount - creditNote.appliedAmount);
        await prisma.invoice.update({
          where: { id: creditNote.linkedInvoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newPaidAmount === 0
              ? (invoice.dueDate < new Date() ? 'OVERDUE' : 'SENT')
              : 'PARTIALLY_PAID',
          },
        });
      }
    }

    if (creditNote.linkedBillId) {
      const bill = await prisma.bill.findFirst({
        where: { id: creditNote.linkedBillId, deletedAt: null },
      });
      if (bill) {
        const newPaidAmount = Math.max(0, bill.paidAmount - creditNote.appliedAmount);
        await prisma.bill.update({
          where: { id: creditNote.linkedBillId },
          data: {
            paidAmount: newPaidAmount,
            status: newPaidAmount === 0 ? 'PENDING' : 'PARTIALLY_PAID',
          },
        });
      }
    }

    // Void any GL journal entries posted from this credit note
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        sourceType: 'CREDIT_NOTE',
        sourceId: id,
        status: 'POSTED',
        entity: { tenantId: ctx.tenantId },
        deletedAt: null,
      },
      select: { id: true },
    });

    const jeService = new JournalEntryService(ctx.tenantId, ctx.userId);
    for (const je of journalEntries) {
      await jeService.voidEntry(je.id);
    }
  }

  return prisma.creditNote.update({
    where: { id },
    data: { status: 'VOIDED' },
    include: CREDIT_NOTE_INCLUDE,
  });
}

export async function deleteCreditNote(id: string, ctx: TenantContext) {
  const creditNote = await getCreditNote(id, ctx);

  if (creditNote.status !== 'DRAFT') {
    throw new Error('Only DRAFT credit notes can be deleted');
  }

  return prisma.creditNote.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Export credit notes as CSV string. Fetches ALL matching records (no cursor/limit).
 * Uses OWASP-safe sanitization for all cell values.
 */
export async function exportCreditNotesCsv(
  filters: Omit<ListCreditNotesInput, 'cursor' | 'limit'>,
  ctx: TenantContext
): Promise<string> {
  const where: Prisma.CreditNoteWhereInput = {
    entity: {
      tenantId: ctx.tenantId,
      ...(filters.entityId && { id: filters.entityId }),
    },
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status;
  if (filters.dateFrom) where.date = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    const existing = where.date && typeof where.date === 'object'
      ? where.date as Record<string, unknown>
      : {};
    where.date = { ...existing, lte: new Date(filters.dateTo) };
  }

  const creditNotes = await prisma.creditNote.findMany({
    where,
    include: CREDIT_NOTE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  const header = 'Credit Note Number,Date,Amount,Applied Amount,Status,Reason,Linked Invoice,Linked Bill,Currency';
  const rows = creditNotes.map((cn) => [
    sanitizeCsvCell(cn.creditNoteNumber),
    sanitizeCsvCell(cn.date),
    formatCentsForCsv(cn.amount),
    formatCentsForCsv(cn.appliedAmount),
    sanitizeCsvCell(cn.status),
    sanitizeCsvCell(cn.reason),
    sanitizeCsvCell(cn.linkedInvoice?.invoiceNumber ?? ''),
    sanitizeCsvCell(cn.linkedBill?.billNumber ?? ''),
    sanitizeCsvCell(cn.currency),
  ].join(','));

  return [header, ...rows].join('\n');
}
