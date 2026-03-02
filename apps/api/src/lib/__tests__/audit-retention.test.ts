import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before imports
const mockTenantFindUnique = vi.fn();
const mockTenantFindMany = vi.fn();
const mockAuditLogCount = vi.fn();
const mockAuditLogFindFirst = vi.fn();
const mockAuditLogFindMany = vi.fn();
const mockAuditLogDeleteMany = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    tenant: {
      findUnique: (...args: unknown[]) => mockTenantFindUnique(...args),
      findMany: (...args: unknown[]) => mockTenantFindMany(...args),
    },
    auditLog: {
      count: (...args: unknown[]) => mockAuditLogCount(...args),
      findFirst: (...args: unknown[]) => mockAuditLogFindFirst(...args),
      findMany: (...args: unknown[]) => mockAuditLogFindMany(...args),
      deleteMany: (...args: unknown[]) => mockAuditLogDeleteMany(...args),
    },
  },
  TenantPlan: {
    FREE: 'FREE',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE',
  },
}));

import { getRetentionStats, purgeExpiredLogs, purgeAllExpiredLogs, RETENTION_DAYS } from '../audit-retention';

const TENANT_ID = 'tenant-test-123';

describe('Audit Retention (SEC-14)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RETENTION_DAYS', () => {
    it('should have increasing retention by plan tier', () => {
      expect(RETENTION_DAYS.FREE).toBeLessThan(RETENTION_DAYS.PRO);
      expect(RETENTION_DAYS.PRO).toBeLessThan(RETENTION_DAYS.ENTERPRISE);
    });

    it('should retain at least 90 days for FREE', () => {
      expect(RETENTION_DAYS.FREE).toBeGreaterThanOrEqual(90);
    });

    it('should retain at least 1 year for PRO', () => {
      expect(RETENTION_DAYS.PRO).toBeGreaterThanOrEqual(365);
    });

    it('should retain at least 7 years for ENTERPRISE (regulatory)', () => {
      expect(RETENTION_DAYS.ENTERPRISE).toBeGreaterThanOrEqual(2555);
    });
  });

  describe('getRetentionStats', () => {
    it('should return stats for tenant', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'PRO' });
      mockAuditLogCount
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(200);  // expired
      mockAuditLogFindFirst.mockResolvedValue({ createdAt: new Date('2025-01-01') });

      const stats = await getRetentionStats(TENANT_ID);

      expect(stats.tenantId).toBe(TENANT_ID);
      expect(stats.plan).toBe('PRO');
      expect(stats.retentionDays).toBe(365);
      expect(stats.totalEntries).toBe(1000);
      expect(stats.expiredEntries).toBe(200);
      expect(stats.oldestEntryDate).toEqual(new Date('2025-01-01'));
      expect(stats.cutoffDate).toBeInstanceOf(Date);
    });

    it('should default to FREE plan when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);
      mockAuditLogCount.mockResolvedValue(0);
      mockAuditLogFindFirst.mockResolvedValue(null);

      const stats = await getRetentionStats(TENANT_ID);

      expect(stats.plan).toBe('FREE');
      expect(stats.retentionDays).toBe(90);
    });

    it('should handle empty audit log', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'FREE' });
      mockAuditLogCount.mockResolvedValue(0);
      mockAuditLogFindFirst.mockResolvedValue(null);

      const stats = await getRetentionStats(TENANT_ID);

      expect(stats.totalEntries).toBe(0);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.oldestEntryDate).toBeNull();
    });
  });

  describe('purgeExpiredLogs', () => {
    it('should delete expired entries in batches', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'FREE' });
      // First batch: 3 entries to delete
      mockAuditLogFindMany
        .mockResolvedValueOnce([
          { id: 'log-1' },
          { id: 'log-2' },
          { id: 'log-3' },
        ])
        // Second batch: empty (no more expired entries)
        .mockResolvedValueOnce([]);
      mockAuditLogDeleteMany.mockResolvedValue({ count: 3 });
      mockAuditLogCount.mockResolvedValue(97); // 100 - 3
      mockAuditLogFindFirst.mockResolvedValue({ sequenceNumber: 4 });

      const result = await purgeExpiredLogs(TENANT_ID);

      expect(result.purgedCount).toBe(3);
      expect(result.remainingCount).toBe(97);
      expect(result.tenantId).toBe(TENANT_ID);
      expect(result.cutoffDate).toBeInstanceOf(Date);
      expect(result.newAnchorSequence).toBe(4);
      expect(mockAuditLogDeleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['log-1', 'log-2', 'log-3'] } },
      });
    });

    it('should handle no expired entries', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'ENTERPRISE' });
      mockAuditLogFindMany.mockResolvedValue([]); // No expired entries
      mockAuditLogCount.mockResolvedValue(500);
      mockAuditLogFindFirst.mockResolvedValue({ sequenceNumber: 1 });

      const result = await purgeExpiredLogs(TENANT_ID);

      expect(result.purgedCount).toBe(0);
      expect(result.remainingCount).toBe(500);
      expect(mockAuditLogDeleteMany).not.toHaveBeenCalled();
    });

    it('should return null anchor when all entries purged', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'FREE' });
      mockAuditLogFindMany
        .mockResolvedValueOnce([{ id: 'log-1' }])
        .mockResolvedValueOnce([]);
      mockAuditLogDeleteMany.mockResolvedValue({ count: 1 });
      mockAuditLogCount.mockResolvedValue(0);
      mockAuditLogFindFirst.mockResolvedValue(null); // No remaining entries

      const result = await purgeExpiredLogs(TENANT_ID);

      expect(result.purgedCount).toBe(1);
      expect(result.remainingCount).toBe(0);
      expect(result.newAnchorSequence).toBeNull();
    });

    it('should use correct cutoff date based on plan', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'PRO' });
      mockAuditLogFindMany.mockResolvedValue([]);
      mockAuditLogCount.mockResolvedValue(100);
      mockAuditLogFindFirst.mockResolvedValue({ sequenceNumber: 1 });

      const result = await purgeExpiredLogs(TENANT_ID);

      // PRO = 365 days retention
      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - 365);
      // Allow 1 second tolerance
      expect(Math.abs(result.cutoffDate.getTime() - expectedCutoff.getTime())).toBeLessThan(1000);
    });
  });

  describe('purgeAllExpiredLogs', () => {
    it('should purge logs for all tenants', async () => {
      mockTenantFindMany.mockResolvedValue([
        { id: 'tenant-1' },
        { id: 'tenant-2' },
      ]);
      // Both tenants: tenant lookup + empty batch
      mockTenantFindUnique.mockResolvedValue({ plan: 'FREE' });
      mockAuditLogFindMany
        // tenant-1: has expired entries
        .mockResolvedValueOnce([{ id: 'log-1' }])
        .mockResolvedValueOnce([])
        // tenant-2: no expired entries
        .mockResolvedValueOnce([]);
      mockAuditLogDeleteMany.mockResolvedValue({ count: 1 });
      mockAuditLogCount.mockResolvedValue(10);
      mockAuditLogFindFirst.mockResolvedValue({ sequenceNumber: 2 });

      const results = await purgeAllExpiredLogs();

      // Only tenant-1 had purged entries, tenant-2 returns 0 (not included)
      expect(results.length).toBe(1);
      expect(results[0].tenantId).toBe('tenant-1');
      expect(results[0].purgedCount).toBe(1);
    });

    it('should continue if one tenant fails', async () => {
      mockTenantFindMany.mockResolvedValue([
        { id: 'tenant-fail' },
        { id: 'tenant-ok' },
      ]);
      mockTenantFindUnique
        .mockRejectedValueOnce(new Error('DB error')) // tenant-fail
        .mockResolvedValueOnce({ plan: 'FREE' }); // tenant-ok
      mockAuditLogFindMany.mockResolvedValue([]);
      mockAuditLogCount.mockResolvedValue(0);
      mockAuditLogFindFirst.mockResolvedValue(null);

      // Should not throw
      const results = await purgeAllExpiredLogs();
      expect(results).toEqual([]); // tenant-ok had 0 purges, not included
    });
  });
});
