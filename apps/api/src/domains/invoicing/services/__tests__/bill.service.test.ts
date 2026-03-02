import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as billService from '../bill.service';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';
import { mockPrisma, rewirePrismaMock } from '../../../../test-utils';

// ---------------------------------------------------------------------------
// Prisma mock (dynamic import bypasses vi.mock hoisting constraint)
// ---------------------------------------------------------------------------

vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

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
    rewirePrismaMock();
  });

  describe('createBill', () => {
    it('should verify vendor belongs to tenant before creating', async () => {
      const vendor = {
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.create.mockResolvedValueOnce(mockBill());

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
          notes: undefined,
          lines: [
            {
              description: 'Service',
              quantity: 1,
              unitPrice: 100000,
              taxAmount: 10000,
              amount: 100000, // qty * unitPrice (pre-tax)
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      expect(mockPrisma.vendor.findFirst).toHaveBeenCalledWith({
        where: {
          id: VENDOR_ID,
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw if vendor does not belong to tenant', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(null);

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
            notes: undefined,
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
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.create.mockResolvedValueOnce(mockBill());

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
            {
              description: 'Service A',
              quantity: 1,
              unitPrice: 150000,
              taxAmount: 15000,
              amount: 150000, // qty * unitPrice (pre-tax)
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      const createArgs = mockPrisma.bill.create.mock.calls[0][0]!;
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
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.create.mockResolvedValueOnce(mockBill());

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
          notes: undefined,
          lines: [
            {
              description: 'Product',
              quantity: 1,
              unitPrice: 50000,
              taxAmount: 0,
              amount: 50000,
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      const createArgs = mockPrisma.bill.create.mock.calls[0][0]!;
      expect(createArgs.data.paidAmount).toBe(0);
    });

    it('should create bill lines nested', async () => {
      const vendor = {
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.create.mockResolvedValueOnce(mockBill());

      const lines = [
        {
          description: 'Item 1',
          quantity: 2,
          unitPrice: 25000,
          taxAmount: 5000,
          amount: 50000, // 2 * 25000 (pre-tax)
          glAccountId: undefined,
          categoryId: undefined,
        },
        {
          description: 'Item 2',
          quantity: 1,
          unitPrice: 10000,
          taxAmount: 1000,
          amount: 10000, // 1 * 10000 (pre-tax)
          glAccountId: undefined,
          categoryId: undefined,
        },
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
          notes: undefined,
          lines,
        },
        mockTenantContext
      );

      const createArgs = mockPrisma.bill.create.mock.calls[0][0]!;
      expect(createArgs.data.billLines).toEqual({ create: lines });
    });

    it('should validate taxRateId ownership (IDOR prevention)', async () => {
      const vendor = {
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.taxRate.findMany.mockResolvedValueOnce([]);

      await expect(
        billService.createBill(
          {
            vendorId: VENDOR_ID,
            billNumber: 'BILL-500',
            issueDate: '2024-06-01',
            dueDate: '2024-06-30',
            currency: 'USD',
            subtotal: 100000,
            taxAmount: 5000,
            total: 105000,
            status: 'DRAFT',
            notes: undefined,
            lines: [
              {
                description: 'Taxed item',
                quantity: 1,
                unitPrice: 100000,
                taxRateId: 'taxrate-other-tenant',
                taxAmount: 5000,
                amount: 100000,
                glAccountId: undefined,
                categoryId: undefined,
              },
            ],
          },
          mockTenantContext
        )
      ).rejects.toThrow('Tax rate not found or access denied');
    });

    it('should accept valid taxRateId belonging to tenant', async () => {
      const vendor = {
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.taxRate.findMany.mockResolvedValueOnce([
        { id: 'taxrate-valid' },
      ]);
      mockPrisma.bill.create.mockResolvedValueOnce(mockBill());

      await billService.createBill(
        {
          vendorId: VENDOR_ID,
          billNumber: 'BILL-501',
          issueDate: '2024-06-01',
          dueDate: '2024-06-30',
          currency: 'USD',
          subtotal: 100000,
          taxAmount: 5000,
          total: 105000,
          status: 'DRAFT',
          notes: undefined,
          lines: [
            {
              description: 'Taxed item',
              quantity: 1,
              unitPrice: 100000,
              taxRateId: 'taxrate-valid',
              taxAmount: 5000,
              amount: 100000,
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      expect(mockPrisma.taxRate.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['taxrate-valid'] },
          OR: [
            { entity: { tenantId: TENANT_ID } },
            { entityId: null },
          ],
        },
        select: { id: true },
      });
      expect(mockPrisma.bill.create).toHaveBeenCalled();
    });

    it('should skip taxRateId validation when no lines have taxRateId', async () => {
      const vendor = {
        id: VENDOR_ID,
        entityId: ENTITY_ID,
        entity: { tenantId: TENANT_ID },
        deletedAt: null,
      };
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.create.mockResolvedValueOnce(mockBill());

      await billService.createBill(
        {
          vendorId: VENDOR_ID,
          billNumber: 'BILL-502',
          issueDate: '2024-06-01',
          dueDate: '2024-06-30',
          currency: 'USD',
          subtotal: 50000,
          taxAmount: 0,
          total: 50000,
          status: 'DRAFT',
          notes: undefined,
          lines: [
            {
              description: 'No tax item',
              quantity: 1,
              unitPrice: 50000,
              taxAmount: 0,
              amount: 50000,
              glAccountId: undefined,
              categoryId: undefined,
            },
          ],
        },
        mockTenantContext
      );

      expect(mockPrisma.taxRate.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.bill.create).toHaveBeenCalled();
    });
  });

  describe('listBills', () => {
    it('should filter by tenantId via entity relation', async () => {
      mockPrisma.bill.findMany.mockResolvedValueOnce([]);

      await billService.listBills({ limit: 10 }, mockTenantContext);

      const callArgs = mockPrisma.bill.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.entity).toEqual({ tenantId: TENANT_ID });
    });

    it('should always filter soft-deleted records', async () => {
      mockPrisma.bill.findMany.mockResolvedValueOnce([]);

      await billService.listBills({ limit: 10 }, mockTenantContext);

      const callArgs = mockPrisma.bill.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should support status filter', async () => {
      mockPrisma.bill.findMany.mockResolvedValueOnce([]);

      await billService.listBills({ limit: 10, status: 'PENDING' }, mockTenantContext);

      const callArgs = mockPrisma.bill.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('status', 'PENDING');
    });

    it('should support vendorId filter', async () => {
      mockPrisma.bill.findMany.mockResolvedValueOnce([]);

      await billService.listBills({ limit: 10, vendorId: VENDOR_ID }, mockTenantContext);

      const callArgs = mockPrisma.bill.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('vendorId', VENDOR_ID);
    });

    it('should support date range filters', async () => {
      mockPrisma.bill.findMany.mockResolvedValueOnce([]);

      await billService.listBills(
        { limit: 10, dateFrom: '2024-01-01', dateTo: '2024-01-31' },
        mockTenantContext
      );

      const callArgs = mockPrisma.bill.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.issueDate).toEqual({
        gte: new Date('2024-01-01'),
        lte: new Date('2024-01-31'),
      });
    });

    it('should support cursor pagination', async () => {
      mockPrisma.bill.findMany.mockResolvedValueOnce([]);

      await billService.listBills({ limit: 10, cursor: 'cursor-abc' }, mockTenantContext);

      const callArgs = mockPrisma.bill.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.id).toEqual({ gt: 'cursor-abc' });
    });

    it('should return nextCursor when limit reached', async () => {
      const bills = [mockBill({ id: 'bill-1' }), mockBill({ id: 'bill-2' })];
      mockPrisma.bill.findMany.mockResolvedValueOnce(bills);

      const result = await billService.listBills({ limit: 2 }, mockTenantContext);

      expect(result.nextCursor).toBe('bill-2');
    });

    it('should return null cursor when fewer results than limit', async () => {
      const bills = [mockBill({ id: 'bill-1' })];
      mockPrisma.bill.findMany.mockResolvedValueOnce(bills);

      const result = await billService.listBills({ limit: 10 }, mockTenantContext);

      expect(result.nextCursor).toBeNull();
    });

    it('should order by createdAt desc', async () => {
      mockPrisma.bill.findMany.mockResolvedValueOnce([]);

      await billService.listBills({ limit: 10 }, mockTenantContext);

      const callArgs = mockPrisma.bill.findMany.mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('getBill', () => {
    it('should find bill by id with tenant isolation', async () => {
      const bill = mockBill({ id: 'bill-xyz' });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);

      const result = await billService.getBill('bill-xyz', mockTenantContext);

      expect(result).toEqual(bill);
      expect(mockPrisma.bill.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'bill-xyz',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: {
          vendor: true,
          entity: true,
          billLines: { include: { taxRate: true } },
        },
      });
    });

    it('should throw when bill not found', async () => {
      mockPrisma.bill.findFirst.mockResolvedValueOnce(null);

      await expect(
        billService.getBill('nonexistent', mockTenantContext)
      ).rejects.toThrow('Bill not found');
    });

    it('should reject cross-tenant access', async () => {
      mockPrisma.bill.findFirst.mockResolvedValueOnce(null);

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
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);

      const result = await billService.getBill('bill-1', mockTenantContext);

      assertIntegerCents(result.subtotal, 'subtotal');
      assertIntegerCents(result.taxAmount, 'taxAmount');
      assertIntegerCents(result.total, 'total');
      assertIntegerCents(result.paidAmount, 'paidAmount');
    });
  });

  describe('updateBill', () => {
    it('should verify bill exists and tenant owns before updating', async () => {
      const existing = mockBill({ id: 'bill-1', status: 'DRAFT' });
      // FIN-29: Now fetches with billLines for validation
      mockPrisma.bill.findFirst.mockResolvedValueOnce({ ...existing, billLines: [] });
      mockPrisma.bill.update.mockResolvedValueOnce(existing);

      await billService.updateBill(
        'bill-1',
        { billNumber: 'BILL-999' },
        mockTenantContext
      );

      expect(mockPrisma.bill.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'bill-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: { billLines: true },
      });
    });

    it('should throw when bill not found', async () => {
      mockPrisma.bill.findFirst.mockResolvedValueOnce(null);

      await expect(
        billService.updateBill('nonexistent', { status: 'PENDING' }, mockTenantContext)
      ).rejects.toThrow('Bill not found');

      expect(mockPrisma.bill.update).not.toHaveBeenCalled();
    });

    it('should reject cross-tenant update', async () => {
      mockPrisma.bill.findFirst.mockResolvedValueOnce(null);

      await expect(
        billService.updateBill('bill-other-tenant', { status: 'PENDING' }, mockTenantContext)
      ).rejects.toThrow('Bill not found');
    });

    it('should only update provided fields', async () => {
      const existing = mockBill({ id: 'bill-1' });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.bill.update.mockResolvedValueOnce(existing);

      await billService.updateBill(
        'bill-1',
        { status: 'PENDING', notes: 'Updated notes' },
        mockTenantContext
      );

      const updateArgs = mockPrisma.bill.update.mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({
        status: 'PENDING',
        notes: 'Updated notes',
      });
    });
  });

  describe('deleteBill', () => {
    it('should verify bill exists and tenant owns before deleting', async () => {
      const existing = mockBill({ id: 'bill-1' });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      });

      await billService.deleteBill('bill-1', mockTenantContext);

      expect(mockPrisma.bill.findFirst).toHaveBeenCalled();
    });

    it('should soft delete (set deletedAt, not hard delete)', async () => {
      const existing = mockBill({ id: 'bill-1' });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      });

      const result = await billService.deleteBill('bill-1', mockTenantContext);

      const updateArgs = mockPrisma.bill.update.mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('deletedAt');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('getBillStats', () => {
    it('should calculate outstandingAP as integer cents', async () => {
      mockPrisma.bill.aggregate
        .mockResolvedValueOnce({ _sum: { total: 100000, paidAmount: 25000 } }) // Outstanding
        .mockResolvedValueOnce({ _sum: { total: 50000 } }) // Paid
        .mockResolvedValueOnce({ _sum: { total: 30000 } }) // Overdue
        .mockResolvedValueOnce({ _sum: { total: 40000, paidAmount: 0 } }) // Current
        .mockResolvedValueOnce({ _sum: { total: 20000, paidAmount: 0 } }) // 1-30
        .mockResolvedValueOnce({ _sum: { total: 10000, paidAmount: 0 } }) // 31-60
        .mockResolvedValueOnce({ _sum: { total: 5000, paidAmount: 0 } }); // 60+

      const result = await billService.getBillStats(mockTenantContext);

      expect(result.outstandingAP).toBe(75000); // 100000 - 25000
      assertIntegerCents(result.outstandingAP, 'outstandingAP');
    });

    it('should calculate aging buckets correctly', async () => {
      mockPrisma.bill.aggregate
        .mockResolvedValueOnce({ _sum: { total: 100000, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 40000, paidAmount: 0 } }) // Current: 40%
        .mockResolvedValueOnce({ _sum: { total: 30000, paidAmount: 0 } }) // 1-30: 30%
        .mockResolvedValueOnce({ _sum: { total: 20000, paidAmount: 0 } }) // 31-60: 20%
        .mockResolvedValueOnce({ _sum: { total: 10000, paidAmount: 0 } }); // 60+: 10%

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
      mockPrisma.bill.aggregate
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } })
        .mockResolvedValueOnce({ _sum: { total: null } })
        .mockResolvedValueOnce({ _sum: { total: null } })
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } })
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } })
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } })
        .mockResolvedValueOnce({ _sum: { total: null, paidAmount: null } });

      const result = await billService.getBillStats(mockTenantContext);

      expect(result.outstandingAP).toBe(0);
      expect(result.paidThisMonth).toBe(0);
      expect(result.overdue).toBe(0);
      assertIntegerCents(result.outstandingAP, 'outstandingAP');
    });

    it('should filter by PENDING, PARTIALLY_PAID, and OVERDUE status for outstanding AP', async () => {
      mockPrisma.bill.aggregate
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } });

      await billService.getBillStats(mockTenantContext);

      const calls = mockPrisma.bill.aggregate.mock.calls;
      expect(calls[0]![0].where!.status).toEqual({ in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] });
    });

    it('should filter by tenantId for all aggregations', async () => {
      mockPrisma.bill.aggregate
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0, paidAmount: 0 } });

      await billService.getBillStats(mockTenantContext);

      const calls = mockPrisma.bill.aggregate.mock.calls;
      calls.forEach((call) => {
        expect(call[0]!.where!.entity).toEqual({ tenantId: TENANT_ID });
        expect(call[0]!.where!.deletedAt).toBeNull();
      });
    });
  });

  // ─── Status Transition Tests ─────────────────────────────────────

  describe('approveBill', () => {
    it('should transition DRAFT → PENDING', async () => {
      const bill = mockBill({ status: 'DRAFT' });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...bill,
        status: 'PENDING',
      });

      const result = await billService.approveBill('bill-1', mockTenantContext);

      expect(result.status).toBe('PENDING');
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { status: 'PENDING' },
        include: { vendor: true, entity: true, billLines: { include: { taxRate: true } } },
      });
    });

    it('should reject transition from PAID → PENDING', async () => {
      const bill = mockBill({ status: 'PAID' });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);

      await expect(
        billService.approveBill('bill-1', mockTenantContext)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('cancelBill', () => {
    it('should transition DRAFT → CANCELLED', async () => {
      const bill = mockBill({ status: 'DRAFT', paidAmount: 0 });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...bill,
        status: 'CANCELLED',
      });

      const result = await billService.cancelBill('bill-1', mockTenantContext);

      expect(result.status).toBe('CANCELLED');
    });

    it('should reject cancellation when payments exist', async () => {
      const bill = mockBill({ status: 'PENDING', paidAmount: 25000 });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);

      await expect(
        billService.cancelBill('bill-1', mockTenantContext)
      ).rejects.toThrow('Cannot cancel bill with existing payments');
    });

    it('should reject transition from PAID → CANCELLED', async () => {
      const bill = mockBill({ status: 'PAID', paidAmount: 99000 });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);

      await expect(
        billService.cancelBill('bill-1', mockTenantContext)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('markBillOverdue', () => {
    it('should transition PENDING → OVERDUE', async () => {
      const bill = mockBill({ status: 'PENDING' });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...bill,
        status: 'OVERDUE',
      });

      const result = await billService.markBillOverdue('bill-1', mockTenantContext);

      expect(result.status).toBe('OVERDUE');
    });

    it('should reject transition from DRAFT → OVERDUE', async () => {
      const bill = mockBill({ status: 'DRAFT' });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);

      await expect(
        billService.markBillOverdue('bill-1', mockTenantContext)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('applyPaymentToBill', () => {
    it('should partially pay and update status to PARTIALLY_PAID', async () => {
      const bill = mockBill({ status: 'PENDING', total: 99000, paidAmount: 0 });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...bill,
        paidAmount: 50000,
        status: 'PARTIALLY_PAID',
      });

      const result = await billService.applyPaymentToBill('bill-1', 50000, mockTenantContext);

      expect(result.status).toBe('PARTIALLY_PAID');
      assertIntegerCents(result.paidAmount, 'paidAmount');
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { paidAmount: 50000, status: 'PARTIALLY_PAID' },
        include: { vendor: true, entity: true, billLines: { include: { taxRate: true } } },
      });
    });

    it('should fully pay and update status to PAID', async () => {
      const bill = mockBill({ status: 'PENDING', total: 99000, paidAmount: 0 });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...bill,
        paidAmount: 99000,
        status: 'PAID',
      });

      const result = await billService.applyPaymentToBill('bill-1', 99000, mockTenantContext);

      expect(result.status).toBe('PAID');
    });

    it('should reject payment exceeding balance', async () => {
      const bill = mockBill({ status: 'PENDING', total: 99000, paidAmount: 90000 });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);

      await expect(
        billService.applyPaymentToBill('bill-1', 50000, mockTenantContext)
      ).rejects.toThrow('would exceed bill balance');
    });

    it('should reject zero or negative payment amount', async () => {
      const bill = mockBill({ status: 'PENDING', total: 99000, paidAmount: 0 });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);

      await expect(
        billService.applyPaymentToBill('bill-1', 0, mockTenantContext)
      ).rejects.toThrow('Payment amount must be positive');
    });
  });

  describe('reversePaymentFromBill', () => {
    it('should revert to PENDING when fully reversed and not yet due', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const bill = mockBill({
        status: 'PARTIALLY_PAID',
        total: 99000,
        paidAmount: 25000,
        dueDate: futureDate,
      });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...bill,
        paidAmount: 0,
        status: 'PENDING',
      });

      const result = await billService.reversePaymentFromBill('bill-1', 25000, mockTenantContext);

      expect(result.status).toBe('PENDING');
      expect(result.paidAmount).toBe(0);
    });

    it('should revert to OVERDUE when fully reversed and past due', async () => {
      const pastDate = new Date('2024-01-01');
      const bill = mockBill({
        status: 'PARTIALLY_PAID',
        total: 99000,
        paidAmount: 25000,
        dueDate: pastDate,
      });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...bill,
        paidAmount: 0,
        status: 'OVERDUE',
      });

      const result = await billService.reversePaymentFromBill('bill-1', 25000, mockTenantContext);

      expect(result.status).toBe('OVERDUE');
    });

    it('should remain PARTIALLY_PAID when partially reversed', async () => {
      const bill = mockBill({
        status: 'PAID',
        total: 99000,
        paidAmount: 99000,
      });
      mockPrisma.bill.findFirst.mockResolvedValueOnce(bill);
      mockPrisma.bill.update.mockResolvedValueOnce({
        ...bill,
        paidAmount: 50000,
        status: 'PARTIALLY_PAID',
      });

      const result = await billService.reversePaymentFromBill('bill-1', 49000, mockTenantContext);

      expect(result.status).toBe('PARTIALLY_PAID');
      assertIntegerCents(result.paidAmount, 'paidAmount');
    });
  });
});
