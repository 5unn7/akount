import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';

// Mock Prisma
const mockPaymentCreate = vi.fn();
const mockPaymentFindFirst = vi.fn();
const mockPaymentFindMany = vi.fn();
const mockPaymentUpdate = vi.fn();
const mockClientFindFirst = vi.fn();
const mockClientFindFirstOrThrow = vi.fn();
const mockVendorFindFirst = vi.fn();
const mockVendorFindFirstOrThrow = vi.fn();
const mockAllocationCreate = vi.fn();
const mockAllocationFindFirst = vi.fn();
const mockAllocationDelete = vi.fn();
const mockAllocationDeleteMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    payment: {
      create: (...args: unknown[]) => mockPaymentCreate(...args),
      findFirst: (...args: unknown[]) => mockPaymentFindFirst(...args),
      findMany: (...args: unknown[]) => mockPaymentFindMany(...args),
      update: (...args: unknown[]) => mockPaymentUpdate(...args),
    },
    client: {
      findFirst: (...args: unknown[]) => mockClientFindFirst(...args),
      findFirstOrThrow: (...args: unknown[]) => mockClientFindFirstOrThrow(...args),
    },
    vendor: {
      findFirst: (...args: unknown[]) => mockVendorFindFirst(...args),
      findFirstOrThrow: (...args: unknown[]) => mockVendorFindFirstOrThrow(...args),
    },
    paymentAllocation: {
      create: (...args: unknown[]) => mockAllocationCreate(...args),
      findFirst: (...args: unknown[]) => mockAllocationFindFirst(...args),
      delete: (...args: unknown[]) => mockAllocationDelete(...args),
      deleteMany: (...args: unknown[]) => mockAllocationDeleteMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
  Prisma: {},
}));

// Mock invoice and bill services
const mockApplyPaymentToInvoice = vi.fn();
const mockReversePaymentFromInvoice = vi.fn();

vi.mock('../invoice.service', () => ({
  applyPaymentToInvoice: (...args: unknown[]) => mockApplyPaymentToInvoice(...args),
  reversePaymentFromInvoice: (...args: unknown[]) => mockReversePaymentFromInvoice(...args),
}));

const mockApplyPaymentToBill = vi.fn();
const mockReversePaymentFromBill = vi.fn();

vi.mock('../bill.service', () => ({
  applyPaymentToBill: (...args: unknown[]) => mockApplyPaymentToBill(...args),
  reversePaymentFromBill: (...args: unknown[]) => mockReversePaymentFromBill(...args),
}));

import {
  createPayment,
  getPayment,
  listPayments,
  updatePayment,
  deletePayment,
  allocatePayment,
  deallocatePayment,
} from '../payment.service';

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-test-001';
const ENTITY_ID = 'entity-xyz-789';

const CTX = { tenantId: TENANT_ID, userId: USER_ID, role: 'OWNER' as const };

const MOCK_CLIENT = {
  id: 'client-1',
  entityId: ENTITY_ID,
  name: 'Acme Corp',
};

const MOCK_VENDOR = {
  id: 'vendor-1',
  entityId: ENTITY_ID,
  name: 'Supplies Inc',
};

const MOCK_PAYMENT_AR = {
  id: 'payment-ar-1',
  entityId: ENTITY_ID,
  date: new Date('2026-02-15'),
  amount: 100000, // $1,000.00
  currency: 'USD',
  paymentMethod: 'TRANSFER',
  reference: 'CHK-001',
  clientId: 'client-1',
  vendorId: null,
  notes: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  client: MOCK_CLIENT,
  vendor: null,
  entity: { id: ENTITY_ID, tenantId: TENANT_ID },
  allocations: [],
};

const MOCK_PAYMENT_AP = {
  ...MOCK_PAYMENT_AR,
  id: 'payment-ap-1',
  clientId: null,
  vendorId: 'vendor-1',
  client: null,
  vendor: MOCK_VENDOR,
  allocations: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PaymentService', () => {
  describe('createPayment', () => {
    it('should create AR payment (client)', async () => {
      mockClientFindFirst.mockResolvedValue(MOCK_CLIENT);
      mockClientFindFirstOrThrow.mockResolvedValue({ entityId: ENTITY_ID });
      mockPaymentCreate.mockResolvedValue(MOCK_PAYMENT_AR);

      const result = await createPayment(
        {
          date: '2026-02-15T00:00:00.000Z',
          amount: 100000,
          currency: 'USD',
          paymentMethod: 'TRANSFER',
          reference: 'CHK-001',
          clientId: 'client-1',
        },
        CTX
      );

      expect(result.amount).toBe(100000);
      assertIntegerCents(result.amount);
      expect(result.clientId).toBe('client-1');
      expect(result.vendorId).toBeNull();
      expect(mockPaymentCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityId: ENTITY_ID,
            amount: 100000,
            clientId: 'client-1',
          }),
        })
      );
    });

    it('should create AP payment (vendor)', async () => {
      mockVendorFindFirst.mockResolvedValue(MOCK_VENDOR);
      mockVendorFindFirstOrThrow.mockResolvedValue({ entityId: ENTITY_ID });
      mockPaymentCreate.mockResolvedValue(MOCK_PAYMENT_AP);

      const result = await createPayment(
        {
          date: '2026-02-15T00:00:00.000Z',
          amount: 50000,
          currency: 'USD',
          paymentMethod: 'CHECK',
          vendorId: 'vendor-1',
        },
        CTX
      );

      expect(result.vendorId).toBe('vendor-1');
      expect(result.clientId).toBeNull();
    });

    it('should reject if client not found (tenant isolation)', async () => {
      mockClientFindFirst.mockResolvedValue(null);

      await expect(
        createPayment(
          {
            date: '2026-02-15T00:00:00.000Z',
            amount: 100000,
            currency: 'USD',
            paymentMethod: 'TRANSFER',
            clientId: 'wrong-client',
          },
          CTX
        )
      ).rejects.toThrow('Client not found');
    });

    it('should reject if vendor not found (tenant isolation)', async () => {
      mockVendorFindFirst.mockResolvedValue(null);

      await expect(
        createPayment(
          {
            date: '2026-02-15T00:00:00.000Z',
            amount: 100000,
            currency: 'USD',
            paymentMethod: 'WIRE',
            vendorId: 'wrong-vendor',
          },
          CTX
        )
      ).rejects.toThrow('Vendor not found');
    });
  });

  describe('getPayment', () => {
    it('should return payment with allocations', async () => {
      mockPaymentFindFirst.mockResolvedValue(MOCK_PAYMENT_AR);

      const result = await getPayment('payment-ar-1', CTX);

      expect(result.id).toBe('payment-ar-1');
      expect(mockPaymentFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'payment-ar-1',
            entity: { tenantId: TENANT_ID },
            deletedAt: null,
          }),
        })
      );
    });

    it('should reject if payment not found', async () => {
      mockPaymentFindFirst.mockResolvedValue(null);

      await expect(getPayment('not-found', CTX)).rejects.toThrow(
        'Payment not found'
      );
    });
  });

  describe('listPayments', () => {
    it('should return paginated payments', async () => {
      mockPaymentFindMany.mockResolvedValue([MOCK_PAYMENT_AR]);

      const result = await listPayments({ limit: 20 }, CTX);

      expect(result.data).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
      assertIntegerCents(result.data[0].amount);
    });

    it('should filter by clientId', async () => {
      mockPaymentFindMany.mockResolvedValue([MOCK_PAYMENT_AR]);

      await listPayments({ clientId: 'client-1', limit: 20 }, CTX);

      expect(mockPaymentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: 'client-1',
          }),
        })
      );
    });

    it('should return nextCursor when more results exist', async () => {
      const payments = Array(21)
        .fill(null)
        .map((_, i) => ({ ...MOCK_PAYMENT_AR, id: `payment-${i}` }));
      mockPaymentFindMany.mockResolvedValue(payments);

      const result = await listPayments({ limit: 20 }, CTX);

      expect(result.data).toHaveLength(20);
      expect(result.nextCursor).toBe('payment-19');
    });
  });

  describe('updatePayment', () => {
    it('should update payment fields', async () => {
      mockPaymentFindFirst.mockResolvedValue(MOCK_PAYMENT_AR);
      mockPaymentUpdate.mockResolvedValue({
        ...MOCK_PAYMENT_AR,
        reference: 'CHK-002',
      });

      const result = await updatePayment(
        'payment-ar-1',
        { reference: 'CHK-002' },
        CTX
      );

      expect(result.reference).toBe('CHK-002');
    });

    it('should reject if payment not found', async () => {
      mockPaymentFindFirst.mockResolvedValue(null);

      await expect(
        updatePayment('not-found', { reference: 'X' }, CTX)
      ).rejects.toThrow('Payment not found');
    });
  });

  describe('deletePayment', () => {
    it('should soft delete and reverse all allocations', async () => {
      const paymentWithAllocations = {
        ...MOCK_PAYMENT_AR,
        allocations: [
          { id: 'alloc-1', paymentId: 'payment-ar-1', invoiceId: 'inv-1', billId: null, amount: 50000 },
          { id: 'alloc-2', paymentId: 'payment-ar-1', invoiceId: 'inv-2', billId: null, amount: 30000 },
        ],
      };
      mockPaymentFindFirst.mockResolvedValue(paymentWithAllocations);
      mockReversePaymentFromInvoice.mockResolvedValue({});
      mockTransaction.mockResolvedValue([{}, {}]);

      await deletePayment('payment-ar-1', CTX);

      // Should reverse both allocations
      expect(mockReversePaymentFromInvoice).toHaveBeenCalledTimes(2);
      expect(mockReversePaymentFromInvoice).toHaveBeenCalledWith('inv-1', 50000, CTX);
      expect(mockReversePaymentFromInvoice).toHaveBeenCalledWith('inv-2', 30000, CTX);

      // Should delete allocations and soft-delete payment
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should soft delete payment with bill allocations', async () => {
      const paymentWithBillAllocs = {
        ...MOCK_PAYMENT_AP,
        allocations: [
          { id: 'alloc-3', paymentId: 'payment-ap-1', invoiceId: null, billId: 'bill-1', amount: 40000 },
        ],
      };
      mockPaymentFindFirst.mockResolvedValue(paymentWithBillAllocs);
      mockReversePaymentFromBill.mockResolvedValue({});
      mockTransaction.mockResolvedValue([{}, {}]);

      await deletePayment('payment-ap-1', CTX);

      expect(mockReversePaymentFromBill).toHaveBeenCalledWith('bill-1', 40000, CTX);
    });
  });

  describe('allocatePayment', () => {
    it('should allocate AR payment to invoice', async () => {
      mockPaymentFindFirst.mockResolvedValue(MOCK_PAYMENT_AR);
      mockApplyPaymentToInvoice.mockResolvedValue({});
      mockAllocationCreate.mockResolvedValue({
        id: 'alloc-new',
        paymentId: 'payment-ar-1',
        invoiceId: 'inv-1',
        billId: null,
        amount: 50000,
      });

      const result = await allocatePayment(
        'payment-ar-1',
        { invoiceId: 'inv-1', amount: 50000 },
        CTX
      );

      assertIntegerCents(result.amount);
      expect(result.invoiceId).toBe('inv-1');
      expect(mockApplyPaymentToInvoice).toHaveBeenCalledWith('inv-1', 50000, CTX);
    });

    it('should allocate AP payment to bill', async () => {
      mockPaymentFindFirst.mockResolvedValue(MOCK_PAYMENT_AP);
      mockApplyPaymentToBill.mockResolvedValue({});
      mockAllocationCreate.mockResolvedValue({
        id: 'alloc-new',
        paymentId: 'payment-ap-1',
        invoiceId: null,
        billId: 'bill-1',
        amount: 30000,
      });

      const result = await allocatePayment(
        'payment-ap-1',
        { billId: 'bill-1', amount: 30000 },
        CTX
      );

      assertIntegerCents(result.amount);
      expect(result.billId).toBe('bill-1');
      expect(mockApplyPaymentToBill).toHaveBeenCalledWith('bill-1', 30000, CTX);
    });

    it('should reject AR payment allocated to bill', async () => {
      mockPaymentFindFirst.mockResolvedValue(MOCK_PAYMENT_AR);

      await expect(
        allocatePayment('payment-ar-1', { billId: 'bill-1', amount: 10000 }, CTX)
      ).rejects.toThrow('AR payment (client) cannot be allocated to a bill');
    });

    it('should reject AP payment allocated to invoice', async () => {
      mockPaymentFindFirst.mockResolvedValue(MOCK_PAYMENT_AP);

      await expect(
        allocatePayment('payment-ap-1', { invoiceId: 'inv-1', amount: 10000 }, CTX)
      ).rejects.toThrow('AP payment (vendor) cannot be allocated to an invoice');
    });

    it('should reject allocation exceeding unallocated balance', async () => {
      const paymentWithExistingAlloc = {
        ...MOCK_PAYMENT_AR,
        allocations: [
          { id: 'alloc-1', amount: 80000 }, // $800 of $1000 already allocated
        ],
      };
      mockPaymentFindFirst.mockResolvedValue(paymentWithExistingAlloc);

      await expect(
        allocatePayment(
          'payment-ar-1',
          { invoiceId: 'inv-1', amount: 30000 }, // $300 > $200 remaining
          CTX
        )
      ).rejects.toThrow('exceeds unallocated balance');
    });

    it('should allow partial allocation within balance', async () => {
      const paymentWithPartialAlloc = {
        ...MOCK_PAYMENT_AR,
        allocations: [
          { id: 'alloc-1', amount: 60000 }, // $600 of $1000 allocated
        ],
      };
      mockPaymentFindFirst.mockResolvedValue(paymentWithPartialAlloc);
      mockApplyPaymentToInvoice.mockResolvedValue({});
      mockAllocationCreate.mockResolvedValue({
        id: 'alloc-new',
        paymentId: 'payment-ar-1',
        invoiceId: 'inv-2',
        billId: null,
        amount: 40000,
      });

      const result = await allocatePayment(
        'payment-ar-1',
        { invoiceId: 'inv-2', amount: 40000 }, // $400 = exactly remaining
        CTX
      );

      expect(result.amount).toBe(40000);
      assertIntegerCents(result.amount);
    });
  });

  describe('deallocatePayment', () => {
    it('should deallocate and reverse invoice payment', async () => {
      mockPaymentFindFirst.mockResolvedValue(MOCK_PAYMENT_AR);
      mockAllocationFindFirst.mockResolvedValue({
        id: 'alloc-1',
        paymentId: 'payment-ar-1',
        invoiceId: 'inv-1',
        billId: null,
        amount: 50000,
      });
      mockReversePaymentFromInvoice.mockResolvedValue({});
      mockAllocationDelete.mockResolvedValue({});

      await deallocatePayment('payment-ar-1', 'alloc-1', CTX);

      expect(mockReversePaymentFromInvoice).toHaveBeenCalledWith('inv-1', 50000, CTX);
      expect(mockAllocationDelete).toHaveBeenCalledWith({ where: { id: 'alloc-1' } });
    });

    it('should deallocate and reverse bill payment', async () => {
      mockPaymentFindFirst.mockResolvedValue(MOCK_PAYMENT_AP);
      mockAllocationFindFirst.mockResolvedValue({
        id: 'alloc-2',
        paymentId: 'payment-ap-1',
        invoiceId: null,
        billId: 'bill-1',
        amount: 30000,
      });
      mockReversePaymentFromBill.mockResolvedValue({});
      mockAllocationDelete.mockResolvedValue({});

      await deallocatePayment('payment-ap-1', 'alloc-2', CTX);

      expect(mockReversePaymentFromBill).toHaveBeenCalledWith('bill-1', 30000, CTX);
    });

    it('should reject if allocation not found', async () => {
      mockPaymentFindFirst.mockResolvedValue(MOCK_PAYMENT_AR);
      mockAllocationFindFirst.mockResolvedValue(null);

      await expect(
        deallocatePayment('payment-ar-1', 'not-found', CTX)
      ).rejects.toThrow('Allocation not found');
    });
  });
});
