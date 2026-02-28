import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { aiDataDeletionRoutes } from '../ai-data-deletion.routes';
import * as aiDataDeletionService from '../../services/ai-data-deletion.service';
import { mockPrisma, rewirePrismaMock, AUTH_HEADERS } from '../../../../test-utils';

// Dynamic import to bypass hoisting
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

// Mock AI data deletion service
vi.mock('../../services/ai-data-deletion.service', () => ({
  deleteUserAIData: vi.fn(),
  checkUserAIData: vi.fn(),
  estimateDeletionTime: vi.fn(),
}));

// Mock auth and tenant middleware
vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: async (request: unknown) => {
    (request as { userId: string }).userId = 'user_test123';
  },
}));

vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: async (request: unknown) => {
    (request as { tenantId: string; tenant: { tenantId: string; userId: string; role: string } }).tenantId = 'tenant_test123';
    (request as { tenant: { tenantId: string; userId: string; role: string } }).tenant = {
      tenantId: 'tenant_test123',
      userId: 'user_test123',
      role: 'OWNER',
    };
  },
}));

describe('AI Data Deletion Routes (SEC-35)', () => {
  let app: FastifyInstance;
  const TEST_USER_ID = 'user_test123';
  const TEST_TENANT_ID = 'tenant_test123';

  beforeEach(async () => {
    app = Fastify({ logger: false });
    await app.register(aiDataDeletionRoutes);
    await app.ready();

    vi.clearAllMocks();
    rewirePrismaMock();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /check', () => {
    it('should return AI data status when data exists', async () => {
      vi.mocked(aiDataDeletionService.checkUserAIData).mockResolvedValueOnce({
        hasAIConsent: true,
        hasUploadedDocuments: false,
        hasTrainingData: false,
        hasRAGEntries: false,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/check',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        userId: TEST_USER_ID,
        data: {
          hasAIConsent: true,
          hasUploadedDocuments: false,
          hasTrainingData: false,
          hasRAGEntries: false,
        },
        message: 'You have AI data that can be deleted',
      });

      expect(aiDataDeletionService.checkUserAIData).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should return message when no AI data exists', async () => {
      vi.mocked(aiDataDeletionService.checkUserAIData).mockResolvedValueOnce({
        hasAIConsent: false,
        hasUploadedDocuments: false,
        hasTrainingData: false,
        hasRAGEntries: false,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/check',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toBe('No AI data found for your account');
    });

    it('should handle service errors', async () => {
      vi.mocked(aiDataDeletionService.checkUserAIData).mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/check',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(500);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('GET /deletion-estimate', () => {
    it('should return estimated deletion time', async () => {
      vi.mocked(aiDataDeletionService.estimateDeletionTime).mockResolvedValueOnce(150);

      const response = await app.inject({
        method: 'GET',
        url: '/deletion-estimate',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        userId: TEST_USER_ID,
        estimatedMs: 150,
        estimatedSeconds: 1,
        slaHours: 24,
      });

      expect(body.message).toContain('approximately 1 seconds');
      expect(body.message).toContain('SLA: 24 hours');
    });

    it('should handle estimation errors', async () => {
      vi.mocked(aiDataDeletionService.estimateDeletionTime).mockRejectedValueOnce(
        new Error('Estimation failed')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/deletion-estimate',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('DELETE /', () => {
    it('should delete AI data and return result', async () => {
      vi.mocked(aiDataDeletionService.checkUserAIData).mockResolvedValueOnce({
        hasAIConsent: true,
        hasUploadedDocuments: false,
        hasTrainingData: false,
        hasRAGEntries: false,
      });

      vi.mocked(aiDataDeletionService.deleteUserAIData).mockResolvedValueOnce({
        userId: TEST_USER_ID,
        deletedAt: new Date('2026-02-28T10:00:00Z'),
        itemsDeleted: {
          aiConsent: true,
          uploadedDocuments: 0,
          trainingData: 0,
          ragEntries: 0,
          llmLogs: 0,
        },
        preservedRecords: {
          financialRecords: ['Invoice', 'Bill', 'JournalEntry', 'Payment', 'Transaction', 'Category'],
          tenantDecisionLogs: true,
        },
        auditLogId: 'audit_123',
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        userId: TEST_USER_ID,
        message: 'AI data deleted successfully',
        sla: '24 hours',
        itemsDeleted: {
          aiConsent: true,
        },
        preservedRecords: {
          financialRecords: expect.arrayContaining(['Invoice', 'Bill']),
          tenantDecisionLogs: true,
        },
      });

      expect(aiDataDeletionService.deleteUserAIData).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should return early when no AI data exists', async () => {
      vi.mocked(aiDataDeletionService.checkUserAIData).mockResolvedValueOnce({
        hasAIConsent: false,
        hasUploadedDocuments: false,
        hasTrainingData: false,
        hasRAGEntries: false,
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toBe('No AI data found for your account');

      // Should NOT call deleteUserAIData if no data exists
      expect(aiDataDeletionService.deleteUserAIData).not.toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      vi.mocked(aiDataDeletionService.checkUserAIData).mockResolvedValueOnce({
        hasAIConsent: true,
        hasUploadedDocuments: false,
        hasTrainingData: false,
        hasRAGEntries: false,
      });

      vi.mocked(aiDataDeletionService.deleteUserAIData).mockRejectedValueOnce(
        new Error('Deletion failed')
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/',
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(500);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Deletion failed');
    });

    it('should preserve financial records (GDPR exemption)', async () => {
      vi.mocked(aiDataDeletionService.checkUserAIData).mockResolvedValueOnce({
        hasAIConsent: true,
        hasUploadedDocuments: false,
        hasTrainingData: false,
        hasRAGEntries: false,
      });

      vi.mocked(aiDataDeletionService.deleteUserAIData).mockResolvedValueOnce({
        userId: TEST_USER_ID,
        deletedAt: new Date(),
        itemsDeleted: {
          aiConsent: true,
          uploadedDocuments: 0,
          trainingData: 0,
          ragEntries: 0,
          llmLogs: 0,
        },
        preservedRecords: {
          financialRecords: ['Invoice', 'Bill', 'JournalEntry', 'Payment', 'Transaction', 'Category'],
          tenantDecisionLogs: true,
        },
        auditLogId: 'audit_preserved',
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/',
        headers: AUTH_HEADERS,
      });

      const body = JSON.parse(response.body);

      // Verify financial records are explicitly preserved
      expect(body.preservedRecords.financialRecords).toContain('Invoice');
      expect(body.preservedRecords.financialRecords).toContain('Bill');
      expect(body.preservedRecords.financialRecords).toContain('JournalEntry');
      expect(body.preservedRecords.tenantDecisionLogs).toBe(true);
    });

    it('should complete within 24-hour SLA', async () => {
      vi.mocked(aiDataDeletionService.checkUserAIData).mockResolvedValueOnce({
        hasAIConsent: true,
        hasUploadedDocuments: false,
        hasTrainingData: false,
        hasRAGEntries: false,
      });

      vi.mocked(aiDataDeletionService.deleteUserAIData).mockResolvedValueOnce({
        userId: TEST_USER_ID,
        deletedAt: new Date(),
        itemsDeleted: {
          aiConsent: true,
          uploadedDocuments: 0,
          trainingData: 0,
          ragEntries: 0,
          llmLogs: 0,
        },
        preservedRecords: {
          financialRecords: ['Invoice', 'Bill', 'JournalEntry', 'Payment', 'Transaction', 'Category'],
          tenantDecisionLogs: true,
        },
        auditLogId: 'audit_sla',
      });

      const startTime = Date.now();
      const response = await app.inject({
        method: 'DELETE',
        url: '/',
        headers: AUTH_HEADERS,
      });
      const endTime = Date.now();

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.sla).toBe('24 hours');

      // Route should complete in <100ms (well under 24h SLA)
      const durationMs = endTime - startTime;
      expect(durationMs).toBeLessThan(100);
    });
  });
});
