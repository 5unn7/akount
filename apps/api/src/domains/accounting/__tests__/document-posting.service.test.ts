import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountingError } from '../errors';
import { TENANT_ID, USER_ID, ENTITY_ID } from './helpers';
import { assertIntegerCents } from '../../../test-utils/financial-assertions';

// Mock Prisma — txClient simulates the transactional Prisma client
const mockInvoiceFindFirst = vi.fn();
const mockBillFindFirst = vi.fn();
const mockAllocationFindUnique = vi.fn();
const mockGLFindFirst = vi.fn();
const mockJECreate = vi.fn();
const mockJEFindFirst = vi.fn();
const mockFiscalPeriodFindFirst = vi.fn();

const txClient = {
  invoice: { findFirst: mockInvoiceFindFirst },
  bill: { findFirst: mockBillFindFirst },
  paymentAllocation: { findUnique: mockAllocationFindUnique },
  gLAccount: { findFirst: mockGLFindFirst },
  journalEntry: { create: mockJECreate, findFirst: mockJEFindFirst },
  fiscalPeriod: { findFirst: mockFiscalPeriodFindFirst },
};

vi.mock('@akount/db', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: unknown) => (fn as (tx: typeof txClient) => Promise<unknown>)(txClient)),
  },
  Prisma: {
    TransactionIsolationLevel: { Serializable: 'Serializable' },
  },
}));

vi.mock('../../../lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

// GL account IDs
const GL_AR = 'gl-ar-1200';
const GL_AP = 'gl-ap-2000';
const GL_TAX = 'gl-tax-2300';
const GL_REVENUE = 'gl-revenue-4000';
const GL_EXPENSE = 'gl-expense-5990';
const GL_BANK = 'gl-bank-1100';

function mockInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    entityId: ENTITY_ID,
    clientId: 'client-1',
    invoiceNumber: 'INV-001',
    issueDate: new Date('2026-01-15'),
    dueDate: new Date('2026-02-15'),
    currency: 'CAD',
    subtotal: 100000, // $1,000.00
    taxAmount: 13000,  // $130.00
    total: 113000,     // $1,130.00
    status: 'SENT',
    paidAmount: 0,
    client: { id: 'client-1', name: 'Acme Corp' },
    entity: { id: ENTITY_ID, name: 'My Company', functionalCurrency: 'CAD' },
    invoiceLines: [
      {
        id: 'line-1',
        description: 'Consulting services',
        quantity: 10,
        unitPrice: 10000,
        taxAmount: 13000,
        amount: 113000,
        glAccountId: GL_REVENUE,
        deletedAt: null,
      },
    ],
    ...overrides,
  };
}

function mockBillData(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bill-1',
    entityId: ENTITY_ID,
    vendorId: 'vendor-1',
    billNumber: 'BILL-001',
    issueDate: new Date('2026-01-10'),
    dueDate: new Date('2026-02-10'),
    currency: 'CAD',
    subtotal: 50000,  // $500.00
    taxAmount: 6500,  // $65.00
    total: 56500,     // $565.00
    status: 'PENDING',
    paidAmount: 0,
    vendor: { id: 'vendor-1', name: 'Office Supplies Inc' },
    entity: { id: ENTITY_ID, name: 'My Company', functionalCurrency: 'CAD' },
    billLines: [
      {
        id: 'bline-1',
        description: 'Printer paper',
        quantity: 5,
        unitPrice: 10000,
        taxAmount: 6500,
        amount: 56500,
        glAccountId: GL_EXPENSE,
        deletedAt: null,
      },
    ],
    ...overrides,
  };
}

// Helper to set up GL account resolution — matches by code in the where clause
function setupGLAccountLookups(accounts: Array<{ code: string; id: string }>) {
  const lookup = new Map(accounts.map(a => [a.code, a]));
  mockGLFindFirst.mockImplementation(async (args: { where: { code?: string } }) => {
    const code = args?.where?.code;
    if (code && lookup.has(code)) {
      const acc = lookup.get(code)!;
      return { id: acc.id, code: acc.code, name: `Account ${acc.code}` };
    }
    return null;
  });
}

const { DocumentPostingService } = await import('../services/document-posting.service');

describe('DocumentPostingService', () => {
  let service: InstanceType<typeof DocumentPostingService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentPostingService(TENANT_ID, USER_ID);

    // Default: no fiscal period locks, no existing JE
    mockFiscalPeriodFindFirst.mockResolvedValue(null);
    mockJEFindFirst.mockResolvedValue(null); // Not already posted

    // Default JE create returns valid structure
    mockJECreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: 'je-new-1',
      entryNumber: 'JE-001',
      journalLines: (args.data.journalLines as { create: Array<{ glAccountId: string; debitAmount: number; creditAmount: number }> }).create.map(
        (line: { glAccountId: string; debitAmount: number; creditAmount: number }, idx: number) => ({
          id: `jl-${idx}`,
          glAccountId: line.glAccountId,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
        })
      ),
    }));
  });

  // ─── Invoice Posting ─────────────────────────────────────────────

  describe('postInvoice', () => {
    it('should create balanced journal entry: DR AR, CR Revenue, CR Tax', async () => {
      mockInvoiceFindFirst.mockResolvedValueOnce(mockInvoice());
      setupGLAccountLookups([
        { code: '1200', id: GL_AR },
        { code: '2300', id: GL_TAX },
        { code: '4000', id: GL_REVENUE },
      ]);
      // generateEntryNumber lookup
      mockJEFindFirst
        .mockResolvedValueOnce(null)  // Not already posted
        .mockResolvedValueOnce(null); // No previous entry number

      const result = await service.postInvoice('inv-1');

      // Verify balanced: debits === credits
      const totalDebits = result.lines.reduce((s: number, l: { debitAmount: number }) => s + l.debitAmount, 0);
      const totalCredits = result.lines.reduce((s: number, l: { creditAmount: number }) => s + l.creditAmount, 0);
      expect(totalDebits).toBe(totalCredits);

      // Verify amounts are integer cents
      assertIntegerCents(result.amount, 'amount');
      expect(result.amount).toBe(113000);
    });

    it('should reject posting DRAFT invoice', async () => {
      mockInvoiceFindFirst.mockResolvedValueOnce(mockInvoice({ status: 'DRAFT' }));

      await expect(service.postInvoice('inv-1')).rejects.toThrow(
        'Cannot post DRAFT invoice'
      );
    });

    it('should reject double-posting', async () => {
      mockInvoiceFindFirst.mockResolvedValueOnce(mockInvoice());
      // Already posted
      mockJEFindFirst.mockResolvedValueOnce({ id: 'je-existing' });

      await expect(service.postInvoice('inv-1')).rejects.toThrow(
        'already posted'
      );
    });

    it('should reject if invoice not found', async () => {
      mockInvoiceFindFirst.mockResolvedValueOnce(null);

      await expect(service.postInvoice('inv-missing')).rejects.toThrow(
        'Invoice not found'
      );
    });

    it('should enforce fiscal period locks', async () => {
      mockInvoiceFindFirst.mockResolvedValueOnce(mockInvoice());
      mockJEFindFirst.mockResolvedValueOnce(null);
      // GL lookups
      setupGLAccountLookups([
        { code: '1200', id: GL_AR },
      ]);
      // Fiscal period is locked
      mockFiscalPeriodFindFirst.mockResolvedValueOnce({
        id: 'fp-1',
        name: 'January 2026',
        status: 'LOCKED',
      });

      await expect(service.postInvoice('inv-1')).rejects.toThrow(
        'fiscal period'
      );
    });

    it('should store source document with invoice snapshot', async () => {
      mockInvoiceFindFirst.mockResolvedValueOnce(mockInvoice());
      setupGLAccountLookups([
        { code: '1200', id: GL_AR },
        { code: '2300', id: GL_TAX },
        { code: '4000', id: GL_REVENUE },
      ]);
      mockJEFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await service.postInvoice('inv-1');

      const createArgs = mockJECreate.mock.calls[0][0];
      expect(createArgs.data.sourceType).toBe('INVOICE');
      expect(createArgs.data.sourceId).toBe('inv-1');
      expect(createArgs.data.sourceDocument).toBeDefined();
      const sourceDoc = createArgs.data.sourceDocument as Record<string, unknown>;
      expect(sourceDoc.invoiceNumber).toBe('INV-001');
      expect(sourceDoc.total).toBe(113000);
    });

    it('should use line glAccountId when provided, default when null', async () => {
      const invoice = mockInvoice({
        invoiceLines: [
          {
            id: 'line-1',
            description: 'Custom service',
            quantity: 1,
            unitPrice: 50000,
            taxAmount: 0,
            amount: 50000,
            glAccountId: 'gl-custom-revenue', // Custom GL account
            deletedAt: null,
          },
          {
            id: 'line-2',
            description: 'Misc',
            quantity: 1,
            unitPrice: 50000,
            taxAmount: 0,
            amount: 50000,
            glAccountId: null, // Should use default
            deletedAt: null,
          },
        ],
        subtotal: 100000,
        taxAmount: 0,
        total: 100000,
      });
      mockInvoiceFindFirst.mockResolvedValueOnce(invoice);
      setupGLAccountLookups([
        { code: '1200', id: GL_AR },
        { code: '2300', id: GL_TAX },
        { code: '4000', id: GL_REVENUE },
      ]);
      mockJEFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await service.postInvoice('inv-1');

      const createArgs = mockJECreate.mock.calls[0][0];
      const createdLines = createArgs.data.journalLines.create as Array<{
        glAccountId: string;
        debitAmount: number;
        creditAmount: number;
      }>;

      // Lines: [0] AR debit, [1] custom revenue, [2] default revenue (no tax since taxAmount=0)
      expect(createdLines).toHaveLength(3); // AR + 2 revenue lines, no tax line
      expect(createdLines[0].glAccountId).toBe(GL_AR);
      expect(createdLines[0].debitAmount).toBe(100000);

      // Line with custom GL account
      expect(createdLines[1].glAccountId).toBe('gl-custom-revenue');
      expect(createdLines[1].creditAmount).toBe(50000);

      // Line with default GL account
      expect(createdLines[2].glAccountId).toBe(GL_REVENUE);
      expect(createdLines[2].creditAmount).toBe(50000);
    });
  });

  // ─── Bill Posting ────────────────────────────────────────────────

  describe('postBill', () => {
    it('should create balanced journal entry: DR Expense, CR AP', async () => {
      mockBillFindFirst.mockResolvedValueOnce(mockBillData());
      setupGLAccountLookups([
        { code: '2000', id: GL_AP },
        { code: '2300', id: GL_TAX },
        { code: '5990', id: GL_EXPENSE },
      ]);
      mockJEFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.postBill('bill-1');

      const totalDebits = result.lines.reduce((s: number, l: { debitAmount: number }) => s + l.debitAmount, 0);
      const totalCredits = result.lines.reduce((s: number, l: { creditAmount: number }) => s + l.creditAmount, 0);
      expect(totalDebits).toBe(totalCredits);
      expect(result.amount).toBe(56500);
      assertIntegerCents(result.amount, 'amount');
    });

    it('should reject posting DRAFT bill', async () => {
      mockBillFindFirst.mockResolvedValueOnce(mockBillData({ status: 'DRAFT' }));

      await expect(service.postBill('bill-1')).rejects.toThrow(
        'Cannot post DRAFT bill'
      );
    });

    it('should reject double-posting bill', async () => {
      mockBillFindFirst.mockResolvedValueOnce(mockBillData());
      mockJEFindFirst.mockResolvedValueOnce({ id: 'je-existing' });

      await expect(service.postBill('bill-1')).rejects.toThrow(
        'already posted'
      );
    });

    it('should store BILL as sourceType', async () => {
      mockBillFindFirst.mockResolvedValueOnce(mockBillData());
      setupGLAccountLookups([
        { code: '2000', id: GL_AP },
        { code: '2300', id: GL_TAX },
        { code: '5990', id: GL_EXPENSE },
      ]);
      mockJEFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await service.postBill('bill-1');

      const createArgs = mockJECreate.mock.calls[0][0];
      expect(createArgs.data.sourceType).toBe('BILL');
      expect(createArgs.data.sourceId).toBe('bill-1');
    });
  });

  // ─── Payment Allocation Posting ──────────────────────────────────

  describe('postPaymentAllocation', () => {
    it('should create AR payment entry: DR Bank, CR AR', async () => {
      mockAllocationFindUnique.mockResolvedValueOnce({
        id: 'alloc-1',
        paymentId: 'pay-1',
        invoiceId: 'inv-1',
        billId: null,
        amount: 50000,
        payment: {
          entityId: ENTITY_ID,
          date: new Date('2026-02-01'),
          currency: 'CAD',
          paymentMethod: 'BANK_TRANSFER',
          reference: 'TXN-123',
          entity: { id: ENTITY_ID, tenantId: TENANT_ID, functionalCurrency: 'CAD' },
          client: { id: 'client-1', name: 'Acme Corp' },
          vendor: null,
        },
        invoice: { id: 'inv-1', invoiceNumber: 'INV-001' },
        bill: null,
      });

      // Bank GL account validation + AR account resolution via code lookup
      mockGLFindFirst.mockImplementation(async (args: { where: { id?: string; code?: string } }) => {
        if (args?.where?.id === GL_BANK) return { id: GL_BANK };
        if (args?.where?.code === '1200') return { id: GL_AR, code: '1200', name: 'AR' };
        return null;
      });

      mockJEFindFirst
        .mockResolvedValueOnce(null)  // Not already posted
        .mockResolvedValueOnce(null); // Entry number

      const result = await service.postPaymentAllocation('alloc-1', GL_BANK);

      expect(result.type).toBe('AR');
      expect(result.amount).toBe(50000);
      assertIntegerCents(result.amount, 'amount');

      // Verify balanced
      const totalDebits = result.lines.reduce((s: number, l: { debitAmount: number }) => s + l.debitAmount, 0);
      const totalCredits = result.lines.reduce((s: number, l: { creditAmount: number }) => s + l.creditAmount, 0);
      expect(totalDebits).toBe(totalCredits);
    });

    it('should create AP payment entry: DR AP, CR Bank', async () => {
      mockAllocationFindUnique.mockResolvedValueOnce({
        id: 'alloc-2',
        paymentId: 'pay-2',
        invoiceId: null,
        billId: 'bill-1',
        amount: 30000,
        payment: {
          entityId: ENTITY_ID,
          date: new Date('2026-02-05'),
          currency: 'CAD',
          paymentMethod: 'CHECK',
          reference: 'CHK-456',
          entity: { id: ENTITY_ID, tenantId: TENANT_ID, functionalCurrency: 'CAD' },
          client: null,
          vendor: { id: 'vendor-1', name: 'Supplier Co' },
        },
        invoice: null,
        bill: { id: 'bill-1', billNumber: 'BILL-001' },
      });

      // Bank GL account validation + AP account resolution via code lookup
      mockGLFindFirst.mockImplementation(async (args: { where: { id?: string; code?: string } }) => {
        if (args?.where?.id === GL_BANK) return { id: GL_BANK };
        if (args?.where?.code === '2000') return { id: GL_AP, code: '2000', name: 'AP' };
        return null;
      });

      mockJEFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.postPaymentAllocation('alloc-2', GL_BANK);

      expect(result.type).toBe('AP');
      expect(result.amount).toBe(30000);
    });

    it('should reject if allocation not found', async () => {
      mockAllocationFindUnique.mockResolvedValueOnce(null);

      await expect(
        service.postPaymentAllocation('alloc-missing', GL_BANK)
      ).rejects.toThrow('not found');
    });

    it('should enforce tenant isolation', async () => {
      mockAllocationFindUnique.mockResolvedValueOnce({
        id: 'alloc-other',
        paymentId: 'pay-other',
        invoiceId: 'inv-other',
        billId: null,
        amount: 10000,
        payment: {
          entityId: 'other-entity',
          date: new Date(),
          paymentMethod: 'BANK_TRANSFER',
          reference: null,
          entity: { id: 'other-entity', tenantId: 'other-tenant', functionalCurrency: 'CAD' },
          client: null,
          vendor: null,
        },
        invoice: { id: 'inv-other', invoiceNumber: 'INV-999' },
        bill: null,
      });

      await expect(
        service.postPaymentAllocation('alloc-other', GL_BANK)
      ).rejects.toThrow('not found');
    });

    it('should reject double-posting allocation', async () => {
      mockAllocationFindUnique.mockResolvedValueOnce({
        id: 'alloc-1',
        paymentId: 'pay-1',
        invoiceId: 'inv-1',
        billId: null,
        amount: 50000,
        payment: {
          entityId: ENTITY_ID,
          date: new Date(),
          paymentMethod: 'BANK_TRANSFER',
          reference: null,
          entity: { id: ENTITY_ID, tenantId: TENANT_ID, functionalCurrency: 'CAD' },
          client: { id: 'client-1', name: 'Acme' },
          vendor: null,
        },
        invoice: { id: 'inv-1', invoiceNumber: 'INV-001' },
        bill: null,
      });

      // Already posted
      mockJEFindFirst.mockResolvedValueOnce({ id: 'je-existing' });

      await expect(
        service.postPaymentAllocation('alloc-1', GL_BANK)
      ).rejects.toThrow('already posted');
    });
  });
});
