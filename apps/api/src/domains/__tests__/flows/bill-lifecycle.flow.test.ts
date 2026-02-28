/**
 * Bill Lifecycle Flow Tests
 *
 * Tests the full lifecycle: DRAFT → PENDING → partial pay → PARTIALLY_PAID
 * → full pay → PAID
 * Also: DRAFT/PENDING → CANCELLED, PENDING → OVERDUE
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
  mockBillFindFirst,
  mockBillCreate,
  mockBillUpdate,
  mockVendorFindFirst,
  mockTaxRateFindMany,
} = vi.hoisted(() => ({
  mockBillFindFirst: vi.fn(),
  mockBillCreate: vi.fn(),
  mockBillUpdate: vi.fn(),
  mockVendorFindFirst: vi.fn(),
  mockTaxRateFindMany: vi.fn(),
}));

vi.mock('@akount/db', () => ({
  prisma: {
    bill: {
      findFirst: (...args: unknown[]) => mockBillFindFirst(...args),
      create: (...args: unknown[]) => mockBillCreate(...args),
      update: (...args: unknown[]) => mockBillUpdate(...args),
    },
    vendor: {
      findFirst: (...args: unknown[]) => mockVendorFindFirst(...args),
    },
    taxRate: {
      findMany: (...args: unknown[]) => mockTaxRateFindMany(...args),
    },
  },
  Prisma: {
    TransactionIsolationLevel: { Serializable: 'Serializable' },
  },
}));

import * as billService from '../../invoicing/services/bill.service';

// ─────────────────────────────────────────────────────────────────
// Shared Constants
// ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-bill-flow-123';
const ENTITY_ID = 'entity-bill-flow-456';
const VENDOR_ID = 'vendor-bill-flow-789';
const USER_ID = 'user-bill-flow-111';

const CTX = {
  tenantId: TENANT_ID,
  userId: USER_ID,
  role: 'OWNER' as const,
};

// ─────────────────────────────────────────────────────────────────
// Mock Data Factories
// ─────────────────────────────────────────────────────────────────

function makeBill(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bill-flow-1',
    billNumber: 'BILL-001',
    entityId: ENTITY_ID,
    vendorId: VENDOR_ID,
    issueDate: new Date('2024-06-01'),
    dueDate: new Date('2025-12-31'), // Far future so not OVERDUE
    currency: 'USD',
    subtotal: 50000, // $500.00
    taxAmount: 6500, // $65.00 (13% tax)
    total: 56500, // $565.00
    paidAmount: 0,
    status: 'DRAFT',
    notes: null,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    deletedAt: null,
    vendor: { id: VENDOR_ID, name: 'Flow Vendor', entityId: ENTITY_ID },
    entity: { id: ENTITY_ID, name: 'Flow Corp', tenantId: TENANT_ID, functionalCurrency: 'USD' },
    billLines: [
      {
        id: 'bline-1',
        description: 'Office Supplies',
        quantity: 5,
        unitPrice: 10000, // $100.00 each
        amount: 50000, // $500.00 (pre-tax)
        taxAmount: 6500,
        taxRateId: null,
        taxRate: null,
      },
    ],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Bill Lifecycle Flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // Step 1: Bill Creation (DRAFT)
  // ────────────────────────────────────────────────────────────

  describe('Step 1: Create Bill (DRAFT)', () => {
    it('should create bill with integer cents and status DRAFT', async () => {
      const bill = makeBill({ status: 'DRAFT' });

      mockVendorFindFirst.mockResolvedValueOnce({
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      });
      mockTaxRateFindMany.mockResolvedValueOnce([]); // No tax rates needed
      mockBillCreate.mockResolvedValueOnce(bill);

      const result = await billService.createBill(
        {
          vendorId: VENDOR_ID,
          billNumber: 'BILL-001',
          issueDate: '2024-06-01',
          dueDate: '2024-06-30',
          currency: 'USD',
          subtotal: 50000,
          taxAmount: 6500,
          total: 56500,
          // status defaults to 'DRAFT' (schema default)
          // entityId derived from CTX (TenantContext), not from payload
          lines: [
            {
              description: 'Office Supplies',
              quantity: 5,
              unitPrice: 10000,
              amount: 50000,
              taxAmount: 6500,
            },
          ],
        },
        CTX
      );

      expect(result.status).toBe('DRAFT');
      assertIntegerCents(result.total);
      assertIntegerCents(result.subtotal);
      assertIntegerCents(result.taxAmount);
      expect(result.paidAmount).toBe(0);
    });

    it('should enforce subtotal = SUM(line.amount)', async () => {
      mockVendorFindFirst.mockResolvedValueOnce({
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      });
      mockTaxRateFindMany.mockResolvedValueOnce([]);

      await expect(
        billService.createBill(
          {
            vendorId: VENDOR_ID,
            billNumber: 'BILL-002',
            issueDate: '2024-06-01',
            dueDate: '2024-06-30',
            currency: 'USD',
            subtotal: 99999, // Wrong!
            taxAmount: 6500,
            total: 106499,
            // status defaults to 'DRAFT' (schema default)
            // entityId derived from CTX (TenantContext), not from payload
            lines: [
              {
                description: 'Item',
                quantity: 5,
                unitPrice: 10000,
                amount: 50000,
                taxAmount: 6500,
              },
            ],
          },
          CTX
        )
      ).rejects.toThrow('Subtotal mismatch');
    });

    it('should reject bill for vendor from different tenant (IDOR)', async () => {
      mockVendorFindFirst.mockResolvedValueOnce(null); // Not found = cross-tenant

      await expect(
        billService.createBill(
          {
            vendorId: 'other-vendor',
            billNumber: 'BILL-003',
            issueDate: '2024-06-01',
            dueDate: '2024-06-30',
            currency: 'USD',
            subtotal: 50000,
            taxAmount: 6500,
            total: 56500,
            // entityId derived from CTX (TenantContext), not from payload
            lines: [
              {
                description: 'Item',
                quantity: 5,
                unitPrice: 10000,
                amount: 50000,
                taxAmount: 6500,
              },
            ],
          },
          CTX
        )
      ).rejects.toThrow('Vendor not found');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Step 2: Status Transitions
  // ────────────────────────────────────────────────────────────

  describe('Step 2: Status Transitions', () => {
    it('should transition DRAFT → PENDING (approve)', async () => {
      const draftBill = makeBill({ status: 'DRAFT' });
      const pendingBill = makeBill({ status: 'PENDING' });

      mockBillFindFirst.mockResolvedValueOnce(draftBill);
      mockBillUpdate.mockResolvedValueOnce(pendingBill);

      const result = await billService.approveBill('bill-flow-1', CTX);
      expect(result.status).toBe('PENDING');
    });

    it('should reject PAID → PENDING transition', async () => {
      const paidBill = makeBill({ status: 'PAID' });
      mockBillFindFirst.mockResolvedValueOnce(paidBill);

      await expect(
        billService.approveBill('bill-flow-1', CTX)
      ).rejects.toThrow('Invalid status transition: PAID → PENDING');
    });

    it('should allow DRAFT → CANCELLED transition', async () => {
      const draftBill = makeBill({ status: 'DRAFT', paidAmount: 0 });
      const cancelledBill = makeBill({ status: 'CANCELLED' });

      mockBillFindFirst.mockResolvedValueOnce(draftBill);
      mockBillUpdate.mockResolvedValueOnce(cancelledBill);

      const result = await billService.cancelBill('bill-flow-1', CTX);
      expect(result.status).toBe('CANCELLED');
    });

    it('should reject cancel if bill has payments', async () => {
      const billWithPayments = makeBill({
        status: 'PENDING',
        paidAmount: 10000,
      });
      mockBillFindFirst.mockResolvedValueOnce(billWithPayments);

      await expect(
        billService.cancelBill('bill-flow-1', CTX)
      ).rejects.toThrow('Cannot cancel bill with existing payments');
    });

    it('should allow PENDING → OVERDUE transition', async () => {
      const pendingBill = makeBill({ status: 'PENDING' });
      const overdueBill = makeBill({ status: 'OVERDUE' });

      mockBillFindFirst.mockResolvedValueOnce(pendingBill);
      mockBillUpdate.mockResolvedValueOnce(overdueBill);

      const result = await billService.markBillOverdue('bill-flow-1', CTX);
      expect(result.status).toBe('OVERDUE');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Step 3: Payment Application (AP side)
  // ────────────────────────────────────────────────────────────

  describe('Step 3: Payment Application', () => {
    it('should transition PENDING → PARTIALLY_PAID on partial payment', async () => {
      const pendingBill = makeBill({ status: 'PENDING', paidAmount: 0 });
      const partialBill = makeBill({ status: 'PARTIALLY_PAID', paidAmount: 20000 });

      mockBillFindFirst.mockResolvedValueOnce(pendingBill);
      mockBillUpdate.mockResolvedValueOnce(partialBill);

      const result = await billService.applyPaymentToBill('bill-flow-1', 20000, CTX);
      expect(result.status).toBe('PARTIALLY_PAID');
      assertIntegerCents(result.paidAmount);
    });

    it('should transition to PAID when full amount paid', async () => {
      const partialBill = makeBill({ status: 'PARTIALLY_PAID', paidAmount: 20000 });
      const paidBill = makeBill({ status: 'PAID', paidAmount: 56500 });

      mockBillFindFirst.mockResolvedValueOnce(partialBill);
      mockBillUpdate.mockResolvedValueOnce(paidBill);

      const result = await billService.applyPaymentToBill('bill-flow-1', 36500, CTX);
      expect(result.status).toBe('PAID');
      expect(result.paidAmount).toBe(56500);
    });

    it('should reject payment exceeding outstanding balance', async () => {
      const bill = makeBill({ status: 'PENDING', paidAmount: 0, total: 56500 });
      mockBillFindFirst.mockResolvedValueOnce(bill);

      await expect(
        billService.applyPaymentToBill('bill-flow-1', 60000, CTX)
      ).rejects.toThrow('exceed bill balance');
    });

    it('should reject zero or negative payment amounts', async () => {
      const bill = makeBill({ status: 'PENDING', paidAmount: 0 });
      mockBillFindFirst.mockResolvedValueOnce(bill);

      await expect(
        billService.applyPaymentToBill('bill-flow-1', 0, CTX)
      ).rejects.toThrow('Payment amount must be positive');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Step 4: Payment Reversal
  // ────────────────────────────────────────────────────────────

  describe('Step 4: Payment Reversal', () => {
    it('should revert PARTIALLY_PAID → PENDING when full payment reversed (future due date)', async () => {
      const partialBill = makeBill({
        status: 'PARTIALLY_PAID',
        paidAmount: 20000,
        dueDate: new Date('2025-12-31'), // future
      });
      const pendingBill = makeBill({ status: 'PENDING', paidAmount: 0 });

      mockBillFindFirst.mockResolvedValueOnce(partialBill);
      mockBillUpdate.mockResolvedValueOnce(pendingBill);

      const result = await billService.reversePaymentFromBill('bill-flow-1', 20000, CTX);
      expect(result.status).toBe('PENDING');
    });

    it('should revert to OVERDUE when full payment reversed and dueDate is past', async () => {
      const partialBill = makeBill({
        status: 'PARTIALLY_PAID',
        paidAmount: 20000,
        dueDate: new Date('2020-01-01'), // past
      });
      const overdueBill = makeBill({ status: 'OVERDUE', paidAmount: 0 });

      mockBillFindFirst.mockResolvedValueOnce(partialBill);
      mockBillUpdate.mockResolvedValueOnce(overdueBill);

      const result = await billService.reversePaymentFromBill('bill-flow-1', 20000, CTX);
      expect(result.status).toBe('OVERDUE');
    });

    it('should remain PARTIALLY_PAID when only partial reversal', async () => {
      const partialBill = makeBill({ status: 'PARTIALLY_PAID', paidAmount: 40000 });
      const stillPartialBill = makeBill({ status: 'PARTIALLY_PAID', paidAmount: 20000 });

      mockBillFindFirst.mockResolvedValueOnce(partialBill);
      mockBillUpdate.mockResolvedValueOnce(stillPartialBill);

      const result = await billService.reversePaymentFromBill('bill-flow-1', 20000, CTX);
      expect(result.status).toBe('PARTIALLY_PAID');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Step 5: Soft Delete
  // ────────────────────────────────────────────────────────────

  describe('Step 5: Soft Delete', () => {
    it('should soft-delete by setting deletedAt (not hard delete)', async () => {
      const bill = makeBill({ status: 'DRAFT' });
      const deletedBill = { ...bill, deletedAt: new Date() };

      mockBillFindFirst.mockResolvedValueOnce(bill);
      mockBillUpdate.mockResolvedValueOnce(deletedBill);

      const result = await billService.deleteBill('bill-flow-1', CTX);
      expect(result.deletedAt).toBeTruthy();
      expect(result.id).toBe('bill-flow-1');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Financial Invariants
  // ────────────────────────────────────────────────────────────

  describe('Financial Invariants', () => {
    it('should use integer cents for all monetary fields (never floats)', () => {
      const bill = makeBill();
      assertIntegerCents(bill.subtotal);
      assertIntegerCents(bill.taxAmount);
      assertIntegerCents(bill.total);
      assertIntegerCents(bill.paidAmount);
      assertIntegerCents(bill.billLines[0].amount);
      assertIntegerCents(bill.billLines[0].taxAmount);
    });

    it('should ensure total = subtotal + taxAmount', () => {
      const bill = makeBill();
      expect(bill.total).toBe(bill.subtotal + bill.taxAmount);
    });

    it('should enforce line.amount is pre-tax (qty x unitPrice)', () => {
      const bill = makeBill();
      const line = bill.billLines[0];
      expect(line.amount).toBe(line.quantity * line.unitPrice);
    });

    it('should ensure paidAmount starts at 0 for new bills', () => {
      const bill = makeBill();
      expect(bill.paidAmount).toBe(0);
    });

    it('should ensure paidAmount never exceeds total (business rule)', async () => {
      const bill = makeBill({ status: 'PENDING', paidAmount: 56000, total: 56500 });
      mockBillFindFirst.mockResolvedValueOnce(bill);

      // Try paying 1000 more (would bring paidAmount to 57000, exceeding total 56500)
      await expect(
        billService.applyPaymentToBill('bill-flow-1', 1000, CTX)
      ).rejects.toThrow('exceed bill balance');
    });
  });
});
