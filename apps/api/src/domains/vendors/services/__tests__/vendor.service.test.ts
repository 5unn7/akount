import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vendorService from '../vendor.service';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';

// Mock Prisma client
vi.mock('@akount/db', () => ({
  prisma: {
    vendor: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    entity: {
      findFirst: vi.fn(),
    },
    bill: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from '@akount/db';

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
    status: 'ACTIVE',
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
  });

  describe('createVendor', () => {
    it('should verify entity belongs to tenant before creating', async () => {
      const entity = { id: ENTITY_ID, tenantId: TENANT_ID, name: 'Corp', deletedAt: null };
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.vendor.create).mockResolvedValueOnce(mockVendor() as never);

      await vendorService.createVendor(
        {
          entityId: ENTITY_ID,
          name: 'New Vendor',
          email: 'contact@newvendor.com',
          phone: '555-9999',
          address: '456 Oak Ave',
          paymentTerms: 'NET_30',
          status: 'ACTIVE',
        },
        mockTenantContext
      );

      expect(prisma.entity.findFirst).toHaveBeenCalledWith({
        where: {
          id: ENTITY_ID,
          tenantId: TENANT_ID,
          deletedAt: null,
        },
      });
    });

    it('should throw if entity does not belong to tenant', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        vendorService.createVendor(
          {
            entityId: 'entity-other-tenant',
            name: 'Sneaky Vendor',
            email: 'sneaky@vendor.com',
            phone: '555-0000',
            address: '789 Elm St',
            paymentTerms: 'NET_30',
            status: 'ACTIVE',
          },
          mockTenantContext
        )
      ).rejects.toThrow('Entity not found');
    });

    it('should create vendor with all provided fields', async () => {
      const entity = { id: ENTITY_ID, tenantId: TENANT_ID, deletedAt: null };
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.vendor.create).mockResolvedValueOnce(mockVendor() as never);

      await vendorService.createVendor(
        {
          entityId: ENTITY_ID,
          name: 'Test Vendor',
          email: 'test@vendor.com',
          phone: '555-1111',
          address: '321 Pine St',
          paymentTerms: 'NET_15',
          status: 'ACTIVE',
        },
        mockTenantContext
      );

      const createArgs = vi.mocked(prisma.vendor.create).mock.calls[0][0]!;
      expect(createArgs.data).toEqual({
        entityId: ENTITY_ID,
        name: 'Test Vendor',
        email: 'test@vendor.com',
        phone: '555-1111',
        address: '321 Pine St',
        paymentTerms: 'NET_15',
        status: 'ACTIVE',
      });
      expect(createArgs.include).toEqual({ entity: true });
    });
  });

  describe('listVendors', () => {
    it('should filter by tenantId via entity relation', async () => {
      vi.mocked(prisma.vendor.findMany).mockResolvedValueOnce([] as never);

      await vendorService.listVendors({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.vendor.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.entity).toEqual({ tenantId: TENANT_ID });
    });

    it('should always filter soft-deleted records', async () => {
      vi.mocked(prisma.vendor.findMany).mockResolvedValueOnce([] as never);

      await vendorService.listVendors({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.vendor.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should support status filter', async () => {
      vi.mocked(prisma.vendor.findMany).mockResolvedValueOnce([] as never);

      await vendorService.listVendors({ limit: 10, status: 'ACTIVE' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.vendor.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('status', 'ACTIVE');
    });

    it('should support search filter (name and email)', async () => {
      vi.mocked(prisma.vendor.findMany).mockResolvedValueOnce([] as never);

      await vendorService.listVendors({ limit: 10, search: 'abc' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.vendor.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.OR).toEqual([
        { name: { contains: 'abc', mode: 'insensitive' } },
        { email: { contains: 'abc', mode: 'insensitive' } },
      ]);
    });

    it('should support cursor pagination', async () => {
      vi.mocked(prisma.vendor.findMany).mockResolvedValueOnce([] as never);

      await vendorService.listVendors({ limit: 10, cursor: 'cursor-abc' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.vendor.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.id).toEqual({ gt: 'cursor-abc' });
    });

    it('should return nextCursor when limit reached', async () => {
      const vendors = [
        mockVendor({ id: 'vendor-1' }),
        mockVendor({ id: 'vendor-2' }),
      ];
      vi.mocked(prisma.vendor.findMany).mockResolvedValueOnce(vendors as never);

      const result = await vendorService.listVendors({ limit: 2 }, mockTenantContext);

      expect(result.nextCursor).toBe('vendor-2');
    });

    it('should return null cursor when fewer results than limit', async () => {
      const vendors = [mockVendor({ id: 'vendor-1' })];
      vi.mocked(prisma.vendor.findMany).mockResolvedValueOnce(vendors as never);

      const result = await vendorService.listVendors({ limit: 10 }, mockTenantContext);

      expect(result.nextCursor).toBeNull();
    });

    it('should order by createdAt desc', async () => {
      vi.mocked(prisma.vendor.findMany).mockResolvedValueOnce([] as never);

      await vendorService.listVendors({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.vendor.findMany).mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('getVendor', () => {
    it('should find vendor by id with tenant isolation', async () => {
      const vendor = mockVendor({ id: 'vendor-xyz' });
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(vendor as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(3 as never);
      vi.mocked(prisma.bill.aggregate).mockResolvedValueOnce({
        _sum: { total: 10000, paidAmount: 2500 },
      } as never);

      await vendorService.getVendor('vendor-xyz', mockTenantContext);

      expect(prisma.vendor.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'vendor-xyz',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: { entity: true },
      });
    });

    it('should throw when vendor not found', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        vendorService.getVendor('nonexistent', mockTenantContext)
      ).rejects.toThrow('Vendor not found');
    });

    it('should reject cross-tenant access', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        vendorService.getVendor('vendor-other-tenant', mockTenantContext)
      ).rejects.toThrow('Vendor not found');

      expect(prisma.vendor.findFirst).toHaveBeenCalledWith({
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
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(vendor as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(2 as never);
      vi.mocked(prisma.bill.aggregate).mockResolvedValueOnce({
        _sum: { total: 50000, paidAmount: 12500 }, // $500.00 - $125.00 = $375.00
      } as never);

      const result = await vendorService.getVendor('vendor-1', mockTenantContext);

      expect(result.balanceDue).toBe(37500); // Integer cents
      assertIntegerCents(result.balanceDue, 'balanceDue');
    });

    it('should include openBills count', async () => {
      const vendor = mockVendor({ id: 'vendor-1' });
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(vendor as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(5 as never);
      vi.mocked(prisma.bill.aggregate).mockResolvedValueOnce({
        _sum: { total: 10000, paidAmount: 0 },
      } as never);

      const result = await vendorService.getVendor('vendor-1', mockTenantContext);

      expect(result.openBills).toBe(5);
    });

    it('should handle zero balances correctly', async () => {
      const vendor = mockVendor({ id: 'vendor-1' });
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(vendor as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.bill.aggregate).mockResolvedValueOnce({
        _sum: { total: null, paidAmount: null },
      } as never);

      const result = await vendorService.getVendor('vendor-1', mockTenantContext);

      expect(result.balanceDue).toBe(0);
      assertIntegerCents(result.balanceDue, 'balanceDue');
    });

    it('should only query RECEIVED and OVERDUE bills for balance', async () => {
      const vendor = mockVendor({ id: 'vendor-1' });
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(vendor as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.bill.aggregate).mockResolvedValueOnce({
        _sum: { total: 0, paidAmount: 0 },
      } as never);

      await vendorService.getVendor('vendor-1', mockTenantContext);

      expect(prisma.bill.count).toHaveBeenCalledWith({
        where: {
          vendorId: 'vendor-1',
          status: { in: ['RECEIVED', 'OVERDUE'] },
          deletedAt: null,
          entity: { tenantId: 'tenant-test-123' },
        },
      });

      expect(prisma.bill.aggregate).toHaveBeenCalledWith({
        where: {
          vendorId: 'vendor-1',
          status: { in: ['RECEIVED', 'OVERDUE'] },
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
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.vendor.update).mockResolvedValueOnce(existing as never);

      await vendorService.updateVendor('vendor-1', { name: 'Updated Name' }, mockTenantContext);

      expect(prisma.vendor.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'vendor-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw when vendor not found', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        vendorService.updateVendor('nonexistent', { name: 'Updated' }, mockTenantContext)
      ).rejects.toThrow('Vendor not found');

      expect(prisma.vendor.update).not.toHaveBeenCalled();
    });

    it('should reject cross-tenant update', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        vendorService.updateVendor('vendor-other-tenant', { name: 'Hacked' }, mockTenantContext)
      ).rejects.toThrow('Vendor not found');
    });

    it('should only update provided fields', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.vendor.update).mockResolvedValueOnce(existing as never);

      await vendorService.updateVendor(
        'vendor-1',
        { name: 'New Name', email: 'new@email.com' },
        mockTenantContext
      );

      const updateArgs = vi.mocked(prisma.vendor.update).mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({
        name: 'New Name',
        email: 'new@email.com',
      });
    });

    it('should handle optional fields correctly (allow nullable)', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.vendor.update).mockResolvedValueOnce(existing as never);

      await vendorService.updateVendor(
        'vendor-1',
        { phone: null, address: null },
        mockTenantContext
      );

      const updateArgs = vi.mocked(prisma.vendor.update).mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('phone', null);
      expect(updateArgs.data).toHaveProperty('address', null);
    });

    it('should include entity in response', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.vendor.update).mockResolvedValueOnce(existing as never);

      await vendorService.updateVendor('vendor-1', { name: 'Updated' }, mockTenantContext);

      const updateArgs = vi.mocked(prisma.vendor.update).mock.calls[0][0]!;
      expect(updateArgs.include).toEqual({ entity: true });
    });
  });

  describe('deleteVendor', () => {
    it('should verify vendor exists and tenant owns before deleting', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.vendor.update).mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      } as never);

      await vendorService.deleteVendor('vendor-1', mockTenantContext);

      expect(prisma.vendor.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'vendor-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw when vendor not found', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        vendorService.deleteVendor('nonexistent', mockTenantContext)
      ).rejects.toThrow('Vendor not found');

      expect(prisma.vendor.update).not.toHaveBeenCalled();
    });

    it('should soft delete (set deletedAt, not hard delete)', async () => {
      const existing = mockVendor({ id: 'vendor-1' });
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.vendor.update).mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      } as never);

      const result = await vendorService.deleteVendor('vendor-1', mockTenantContext);

      const updateArgs = vi.mocked(prisma.vendor.update).mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('deletedAt');
      expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);

      // Verify result has deletedAt
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should reject cross-tenant delete', async () => {
      vi.mocked(prisma.vendor.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        vendorService.deleteVendor('vendor-other-tenant', mockTenantContext)
      ).rejects.toThrow('Vendor not found');
    });
  });
});
