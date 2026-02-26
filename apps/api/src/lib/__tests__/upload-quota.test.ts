import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before imports
const mockTenantFindUnique = vi.fn();
const mockImportBatchCount = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    tenant: {
      findUnique: (...args: unknown[]) => mockTenantFindUnique(...args),
    },
    importBatch: {
      count: (...args: unknown[]) => mockImportBatchCount(...args),
    },
  },
  TenantPlan: {
    FREE: 'FREE',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE',
  },
}));

import { checkUploadQuota, getMaxFileSize, UPLOAD_LIMITS } from '../upload-quota';

const TENANT_ID = 'tenant-test-123';

describe('Upload Quota (SEC-12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkUploadQuota', () => {
    it('should allow upload when under quota', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'FREE' });
      mockImportBatchCount.mockResolvedValue(5);

      const result = await checkUploadQuota(TENANT_ID);

      expect(result.allowed).toBe(true);
      expect(result.usage.importsThisMonth).toBe(5);
      expect(result.usage.limit).toBe(UPLOAD_LIMITS.FREE.maxImportsPerMonth);
      expect(result.usage.plan).toBe('FREE');
    });

    it('should deny upload when quota reached for FREE plan', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'FREE' });
      mockImportBatchCount.mockResolvedValue(10); // FREE limit is 10

      const result = await checkUploadQuota(TENANT_ID);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Monthly import limit reached');
      expect(result.reason).toContain('FREE');
      expect(result.usage.importsThisMonth).toBe(10);
    });

    it('should allow more uploads for PRO plan', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'PRO' });
      mockImportBatchCount.mockResolvedValue(50);

      const result = await checkUploadQuota(TENANT_ID);

      expect(result.allowed).toBe(true);
      expect(result.usage.limit).toBe(UPLOAD_LIMITS.PRO.maxImportsPerMonth);
    });

    it('should deny when PRO quota exceeded', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'PRO' });
      mockImportBatchCount.mockResolvedValue(100); // PRO limit is 100

      const result = await checkUploadQuota(TENANT_ID);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('PRO');
    });

    it('should allow high volume for ENTERPRISE plan', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'ENTERPRISE' });
      mockImportBatchCount.mockResolvedValue(500);

      const result = await checkUploadQuota(TENANT_ID);

      expect(result.allowed).toBe(true);
      expect(result.usage.limit).toBe(UPLOAD_LIMITS.ENTERPRISE.maxImportsPerMonth);
    });

    it('should deny when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const result = await checkUploadQuota(TENANT_ID);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Tenant not found');
    });

    it('should fail open when database error occurs', async () => {
      mockTenantFindUnique.mockRejectedValue(new Error('DB connection failed'));

      const result = await checkUploadQuota(TENANT_ID);

      // Fail open — don't block uploads if quota check fails
      expect(result.allowed).toBe(true);
    });

    it('should count imports for current month only', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'FREE' });
      mockImportBatchCount.mockResolvedValue(0);

      await checkUploadQuota(TENANT_ID);

      // Verify the count query filters by current month
      const countCall = mockImportBatchCount.mock.calls[0][0];
      expect(countCall.where.tenantId).toBe(TENANT_ID);
      expect(countCall.where.createdAt.gte).toBeInstanceOf(Date);
      // Verify it's the first of the current month
      const gte = countCall.where.createdAt.gte as Date;
      expect(gte.getDate()).toBe(1);
    });
  });

  describe('getMaxFileSize', () => {
    it('should return FREE limit for FREE plan', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'FREE' });

      const maxSize = await getMaxFileSize(TENANT_ID);

      expect(maxSize).toBe(5 * 1024 * 1024); // 5MB
    });

    it('should return PRO limit for PRO plan', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'PRO' });

      const maxSize = await getMaxFileSize(TENANT_ID);

      expect(maxSize).toBe(10 * 1024 * 1024); // 10MB
    });

    it('should return ENTERPRISE limit for ENTERPRISE plan', async () => {
      mockTenantFindUnique.mockResolvedValue({ plan: 'ENTERPRISE' });

      const maxSize = await getMaxFileSize(TENANT_ID);

      expect(maxSize).toBe(50 * 1024 * 1024); // 50MB
    });

    it('should default to FREE limit when tenant not found', async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      const maxSize = await getMaxFileSize(TENANT_ID);

      expect(maxSize).toBe(UPLOAD_LIMITS.FREE.maxBytesPerFile);
    });

    it('should default to FREE limit on error', async () => {
      mockTenantFindUnique.mockRejectedValue(new Error('DB error'));

      const maxSize = await getMaxFileSize(TENANT_ID);

      expect(maxSize).toBe(UPLOAD_LIMITS.FREE.maxBytesPerFile);
    });
  });

  describe('UPLOAD_LIMITS', () => {
    it('should have increasing limits by plan tier', () => {
      expect(UPLOAD_LIMITS.FREE.maxImportsPerMonth).toBeLessThan(
        UPLOAD_LIMITS.PRO.maxImportsPerMonth
      );
      expect(UPLOAD_LIMITS.PRO.maxImportsPerMonth).toBeLessThan(
        UPLOAD_LIMITS.ENTERPRISE.maxImportsPerMonth
      );
      expect(UPLOAD_LIMITS.FREE.maxBytesPerFile).toBeLessThan(
        UPLOAD_LIMITS.PRO.maxBytesPerFile
      );
      expect(UPLOAD_LIMITS.PRO.maxBytesPerFile).toBeLessThan(
        UPLOAD_LIMITS.ENTERPRISE.maxBytesPerFile
      );
    });
  });
});
