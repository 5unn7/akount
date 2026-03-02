import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as creditNoteService from '../credit-note.service';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';
import { mockPrisma, rewirePrismaMock } from '../../../../test-utils';

// ---------------------------------------------------------------------------
// Prisma mock (dynamic import bypasses vi.mock hoisting constraint)
// ---------------------------------------------------------------------------

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

vi.mock('../../../accounting/services/journal-entry.service', () => ({
  JournalEntryService: vi.fn().mockImplementation(() => ({
    voidEntry: vi.fn().mockResolvedValue(undefined),
  })),
}));

const TENANT_ID = 'tenant-test-123';
const ENTITY_ID = 'entity-test-456';
const INVOICE_ID = 'inv-test-789';
const BILL_ID = 'bill-test-101';

const mockTenantContext = {
  tenantId: TENANT_ID,
  userId: 'user-test-111',
  role: 'OWNER' as const,
};

function mockCreditNote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cn-1',
    creditNoteNumber: 'CN-001',
    entityId: ENTITY_ID,
    date: new Date('2026-01-15'),
    currency: 'CAD',
    amount: 50000, // $500.00
    appliedAmount: 0,
    reason: 'Product return',
    notes: null,
    linkedInvoiceId: null,
    linkedBillId: null,
    status: 'DRAFT',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    deletedAt: null,
    entity: { id: ENTITY_ID, name: 'Test Corp', tenantId: TENANT_ID },
    linkedInvoice: null,
    linkedBill: null,
    ...overrides,
  };
}

describe('CreditNoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  // --------------------------------------------------------------------------
  // createCreditNote
  // --------------------------------------------------------------------------
  describe('createCreditNote', () => {
    it('should verify entity belongs to tenant before creating', async () => {
      const entity = { id: ENTITY_ID, tenantId: TENANT_ID };
      mockPrisma.entity.findFirst.mockResolvedValueOnce(entity);

      const created = mockCreditNote();
      mockPrisma.creditNote.create.mockResolvedValueOnce(created);
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(null); // No prior CN for number gen

      await creditNoteService.createCreditNote(
        {
          entityId: ENTITY_ID,
          date: '2026-01-15',
          currency: 'CAD',
          amount: 50000,
          reason: 'Product return',
        },
        mockTenantContext
      );

      expect(mockPrisma.entity.findFirst).toHaveBeenCalledWith({
        where: { id: ENTITY_ID, tenantId: TENANT_ID },
      });
    });

    it('should reject when entity does not belong to tenant', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce(null);

      await expect(
        creditNoteService.createCreditNote(
          {
            entityId: 'foreign-entity',
            date: '2026-01-15',
            currency: 'CAD',
            amount: 50000,
            reason: 'Test',
          },
          mockTenantContext
        )
      ).rejects.toThrow('Entity not found');
    });

    it('should validate linked invoice ownership (IDOR prevention)', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce({ id: ENTITY_ID, tenantId: TENANT_ID });
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(null); // Invoice not found/wrong tenant

      await expect(
        creditNoteService.createCreditNote(
          {
            entityId: ENTITY_ID,
            date: '2026-01-15',
            currency: 'CAD',
            amount: 50000,
            reason: 'Credit for invoice',
            linkedInvoiceId: 'foreign-inv',
          },
          mockTenantContext
        )
      ).rejects.toThrow('Linked invoice not found or access denied');
    });

    it('should validate linked bill ownership (IDOR prevention)', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce({ id: ENTITY_ID, tenantId: TENANT_ID });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(null); // Bill not found/wrong tenant

      await expect(
        creditNoteService.createCreditNote(
          {
            entityId: ENTITY_ID,
            date: '2026-01-15',
            currency: 'CAD',
            amount: 50000,
            reason: 'Credit for bill',
            linkedBillId: 'foreign-bill',
          },
          mockTenantContext
        )
      ).rejects.toThrow('Linked bill not found or access denied');
    });

    it('should return integer cents for monetary fields', async () => {
      const entity = { id: ENTITY_ID, tenantId: TENANT_ID };
      mockPrisma.entity.findFirst.mockResolvedValueOnce(entity);

      const created = mockCreditNote({ amount: 75025 });
      mockPrisma.creditNote.create.mockResolvedValueOnce(created);
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(null);

      const result = await creditNoteService.createCreditNote(
        {
          entityId: ENTITY_ID,
          date: '2026-01-15',
          currency: 'CAD',
          amount: 75025,
          reason: 'Partial refund',
        },
        mockTenantContext
      );

      assertIntegerCents(result.amount);
      assertIntegerCents(result.appliedAmount);
    });
  });

  // --------------------------------------------------------------------------
  // getCreditNote
  // --------------------------------------------------------------------------
  describe('getCreditNote', () => {
    it('should filter by tenantId and deletedAt', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(mockCreditNote());

      await creditNoteService.getCreditNote('cn-1', mockTenantContext);

      expect(mockPrisma.creditNote.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'cn-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: expect.objectContaining({ entity: true }),
      });
    });

    it('should throw when credit note not found (cross-tenant)', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(null);

      await expect(
        creditNoteService.getCreditNote('cn-foreign', mockTenantContext)
      ).rejects.toThrow('Credit note not found');
    });
  });

  // --------------------------------------------------------------------------
  // listCreditNotes
  // --------------------------------------------------------------------------
  describe('listCreditNotes', () => {
    it('should filter by tenantId and return cursor pagination', async () => {
      const cns = [
        mockCreditNote({ id: 'cn-1' }),
        mockCreditNote({ id: 'cn-2', creditNoteNumber: 'CN-002' }),
      ];
      mockPrisma.creditNote.findMany.mockResolvedValueOnce(cns);

      const result = await creditNoteService.listCreditNotes(
        { limit: 25 },
        mockTenantContext
      );

      expect(result.creditNotes).toHaveLength(2);
      expect(result.nextCursor).toBeNull(); // Less than limit
    });

    it('should return nextCursor when results equal limit', async () => {
      const cns = [mockCreditNote({ id: 'cn-last' })];
      mockPrisma.creditNote.findMany.mockResolvedValueOnce(cns);

      const result = await creditNoteService.listCreditNotes(
        { limit: 1 },
        mockTenantContext
      );

      expect(result.nextCursor).toBe('cn-last');
    });

    it('should apply status filter', async () => {
      mockPrisma.creditNote.findMany.mockResolvedValueOnce([]);

      await creditNoteService.listCreditNotes(
        { limit: 25, status: 'APPROVED' },
        mockTenantContext
      );

      expect(mockPrisma.creditNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // updateCreditNote
  // --------------------------------------------------------------------------
  describe('updateCreditNote', () => {
    it('should allow updates on DRAFT credit notes', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(mockCreditNote());
      mockPrisma.creditNote.update.mockResolvedValueOnce(
        mockCreditNote({ reason: 'Updated reason' })
      );

      const result = await creditNoteService.updateCreditNote(
        'cn-1',
        { reason: 'Updated reason' },
        mockTenantContext
      );

      expect(result.reason).toBe('Updated reason');
    });

    it('should reject updates on non-DRAFT credit notes', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPROVED' })
      );

      await expect(
        creditNoteService.updateCreditNote(
          'cn-1',
          { reason: 'Too late' },
          mockTenantContext
        )
      ).rejects.toThrow('Only DRAFT credit notes can be updated');
    });
  });

  // --------------------------------------------------------------------------
  // Status Transitions
  // --------------------------------------------------------------------------
  describe('approveCreditNote', () => {
    it('should transition DRAFT → APPROVED', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'DRAFT', amount: 50000 })
      );
      mockPrisma.creditNote.update.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPROVED' })
      );

      const result = await creditNoteService.approveCreditNote('cn-1', mockTenantContext);
      expect(result.status).toBe('APPROVED');
    });

    it('should reject approval of zero-amount credit note', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'DRAFT', amount: 0 })
      );

      await expect(
        creditNoteService.approveCreditNote('cn-1', mockTenantContext)
      ).rejects.toThrow('Credit note amount must be positive');
    });

    it('should reject invalid transition APPLIED → APPROVED', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPLIED', amount: 50000 })
      );

      await expect(
        creditNoteService.approveCreditNote('cn-1', mockTenantContext)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  // --------------------------------------------------------------------------
  // applyCreditNote
  // --------------------------------------------------------------------------
  describe('applyCreditNote', () => {
    it('should apply credit note to invoice and update paidAmount', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPROVED', amount: 50000, appliedAmount: 0 })
      );

      const invoice = {
        id: INVOICE_ID,
        total: 100000,
        paidAmount: 0,
        deletedAt: null,
        entity: { tenantId: TENANT_ID },
      };
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);
      mockPrisma.invoice.update.mockResolvedValueOnce({});
      mockPrisma.creditNote.update.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPLIED', appliedAmount: 50000 })
      );

      const result = await creditNoteService.applyCreditNote(
        'cn-1',
        { invoiceId: INVOICE_ID, amount: 50000 },
        mockTenantContext
      );

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
        where: { id: INVOICE_ID },
        data: { paidAmount: 50000, status: 'PARTIALLY_PAID' },
      });
      assertIntegerCents(result.appliedAmount);
    });

    it('should reject when application exceeds remaining credit', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPROVED', amount: 50000, appliedAmount: 30000 })
      );

      await expect(
        creditNoteService.applyCreditNote(
          'cn-1',
          { invoiceId: INVOICE_ID, amount: 30000 },
          mockTenantContext
        )
      ).rejects.toThrow('exceeds remaining credit');
    });

    it('should reject when application exceeds invoice outstanding balance', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPROVED', amount: 100000, appliedAmount: 0 })
      );

      const invoice = {
        id: INVOICE_ID,
        total: 50000,
        paidAmount: 40000, // Only $100 outstanding
        deletedAt: null,
        entity: { tenantId: TENANT_ID },
      };
      mockPrisma.invoice.findFirst.mockResolvedValueOnce(invoice);

      await expect(
        creditNoteService.applyCreditNote(
          'cn-1',
          { invoiceId: INVOICE_ID, amount: 20000 },
          mockTenantContext
        )
      ).rejects.toThrow('exceeds invoice outstanding balance');
    });

    it('should apply credit note to bill', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPROVED', amount: 50000, appliedAmount: 0 })
      );

      const bill = {
        id: BILL_ID,
        total: 80000,
        paidAmount: 0,
        deletedAt: null,
        entity: { tenantId: TENANT_ID },
      };
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);
      mockPrisma.bill.update.mockResolvedValueOnce({});
      mockPrisma.creditNote.update.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPLIED', appliedAmount: 50000, linkedBillId: BILL_ID })
      );

      await creditNoteService.applyCreditNote(
        'cn-1',
        { billId: BILL_ID, amount: 50000 },
        mockTenantContext
      );

      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: BILL_ID },
        data: { paidAmount: 50000, status: 'PARTIALLY_PAID' },
      });
    });
  });

  // --------------------------------------------------------------------------
  // voidCreditNote
  // --------------------------------------------------------------------------
  describe('voidCreditNote', () => {
    it('should void DRAFT credit note', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'DRAFT', appliedAmount: 0 })
      );
      mockPrisma.creditNote.update.mockResolvedValueOnce(
        mockCreditNote({ status: 'VOIDED' })
      );

      const result = await creditNoteService.voidCreditNote('cn-1', mockTenantContext);
      expect(result.status).toBe('VOIDED');
    });

    it('should void APPROVED credit note', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPROVED', appliedAmount: 0 })
      );
      mockPrisma.creditNote.update.mockResolvedValueOnce(
        mockCreditNote({ status: 'VOIDED' })
      );

      const result = await creditNoteService.voidCreditNote('cn-1', mockTenantContext);
      expect(result.status).toBe('VOIDED');
    });

    it('should reject voiding an APPLIED credit note', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPLIED' })
      );

      await expect(
        creditNoteService.voidCreditNote('cn-1', mockTenantContext)
      ).rejects.toThrow('Invalid status transition');
    });

    it('should reject voiding an already VOIDED credit note', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'VOIDED' })
      );

      await expect(
        creditNoteService.voidCreditNote('cn-1', mockTenantContext)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  // --------------------------------------------------------------------------
  // deleteCreditNote (soft delete)
  // --------------------------------------------------------------------------
  describe('deleteCreditNote', () => {
    it('should soft delete DRAFT credit note', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'DRAFT' })
      );
      const deletedAt = new Date();
      mockPrisma.creditNote.update.mockResolvedValueOnce(
        mockCreditNote({ deletedAt })
      );

      const result = await creditNoteService.deleteCreditNote('cn-1', mockTenantContext);
      expect(result.deletedAt).toBeTruthy();
    });

    it('should reject deletion of non-DRAFT credit notes', async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValueOnce(
        mockCreditNote({ status: 'APPROVED' })
      );

      await expect(
        creditNoteService.deleteCreditNote('cn-1', mockTenantContext)
      ).rejects.toThrow('Only DRAFT credit notes can be deleted');
    });
  });

  // --------------------------------------------------------------------------
  // exportCreditNotesCsv
  // --------------------------------------------------------------------------
  describe('exportCreditNotesCsv', () => {
    it('should return CSV with header row and data rows', async () => {
      mockPrisma.creditNote.findMany.mockResolvedValueOnce([
        mockCreditNote({
          creditNoteNumber: 'CN-001',
          amount: 50000,
          appliedAmount: 25000,
          status: 'APPROVED',
          linkedInvoice: { invoiceNumber: 'INV-001' },
          linkedBill: null,
        }),
      ]);

      const csv = await creditNoteService.exportCreditNotesCsv(
        {},
        mockTenantContext
      );

      expect(csv).toContain('Credit Note Number');
      expect(csv).toContain('CN-001');
      expect(csv).toContain('500.00'); // 50000 cents → $500.00
      expect(csv).toContain('INV-001');
    });

    it('should filter by tenant and deletedAt', async () => {
      mockPrisma.creditNote.findMany.mockResolvedValueOnce([]);

      await creditNoteService.exportCreditNotesCsv({}, mockTenantContext);

      expect(mockPrisma.creditNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: expect.objectContaining({ tenantId: TENANT_ID }),
            deletedAt: null,
          }),
        })
      );
    });
  });
});
