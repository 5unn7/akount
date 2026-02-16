import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityService } from '../entity.service';

// Mock Prisma client
vi.mock('@akount/db', () => ({
  prisma: {
    entity: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@akount/db';

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-test-001';
const OTHER_TENANT_ID = 'tenant-other-456';

function mockEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entity-1',
    tenantId: TENANT_ID,
    name: 'My Company',
    type: 'LLC',
    country: 'US',
    functionalCurrency: 'USD',
    reportingCurrency: 'USD',
    fiscalYearStart: 1,
    taxId: null,
    address: null,
    city: null,
    state: null,
    postalCode: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('EntityService', () => {
  let service: EntityService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EntityService(TENANT_ID);
  });

  describe('listEntities', () => {
    it('should list entities for the tenant only', async () => {
      const entities = [
        mockEntity({ id: 'entity-1', name: 'Company A' }),
        mockEntity({ id: 'entity-2', name: 'Company B' }),
      ];

      vi.mocked(prisma.entity.findMany).mockResolvedValueOnce(entities as never);

      const result = await service.listEntities();

      expect(result).toEqual(entities);
      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID },
        select: {
          id: true,
          name: true,
          type: true,
          functionalCurrency: true,
          reportingCurrency: true,
          country: true,
          fiscalYearStart: true,
          createdAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('should return empty array when no entities exist', async () => {
      vi.mocked(prisma.entity.findMany).mockResolvedValueOnce([] as never);

      const result = await service.listEntities();

      expect(result).toEqual([]);
    });

    it('should order entities by name ascending', async () => {
      vi.mocked(prisma.entity.findMany).mockResolvedValueOnce([] as never);

      await service.listEntities();

      const callArgs = vi.mocked(prisma.entity.findMany).mock.calls[0][0]!;
      expect(callArgs.orderBy).toEqual({ name: 'asc' });
    });

    it('should not include entities from other tenants', async () => {
      // This test verifies the WHERE clause filters by tenantId
      vi.mocked(prisma.entity.findMany).mockResolvedValueOnce([] as never);

      await service.listEntities();

      const callArgs = vi.mocked(prisma.entity.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toEqual({ tenantId: TENANT_ID });
    });
  });

  describe('getEntity', () => {
    it('should return entity with counts when found', async () => {
      const entity = {
        ...mockEntity({ id: 'entity-1' }),
        _count: {
          accounts: 5,
          glAccounts: 120,
          clients: 15,
          vendors: 8,
        },
      };

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);

      const result = await service.getEntity('entity-1');

      expect(result).toEqual(entity);
      expect(prisma.entity.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'entity-1',
          tenantId: TENANT_ID,
        },
        include: {
          _count: {
            select: {
              accounts: true,
              glAccounts: true,
              clients: true,
              vendors: true,
            },
          },
        },
      });
    });

    it('should return null when entity not found', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.getEntity('nonexistent');

      expect(result).toBeNull();
    });

    it('should enforce tenant isolation', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      await service.getEntity('entity-other-tenant');

      expect(prisma.entity.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'entity-other-tenant',
          tenantId: TENANT_ID,
        },
        include: {
          _count: {
            select: {
              accounts: true,
              glAccounts: true,
              clients: true,
              vendors: true,
            },
          },
        },
      });
    });
  });

  describe('createEntity', () => {
    it('should create entity with required fields', async () => {
      const newEntity = mockEntity({
        id: 'entity-new',
        name: 'New Company',
        type: 'CORPORATION',
        country: 'CA',
        functionalCurrency: 'CAD',
      });

      vi.mocked(prisma.entity.create).mockResolvedValueOnce(newEntity as never);

      const result = await service.createEntity(USER_ID, {
        name: 'New Company',
        type: 'CORPORATION',
        country: 'CA',
        functionalCurrency: 'CAD',
      });

      expect(result).toEqual(newEntity);
      expect(prisma.entity.create).toHaveBeenCalledWith({
        data: {
          tenantId: TENANT_ID,
          name: 'New Company',
          type: 'CORPORATION',
          country: 'CA',
          functionalCurrency: 'CAD',
          reportingCurrency: 'CAD', // Defaults to functionalCurrency
          fiscalYearStart: 1, // Default
        },
      });
    });

    it('should default reportingCurrency to functionalCurrency', async () => {
      vi.mocked(prisma.entity.create).mockResolvedValueOnce(mockEntity() as never);

      await service.createEntity(USER_ID, {
        name: 'Test Co',
        type: 'LLC',
        country: 'US',
        functionalCurrency: 'USD',
      });

      const createArgs = vi.mocked(prisma.entity.create).mock.calls[0][0]!;
      expect(createArgs.data.reportingCurrency).toBe('USD');
    });

    it('should use custom reportingCurrency when provided', async () => {
      vi.mocked(prisma.entity.create).mockResolvedValueOnce(mockEntity() as never);

      await service.createEntity(USER_ID, {
        name: 'Test Co',
        type: 'LLC',
        country: 'US',
        functionalCurrency: 'CAD',
        reportingCurrency: 'USD',
      });

      const createArgs = vi.mocked(prisma.entity.create).mock.calls[0][0]!;
      expect(createArgs.data.functionalCurrency).toBe('CAD');
      expect(createArgs.data.reportingCurrency).toBe('USD');
    });

    it('should default fiscalYearStart to 1 (January)', async () => {
      vi.mocked(prisma.entity.create).mockResolvedValueOnce(mockEntity() as never);

      await service.createEntity(USER_ID, {
        name: 'Test Co',
        type: 'LLC',
        country: 'US',
        functionalCurrency: 'USD',
      });

      const createArgs = vi.mocked(prisma.entity.create).mock.calls[0][0]!;
      expect(createArgs.data.fiscalYearStart).toBe(1);
    });

    it('should use custom fiscalYearStart when provided', async () => {
      vi.mocked(prisma.entity.create).mockResolvedValueOnce(mockEntity() as never);

      await service.createEntity(USER_ID, {
        name: 'Test Co',
        type: 'LLC',
        country: 'US',
        functionalCurrency: 'USD',
        fiscalYearStart: 4, // April
      });

      const createArgs = vi.mocked(prisma.entity.create).mock.calls[0][0]!;
      expect(createArgs.data.fiscalYearStart).toBe(4);
    });

    it('should include optional fields when provided', async () => {
      vi.mocked(prisma.entity.create).mockResolvedValueOnce(mockEntity() as never);

      await service.createEntity(USER_ID, {
        name: 'Test Co',
        type: 'LLC',
        country: 'US',
        functionalCurrency: 'USD',
        taxId: '12-3456789',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
      });

      const createArgs = vi.mocked(prisma.entity.create).mock.calls[0][0]!;
      expect(createArgs.data).toMatchObject({
        taxId: '12-3456789',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
      });
    });

    it('should set tenantId from service constructor', async () => {
      vi.mocked(prisma.entity.create).mockResolvedValueOnce(mockEntity() as never);

      await service.createEntity(USER_ID, {
        name: 'Test Co',
        type: 'LLC',
        country: 'US',
        functionalCurrency: 'USD',
      });

      const createArgs = vi.mocked(prisma.entity.create).mock.calls[0][0]!;
      expect(createArgs.data.tenantId).toBe(TENANT_ID);
    });

    it('should accept all valid entity types', async () => {
      const types = ['PERSONAL', 'CORPORATION', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC'];

      for (const type of types) {
        vi.mocked(prisma.entity.create).mockResolvedValueOnce(mockEntity({ type }) as never);

        await service.createEntity(USER_ID, {
          name: 'Test Co',
          type,
          country: 'US',
          functionalCurrency: 'USD',
        });

        const createArgs = vi.mocked(prisma.entity.create).mock.calls[vi.mocked(prisma.entity.create).mock.calls.length - 1][0]!;
        expect(createArgs.data.type).toBe(type);
      }
    });
  });

  describe('updateEntity', () => {
    it('should update entity when found', async () => {
      const existing = mockEntity({ id: 'entity-1', name: 'Old Name' });
      const updated = mockEntity({ id: 'entity-1', name: 'New Name' });

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.entity.update).mockResolvedValueOnce(updated as never);

      const result = await service.updateEntity('entity-1', { name: 'New Name' });

      expect(result).toEqual(updated);
      expect(prisma.entity.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'entity-1',
          tenantId: TENANT_ID,
        },
      });
      expect(prisma.entity.update).toHaveBeenCalledWith({
        where: { id: 'entity-1' },
        data: { name: 'New Name' },
      });
    });

    it('should return null when entity not found', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.updateEntity('nonexistent', { name: 'New Name' });

      expect(result).toBeNull();
      expect(prisma.entity.update).not.toHaveBeenCalled();
    });

    it('should enforce tenant isolation before update', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      await service.updateEntity('entity-other-tenant', { name: 'Hacked' });

      expect(prisma.entity.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'entity-other-tenant',
          tenantId: TENANT_ID,
        },
      });
      expect(prisma.entity.update).not.toHaveBeenCalled();
    });

    it('should update fiscalYearStart when provided', async () => {
      const existing = mockEntity({ id: 'entity-1', fiscalYearStart: 1 });
      const updated = mockEntity({ id: 'entity-1', fiscalYearStart: 7 });

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.entity.update).mockResolvedValueOnce(updated as never);

      await service.updateEntity('entity-1', { fiscalYearStart: 7 });

      expect(prisma.entity.update).toHaveBeenCalledWith({
        where: { id: 'entity-1' },
        data: { fiscalYearStart: 7 },
      });
    });

    it('should only update provided fields', async () => {
      const existing = mockEntity({ id: 'entity-1', name: 'Old Name', fiscalYearStart: 1 });

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.entity.update).mockResolvedValueOnce(existing as never);

      await service.updateEntity('entity-1', { name: 'New Name' });

      const updateArgs = vi.mocked(prisma.entity.update).mock.calls[0][0]!;
      expect(updateArgs.data).toEqual({ name: 'New Name' });
      expect(updateArgs.data).not.toHaveProperty('fiscalYearStart');
    });
  });

  describe('tenant isolation (cross-tenant scenarios)', () => {
    it('should not list entities from other tenants', async () => {
      const otherService = new EntityService(OTHER_TENANT_ID);

      vi.mocked(prisma.entity.findMany).mockResolvedValueOnce([] as never);

      await otherService.listEntities();

      const callArgs = vi.mocked(prisma.entity.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toEqual({ tenantId: OTHER_TENANT_ID });
      expect(callArgs.where).not.toEqual({ tenantId: TENANT_ID });
    });

    it('should not allow cross-tenant entity access via getEntity', async () => {
      // Simulate: TENANT_ID tries to access entity from OTHER_TENANT_ID
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.getEntity('entity-other-tenant');

      expect(result).toBeNull();
      expect(prisma.entity.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ID,
          }),
        })
      );
    });

    it('should not allow cross-tenant entity updates', async () => {
      // Simulate: TENANT_ID tries to update entity from OTHER_TENANT_ID
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.updateEntity('entity-other-tenant', {
        name: 'Hacked Name',
      });

      expect(result).toBeNull();
      expect(prisma.entity.update).not.toHaveBeenCalled();
    });
  });
});
