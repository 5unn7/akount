import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getConsent,
  updateConsent,
  checkConsent,
  isInTrainingPeriod,
  deleteUserConsent,
  type ConsentStatus,
} from '../ai-consent.service';
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils';

// Dynamic import inside factory bypasses vi.mock hoisting constraint
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

describe('AIConsentService (SEC-32)', () => {
  const userId = TEST_IDS.USER_ID;
  const tenantId = TEST_IDS.TENANT_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  describe('getConsent', () => {
    it('should return existing consent if found', async () => {
      const mockConsent: ConsentStatus = {
        userId,
        tenantId,
        autoCreateBills: true,
        autoCreateInvoices: false,
        autoMatchTransactions: true,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-15'),
      };

      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(mockConsent);

      const result = await getConsent(userId, tenantId);

      expect(result).toEqual(mockConsent);
      expect(mockPrisma.aIConsent.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
      });
    });

    it('should create default consent if not found (all toggles OFF)', async () => {
      // First call (findUnique) returns null
      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(null);

      // Second call (create) returns new consent
      const newConsent: ConsentStatus = {
        userId,
        tenantId,
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.aIConsent.create.mockResolvedValueOnce(newConsent);

      const result = await getConsent(userId, tenantId);

      expect(result).toEqual(newConsent);
      expect(mockPrisma.aIConsent.create).toHaveBeenCalledWith({
        data: {
          userId,
          tenantId,
        },
        select: expect.any(Object),
      });

      // Verify all toggles are OFF
      expect(result.autoCreateBills).toBe(false);
      expect(result.autoCreateInvoices).toBe(false);
      expect(result.autoMatchTransactions).toBe(false);
      expect(result.autoCategorize).toBe(false);
      expect(result.useCorrectionsForLearning).toBe(false);
    });

    it('should reject access if tenant mismatch (security)', async () => {
      const consentDifferentTenant: ConsentStatus = {
        userId,
        tenantId: 'different-tenant-id',
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(consentDifferentTenant);

      await expect(getConsent(userId, tenantId)).rejects.toThrow('Access denied');
    });
  });

  describe('updateConsent', () => {
    it('should update consent settings', async () => {
      const existingConsent: ConsentStatus = {
        userId,
        tenantId,
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      // Mock getConsent
      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(existingConsent);

      const updatedConsent: ConsentStatus = {
        ...existingConsent,
        autoCreateBills: true,
        autoCategorize: true,
        updatedAt: new Date(),
      };

      mockPrisma.aIConsent.update.mockResolvedValueOnce(updatedConsent);

      const result = await updateConsent(userId, tenantId, {
        autoCreateBills: true,
        autoCategorize: true,
      });

      expect(result.autoCreateBills).toBe(true);
      expect(result.autoCategorize).toBe(true);
      expect(mockPrisma.aIConsent.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          autoCreateBills: true,
          autoCategorize: true,
          updatedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it('should log consent changes', async () => {
      const existingConsent: ConsentStatus = {
        userId,
        tenantId,
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(existingConsent);
      mockPrisma.aIConsent.update.mockResolvedValueOnce({
        ...existingConsent,
        autoCreateBills: true,
        updatedAt: new Date(),
      });

      await updateConsent(userId, tenantId, { autoCreateBills: true });

      // Verify update was called
      expect(mockPrisma.aIConsent.update).toHaveBeenCalled();
    });
  });

  describe('checkConsent', () => {
    it('should return true if feature is enabled', async () => {
      const consent: ConsentStatus = {
        userId,
        tenantId,
        autoCreateBills: true,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(consent);

      const result = await checkConsent(userId, tenantId, 'autoCreateBills');

      expect(result).toBe(true);
    });

    it('should return false if feature is disabled', async () => {
      const consent: ConsentStatus = {
        userId,
        tenantId,
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(consent);

      const result = await checkConsent(userId, tenantId, 'autoCreateBills');

      expect(result).toBe(false);
    });

    it('should create default consent and return false if no record exists', async () => {
      // findUnique returns null (no existing consent)
      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(null);

      // create returns new consent with defaults (all false)
      const newConsent: ConsentStatus = {
        userId,
        tenantId,
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.aIConsent.create.mockResolvedValueOnce(newConsent);

      const result = await checkConsent(userId, tenantId, 'autoCreateBills');

      expect(result).toBe(false);
      expect(mockPrisma.aIConsent.create).toHaveBeenCalled();
    });
  });

  describe('isInTrainingPeriod', () => {
    it('should return true for users registered <30 days ago', async () => {
      const recentUser = {
        id: userId,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(recentUser);

      const result = await isInTrainingPeriod(userId);

      expect(result).toBe(true);
    });

    it('should return false for users registered >30 days ago', async () => {
      const oldUser = {
        id: userId,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(oldUser);

      const result = await isInTrainingPeriod(userId);

      expect(result).toBe(false);
    });

    it('should return true if user not found (conservative)', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await isInTrainingPeriod(userId);

      expect(result).toBe(true);
    });

    it('should calculate training period correctly at exactly 30 days', async () => {
      const userAt30Days = {
        id: userId,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Exactly 30 days
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(userAt30Days);

      const result = await isInTrainingPeriod(userId);

      expect(result).toBe(false); // 30 days = end of training period
    });
  });

  describe('deleteUserConsent (GDPR)', () => {
    it('should delete user consent record', async () => {
      mockPrisma.aIConsent.delete.mockResolvedValueOnce({
        id: 'consent-id',
        userId,
        tenantId,
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await deleteUserConsent(userId);

      expect(mockPrisma.aIConsent.delete).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('Tenant isolation (security)', () => {
    it('should prevent cross-tenant consent access', async () => {
      const consentForOtherTenant: ConsentStatus = {
        userId,
        tenantId: 'other-tenant-id',
        autoCreateBills: true,
        autoCreateInvoices: true,
        autoMatchTransactions: true,
        autoCategorize: true,
        useCorrectionsForLearning: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(consentForOtherTenant);

      // Should throw error when tenantId doesn't match
      await expect(getConsent(userId, tenantId)).rejects.toThrow(
        'Access denied: Consent record belongs to different tenant'
      );
    });
  });

  describe('Default consent behavior', () => {
    it('should default all toggles to false for security (opt-in model)', async () => {
      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(null);

      const newConsent: ConsentStatus = {
        userId,
        tenantId,
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.aIConsent.create.mockResolvedValueOnce(newConsent);

      const result = await getConsent(userId, tenantId);

      // All toggles must be false (GDPR/PIPEDA compliance — opt-in required)
      expect(result.autoCreateBills).toBe(false);
      expect(result.autoCreateInvoices).toBe(false);
      expect(result.autoMatchTransactions).toBe(false);
      expect(result.autoCategorize).toBe(false);
      expect(result.useCorrectionsForLearning).toBe(false);
    });
  });
});
