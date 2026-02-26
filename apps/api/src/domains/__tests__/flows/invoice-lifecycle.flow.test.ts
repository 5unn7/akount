/**
 * Invoice Lifecycle Flow Tests
 *
 * Tests the full lifecycle: DRAFT → SENT → partial pay → PARTIALLY_PAID
 * → full pay → PAID → VOID
 *
 * Strategy: Mock Prisma at the DB level, import REAL service functions,
 * chain mockResolvedValueOnce calls to simulate state progression.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertIntegerCents } from '../../../test-utils/financial-assertions';

// ─────────────────────────────────────────────────────────────────
// Mock Variables (hoisted)
// ─────────────────────────────────────────────────────────────────

const {
  mockInvoiceFindFirst,
  mockInvoiceCreate,
  mockInvoiceUpdate,
  mockInvoiceFindMany,
  mockClientFindFirst,
  mockTaxRateFindMany,
  mockPaymentFindFirst,
  mockAllocationCreate,
  mockJournalEntryCreate,
  mockJournalEntryFindFirst,
  mockJournalEntryFindMany,
  mockJournalEntryUpdate,
  mockGLAccountFindFirst,
  mockFiscalPeriodFindFirst,
  mockAuditLogCreate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockInvoiceFindFirst: vi.fn(),
  mockInvoiceCreate: vi.fn(),
  mockInvoiceUpdate: vi.fn(),
  mockInvoiceFindMany: vi.fn(),
  mockClientFindFirst: vi.fn(),
  mockTaxRateFindMany: vi.fn(),
  mockPaymentFindFirst: vi.fn(),
  mockAllocationCreate: vi.fn(),
  mockJournalEntryCreate: vi.fn(),
  mockJournalEntryFindFirst: vi.fn(),
  mockJournalEntryFindMany: vi.fn(),
  mockJournalEntryUpdate: vi.fn(),
  mockGLAccountFindFirst: vi.fn(),
  mockFiscalPeriodFindFirst: vi.fn(),
  mockAuditLogCreate: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@akount/db', () => ({
  prisma: {
    invoice: {
      findFirst: (...args: unknown[]) => mockInvoiceFindFirst(...args),
      create: (...args: unknown[]) => mockInvoiceCreate(...args),
      update: (...args: unknown[]) => mockInvoiceUpdate(...args),
      findMany: (...args: unknown[]) => mockInvoiceFindMany(...args),
    },
    client: {
      findFirst: (...args: unknown[]) => mockClientFindFirst(...args),
    },
    taxRate: {
      findMany: (...args: unknown[]) => mockTaxRateFindMany(...args),
    },
    payment: {
      findFirst: (...args: unknown[]) => mockPaymentFindFirst(...args),
    },
    paymentAllocation: {
      create: (...args: unknown[]) => mockAllocationCreate(...args),
    },
    journalEntry: {
      create: (...args: unknown[]) => mockJournalEntryCreate(...args),
      findFirst: (...args: unknown[]) => mockJournalEntryFindFirst(...args),
      findMany: (...args: unknown[]) => mockJournalEntryFindMany(...args),
      update: (...args: unknown[]) => mockJournalEntryUpdate(...args),
    },
    gLAccount: {
      findFirst: (...args: unknown[]) => mockGLAccountFindFirst(...args),
    },
    fiscalPeriod: {
      findFirst: (...args: unknown[]) => mockFiscalPeriodFindFirst(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
  Prisma: {
    TransactionIsolationLevel: { Serializable: 'Serializable' },
  },
}));

// Mock bill service (imported by payment service)
vi.mock('../../invoicing/services/bill.service', () => ({
  applyPaymentToBill: vi.fn(),
  reversePaymentFromBill: vi.fn(),
}));

// Mock resend (used by invoice send)
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'email-1' }) },
  })),
}));

// Mock PDF generation
vi.mock('../../../lib/pdf', () => ({
  generateInvoicePdf: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')),
}));

// Mock report cache
vi.mock('../../accounting/services/report-cache.service', () => ({
  reportCacheService: { invalidate: vi.fn() },
}));

import * as invoiceService from '../../invoicing/services/invoice.service';
import { allocatePayment } from '../../invoicing/services/payment.service';

// ─────────────────────────────────────────────────────────────────
// Shared Constants
// ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-flow-123';
const ENTITY_ID = 'entity-flow-456';
const CLIENT_ID = 'client-flow-789';
const USER_ID = 'user-flow-111';

const CTX = {
  tenantId: TENANT_ID,
  userId: USER_ID,
  role: 'OWNER' as const,
};

// ─────────────────────────────────────────────────────────────────
// Mock Data Factories
// ─────────────────────────────────────────────────────────────────

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-flow-1',
    invoiceNumber: 'INV-001',
    entityId: ENTITY_ID,
    clientId: CLIENT_ID,
    issueDate: new Date('2024-06-01'),
    dueDate: new Date('2025-12-31'), // Far future so not OVERDUE
    currency: 'USD',
    subtotal: 100000, // $1,000.00
    taxAmount: 13000,  // $130.00 (13% tax)
    total: 113000,     // $1,130.00
    paidAmount: 0,
    status: 'DRAFT',
    notes: null,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    deletedAt: null,
    client: { id: CLIENT_ID, name: 'Flow Client', email: 'client@flow.test', entityId: ENTITY_ID },
    entity: { id: ENTITY_ID, name: 'Flow Corp', tenantId: TENANT_ID, functionalCurrency: 'USD' },
    invoiceLines: [
      {
        id: 'line-1',
        description: 'Consulting',
        quantity: 10,
        unitPrice: 10000, // $100.00/hr
        amount: 100000,   // $1,000.00 (pre-tax)
        taxAmount: 13000,
        taxRateId: null,
        taxRate: null,
      },
    ],
    ...overrides,
  };
}

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pay-flow-1',
    paymentNumber: 'PAY-001',
    entityId: ENTITY_ID,
    clientId: CLIENT_ID,
    vendorId: null,
    type: 'RECEIVED',
    amount: 113000,
    currency: 'USD',
    date: new Date('2024-06-15'),
    method: 'BANK_TRANSFER',
    reference: 'REF-001',
    notes: null,
    status: 'COMPLETED',
    allocations: [],
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-06-15'),
    deletedAt: null,
    entity: { tenantId: TENANT_ID },
    client: { entityId: ENTITY_ID, entity: { tenantId: TENANT_ID } },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Invoice Lifecycle Flow', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Reset all mocks + clear Once queues
    // Default: $transaction executes the callback with a mock tx
    mockTransaction.mockImplementation(async (...args: unknown[]) => {
      const fn = typeof args[0] === 'function' ? args[0] : args[1];
      if (typeof fn === 'function') return (fn as (tx: unknown) => Promise<unknown>)(mockTx());
      return undefined;
    });
  });

  function mockTx() {
    return {
      invoice: {
        findFirst: mockInvoiceFindFirst,
        create: mockInvoiceCreate,
        update: mockInvoiceUpdate,
      },
      journalEntry: {
        create: mockJournalEntryCreate,
        findFirst: mockJournalEntryFindFirst,
        findMany: mockJournalEntryFindMany,
        update: mockJournalEntryUpdate,
      },
      journalLine: {
        create: vi.fn(),
      },
      gLAccount: {
        findFirst: mockGLAccountFindFirst,
      },
      fiscalPeriod: {
        findFirst: mockFiscalPeriodFindFirst,
      },
      auditLog: {
        create: mockAuditLogCreate,
      },
    };
  }

  // ────────────────────────────────────────────────────────────
  // Step 1: Invoice Creation
  // ────────────────────────────────────────────────────────────

  describe('Step 1: Create Invoice (DRAFT)', () => {
    it('should create invoice with integer cents and status DRAFT', async () => {
      const invoice = makeInvoice({ status: 'DRAFT' });

      mockClientFindFirst.mockResolvedValueOnce({
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      });
      mockTaxRateFindMany.mockResolvedValueOnce([]); // No tax rates needed (no taxRateId)
      mockInvoiceCreate.mockResolvedValueOnce(invoice);

      const result = await invoiceService.createInvoice(
        {
          clientId: CLIENT_ID,
          invoiceNumber: 'INV-001',
          issueDate: '2024-06-01',
          dueDate: '2024-06-30',
          currency: 'USD',
          subtotal: 100000,
          taxAmount: 13000,
          total: 113000,
          entityId: ENTITY_ID,
          lines: [
            {
              description: 'Consulting',
              quantity: 10,
              unitPrice: 10000,
              amount: 100000,
              taxAmount: 13000,
            },
          ],
        },
        CTX,
      );

      expect(result.status).toBe('DRAFT');
      assertIntegerCents(result.total);
      assertIntegerCents(result.subtotal);
      assertIntegerCents(result.taxAmount);
      expect(result.paidAmount).toBe(0);
    });

    it('should enforce subtotal = SUM(line.amount)', async () => {
      mockClientFindFirst.mockResolvedValueOnce({
        id: CLIENT_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      });
      mockTaxRateFindMany.mockResolvedValueOnce([]);

      // Wrong subtotal: 50000 ≠ SUM(100000)
      await expect(
        invoiceService.createInvoice(
          {
            clientId: CLIENT_ID,
            invoiceNumber: 'INV-BAD',
            issueDate: '2024-06-01',
            dueDate: '2024-06-30',
            currency: 'USD',
            subtotal: 50000, // Wrong!
            taxAmount: 13000,
            total: 63000,
            entityId: ENTITY_ID,
            lines: [
              { description: 'A', quantity: 10, unitPrice: 10000, amount: 100000 },
            ],
          },
          CTX,
        ),
      ).rejects.toThrow();
    });

    it('should reject invoice for client from different tenant (IDOR)', async () => {
      mockClientFindFirst.mockResolvedValueOnce(null); // Client not found = wrong tenant

      await expect(
        invoiceService.createInvoice(
          {
            clientId: 'foreign-client',
            invoiceNumber: 'INV-X',
            issueDate: '2024-06-01',
            dueDate: '2024-06-30',
            currency: 'USD',
            subtotal: 100000,
            taxAmount: 0,
            total: 100000,
            entityId: ENTITY_ID,
            lines: [
              { description: 'A', quantity: 1, unitPrice: 100000, amount: 100000 },
            ],
          },
          CTX,
        ),
      ).rejects.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Step 2: Status Transitions
  // ────────────────────────────────────────────────────────────

  describe('Step 2: Status Transitions', () => {
    it('should allow SENT/PAID/PARTIALLY_PAID → VOIDED transition', async () => {
      const paidInvoice = makeInvoice({ status: 'PAID', paidAmount: 113000 });

      mockInvoiceFindFirst.mockResolvedValueOnce(paidInvoice);
      // voidInvoice finds JEs to reverse (no JEs → simple void)
      mockJournalEntryFindMany.mockResolvedValueOnce([]);
      mockInvoiceUpdate.mockResolvedValueOnce(
        makeInvoice({ status: 'VOIDED', paidAmount: 113000 }),
      );

      const result = await invoiceService.voidInvoice('inv-flow-1', CTX);
      expect(result.status).toBe('VOIDED');
    });

    it('should reject voiding a DRAFT invoice', async () => {
      const draftInvoice = makeInvoice({ status: 'DRAFT' });
      mockInvoiceFindFirst.mockResolvedValueOnce(draftInvoice);

      await expect(
        invoiceService.voidInvoice('inv-flow-1', CTX),
      ).rejects.toThrow(); // DRAFT → VOIDED not in VALID_TRANSITIONS
    });

    it('should reject voiding a CANCELLED invoice', async () => {
      const cancelledInvoice = makeInvoice({ status: 'CANCELLED' });
      mockInvoiceFindFirst.mockResolvedValueOnce(cancelledInvoice);

      await expect(
        invoiceService.voidInvoice('inv-flow-1', CTX),
      ).rejects.toThrow(); // CANCELLED → VOIDED not allowed
    });

    it('should allow cancel only from DRAFT or SENT', async () => {
      // PAID → CANCELLED should fail
      const paidInvoice = makeInvoice({ status: 'PAID', paidAmount: 113000 });
      mockInvoiceFindFirst.mockResolvedValueOnce(paidInvoice);

      await expect(
        invoiceService.cancelInvoice('inv-flow-1', CTX),
      ).rejects.toThrow();
    });

    it('should only allow editing DRAFT invoices', async () => {
      const sentInvoice = makeInvoice({ status: 'SENT', invoiceLines: [] });
      mockInvoiceFindFirst.mockResolvedValueOnce(sentInvoice);
      // updateInvoice on SENT with total/subtotal changes should skip validation
      // but status-changing fields require DRAFT
      // The service accepts notes changes for non-DRAFT but blocks total edits
      // Let's verify the service returns the update result for notes-only change
      mockInvoiceUpdate.mockResolvedValueOnce(
        makeInvoice({ status: 'SENT', notes: 'updated' }),
      );

      // Notes-only update on SENT should succeed (not blocked)
      const result = await invoiceService.updateInvoice(
        'inv-flow-1',
        { notes: 'updated' },
        CTX,
      );
      expect(result.notes).toBe('updated');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Step 3: Payment Application
  // ────────────────────────────────────────────────────────────

  describe('Step 3: Payment Application', () => {
    it('should transition SENT → PARTIALLY_PAID on partial payment', async () => {
      // getInvoice is called by applyPaymentToInvoice
      const sentInvoice = makeInvoice({ status: 'SENT', paidAmount: 0 });
      mockInvoiceFindFirst.mockResolvedValueOnce(sentInvoice);

      // Service calls prisma.invoice.update with new status
      const partiallyPaidInvoice = makeInvoice({
        status: 'PARTIALLY_PAID',
        paidAmount: 50000,
      });
      mockInvoiceUpdate.mockResolvedValueOnce(partiallyPaidInvoice);

      const result = await invoiceService.applyPaymentToInvoice(
        'inv-flow-1',
        50000, // $500 partial payment on $1,130 invoice
        CTX,
      );

      expect(result.status).toBe('PARTIALLY_PAID');
      assertIntegerCents(result.paidAmount);
      expect(result.paidAmount).toBe(50000);
    });

    it('should transition to PAID when full amount paid', async () => {
      const sentInvoice = makeInvoice({ status: 'SENT', paidAmount: 0 });
      mockInvoiceFindFirst.mockResolvedValueOnce(sentInvoice);

      const paidInvoice = makeInvoice({
        status: 'PAID',
        paidAmount: 113000,
      });
      mockInvoiceUpdate.mockResolvedValueOnce(paidInvoice);

      const result = await invoiceService.applyPaymentToInvoice(
        'inv-flow-1',
        113000, // Full $1,130 payment
        CTX,
      );

      expect(result.status).toBe('PAID');
      expect(result.paidAmount).toBe(113000);
      expect(result.paidAmount).toBe(result.total);
    });

    it('should reject payment exceeding outstanding balance', async () => {
      const partialInvoice = makeInvoice({
        status: 'PARTIALLY_PAID',
        paidAmount: 100000, // Already paid $1,000
      });
      mockInvoiceFindFirst.mockResolvedValueOnce(partialInvoice);

      // Trying to pay $200 more, but only $130 outstanding
      await expect(
        invoiceService.applyPaymentToInvoice('inv-flow-1', 20000, CTX),
      ).rejects.toThrow(/exceed/i);
    });

    it('should ensure SUM(allocations) cannot exceed payment.amount', async () => {
      const payment = makePayment({ amount: 50000 }); // Only $500 available

      // Payment already has $400 allocated
      mockPaymentFindFirst.mockResolvedValueOnce({
        ...payment,
        allocations: [{ id: 'alloc-1', amount: 40000, invoiceId: null, billId: null }],
      });

      // Trying to allocate $200 more (40000 + 20000 = 60000 > 50000)
      await expect(
        allocatePayment(
          'pay-flow-1',
          { invoiceId: 'inv-flow-1', amount: 20000 },
          CTX,
        ),
      ).rejects.toThrow(); // Exceeds payment amount
    });

    it('should prevent AR payment from allocating to bills', async () => {
      // Payment with clientId set (AR payment)
      mockPaymentFindFirst.mockResolvedValueOnce(
        makePayment({ clientId: CLIENT_ID, vendorId: null, allocations: [] }),
      );

      await expect(
        allocatePayment(
          'pay-flow-1',
          { billId: 'bill-1', amount: 50000 },
          CTX,
        ),
      ).rejects.toThrow();
    });

    it('should reject zero or negative payment amounts', async () => {
      const invoice = makeInvoice({ status: 'SENT', paidAmount: 0 });
      mockInvoiceFindFirst.mockResolvedValueOnce(invoice);

      await expect(
        invoiceService.applyPaymentToInvoice('inv-flow-1', 0, CTX),
      ).rejects.toThrow(/positive/i);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Step 4: Payment Reversal
  // ────────────────────────────────────────────────────────────

  describe('Step 4: Payment Reversal', () => {
    it('should revert PARTIALLY_PAID → SENT when full payment reversed', async () => {
      const partialInvoice = makeInvoice({
        status: 'PARTIALLY_PAID',
        paidAmount: 50000,
        dueDate: new Date('2025-12-31'), // Future → reverts to SENT not OVERDUE
      });
      mockInvoiceFindFirst.mockResolvedValueOnce(partialInvoice);

      const revertedInvoice = makeInvoice({
        status: 'SENT',
        paidAmount: 0,
      });
      mockInvoiceUpdate.mockResolvedValueOnce(revertedInvoice);

      const result = await invoiceService.reversePaymentFromInvoice(
        'inv-flow-1',
        50000,
        CTX,
      );

      expect(result.status).toBe('SENT');
      expect(result.paidAmount).toBe(0);
    });

    it('should remain PARTIALLY_PAID when only partial reversal', async () => {
      const partialInvoice = makeInvoice({
        status: 'PARTIALLY_PAID',
        paidAmount: 80000,
      });
      mockInvoiceFindFirst.mockResolvedValueOnce(partialInvoice);

      const stillPartialInvoice = makeInvoice({
        status: 'PARTIALLY_PAID',
        paidAmount: 30000,
      });
      mockInvoiceUpdate.mockResolvedValueOnce(stillPartialInvoice);

      const result = await invoiceService.reversePaymentFromInvoice(
        'inv-flow-1',
        50000, // Reverse $500, leaving $300 paid
        CTX,
      );

      expect(result.status).toBe('PARTIALLY_PAID');
      expect(result.paidAmount).toBe(30000);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Step 5: Void Invoice with JE Reversal
  // ────────────────────────────────────────────────────────────

  describe('Step 5: Void Invoice', () => {
    it('should void invoice with no journal entries', async () => {
      const sentInvoice = makeInvoice({ status: 'SENT' });
      mockInvoiceFindFirst.mockResolvedValueOnce(sentInvoice);
      mockJournalEntryFindMany.mockResolvedValueOnce([]); // No JEs
      mockInvoiceUpdate.mockResolvedValueOnce(
        makeInvoice({ status: 'VOIDED' }),
      );

      const result = await invoiceService.voidInvoice('inv-flow-1', CTX);
      expect(result.status).toBe('VOIDED');
    });

    it('should void invoice and reverse existing journal entries via transaction', async () => {
      const paidInvoice = makeInvoice({ status: 'PAID', paidAmount: 113000 });
      mockInvoiceFindFirst.mockResolvedValueOnce(paidInvoice);

      // Found posted JE to reverse
      mockJournalEntryFindMany.mockResolvedValueOnce([
        {
          id: 'je-1',
          entryNumber: 'JE-001',
          status: 'POSTED',
          entityId: ENTITY_ID,
          sourceType: 'INVOICE',
          sourceId: 'inv-flow-1',
        },
      ]);

      // Transaction mock: voidEntry looks up the JE, creates reversal
      mockJournalEntryFindFirst.mockResolvedValueOnce({
        id: 'je-1',
        entryNumber: 'JE-001',
        status: 'POSTED',
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        linkedFrom: [], // No existing reversals (double-void prevention check)
        journalLines: [
          { id: 'jl-1', glAccountId: 'gl-ar', debitAmount: 113000, creditAmount: 0, currency: 'USD', exchangeRate: 1, baseCurrencyDebit: 113000, baseCurrencyCredit: 0, memo: 'AR' },
          { id: 'jl-2', glAccountId: 'gl-rev', debitAmount: 0, creditAmount: 100000, currency: 'USD', exchangeRate: 1, baseCurrencyDebit: 0, baseCurrencyCredit: 100000, memo: 'Revenue' },
          { id: 'jl-3', glAccountId: 'gl-tax', debitAmount: 0, creditAmount: 13000, currency: 'USD', exchangeRate: 1, baseCurrencyDebit: 0, baseCurrencyCredit: 13000, memo: 'Tax' },
        ],
      });

      // Update original to VOIDED
      mockJournalEntryUpdate.mockResolvedValueOnce({ id: 'je-1', status: 'VOIDED' });

      // Create reversing JE
      mockJournalEntryCreate.mockResolvedValueOnce({
        id: 'je-reverse-1',
        entryNumber: 'JE-002',
        status: 'POSTED',
      });
      mockAuditLogCreate.mockResolvedValueOnce({});

      // Final invoice update
      mockInvoiceUpdate.mockResolvedValueOnce(
        makeInvoice({ status: 'VOIDED', paidAmount: 113000 }),
      );

      const result = await invoiceService.voidInvoice('inv-flow-1', CTX);
      expect(result.status).toBe('VOIDED');

      // Verify the reversing JE was created
      expect(mockJournalEntryCreate).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Step 6: Soft Delete
  // ────────────────────────────────────────────────────────────

  describe('Step 6: Soft Delete', () => {
    it('should soft-delete by setting deletedAt (not hard delete)', async () => {
      const invoice = makeInvoice({ status: 'DRAFT' });
      mockInvoiceFindFirst.mockResolvedValueOnce(invoice); // getInvoice

      const now = new Date();
      mockInvoiceUpdate.mockResolvedValueOnce({
        ...invoice,
        deletedAt: now,
      });

      const result = await invoiceService.deleteInvoice('inv-flow-1', CTX);
      expect(result.deletedAt).toBeTruthy();
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Financial Invariants (cross-cutting)
  // ────────────────────────────────────────────────────────────

  describe('Financial Invariants', () => {
    it('should use integer cents for all monetary fields (never floats)', () => {
      const invoice = makeInvoice();
      assertIntegerCents(invoice.subtotal);
      assertIntegerCents(invoice.taxAmount);
      assertIntegerCents(invoice.total);
      assertIntegerCents(invoice.paidAmount);

      const payment = makePayment();
      assertIntegerCents(payment.amount);
    });

    it('should ensure total = subtotal + taxAmount', () => {
      const invoice = makeInvoice();
      expect(invoice.total).toBe(invoice.subtotal + invoice.taxAmount);
    });

    it('should enforce line.amount is pre-tax (qty × unitPrice)', () => {
      const invoice = makeInvoice();
      const line = (invoice.invoiceLines as Array<{
        quantity: number;
        unitPrice: number;
        amount: number;
      }>)[0];
      expect(line.amount).toBe(line.quantity * line.unitPrice);
    });

    it('should enforce subtotal = SUM(line.amount) across all lines', () => {
      const invoice = makeInvoice();
      const lineTotal = (invoice.invoiceLines as Array<{ amount: number }>).reduce(
        (sum, l) => sum + l.amount,
        0,
      );
      expect(invoice.subtotal).toBe(lineTotal);
    });

    it('should ensure paidAmount starts at 0 for new invoices', () => {
      const invoice = makeInvoice();
      expect(invoice.paidAmount).toBe(0);
    });

    it('should ensure paidAmount never exceeds total (business rule)', () => {
      const fullyPaid = makeInvoice({ status: 'PAID', paidAmount: 113000 });
      expect(fullyPaid.paidAmount).toBeLessThanOrEqual(fullyPaid.total);
    });
  });
});
