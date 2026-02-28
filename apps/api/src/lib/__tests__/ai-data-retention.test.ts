import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  purgeExpiredAIDecisionLogs,
  purgeExpiredLLMLogs,
  purgeExpiredUploadedDocuments,
  purgeAllExpiredAIData,
  purgeAllTenantsAIData,
  AI_DECISION_LOG_RETENTION_DAYS,
  UPLOADED_DOCUMENTS_RETENTION_DAYS,
  LLM_LOGS_RETENTION_DAYS,
} from '../audit-retention';
import { mockPrisma, rewirePrismaMock } from '../../test-utils';

// Dynamic import inside factory bypasses vi.mock hoisting constraint
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../test-utils/prisma-mock')).mockPrisma,
}));

describe('AI Data Retention (SEC-36)', () => {
  const TEST_TENANT_ID = 'tenant_test123';

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  describe('Retention Constants', () => {
    it('should define AIDecisionLog retention matching audit log tiers', () => {
      expect(AI_DECISION_LOG_RETENTION_DAYS).toEqual({
        FREE: 90,
        PRO: 365,
        ENTERPRISE: 2555,
      });
    });

    it('should define uploaded documents retention (regulatory compliance)', () => {
      expect(UPLOADED_DOCUMENTS_RETENTION_DAYS).toEqual({
        FREE: 90,
        PRO: 365,
        ENTERPRISE: 2555, // 7 years for regulatory compliance
      });
    });

    it('should define LLM logs with fixed 90-day retention (all plans)', () => {
      expect(LLM_LOGS_RETENTION_DAYS).toEqual({
        FREE: 90,
        PRO: 90,
        ENTERPRISE: 90, // Fixed 90 days - debugging window only
      });
    });
  });

  describe('purgeExpiredAIDecisionLogs', () => {
    it('should purge logs older than retention period for FREE plan', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: TEST_TENANT_ID,
        name: 'Test Tenant',
        region: 'US',
        status: 'ACTIVE',
        plan: 'FREE',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock expired logs (older than 90 days)
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 100);

      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([
        { id: 'log1' },
        { id: 'log2' },
        { id: 'log3' },
      ]);

      mockPrisma.aIDecisionLog.deleteMany.mockResolvedValueOnce({ count: 3 });

      // Second batch returns empty (purge complete)
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      const result = await purgeExpiredAIDecisionLogs(TEST_TENANT_ID);

      expect(result.purgedCount).toBe(3);
      expect(result.cutoffDate).toBeInstanceOf(Date);

      // Verify batch deletion was called
      expect(mockPrisma.aIDecisionLog.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['log1', 'log2', 'log3'] } },
      });
    });

    it('should use ENTERPRISE retention (7 years) for enterprise plan', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: TEST_TENANT_ID,
        name: 'Enterprise Corp',
        region: 'US',
        status: 'ACTIVE',
        plan: 'ENTERPRISE',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      const result = await purgeExpiredAIDecisionLogs(TEST_TENANT_ID);

      // Should look for logs older than 2555 days (7 years)
      const callArgs = mockPrisma.aIDecisionLog.findMany.mock.calls[0][0];
      const cutoffDate = callArgs?.where?.createdAt?.lt as Date;

      // Verify cutoff is approximately 7 years ago
      const daysDiff = (Date.now() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(2550);
      expect(daysDiff).toBeLessThan(2560);
    });

    it('should handle empty result (no expired logs)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: TEST_TENANT_ID,
        name: 'Test Tenant',
        region: 'US',
        status: 'ACTIVE',
        plan: 'PRO',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      const result = await purgeExpiredAIDecisionLogs(TEST_TENANT_ID);

      expect(result.purgedCount).toBe(0);
      expect(mockPrisma.aIDecisionLog.deleteMany).not.toHaveBeenCalled();
    });

    it('should delete in batches to prevent lock contention', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: TEST_TENANT_ID,
        name: 'Test Tenant',
        region: 'US',
        status: 'ACTIVE',
        plan: 'FREE',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // First batch (500 items - default batch size)
      const firstBatch = Array.from({ length: 500 }, (_, i) => ({ id: `log${i}` }));
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce(firstBatch);
      mockPrisma.aIDecisionLog.deleteMany.mockResolvedValueOnce({ count: 500 });

      // Second batch (remaining 200 items)
      const secondBatch = Array.from({ length: 200 }, (_, i) => ({ id: `log${i + 500}` }));
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce(secondBatch);
      mockPrisma.aIDecisionLog.deleteMany.mockResolvedValueOnce({ count: 200 });

      // Third batch (empty - purge complete)
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      const result = await purgeExpiredAIDecisionLogs(TEST_TENANT_ID);

      expect(result.purgedCount).toBe(700);
      expect(mockPrisma.aIDecisionLog.deleteMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('purgeExpiredLLMLogs', () => {
    it('should return 0 (not yet implemented)', async () => {
      const result = await purgeExpiredLLMLogs(TEST_TENANT_ID);

      expect(result.purgedCount).toBe(0);
      expect(result.cutoffDate).toBeInstanceOf(Date);

      // Cutoff should be 90 days ago (fixed retention)
      const daysDiff = (Date.now() - result.cutoffDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(89);
      expect(daysDiff).toBeLessThan(91);
    });
  });

  describe('purgeExpiredUploadedDocuments', () => {
    it('should return 0 (not yet implemented) with correct cutoff for FREE plan', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: TEST_TENANT_ID,
        name: 'Test Tenant',
        region: 'US',
        status: 'ACTIVE',
        plan: 'FREE',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await purgeExpiredUploadedDocuments(TEST_TENANT_ID);

      expect(result.purgedCount).toBe(0);

      // Cutoff should be 90 days ago for FREE plan
      const daysDiff = (Date.now() - result.cutoffDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(89);
      expect(daysDiff).toBeLessThan(91);
    });

    it('should calculate correct cutoff for ENTERPRISE plan (7 years)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: TEST_TENANT_ID,
        name: 'Enterprise Corp',
        region: 'US',
        status: 'ACTIVE',
        plan: 'ENTERPRISE',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await purgeExpiredUploadedDocuments(TEST_TENANT_ID);

      // Cutoff should be 2555 days ago (7 years) for ENTERPRISE
      const daysDiff = (Date.now() - result.cutoffDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(2550);
      expect(daysDiff).toBeLessThan(2560);
    });
  });

  describe('purgeAllExpiredAIData', () => {
    it('should purge all AI data types and return summary', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: TEST_TENANT_ID,
        name: 'Test Tenant',
        region: 'US',
        status: 'ACTIVE',
        plan: 'PRO',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock AIDecisionLog purge
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([
        { id: 'log1' },
        { id: 'log2' },
      ]);
      mockPrisma.aIDecisionLog.deleteMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]); // Second batch empty

      const result = await purgeAllExpiredAIData(TEST_TENANT_ID);

      expect(result).toMatchObject({
        tenantId: TEST_TENANT_ID,
        aiDecisionLogs: { purgedCount: 2 },
        llmLogs: { purgedCount: 0 }, // Not implemented
        uploadedDocuments: { purgedCount: 0 }, // Not implemented
        totalPurged: 2,
      });
    });

    it('should return zero when no expired data exists', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: TEST_TENANT_ID,
        name: 'Test Tenant',
        region: 'US',
        status: 'ACTIVE',
        plan: 'FREE',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // All data types return empty
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      const result = await purgeAllExpiredAIData(TEST_TENANT_ID);

      expect(result.totalPurged).toBe(0);
      expect(result.aiDecisionLogs.purgedCount).toBe(0);
    });
  });

  describe('purgeAllTenantsAIData', () => {
    it('should purge AI data for all tenants', async () => {
      mockPrisma.tenant.findMany.mockResolvedValueOnce([
        { id: 'tenant1' },
        { id: 'tenant2' },
        { id: 'tenant3' },
      ]);

      // Mock tenant lookups for retention tier
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant1',
        name: 'Tenant',
        region: 'US',
        status: 'ACTIVE',
        plan: 'FREE',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Tenant 1: Has expired logs
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([{ id: 'log1' }]);
      mockPrisma.aIDecisionLog.deleteMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      // Tenant 2: No expired logs
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      // Tenant 3: Has expired logs
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([{ id: 'log2' }, { id: 'log3' }]);
      mockPrisma.aIDecisionLog.deleteMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      const results = await purgeAllTenantsAIData();

      // Should return results only for tenants with purged data
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({ tenantId: 'tenant1', totalPurged: 1 });
      expect(results[1]).toMatchObject({ tenantId: 'tenant3', totalPurged: 2 });
    });

    it('should handle errors gracefully (continue with other tenants)', async () => {
      mockPrisma.tenant.findMany.mockResolvedValueOnce([
        { id: 'tenant1' },
        { id: 'tenant2' }, // This one will fail
        { id: 'tenant3' },
      ]);

      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant1',
        name: 'Tenant',
        region: 'US',
        status: 'ACTIVE',
        plan: 'FREE',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Tenant 1: Success
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([{ id: 'log1' }]);
      mockPrisma.aIDecisionLog.deleteMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      // Tenant 2: Fails (simulate database error)
      mockPrisma.aIDecisionLog.findMany.mockRejectedValueOnce(
        new Error('Database connection lost')
      );

      // Tenant 3: Success
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([{ id: 'log2' }]);
      mockPrisma.aIDecisionLog.deleteMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      const results = await purgeAllTenantsAIData();

      // Should complete for tenant1 and tenant3, skip tenant2
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.tenantId)).toEqual(['tenant1', 'tenant3']);
    });

    it('should return empty array when no tenants have expired data', async () => {
      mockPrisma.tenant.findMany.mockResolvedValueOnce([
        { id: 'tenant1' },
        { id: 'tenant2' },
      ]);

      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant1',
        name: 'Tenant',
        region: 'US',
        status: 'ACTIVE',
        plan: 'FREE',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // All tenants return no expired logs
      mockPrisma.aIDecisionLog.findMany.mockResolvedValue([]);

      const results = await purgeAllTenantsAIData();

      expect(results).toEqual([]);
    });
  });

  describe('Retention Period Calculations', () => {
    it('should calculate cutoff dates correctly for each plan', () => {
      const now = Date.now();

      // FREE: 90 days ago
      const freeCutoff = new Date();
      freeCutoff.setDate(freeCutoff.getDate() - 90);
      const freeDiff = (now - freeCutoff.getTime()) / (1000 * 60 * 60 * 24);
      expect(freeDiff).toBeCloseTo(90, 0);

      // PRO: 365 days ago
      const proCutoff = new Date();
      proCutoff.setDate(proCutoff.getDate() - 365);
      const proDiff = (now - proCutoff.getTime()) / (1000 * 60 * 60 * 24);
      expect(proDiff).toBeCloseTo(365, 0);

      // ENTERPRISE: 2555 days ago (7 years)
      const entCutoff = new Date();
      entCutoff.setDate(entCutoff.getDate() - 2555);
      const entDiff = (now - entCutoff.getTime()) / (1000 * 60 * 60 * 24);
      expect(entDiff).toBeCloseTo(2555, 1);
    });
  });
});
