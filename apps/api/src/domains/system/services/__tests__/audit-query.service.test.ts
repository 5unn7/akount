import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditQueryService, type AuditQueryParams } from '../audit-query.service';
import { AuditAction } from '@akount/db';

// Mock Prisma
const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    auditLog: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
  } as const,
}));

const TENANT_ID = 'tenant-123';
const USER_ID = 'user-456';
const ENTITY_ID = 'entity-789';

function mockAuditLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 'log-1',
    tenantId: TENANT_ID,
    entityId: ENTITY_ID,
    userId: USER_ID,
    model: 'Invoice',
    recordId: 'invoice-1',
    action: AuditAction.CREATE,
    before: null,
    after: { amount: 1000 },
    createdAt: new Date('2026-02-15'),
    user: {
      id: USER_ID,
      email: 'test@example.com',
      name: 'Test User',
    },
    ...overrides,
  };
}

describe('AuditQueryService', () => {
  let service: AuditQueryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuditQueryService();
  });

  describe('query', () => {
    it('should filter by tenantId (mandatory)', async () => {
      const logs = [mockAuditLog()];
      mockFindMany.mockResolvedValueOnce(logs);
      mockCount.mockResolvedValueOnce(1);

      const params: AuditQueryParams = { tenantId: TENANT_ID };
      await service.query(params);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.tenantId).toBe(TENANT_ID);
    });

    it('should filter by userId when provided', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(1);

      const params: AuditQueryParams = { tenantId: TENANT_ID, userId: USER_ID };
      await service.query(params);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.userId).toBe(USER_ID);
    });

    it('should filter by entityId when provided', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(1);

      const params: AuditQueryParams = { tenantId: TENANT_ID, entityId: ENTITY_ID };
      await service.query(params);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.entityId).toBe(ENTITY_ID);
    });

    it('should filter by model when provided', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(1);

      const params: AuditQueryParams = { tenantId: TENANT_ID, model: 'Invoice' };
      await service.query(params);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.model).toBe('Invoice');
    });

    it('should filter by recordId when provided', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(1);

      const params: AuditQueryParams = { tenantId: TENANT_ID, recordId: 'invoice-1' };
      await service.query(params);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.recordId).toBe('invoice-1');
    });

    it('should filter by action when provided', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(1);

      const params: AuditQueryParams = { tenantId: TENANT_ID, action: AuditAction.CREATE };
      await service.query(params);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.action).toBe(AuditAction.CREATE);
    });

    it('should filter by date range when provided', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(1);

      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');
      const params: AuditQueryParams = { tenantId: TENANT_ID, startDate, endDate };

      await service.query(params);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.createdAt.gte).toBe(startDate);
      expect(queryArgs.where.createdAt.lte).toBe(endDate);
    });

    it('should apply pagination (limit/offset)', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(1);

      const params: AuditQueryParams = { tenantId: TENANT_ID, limit: 10, offset: 20 };
      await service.query(params);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.take).toBe(10);
      expect(queryArgs.skip).toBe(20);
    });

    it('should use default limit of 50 when not provided', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(1);

      await service.query({ tenantId: TENANT_ID });

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.take).toBe(50);
      expect(queryArgs.skip).toBe(0);
    });

    it('should return logs with user info included', async () => {
      const logs = [mockAuditLog()];
      mockFindMany.mockResolvedValueOnce(logs);
      mockCount.mockResolvedValueOnce(1);

      const result = await service.query({ tenantId: TENANT_ID });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].user).toEqual({
        id: USER_ID,
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return total count of matching logs', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(42);

      const result = await service.query({ tenantId: TENANT_ID });

      expect(result.total).toBe(42);
    });

    it('should order by createdAt descending', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);
      mockCount.mockResolvedValueOnce(1);

      await service.query({ tenantId: TENANT_ID });

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('getRecordHistory', () => {
    it('should return record history ordered by createdAt ASC', async () => {
      const logs = [mockAuditLog()];
      mockFindMany.mockResolvedValueOnce(logs);

      await service.getRecordHistory(TENANT_ID, 'Invoice', 'invoice-1');

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.orderBy).toEqual({ createdAt: 'asc' });
    });

    it('should filter by tenantId + model + recordId', async () => {
      const logs = [mockAuditLog()];
      mockFindMany.mockResolvedValueOnce(logs);

      await service.getRecordHistory(TENANT_ID, 'Invoice', 'invoice-1');

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where).toEqual({
        tenantId: TENANT_ID,
        model: 'Invoice',
        recordId: 'invoice-1',
      });
    });

    it('should include user info', async () => {
      const logs = [mockAuditLog()];
      mockFindMany.mockResolvedValueOnce(logs);

      const result = await service.getRecordHistory(TENANT_ID, 'Invoice', 'invoice-1');

      expect(result[0].user).toEqual({
        id: USER_ID,
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity ordered by createdAt DESC', async () => {
      const logs = [mockAuditLog()];
      mockFindMany.mockResolvedValueOnce(logs);

      await service.getUserActivity(TENANT_ID, USER_ID);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('should filter by tenantId + userId', async () => {
      const logs = [mockAuditLog()];
      mockFindMany.mockResolvedValueOnce(logs);

      await service.getUserActivity(TENANT_ID, USER_ID);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where).toEqual({
        tenantId: TENANT_ID,
        userId: USER_ID,
      });
    });

    it('should apply limit (default 50)', async () => {
      const logs = [mockAuditLog()];
      mockFindMany.mockResolvedValueOnce(logs);

      await service.getUserActivity(TENANT_ID, USER_ID);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.take).toBe(50);
    });

    it('should accept custom limit', async () => {
      const logs = [mockAuditLog()];
      mockFindMany.mockResolvedValueOnce(logs);

      await service.getUserActivity(TENANT_ID, USER_ID, 100);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.take).toBe(100);
    });
  });

  describe('getSecurityEvents', () => {
    it('should filter by tenantId + model=Security', async () => {
      const logs = [mockAuditLog({ model: 'Security' })];
      mockFindMany.mockResolvedValueOnce(logs);

      await service.getSecurityEvents(TENANT_ID);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.tenantId).toBe(TENANT_ID);
      expect(queryArgs.where.model).toBe('Security');
    });

    it('should filter by date range when provided', async () => {
      const logs = [mockAuditLog({ model: 'Security' })];
      mockFindMany.mockResolvedValueOnce(logs);

      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');

      await service.getSecurityEvents(TENANT_ID, startDate, endDate);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.where.createdAt.gte).toBe(startDate);
      expect(queryArgs.where.createdAt.lte).toBe(endDate);
    });

    it('should apply limit (default 100)', async () => {
      const logs = [mockAuditLog({ model: 'Security' })];
      mockFindMany.mockResolvedValueOnce(logs);

      await service.getSecurityEvents(TENANT_ID);

      const queryArgs = mockFindMany.mock.calls[0][0];
      expect(queryArgs.take).toBe(100);
    });
  });

  describe('getDailySummary', () => {
    it('should return summary for specific date', async () => {
      const logs = [
        mockAuditLog({ action: AuditAction.CREATE, model: 'Invoice', userId: 'user-1' }),
        mockAuditLog({ action: AuditAction.UPDATE, model: 'Invoice', userId: 'user-2' }),
      ];
      mockFindMany.mockResolvedValueOnce(logs);

      const date = new Date('2026-02-15T12:00:00Z');
      const result = await service.getDailySummary(TENANT_ID, date);

      expect(result.totalActions).toBe(2);
      // Check date components instead of ISO string (avoids timezone issues)
      expect(result.date.getFullYear()).toBe(2026);
      expect(result.date.getMonth()).toBe(1); // February (0-indexed)
      expect(result.date.getDate()).toBe(15);
      expect(result.date.getHours()).toBe(0);
    });

    it('should aggregate by action', async () => {
      const logs = [
        mockAuditLog({ action: AuditAction.CREATE }),
        mockAuditLog({ action: AuditAction.CREATE }),
        mockAuditLog({ action: AuditAction.UPDATE }),
      ];
      mockFindMany.mockResolvedValueOnce(logs);

      const result = await service.getDailySummary(TENANT_ID, new Date());

      expect(result.byAction).toEqual({
        CREATE: 2,
        UPDATE: 1,
      });
    });

    it('should aggregate by model', async () => {
      const logs = [
        mockAuditLog({ model: 'Invoice' }),
        mockAuditLog({ model: 'Invoice' }),
        mockAuditLog({ model: 'Payment' }),
      ];
      mockFindMany.mockResolvedValueOnce(logs);

      const result = await service.getDailySummary(TENANT_ID, new Date());

      expect(result.byModel).toEqual({
        Invoice: 2,
        Payment: 1,
      });
    });

    it('should count unique users', async () => {
      const logs = [
        mockAuditLog({ userId: 'user-1' }),
        mockAuditLog({ userId: 'user-1' }), // Same user
        mockAuditLog({ userId: 'user-2' }),
        mockAuditLog({ userId: null }), // No user
      ];
      mockFindMany.mockResolvedValueOnce(logs);

      const result = await service.getDailySummary(TENANT_ID, new Date());

      expect(result.uniqueUsers).toBe(2); // user-1, user-2
    });

    it('should filter by date range (start and end of day)', async () => {
      mockFindMany.mockResolvedValueOnce([mockAuditLog()]);

      const date = new Date('2026-02-15T15:30:00Z');
      await service.getDailySummary(TENANT_ID, date);

      const queryArgs = mockFindMany.mock.calls[0][0];
      const startDate = new Date(queryArgs.where.createdAt.gte);
      const endDate = new Date(queryArgs.where.createdAt.lte);

      // Start should be 00:00:00
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);

      // End should be 23:59:59
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });
  });
});
