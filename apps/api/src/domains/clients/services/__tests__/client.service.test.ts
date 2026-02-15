import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientService from '../client.service';
import { assertIntegerCents, assertMoneyFields } from '../../../../test-utils/financial-assertions';

// Mock Prisma client
vi.mock('@akount/db', () => ({
  prisma: {
    client: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    entity: {
      findFirst: vi.fn(),
    },
    invoice: {
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

function mockClient(overrides: Record<string, unknown> = {}) {
  return {
    id: 'client-1',
    name: 'Acme Corp',
    email: 'billing@acme.com',
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

describe('ClientService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClient', () => {
    it('should verify entity belongs to tenant before creating', async () => {
      const entity = { id: ENTITY_ID, tenantId: TENANT_ID, name: 'Corp', deletedAt: null };
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.client.create).mockResolvedValueOnce(mockClient() as never);

      await clientService.createClient(
        {
          entityId: ENTITY_ID,
          name: 'New Client',
          email: 'contact@newclient.com',
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
        clientService.createClient(
          {
            entityId: 'entity-other-tenant',
            name: 'Sneaky Client',
            email: 'sneaky@client.com',
            phone: '555-0000',
            address: '789 Elm St',
            paymentTerms: 'NET_30',
            status: 'ACTIVE',
          },
          mockTenantContext
        )
      ).rejects.toThrow('Entity not found');
    });

    it('should create client with all provided fields', async () => {
      const entity = { id: ENTITY_ID, tenantId: TENANT_ID, deletedAt: null };
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.client.create).mockResolvedValueOnce(mockClient() as never);

      await clientService.createClient(
        {
          entityId: ENTITY_ID,
          name: 'Test Client',
          email: 'test@client.com',
          phone: '555-1111',
          address: '321 Pine St',
          paymentTerms: 'NET_15',
          status: 'ACTIVE',
        },
        mockTenantContext
      );

      const createArgs = vi.mocked(prisma.client.create).mock.calls[0][0]!;
      expect(createArgs.data).toEqual({
        entityId: ENTITY_ID,
        name: 'Test Client',
        email: 'test@client.com',
        phone: '555-1111',
        address: '321 Pine St',
        paymentTerms: 'NET_15',
        status: 'ACTIVE',
      });
      expect(createArgs.include).toEqual({ entity: true });
    });
  });

  describe('listClients', () => {
    it('should filter by tenantId via entity relation', async () => {
      vi.mocked(prisma.client.findMany).mockResolvedValueOnce([] as never);

      await clientService.listClients({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.client.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.entity).toEqual({ tenantId: TENANT_ID });
    });

    it('should always filter soft-deleted records', async () => {
      vi.mocked(prisma.client.findMany).mockResolvedValueOnce([] as never);

      await clientService.listClients({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.client.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('deletedAt', null);
    });

    it('should support status filter', async () => {
      vi.mocked(prisma.client.findMany).mockResolvedValueOnce([] as never);

      await clientService.listClients({ limit: 10, status: 'ACTIVE' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.client.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toHaveProperty('status', 'ACTIVE');
    });

    it('should support search filter (name and email)', async () => {
      vi.mocked(prisma.client.findMany).mockResolvedValueOnce([] as never);

      await clientService.listClients({ limit: 10, search: 'acme' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.client.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.OR).toEqual([
        { name: { contains: 'acme', mode: 'insensitive' } },
        { email: { contains: 'acme', mode: 'insensitive' } },
      ]);
    });

    it('should support cursor pagination', async () => {
      vi.mocked(prisma.client.findMany).mockResolvedValueOnce([] as never);

      await clientService.listClients({ limit: 10, cursor: 'cursor-abc' }, mockTenantContext);

      const callArgs = vi.mocked(prisma.client.findMany).mock.calls[0][0]!;
      expect(callArgs.where!.id).toEqual({ gt: 'cursor-abc' });
    });

    it('should return nextCursor when limit reached', async () => {
      const clients = [
        mockClient({ id: 'client-1' }),
        mockClient({ id: 'client-2' }),
      ];
      vi.mocked(prisma.client.findMany).mockResolvedValueOnce(clients as never);

      const result = await clientService.listClients({ limit: 2 }, mockTenantContext);

      expect(result.nextCursor).toBe('client-2');
    });

    it('should return null cursor when fewer results than limit', async () => {
      const clients = [mockClient({ id: 'client-1' })];
      vi.mocked(prisma.client.findMany).mockResolvedValueOnce(clients as never);

      const result = await clientService.listClients({ limit: 10 }, mockTenantContext);

      expect(result.nextCursor).toBeNull();
    });

    it('should order by createdAt desc', async () => {
      vi.mocked(prisma.client.findMany).mockResolvedValueOnce([] as never);

      await clientService.listClients({ limit: 10 }, mockTenantContext);

      const callArgs = vi.mocked(prisma.client.findMany).mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('getClient', () => {
    it('should find client by id with tenant isolation', async () => {
      const client = mockClient({ id: 'client-xyz' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(client as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(3 as never);
      vi.mocked(prisma.invoice.aggregate).mockResolvedValueOnce({
        _sum: { total: 10000, paidAmount: 2500 },
      } as never);

      await clientService.getClient('client-xyz', mockTenantContext);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client-xyz',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: { entity: true },
      });
    });

    it('should throw when client not found', async () => {
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        clientService.getClient('nonexistent', mockTenantContext)
      ).rejects.toThrow('Client not found');
    });

    it('should reject cross-tenant access', async () => {
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        clientService.getClient('client-other-tenant', mockTenantContext)
      ).rejects.toThrow('Client not found');

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client-other-tenant',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
        include: { entity: true },
      });
    });

    it('should calculate balanceDue as integer cents', async () => {
      const client = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(client as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(2 as never);
      vi.mocked(prisma.invoice.aggregate).mockResolvedValueOnce({
        _sum: { total: 50000, paidAmount: 12500 }, // $500.00 - $125.00 = $375.00
      } as never);

      const result = await clientService.getClient('client-1', mockTenantContext);

      expect(result.balanceDue).toBe(37500); // Integer cents
      assertIntegerCents(result.balanceDue, 'balanceDue');
    });

    it('should include openInvoices count', async () => {
      const client = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(client as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(5 as never);
      vi.mocked(prisma.invoice.aggregate).mockResolvedValueOnce({
        _sum: { total: 10000, paidAmount: 0 },
      } as never);

      const result = await clientService.getClient('client-1', mockTenantContext);

      expect(result.openInvoices).toBe(5);
    });

    it('should handle zero balances correctly', async () => {
      const client = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(client as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.invoice.aggregate).mockResolvedValueOnce({
        _sum: { total: null, paidAmount: null },
      } as never);

      const result = await clientService.getClient('client-1', mockTenantContext);

      expect(result.balanceDue).toBe(0);
      assertIntegerCents(result.balanceDue, 'balanceDue');
    });

    it('should only query SENT and OVERDUE invoices for balance', async () => {
      const client = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(client as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.invoice.aggregate).mockResolvedValueOnce({
        _sum: { total: 0, paidAmount: 0 },
      } as never);

      await clientService.getClient('client-1', mockTenantContext);

      expect(prisma.invoice.count).toHaveBeenCalledWith({
        where: {
          clientId: 'client-1',
          status: { in: ['SENT', 'OVERDUE'] },
          deletedAt: null,
        },
      });

      expect(prisma.invoice.aggregate).toHaveBeenCalledWith({
        where: {
          clientId: 'client-1',
          status: { in: ['SENT', 'OVERDUE'] },
          deletedAt: null,
        },
        _sum: { total: true, paidAmount: true },
      });
    });
  });

  describe('updateClient', () => {
    it('should verify client exists and tenant owns before updating', async () => {
      const existing = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.client.update).mockResolvedValueOnce(existing as never);

      await clientService.updateClient('client-1', { name: 'Updated Name' }, mockTenantContext);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw when client not found', async () => {
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        clientService.updateClient('nonexistent', { name: 'Updated' }, mockTenantContext)
      ).rejects.toThrow('Client not found');

      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('should reject cross-tenant update', async () => {
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        clientService.updateClient('client-other-tenant', { name: 'Hacked' }, mockTenantContext)
      ).rejects.toThrow('Client not found');
    });

    it('should only update provided fields', async () => {
      const existing = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.client.update).mockResolvedValueOnce(existing as never);

      await clientService.updateClient(
        'client-1',
        { name: 'New Name', email: 'new@email.com' },
        mockTenantContext
      );

      const updateArgs = vi.mocked(prisma.client.update).mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({
        name: 'New Name',
        email: 'new@email.com',
      });
    });

    it('should handle optional fields correctly (allow nullable)', async () => {
      const existing = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.client.update).mockResolvedValueOnce(existing as never);

      await clientService.updateClient(
        'client-1',
        { phone: null, address: null },
        mockTenantContext
      );

      const updateArgs = vi.mocked(prisma.client.update).mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('phone', null);
      expect(updateArgs.data).toHaveProperty('address', null);
    });

    it('should include entity in response', async () => {
      const existing = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.client.update).mockResolvedValueOnce(existing as never);

      await clientService.updateClient('client-1', { name: 'Updated' }, mockTenantContext);

      const updateArgs = vi.mocked(prisma.client.update).mock.calls[0][0]!;
      expect(updateArgs.include).toEqual({ entity: true });
    });
  });

  describe('deleteClient', () => {
    it('should verify client exists and tenant owns before deleting', async () => {
      const existing = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.client.update).mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      } as never);

      await clientService.deleteClient('client-1', mockTenantContext);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client-1',
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        },
      });
    });

    it('should throw when client not found', async () => {
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        clientService.deleteClient('nonexistent', mockTenantContext)
      ).rejects.toThrow('Client not found');

      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('should soft delete (set deletedAt, not hard delete)', async () => {
      const existing = mockClient({ id: 'client-1' });
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.client.update).mockResolvedValueOnce({
        ...existing,
        deletedAt: new Date(),
      } as never);

      const result = await clientService.deleteClient('client-1', mockTenantContext);

      const updateArgs = vi.mocked(prisma.client.update).mock.calls[0][0]!;
      expect(updateArgs.data).toHaveProperty('deletedAt');
      expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);

      // Verify result has deletedAt
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should reject cross-tenant delete', async () => {
      vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null as never);

      await expect(
        clientService.deleteClient('client-other-tenant', mockTenantContext)
      ).rejects.toThrow('Client not found');
    });
  });
});
