import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vendorService from '../vendor.service';
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

const mockTenantContext = {
  tenantId: TENANT_ID,
  userId: 'user-test-789',
  role: 'OWNER' as const,
};

function mockVendor(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vendor-1',
    name: 'ABC Supplier',
    email: 'billing@abc.com',
    phone: '555-1234',
    address: '123 Main St',
    paymentTerms: 'NET_30',
    status: 'active',
    entityId: ENTITY_ID,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    entity: { id: ENTITY_ID, name: 'My Company', tenantId: TENANT_ID },
    ...overrides,
  };
}

describe('VendorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  describe('createVendor', () => {
    it('should verify entity belongs to tenant before creating', async () => {
      const entity = { id: ENTITY_ID, tenantId: TENANT_ID, name: 'Corp', deletedAt: null };
      mockPrisma.entity.findFirst.mockResolvedValueOnce(entity);
      mockPrisma.vendor.create.mockResolvedValueOnce(mockVendor());

      await vendorService.createVendor(
        {
          entityId: ENTITY_ID,
          name: 'New Vendor',
          email: 'contact@newvendor.com',
          phone: '555-9999',
          address: '456 Oak Ave',
          paymentTerms: 'NET_30',
          status: 'active',
        },
        mockTenantContext
      );

      expect(mockPrisma.entity.findFirst).toHaveBeenCalledWith({
        where: {
          id: ENTITY_ID,
          tenantId: TENANT_ID,
        },
      });
    });

    it('should throw if entity does not belong to tenant', async () => {
      mockPrisma.entity.findFirst.mockResolvedValueOnce(null);

      await expect(
        vendorService.createVendor(
          {
            entityId: 'entity-other-tenant',
            name: 'Sneaky Vendor',
            email: 'sneaky@vendor.com',
            phone: '555-0000',
            address: '789 Elm St',
            paymentTerms: 'NET_30',
            status: 'active',
          },
          mockTenantContext
        )
      ).rejects.toThrow('Entity not found');
    });

    it('should create vendor with all provided fields', async () => {
      const entity = { id: ENTITY_ID, tenantId: TENANT_ID, deletedAt: null };
      mockPrisma.entity.findFirst.mockResolvedValueOnce(entity);
      mockPrisma.vendor.create.mockResolvedValueOnce(mockVendor());

      await vendorService.createVendor(
        {
          entityId: ENTITY_ID,
          name: 'Test Vendor',
          email: 'test@vendor.com',
          phone: '555-1111',
          address: '321 Pine St',
          paymentTerms: 'NET_15',
          status: 'active',
        },
        mockTenantContext
      );

      const createArgs = mockPrisma.vendor.create.mock.calls[0][0]!;
      expect(createArgs.data).toEqual({
        entityId: ENTITY_ID,
        name: 'Test Vendor',
        email: 'test@vendor.com',
        phone: '555-1111',
        address: '321 Pine St',
        paymentTerms: 'NET_15',
        status: 'active',
      });
      expect(createArgs.include).toEqual({ entity: true });
    });
  });

  describe('listVendors', () => {
    it('should filter by tenantId via entity relation', async () => {
      mockPrisma.vendor.findMany.mockResolvedValueOnce([]);

      await vendorService.listVendors({ limit: 10 }, mockTenantContext);

      const callArgs = mockPrisma.vendor.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.entity).toEqual({ tenantId: TENANT_ID });
    });

    it('should always filter soft-deleted records', async () => {
      mockPrisma.vendor.findMany.mockResolvedValueOnce([]);

      await vendorService.listVendors({ limit: 10 }, mockTenantContext);

      const callArgs = mockPrisma.vendor.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should support status filter', async () => {
      mockPrisma.vendor.findMany.mockResolvedValueOnce([]);

      await vendorService.listVendors({ limit: 10, status: 'active' }, mockTenantContext);

      const callArgs = mockPrisma.vendor.findMany.mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('status', 'active');
    });

    it('should support search filter (name and email)', async () => {
      mockPrisma.vendor.findMany.mockResolvedValueOnce([]);

      await vendorService.listVendors({ limit: 10, search: 'abc' }, mockTenantContext);

      const callArgs = mockPrisma.vendor.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.OR).toEqual([
        { name: { contains: 'abc', mode: 'insensitive' } },
        { email: { contains: 'abc', mode: 'insensitive' } },
      ]);
    });

    it('should support cursor pagination', async () => {
      mockPrisma.vendor.findMany.mockResolvedValueOnce([]);

      await vendorService.listVendors({ limit: 10, cursor: 'cursor-abc' }, mockTenantContext);

      const callArgs = mockPrisma.vendor.findMany.mock.calls[0][0]!;
      expect(callArgs.where!.id).toEqual({ gt: 'cursor-abc' });
    });

    it('should return nextCursor when limit reached', async () => {
      const vendors = [
        mockVendor({ id: 'vendor-1' }),
        mockVendor({ id: 'vendor-2' }),
      ];
      mockPrisma.vendor.findMany.mockResolvedValueOnce(vendors);

      const result = await vendorService.listVendors({ limit: 2 }, mockTenantContext);

      expect(result.nextCursor).toBe('vendor-2');
    });

    it('should return null cursor when fewer results than limit', async () => {
      const vendors = [mockVendor({ id: 'vendor-1' })];
      mockPrisma.vendor.findMany.mockResolvedValueOnce(vendors);

      const result = await vendorService.listVendors({ limit: 10 }, mockTenantContext);

      expect(result.nextCursor).toBeNull();
    });

    it('should order by createdAt desc', async () => {
      mockPrisma.vendor.findMany.mockResolvedValueOnce([]);

      await vendorService.listVendors({ limit: 10 }, mockTenantContext);

      const callArgs = mockPrisma.vendor.findMany.mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('getVendor', () => {
    it('should find vendor by id with tenant isolation', async () => {
      const vendor = mockVendor({ id: 'vendor-xyz' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.count.mockResolvedValueOnce(3);
      mockPrisma.bill.aggregate.mockResolvedValueOnce({
        _sum: { total: 10000, paidAmount: 2500 },
      });

      await vendorService.getVendor('vendor-xyz', mockTenantContext);

      expect(mockPrisma.vendor.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'vendor-xyz',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: { entity: true },
      });
    });

    it('should throw when vendor not found', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(null);

      await expect(
        vendorService.getVendor('nonexistent', mockTenantContext)
      ).rejects.toThrow('Vendor not found');
    });

    it('should reject cross-tenant access', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(null);

      await expect(
        vendorService.getVendor('vendor-other-tenant', mockTenantContext)
      ).rejects.toThrow('Vendor not found');

      expect(mockPrisma.vendor.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'vendor-other-tenant',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: { entity: true },
      });
    });

    it('should calculate balanceDue as integer cents', async () => {
      const vendor = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.count.mockResolvedValueOnce(2);
      mockPrisma.bill.aggregate.mockResolvedValueOnce({
        _sum: { total: 50000, paidAmount: 12500 }, // $500.00 - $125.00 = $375.00
      });

      const result = await vendorService.getVendor('vendor-1', mockTenantContext);

      expect(result.balanceDue).toBe(37500); // Integer cents
      assertIntegerCents(result.balanceDue, 'balanceDue');
    });

    it('should include openBills count', async () => {
      const vendor = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.count.mockResolvedValueOnce(5);
      mockPrisma.bill.aggregate.mockResolvedValueOnce({
        _sum: { total: 10000, paidAmount: 0 },
      });

      const result = await vendorService.getVendor('vendor-1', mockTenantContext);

      expect(result.openBills).toBe(5);
    });

    it('should handle zero balances correctly', async () => {
      const vendor = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.count.mockResolvedValueOnce(0);
      mockPrisma.bill.aggregate.mockResolvedValueOnce({
        _sum: { total: null, paidAmount: null },
      });

      const result = await vendorService.getVendor('vendor-1', mockTenantContext);

      expect(result.balanceDue).toBe(0);
      assertIntegerCents(result.balanceDue, 'balanceDue');
    });

    it('should only query PENDING, PARTIALLY_PAID and OVERDUE bills for balance', async () => {
      const vendor = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(vendor);
      mockPrisma.bill.count.mockResolvedValueOnce(0);
      mockPrisma.bill.aggregate.mockResolvedValueOnce({
        _sum: { total: 0, paidAmount: 0 },
      });

      await vendorService.getVendor('vendor-1', mockTenantContext);

      expect(mockPrisma.bill.count).toHaveBeenCalledWith({
        where: {
          vendorId: 'vendor-1',
          status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
          deletedAt: null,
          entity: { tenantId: 'tenant-test-123' },
        },
      });

      expect(mockPrisma.bill.aggregate).toHaveBeenCalledWith({
        where: {
          vendorId: 'vendor-1',
          status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
          deletedAt: null,
          entity: { tenantId: 'tenant-test-123' },
        },
        _sum: { total: true, paidAmount: true },
      });
    });
  });

  describe('updateVendor', () => {
    it('should verify vendor exists and tenant owns before updating', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.vendor.update.mockResolvedValueOnce(existing);

      await vendorService.updateVendor('vendor-1', { name: 'Updated Name' }, mockTenantContext);

      expect(mockPrisma.vendor.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'vendor-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw when vendor not found', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(null);

      await expect(
        vendorService.updateVendor('nonexistent', { name: 'Updated' }, mockTenantContext)
      ).rejects.toThrow('Vendor not found');

      expect(mockPrisma.vendor.update).not.toHaveBeenCalled();
    });

    it('should reject cross-tenant update', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(null);

      await expect(
        vendorService.updateVendor('vendor-other-tenant', { name: 'Hacked' }, mockTenantContext)
      ).rejects.toThrow('Vendor not found');
    });

    it('should only update provided fields', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.vendor.update.mockResolvedValueOnce(existing);

      await vendorService.updateVendor(
        'vendor-1',
        { name: 'New Name', email: 'new@email.com' },
        mockTenantContext
      );

      const updateArgs = mockPrisma.vendor.update.mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({
        name: 'New Name',
        email: 'new@email.com',
      });
    });

    it('should handle optional fields correctly (allow nullable)', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.vendor.update.mockResolvedValueOnce(existing);

      await vendorService.updateVendor(
        'vendor-1',
        { phone: null, address: null } as any,
        mockTenantContext
      );

      const updateArgs = mockPrisma.vendor.update.mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('phone', null);
      expect(updateArgs.data).toHaveProperty('address', null);
    });

    it('should include entity in response', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.vendor.update.mockResolvedValueOnce(existing);

      await vendorService.updateVendor('vendor-1', { name: 'Updated' }, mockTenantContext);

      const updateArgs = mockPrisma.vendor.update.mock.calls[0][0]!;
      expect(updateArgs.include).toEqual({ entity: true });
    });
  });

  describe('deleteVendor', () => {
    it('should verify vendor exists and tenant owns before deleting', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.vendor.update.mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      });

      await vendorService.deleteVendor('vendor-1', mockTenantContext);

      expect(mockPrisma.vendor.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'vendor-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw when vendor not found', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(null);

      await expect(
        vendorService.deleteVendor('nonexistent', mockTenantContext)
      ).rejects.toThrow('Vendor not found');

      expect(mockPrisma.vendor.update).not.toHaveBeenCalled();
    });

    it('should soft delete (set deletedAt, not hard delete)', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.vendor.update.mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      });

      const result = await vendorService.deleteVendor('vendor-1', mockTenantContext);

      const updateArgs = mockPrisma.vendor.update.mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('deletedAt');
      expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);

      // Verify result has deletedAt
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should reject cross-tenant delete', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValueOnce(null);

      await expect(
        vendorService.deleteVendor('vendor-other-tenant', mockTenantContext)
      ).rejects.toThrow('Vendor not found');
    });
  });
});
