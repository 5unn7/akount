import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deleteUserAIData,
  checkUserAIData,
  estimateDeletionTime,
} from '../ai-data-deletion.service';
import { mockPrisma, rewirePrismaMock } from '../../../../test-utils';
import * as aiConsentService from '../ai-consent.service';

// Dynamic import inside factory bypasses vi.mock hoisting constraint
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

// Mock AI consent service
vi.mock('../ai-consent.service', () => ({
  deleteUserConsent: vi.fn(),
}));

describe('AIDataDeletionService (SEC-35)', () => {
  const TEST_USER_ID = 'user_test123';
  const TEST_TENANT_ID = 'tenant_test123';

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
  });

  describe('checkUserAIData', () => {
    it('should return true for AIConsent when record exists', async () => {
      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce({
        id: 'consent_123',
        userId: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkUserAIData(TEST_USER_ID);

      expect(result).toEqual({
        hasAIConsent: true,
        hasUploadedDocuments: false, // Future
        hasTrainingData: false, // Future
        hasRAGEntries: false, // Future
      });

      expect(mockPrisma.aIConsent.findUnique).toHaveBeenCalledWith({
        where: { userId: TEST_USER_ID },
        select: { id: true },
      });
    });

    it('should return false for AIConsent when no record exists', async () => {
      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(null);

      const result = await checkUserAIData(TEST_USER_ID);

      expect(result.hasAIConsent).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.aIConsent.findUnique.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(checkUserAIData(TEST_USER_ID)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('estimateDeletionTime', () => {
    it('should estimate 150ms when user has AI consent', async () => {
      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce({
        id: 'consent_123',
        userId: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        autoCreateBills: false,
        autoCreateInvoices: false,
        autoMatchTransactions: false,
        autoCategorize: false,
        useCorrectionsForLearning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const estimatedMs = await estimateDeletionTime(TEST_USER_ID);

      // Base 100ms + AIConsent 50ms = 150ms
      expect(estimatedMs).toBe(150);
    });

    it('should estimate 100ms when user has no AI data', async () => {
      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce(null);

      const estimatedMs = await estimateDeletionTime(TEST_USER_ID);

      // Base 100ms only
      expect(estimatedMs).toBe(100);
    });

    it('should never exceed 1 second cap', async () => {
      mockPrisma.aIConsent.findUnique.mockResolvedValueOnce({
        id: 'consent_123',
        userId: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        autoCreateBills: true,
        autoCreateInvoices: true,
        autoMatchTransactions: true,
        autoCategorize: true,
        useCorrectionsForLearning: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const estimatedMs = await estimateDeletionTime(TEST_USER_ID);

      // Should be capped at 1000ms
      expect(estimatedMs).toBeLessThanOrEqual(1000);
    });
  });

  describe('deleteUserAIData', () => {
    it('should throw error if userId is empty', async () => {
      await expect(deleteUserAIData('')).rejects.toThrow(
        'userId is required for AI data deletion'
      );
    });

    it('should delete AI consent and create audit log', async () => {
      // Mock deleteUserConsent (from ai-consent.service)
      vi.mocked(aiConsentService.deleteUserConsent).mockResolvedValueOnce(undefined);

      // Mock audit log creation
      mockPrisma.auditLog.create.mockResolvedValueOnce({
        id: 'audit_123',
        tenantId: 'SYSTEM',
        userId: TEST_USER_ID,
        entityId: null,
        model: 'User',
        recordId: TEST_USER_ID,
        action: 'DELETE',
        before: {},
        after: {
          aiConsent: true,
          uploadedDocuments: 0,
          trainingData: 0,
          ragEntries: 0,
          llmLogs: 0,
        },
        metadata: expect.any(Object),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      const result = await deleteUserAIData(TEST_USER_ID);

      // Verify consent deletion was called
      expect(aiConsentService.deleteUserConsent).toHaveBeenCalledWith(TEST_USER_ID);

      // Verify audit log was created
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'SYSTEM',
          userId: TEST_USER_ID,
          model: 'User',
          recordId: TEST_USER_ID,
          action: 'DELETE',
        }),
      });

      // Verify result structure
      expect(result).toMatchObject({
        userId: TEST_USER_ID,
        deletedAt: expect.any(Date),
        itemsDeleted: {
          aiConsent: true,
          uploadedDocuments: 0,
          trainingData: 0,
          ragEntries: 0,
          llmLogs: 0,
        },
        preservedRecords: {
          financialRecords: [
            'Invoice',
            'Bill',
            'JournalEntry',
            'Payment',
            'Transaction',
            'Category',
          ],
          tenantDecisionLogs: true,
        },
        auditLogId: 'audit_123',
      });
    });

    it('should handle case when consent does not exist', async () => {
      // Mock deleteUserConsent throwing "not found" error
      vi.mocked(aiConsentService.deleteUserConsent).mockRejectedValueOnce(
        new Error('Record to delete does not exist')
      );

      // Mock audit log creation
      mockPrisma.auditLog.create.mockResolvedValueOnce({
        id: 'audit_456',
        tenantId: 'SYSTEM',
        userId: TEST_USER_ID,
        entityId: null,
        model: 'User',
        recordId: TEST_USER_ID,
        action: 'DELETE',
        before: {},
        after: {},
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await deleteUserAIData(TEST_USER_ID);

      // Should complete successfully even when consent doesn't exist
      expect(result.itemsDeleted.aiConsent).toBe(false);
      expect(result.auditLogId).toBe('audit_456');
    });

    it('should re-throw errors that are not "record not found"', async () => {
      // Mock deleteUserConsent throwing a different error
      vi.mocked(aiConsentService.deleteUserConsent).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(deleteUserAIData(TEST_USER_ID)).rejects.toThrow(
        'Failed to delete AI data'
      );
    });

    it('should preserve financial records (not delete them)', async () => {
      vi.mocked(aiConsentService.deleteUserConsent).mockResolvedValueOnce(undefined);

      mockPrisma.auditLog.create.mockResolvedValueOnce({
        id: 'audit_789',
        tenantId: 'SYSTEM',
        userId: TEST_USER_ID,
        entityId: null,
        model: 'User',
        recordId: TEST_USER_ID,
        action: 'DELETE',
        before: {},
        after: {},
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await deleteUserAIData(TEST_USER_ID);

      // Verify financial records are explicitly preserved
      expect(result.preservedRecords.financialRecords).toEqual([
        'Invoice',
        'Bill',
        'JournalEntry',
        'Payment',
        'Transaction',
        'Category',
      ]);

      expect(result.preservedRecords.tenantDecisionLogs).toBe(true);

      // Verify no calls to delete financial models
      expect(mockPrisma.invoice.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.bill.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.journalEntry.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.payment.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.transaction.deleteMany).not.toHaveBeenCalled();
    });

    it('should complete within 24-hour SLA (well under)', async () => {
      vi.mocked(aiConsentService.deleteUserConsent).mockResolvedValueOnce(undefined);

      mockPrisma.auditLog.create.mockResolvedValueOnce({
        id: 'audit_timing',
        tenantId: 'SYSTEM',
        userId: TEST_USER_ID,
        entityId: null,
        model: 'User',
        recordId: TEST_USER_ID,
        action: 'DELETE',
        before: {},
        after: {},
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const startTime = Date.now();
      await deleteUserAIData(TEST_USER_ID);
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      // SLA: 24 hours = 86,400,000ms
      // Current implementation should complete in <1 second
      expect(durationMs).toBeLessThan(1000);
    });

    it('should create audit log with GDPR metadata', async () => {
      vi.mocked(aiConsentService.deleteUserConsent).mockResolvedValueOnce(undefined);

      mockPrisma.auditLog.create.mockResolvedValueOnce({
        id: 'audit_gdpr',
        tenantId: 'SYSTEM',
        userId: TEST_USER_ID,
        entityId: null,
        model: 'User',
        recordId: TEST_USER_ID,
        action: 'DELETE',
        before: {},
        after: {},
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await deleteUserAIData(TEST_USER_ID);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DELETE',
          after: expect.objectContaining({
            deletionType: 'AI_DATA',
            gdprArticle: 17,
            gdprRightToErasure: true,
          }),
        }),
      });
    });
  });
});
