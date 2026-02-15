import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as billService from '../bill.service';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';

// Mock Prisma client
vi.mock('@akount/db', () => ({
  prisma: {
    bill: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    vendor: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@akount/db';

const TENANT_ID = 'tenant-test-123';
const ENTITY_ID = 'entity-test-456';
const VENDOR_ID = 'vendor-test-789';

const mockTenantContext = {
  tenantId: TENANT_ID,
  userId: 'user-test-111',
  role: 'OWNER' as const,
};

function mockBill(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bill-1',
    billNumber: 'BILL-001',
    entityId: ENTITY_ID,
    vendorId: VENDOR_ID,
    issueDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-31'),
    currency: 'USD',
    subtotal: 90000, // $900.00
    taxAmount: 9000, // $90.00
    total: 99000, // $990.00
    paidAmount: 0,
    status: 'DRAFT',
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    vendor: { id: VENDOR_ID, name: 'ABC Supplier', entityId: ENTITY_ID },
    entity: { id: ENTITY_ID, name: 'My Company', tenantId: TENANT_ID },
    billLines: [],
    ...overrides,
  };
}

describe('BillService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBill', () => {
    it('should verify vendor belongs to tenant before creating', async () => {
      const vendor = {
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(vendor as never);
      vi.mocked(prisma.bill.create).mockResolvedValueOnce(mockBill() as never);

      await billService.createBill(
        {
          vendorId: VENDOR_ID,
          billNumber: 'BILL-100',
          issueDate: '2024-02-01',
          dueDate: '2024-03-01',
          currency: 'USD',
          subtotal: 100000,
          taxAmount: 10000,
          total: 110000,
          status: 'DRAFT',
          notes: null,
          lines: [],
        },
        mockTenantContext
      );

      expect(prisma.vendor.findFirst).toHaveBeenCalledWith({
        where: {
          id: VENDOR_ID,
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw if vendor does not belong to tenant', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        billService.createBill(
          {
            vendorId: 'vendor-other-tenant',
            billNumber: 'BILL-999',
            issueDate: '2024-02-01',
            dueDate: '2024-03-01',
            currency: 'USD',
            subtotal: 50000,
            taxAmount: 0,
            total: 50000,
            status: 'DRAFT',
            notes: null,
            lines: [],
          },
          mockTenantContext
        )
      ).rejects.toThrow('Vendor not found');
    });

    it('should create bill with all monetary fields as integer cents', async () => {
      const vendor = {
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(vendor as never);
      vi.mocked(prisma.bill.create).mockResolvedValueOnce(mockBill() as never);

      await billService.createBill(
        {
          vendorId: VENDOR_ID,
          billNumber: 'BILL-200',
          issueDate: '2024-03-01',
          dueDate: '2024-03-31',
          currency: 'USD',
          subtotal: 150000,
          taxAmount: 15000,
          total: 165000,
          status: 'DRAFT',
          notes: 'Test bill',
          lines: [
            { description: 'Service A', quantity: 1, unitPrice: 150000, amount: 150000 },
          ],
        },
        mockTenantContext
      );

      const createArgs = vi.mocked(prisma.bill.create).mock.calls[0][0]!;
      assertIntegerCents(createArgs.data.subtotal, 'subtotal');
      assertIntegerCents(createArgs.data.taxAmount, 'taxAmount');
      assertIntegerCents(createArgs.data.total, 'total');
      expect(createArgs.data.paidAmount).toBe(0);
    });

    it('should set paidAmount to 0 on new bill', async () => {
      const vendor = {
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(vendor as never);
      vi.mocked(prisma.bill.create).mockResolvedValueOnce(mockBill() as never);

      await billService.createBill(
        {
          vendorId: VENDOR_ID,
          billNumber: 'BILL-300',
          issueDate: '2024-04-01',
          dueDate: '2024-04-30',
          currency: 'USD',
          subtotal: 50000,
          taxAmount: 0,
          total: 50000,
          status: 'DRAFT',
          notes: null,
          lines: [],
        },
        mockTenantContext
      );

      const createArgs = vi.mocked(prisma.bill.create).mock.calls[0][0]!;
      expect(createArgs.data.paidAmount).toBe(0);
    });

    it('should create bill lines nested', async () => {
      const vendor = {
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(vendor as never);
      vi.mocked(prisma.bill.create).mockResolvedValueOnce(mockBill() as never);

      const lines = [
        { description: 'Item 1', quantity: 2, unitPrice: 25000, amount: 50000 },
        { description: 'Item 2', quantity: 1, unitPrice: 10000, amount: 10000 },
      ];

      await billService.createBill(
        {
          vendorId: VENDOR_ID,
          billNumber: 'BILL-400',
          issueDate: '2024-05-01',
          dueDate: '2024-05-31',
          currency: 'USD',
          subtotal: 60000,
          taxAmount: 6000,
          total: 66000,
          status: 'DRAFT',
          notes: null,
          lines,
        },
        mockTenantContext
      );

      const createArgs = vi.mocked(prisma.bill.create).mock.calls[0][0]!;
      expect(createArgs.data.billLines).toEqual({ create: lines });
    });
  });

  describe('listBills', () => {
    it('should filter by tenantId via entity relation', async () => {
      vi.mocked(prisma.bill.findMany).mockResolvedValueOnce([] as never);

      await billService.listBills({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.bill.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.entity).toEqual({ tenantId: TENANT_ID });
    });

    it('should always filter soft-deleted records', async () => {
      vi.mocked(prisma.bill.findMany).mockResolvedValueOnce([] as never);

      await billService.listBills({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.bill.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should support status filter', async () => {
      vi.mocked(prisma.bill.findMany).mockResolvedValueOnce([] as never);

      await billService.listBills({ limit: 10, status: 'RECEIVED' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.bill.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('status', 'RECEIVED');
    });

    it('should support vendorId filter', async () => {
      vi.mocked(prisma.bill.findMany).mockResolvedValueOnce([] as never);

      await billService.listBills({ limit: 10, vendorId: VENDOR_ID }, mockTenantContext);

      const callArgs = vi.mocked(prisma.bill.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('vendorId', VENDOR_ID);
    });

    it('should support date range filters', async () => {
      vi.mocked(prisma.bill.findMany).mockResolvedValueOnce([] as never);

      await billService.listBills(
        { limit: 10, dateFrom: '2024-01-01', dateTo: '2024-01-31' },
        mockTenantContext
      );

      const callArgs = vi.mocked(prisma.bill.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.issueDate).toEqual({
        gte: new Date('2024-01-01'),
        lte: new Date('2024-01-31'),
      });
    });

    it('should support cursor pagination', async () => {
      vi.mocked(prisma.bill.findMany).mockResolvedValueOnce([] as never);

      await billService.listBills({ limit: 10, cursor: 'cursor-abc' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.bill.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.id).toEqual({ gt: 'cursor-abc' });
    });

    it('should return nextCursor when limit reached', async () => {
      const bills = [mockBill({ id: 'bill-1' }), mockBill({ id: 'bill-2' })];
      vi.mocked(prisma.bill.findMany).mockResolvedValueOnce(bills as never);

      const result = await billService.listBills({ limit: 2 }, mockTenantContext);

      expect(result.nextCursor).toBe('bill-2');
    });

    it('should return null cursor when fewer results than limit', async () => {
      const bills = [mockBill({ id: 'bill-1' })];
      vi.mocked(prisma.bill.findMany).mockResolvedValueOnce(bills as never);

      const result = await billService.listBills({ limit: 10 }, mockTenantContext);

      expect(result.nextCursor).toBeNull();
    });

    it('should order by createdAt desc', async () => {
      vi.mocked(prisma.bill.findMany).mockResolvedValueOnce([] as never);

      await billService.listBills({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.bill.findMany).mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('getBill', () => {
    it('should find bill by id with tenant isolation', async () => {
      const bill = mockBill({ id: 'bill-xyz' });
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(bill as never);

      const result = await billService.getBill('bill-xyz', mockTenantContext);

      expect(result).toEqual(bill);
      expect(prisma.bill.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'bill-xyz',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: {
          vendor: true,
          entity: true,
          billLines: true,
        },
      });
    });

    it('should throw when bill not found', async () => {
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        billService.getBill('nonexistent', mockTenantContext)
      ).rejects.toThrow('Bill not found');
    });

    it('should reject cross-tenant access', async () => {
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        billService.getBill('bill-other-tenant', mockTenantContext)
      ).rejects.toThrow('Bill not found');
    });

    it('should return bill with integer cents for all amounts', async () => {
      const bill = mockBill({
        subtotal: 100000,
        taxAmount: 10000,
        total: 110000,
        paidAmount: 25000,
      });
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(bill as never);

      const result = await billService.getBill('bill-1', mockTenantContext);

      assertIntegerCents(result.subtotal, 'subtotal');
      assertIntegerCents(result.taxAmount, 'taxAmount');
      assertIntegerCents(result.total, 'total');
      assertIntegerCents(result.paidAmount, 'paidAmount');
    });
  });

  describe('updateBill', () => {
    it('should verify bill exists and tenant owns before updating', async () => {
      const existing = mockBill({ id: 'bill-1' });
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.bill.update).mockResolvedValueOnce(existing as never);

      await billService.updateBill(
        'bill-1',
        { billNumber: 'BILL-999' },
        mockTenantContext
      );

      expect(prisma.bill.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'bill-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: { vendor: true, entity: true, billLines: true },
      });
    });

    it('should throw when bill not found', async () => {
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        billService.updateBill('nonexistent', { status: 'RECEIVED' }, mockTenantContext)
      ).rejects.toThrow('Bill not found');

      expect(prisma.bill.update).not.toHaveBeenCalled();
    });

    it('should reject cross-tenant update', async () => {
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        billService.updateBill('bill-other-tenant', { status: 'RECEIVED' }, mockTenantContext)
      ).rejects.toThrow('Bill not found');
    });

    it('should only update provided fields', async () => {
      const existing = mockBill({ id: 'bill-1' });
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.bill.update).mockResolvedValueOnce(existing as never);

      await billService.updateBill(
        'bill-1',
        { status: 'RECEIVED', notes: 'Updated notes' },
        mockTenantContext
      );

      const updateArgs = vi.mocked(prisma.bill.update).mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({
        status: 'RECEIVED',
        notes: 'Updated notes',
      });
    });
  });

  describe('deleteBill', () => {
    it('should verify bill exists and tenant owns before deleting', async () => {
      const existing = mockBill({ id: 'bill-1' });
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.bill.update).mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      } as never);

      await billService.deleteBill('bill-1', mockTenantContext);

      expect(prisma.bill.findFirst).toHaveBeenCalled();
    });

    it('should soft delete (set deletedAt, not hard delete)', async () => {
      const existing = mockBill({ id: 'bill-1' });
      vi.mocked(prisma.bill.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.bill.update).mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      } as never);

      const result = await billService.deleteBill('bill-1', mockTenantContext);

      const updateArgs = vi.mocked(prisma.bill.update).mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('deletedAt');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('getBillStats', () => {
    it('should calculate outstandingAP as integer cents', async () => {
      vi.mocked(prisma.bill.aggregate)
        .mockResolvedValueOnce({ _sum: { total: 100000, paidAmount: 25000 } } as never) // Outstanding
        .mockResolvedValueOnce({ _sum: { total: 50000 } } as never) // Paid
        .mockResolvedValueOnce({ _sum: { total: 30000 } } as never) // Overdue
        .mockResolvedValueOnce({ _sum: { total: 40000, paidAmount: 0 } } as never) // Current
        .mockResolvedValueOnce({ _sum: { total: 20000, paidAmount: 0 } } as never) // 1-30
        .mockResolvedValueOnce({ _sum: { total: 10000, paidAmount: 0 } } as never) // 31-60
        .mockResolvedValueOnce({ _sum: { total: 5000, paidAmount: 0 } } as never); // 60+

      const result = await billService.getBillStats(mockTenantContext);

      expect(result.outstandingAP).toBe(75000); // 100000 - 25000
      assertIntegerCents(result.outstandingAP, 'outstandingAP');
    });

    it('should calculate aging buckets correctly', async () => {
      vi.mocked(prisma.bill.aggregate)
        .mockResolvedValueOnce({ _sum: { total: 100000, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 40000, paidAmount: 0 } } as never) // Current: 40%
        .mockResolvedValueOnce({ _sum: { total: 30000, paidAmount: 0 } } as never) // 1-30: 30%
        .mockResolvedValueOnce({ _sum: { total: 20000, paidAmount: 0 } } as never) // 31-60: 20%
        .mockResolvedValueOnce({ _sum: { total: 10000, paidAmount: 0 } } as never); // 60+: 10%

      const result = await billService.getBillStats(mockTenantContext);

      expect(result.aging.current.amount).toBe(40000);
      expect(result.aging.current.percentage).toBe(40);
      expect(result.aging['1-30'].amount).toBe(30000);
      expect(result.aging['1-30'].percentage).toBe(30);
      expect(result.aging['31-60'].amount).toBe(20000);
      expect(result.aging['31-60'].percentage).toBe(20);
      expect(result.aging['60+'].amount).toBe(10000);
      expect(result.aging['60+'].percentage).toBe(10);
    });

    it('should handle zero balances correctly', async () => {
      vi.mocked(prisma.bill.aggregate)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never)
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } } as never);

      const result = await billService.getBillStats(mockTenantContext);

      expect(result.outstandingAP).toBe(0);
      expect(result.paidThisMonth).toBe(0);
      expect(result.overdue).toBe(0);
      assertIntegerCents(result.outstandingAP, 'outstandingAP');
    });

    it('should filter by RECEIVED and OVERDUE status for outstanding AP', async () => {
      vi.mocked(prisma.bill.aggregate)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never);

      await billService.getBillStats(mockTenantContext);

      const calls = vi.mocked(prisma.bill.aggregate).mock.calls;
      expect(calls[0][0].where.status).toEqual({ in: ['RECEIVED', 'OVERDUE'] });
    });

    it('should filter by tenantId for all aggregations', async () => {
      vi.mocked(prisma.bill.aggregate)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never)
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } } as never);

      await billService.getBillStats(mockTenantContext);

      const calls = vi.mocked(prisma.bill.aggregate).mock.calls;
      calls.forEach((call) => {
        expect(call[0].where.entity).toEqual({ tenantId: TENANT_ID });
        expect(call[0].where.deletedAt).toBeNull();
      });
    });
  });
});
