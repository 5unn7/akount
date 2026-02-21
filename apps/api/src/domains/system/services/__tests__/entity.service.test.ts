import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityService } from '../entity.service';

// Mock audit log
vi.mock('../../../../lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

// Mock Prisma client
vi.mock('@akount/db', () => ({
  prisma: {
    entity: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    account: { count: vi.fn() },
    invoice: { count: vi.fn() },
    bill: { count: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        entity: {
          update: vi.fn(),
        },
      })
    ),
  },
}));

import { prisma } from '@akount/db';
import { createAuditLog } from '../../../../lib/audit';

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-test-001';
const OTHER_TENANT_ID = 'tenant-other-456';

function mockEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entity-1',
    tenantId: TENANT_ID,
    name: 'My Company',
    type: 'LLC',
    status: 'ACTIVE',
    entitySubType: null,
    country: 'US',
    functionalCurrency: 'USD',
    reportingCurrency: 'USD',
    fiscalYearStart: 1,
    registrationDate: null,
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
    service = new EntityService(TENANT_ID, USER_ID);
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
          status: true,
          entitySubType: true,
          functionalCurrency: true,
          reportingCurrency: true,
          country: true,
          fiscalYearStart: true,
          taxId: true,
          createdAt: true,
          _count: {
            select: {
              accounts: true,
              clients: true,
              vendors: true,
              invoices: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should filter by status when provided', async () => {
      vi.mocked(prisma.entity.findMany).mockResolvedValueOnce([] as never);

      await service.listEntities({ status: 'ACTIVE' });

      const callArgs = vi.mocked(prisma.entity.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toEqual({ tenantId: TENANT_ID, status: 'ACTIVE' });
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
      vi.mocked(prisma.entity.findMany).mockResolvedValueOnce([] as never);

      await service.listEntities();

      const callArgs = vi.mocked(prisma.entity.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toMatchObject({ tenantId: TENANT_ID });
    });
  });

  describe('getEntityDetail', () => {
    it('should return entity with full counts', async () => {
      const entity = {
        ...mockEntity(),
        _count: {
          accounts: 5,
          glAccounts: 120,
          clients: 15,
          vendors: 8,
          invoices: 10,
          bills: 3,
          journalEntries: 200,
          payments: 7,
        },
      };

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);

      const result = await service.getEntityDetail('entity-1');

      expect(result).toEqual(entity);
      expect(prisma.entity.findFirst).toHaveBeenCalledWith({
        where: { id: 'entity-1', tenantId: TENANT_ID },
        include: {
          _count: {
            select: {
              accounts: true,
              glAccounts: true,
              clients: true,
              vendors: true,
              invoices: true,
              bills: true,
              journalEntries: true,
              payments: true,
            },
          },
        },
      });
    });

    it('should return null when entity not found', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.getEntityDetail('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getEntity', () => {
    it('should return entity with lightweight counts', async () => {
      const entity = {
        ...mockEntity(),
        _count: { accounts: 5, glAccounts: 120, clients: 15, vendors: 8 },
      };

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);

      const result = await service.getEntity('entity-1');

      expect(result).toEqual(entity);
    });

    it('should enforce tenant isolation', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      await service.getEntity('entity-other');

      expect(prisma.entity.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID }),
        })
      );
    });
  });

  describe('createEntity', () => {
    it('should create entity with required fields and audit log', async () => {
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
          reportingCurrency: 'CAD',
          fiscalYearStart: 1,
        },
      });

      // Verify audit log was created
      expect(createAuditLog).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: 'entity-new',
        model: 'Entity',
        recordId: 'entity-new',
        action: 'CREATE',
        after: { name: 'New Company', type: 'CORPORATION', country: 'CA' },
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

    it('should include entitySubType when provided', async () => {
      vi.mocked(prisma.entity.create).mockResolvedValueOnce(mockEntity() as never);

      await service.createEntity(USER_ID, {
        name: 'Test Co',
        type: 'CORPORATION',
        country: 'US',
        functionalCurrency: 'USD',
        entitySubType: 'S_CORP',
      });

      const createArgs = vi.mocked(prisma.entity.create).mock.calls[0][0]!;
      expect(createArgs.data.entitySubType).toBe('S_CORP');
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
  });

  describe('updateEntity', () => {
    it('should update entity and create audit log', async () => {
      const existing = mockEntity({ id: 'entity-1', name: 'Old Name' });
      const updated = mockEntity({ id: 'entity-1', name: 'New Name' });

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.entity.update).mockResolvedValueOnce(updated as never);

      const result = await service.updateEntity('entity-1', { name: 'New Name' });

      expect(result).toEqual(updated);
      expect(prisma.entity.update).toHaveBeenCalledWith({
        where: { id: 'entity-1' },
        data: { name: 'New Name' },
      });
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          model: 'Entity',
          action: 'UPDATE',
        })
      );
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
        where: { id: 'entity-other-tenant', tenantId: TENANT_ID },
      });
      expect(prisma.entity.update).not.toHaveBeenCalled();
    });

    it('should accept expanded fields (taxId, address, entitySubType)', async () => {
      const existing = mockEntity();
      const updated = mockEntity({ taxId: '12-3456789', entitySubType: 'S_CORP' });

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(existing as never);
      vi.mocked(prisma.entity.update).mockResolvedValueOnce(updated as never);

      await service.updateEntity('entity-1', {
        taxId: '12-3456789',
        entitySubType: 'S_CORP',
        address: '123 Main St',
      });

      expect(prisma.entity.update).toHaveBeenCalledWith({
        where: { id: 'entity-1' },
        data: { taxId: '12-3456789', entitySubType: 'S_CORP', address: '123 Main St' },
      });
    });
  });

  describe('archiveEntity', () => {
    it('should archive entity with no active data', async () => {
      const entity = {
        ...mockEntity({ status: 'ACTIVE' }),
        _count: { accounts: 0, invoices: 0, bills: 0 },
      };

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.entity.count).mockResolvedValueOnce(2 as never); // 2 active entities
      vi.mocked(prisma.account.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(0 as never);

      const result = await service.archiveEntity('entity-1');

      expect(result).toEqual({ success: true });
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          before: { status: 'ACTIVE' },
          after: { status: 'ARCHIVED' },
        })
      );
    });

    it('should reject when entity has active bank accounts', async () => {
      const entity = {
        ...mockEntity({ status: 'ACTIVE' }),
        _count: { accounts: 3, invoices: 0, bills: 0 },
      };

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.entity.count).mockResolvedValueOnce(2 as never);
      vi.mocked(prisma.account.count).mockResolvedValueOnce(3 as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(0 as never);

      const result = await service.archiveEntity('entity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.blockers).toContain(
          'Settle or transfer 3 active accounts before archiving'
        );
      }
    });

    it('should reject when entity has unpaid invoices', async () => {
      const entity = {
        ...mockEntity({ status: 'ACTIVE' }),
        _count: { accounts: 0, invoices: 2, bills: 0 },
      };

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.entity.count).mockResolvedValueOnce(2 as never);
      vi.mocked(prisma.account.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(2 as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(0 as never);

      const result = await service.archiveEntity('entity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.blockers).toContain(
          'Close or void 2 outstanding invoices before archiving'
        );
      }
    });

    it('should reject when entity has open bills', async () => {
      const entity = {
        ...mockEntity({ status: 'ACTIVE' }),
        _count: { accounts: 0, invoices: 0, bills: 1 },
      };

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.entity.count).mockResolvedValueOnce(2 as never);
      vi.mocked(prisma.account.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(1 as never);

      const result = await service.archiveEntity('entity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.blockers).toContain(
          'Pay or void 1 open bill before archiving'
        );
      }
    });

    it('should reject when entity is the only active entity', async () => {
      const entity = {
        ...mockEntity({ status: 'ACTIVE' }),
        _count: { accounts: 0, invoices: 0, bills: 0 },
      };

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.entity.count).mockResolvedValueOnce(1 as never); // Only 1 active
      vi.mocked(prisma.account.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(0 as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(0 as never);

      const result = await service.archiveEntity('entity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.blockers).toContain(
          'Cannot archive the only active entity. Create another entity first.'
        );
      }
    });

    it('should collect multiple blockers', async () => {
      const entity = {
        ...mockEntity({ status: 'ACTIVE' }),
        _count: { accounts: 2, invoices: 3, bills: 1 },
      };

      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(entity as never);
      vi.mocked(prisma.entity.count).mockResolvedValueOnce(1 as never);
      vi.mocked(prisma.account.count).mockResolvedValueOnce(2 as never);
      vi.mocked(prisma.invoice.count).mockResolvedValueOnce(3 as never);
      vi.mocked(prisma.bill.count).mockResolvedValueOnce(1 as never);

      const result = await service.archiveEntity('entity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.blockers.length).toBe(4); // only active + 3 data blockers
      }
    });

    it('should return error when entity not found', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.archiveEntity('nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Entity not found or already archived');
      }
    });
  });

  describe('tenant isolation (cross-tenant scenarios)', () => {
    it('should not list entities from other tenants', async () => {
      const otherService = new EntityService(OTHER_TENANT_ID);

      vi.mocked(prisma.entity.findMany).mockResolvedValueOnce([] as never);

      await otherService.listEntities();

      const callArgs = vi.mocked(prisma.entity.findMany).mock.calls[0][0]!;
      expect(callArgs.where).toMatchObject({ tenantId: OTHER_TENANT_ID });
    });

    it('should not allow cross-tenant entity access via getEntity', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.getEntity('entity-other-tenant');

      expect(result).toBeNull();
      expect(prisma.entity.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID }),
        })
      );
    });

    it('should not allow cross-tenant entity updates', async () => {
      vi.mocked(prisma.entity.findFirst).mockResolvedValueOnce(null as never);

      const result = await service.updateEntity('entity-other-tenant', {
        name: 'Hacked Name',
      });

      expect(result).toBeNull();
      expect(prisma.entity.update).not.toHaveBeenCalled();
    });
  });
});
