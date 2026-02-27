import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, rewirePrismaMock, TEST_IDS } from '../../../../test-utils';
import { AIDecisionLogService } from '../ai-decision-log.service';
import { AIDecisionType, AIRoutingResult } from '@akount/db';

// Dynamic import inside factory bypasses vi.mock hoisting constraint
vi.mock('@akount/db', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  prisma: (await import('../../../../test-utils/prisma-mock')).mockPrisma,
}));

// Mock logger
vi.mock('../../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Manually add aIDecisionLog mock (new model not in centralized mock yet)
mockPrisma.aIDecisionLog = {
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  groupBy: vi.fn(),
  aggregate: vi.fn(),
} as any;

describe('AIDecisionLogService', () => {
  let service: AIDecisionLogService;

  beforeEach(() => {
    vi.clearAllMocks();
    rewirePrismaMock();
    service = new AIDecisionLogService();
  });

  describe('logDecision', () => {
    it('should create decision log entry with all fields', async () => {
      const mockEntry = {
        id: 'log-123',
        tenantId: TEST_IDS.TENANT_ID,
        decisionType: AIDecisionType.BILL_EXTRACTION,
        routingResult: AIRoutingResult.AUTO_CREATED,
        confidence: 92,
        createdAt: new Date(),
      };

      mockPrisma.aIDecisionLog.create.mockResolvedValueOnce(mockEntry);

      const result = await service.logDecision({
        tenantId: TEST_IDS.TENANT_ID,
        entityId: TEST_IDS.ENTITY_ID,
        documentId: 'bill-456',
        decisionType: AIDecisionType.BILL_EXTRACTION,
        input: 'receipt image data',
        modelVersion: 'pixtral-large-latest',
        confidence: 92,
        extractedData: { vendor: 'Starbucks', amount: 1550 },
        routingResult: AIRoutingResult.AUTO_CREATED,
        aiExplanation: 'High confidence extraction',
        consentStatus: 'granted',
        processingTimeMs: 1250,
      });

      expect(result).toEqual(mockEntry);
      expect(mockPrisma.aIDecisionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TEST_IDS.TENANT_ID,
            entityId: TEST_IDS.ENTITY_ID,
            documentId: 'bill-456',
            decisionType: AIDecisionType.BILL_EXTRACTION,
            modelVersion: 'pixtral-large-latest',
            confidence: 92,
            routingResult: AIRoutingResult.AUTO_CREATED,
            consentStatus: 'granted',
            processingTimeMs: 1250,
          }),
        })
      );

      // Verify inputHash was generated
      const createCall = mockPrisma.aIDecisionLog.create.mock.calls[0][0];
      expect(createCall.data.inputHash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
    });

    it('should generate SHA256 hash from string input', async () => {
      mockPrisma.aIDecisionLog.create.mockResolvedValueOnce({
        id: 'log-1',
        tenantId: TEST_IDS.TENANT_ID,
        decisionType: AIDecisionType.CATEGORIZATION,
        routingResult: AIRoutingResult.AUTO_CREATED,
        confidence: 85,
        createdAt: new Date(),
      });

      await service.logDecision({
        tenantId: TEST_IDS.TENANT_ID,
        decisionType: AIDecisionType.CATEGORIZATION,
        input: 'test input',
        modelVersion: 'mistral-large-latest',
        routingResult: AIRoutingResult.AUTO_CREATED,
      });

      const createCall = mockPrisma.aIDecisionLog.create.mock.calls[0][0];
      expect(createCall.data.inputHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle Buffer input for hashing', async () => {
      mockPrisma.aIDecisionLog.create.mockResolvedValueOnce({
        id: 'log-1',
        tenantId: TEST_IDS.TENANT_ID,
        decisionType: AIDecisionType.BILL_EXTRACTION,
        routingResult: AIRoutingResult.QUEUED_FOR_REVIEW,
        confidence: 75,
        createdAt: new Date(),
      });

      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff]);

      await service.logDecision({
        tenantId: TEST_IDS.TENANT_ID,
        decisionType: AIDecisionType.BILL_EXTRACTION,
        input: imageBuffer,
        modelVersion: 'pixtral-large-latest',
        routingResult: AIRoutingResult.QUEUED_FOR_REVIEW,
      });

      const createCall = mockPrisma.aIDecisionLog.create.mock.calls[0][0];
      expect(createCall.data.inputHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('queryDecisions', () => {
    it('should query decisions by tenant', async () => {
      const mockEntries = [
        {
          id: 'log-1',
          tenantId: TEST_IDS.TENANT_ID,
          entityId: TEST_IDS.ENTITY_ID,
          documentId: null,
          decisionType: AIDecisionType.BILL_EXTRACTION,
          modelVersion: 'pixtral-large-latest',
          confidence: 92,
          extractedData: { vendor: 'Test' },
          routingResult: AIRoutingResult.AUTO_CREATED,
          aiExplanation: null,
          consentStatus: 'granted',
          processingTimeMs: 1200,
          createdAt: new Date(),
        },
      ];

      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce(mockEntries);

      const result = await service.queryDecisions({
        tenantId: TEST_IDS.TENANT_ID,
      });

      expect(result).toEqual(mockEntries);
      expect(mockPrisma.aIDecisionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TEST_IDS.TENANT_ID },
          orderBy: { createdAt: 'desc' },
          take: 100,
          skip: 0,
        })
      );
    });

    it('should filter by decision type', async () => {
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      await service.queryDecisions({
        tenantId: TEST_IDS.TENANT_ID,
        decisionType: AIDecisionType.INVOICE_EXTRACTION,
      });

      expect(mockPrisma.aIDecisionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: TEST_IDS.TENANT_ID,
            decisionType: AIDecisionType.INVOICE_EXTRACTION,
          },
        })
      );
    });

    it('should filter by routing result', async () => {
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      await service.queryDecisions({
        tenantId: TEST_IDS.TENANT_ID,
        routingResult: AIRoutingResult.QUEUED_FOR_REVIEW,
      });

      expect(mockPrisma.aIDecisionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: TEST_IDS.TENANT_ID,
            routingResult: AIRoutingResult.QUEUED_FOR_REVIEW,
          },
        })
      );
    });

    it('should filter by date range', async () => {
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      await service.queryDecisions({
        tenantId: TEST_IDS.TENANT_ID,
        dateFrom,
        dateTo,
      });

      expect(mockPrisma.aIDecisionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: TEST_IDS.TENANT_ID,
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        })
      );
    });

    it('should support pagination', async () => {
      mockPrisma.aIDecisionLog.findMany.mockResolvedValueOnce([]);

      await service.queryDecisions({
        tenantId: TEST_IDS.TENANT_ID,
        limit: 50,
        offset: 100,
      });

      expect(mockPrisma.aIDecisionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 100,
        })
      );
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for tenant', async () => {
      mockPrisma.aIDecisionLog.count.mockResolvedValueOnce(150);

      mockPrisma.aIDecisionLog.groupBy.mockResolvedValueOnce([
        { decisionType: AIDecisionType.BILL_EXTRACTION, _count: { id: 80 } },
        { decisionType: AIDecisionType.CATEGORIZATION, _count: { id: 70 } },
      ]);

      mockPrisma.aIDecisionLog.groupBy.mockResolvedValueOnce([
        { routingResult: AIRoutingResult.AUTO_CREATED, _count: { id: 120 } },
        { routingResult: AIRoutingResult.QUEUED_FOR_REVIEW, _count: { id: 30 } },
      ]);

      mockPrisma.aIDecisionLog.aggregate.mockResolvedValueOnce({
        _avg: { confidence: 88.5 },
      });

      mockPrisma.aIDecisionLog.aggregate.mockResolvedValueOnce({
        _avg: { processingTimeMs: 1350 },
      });

      const stats = await service.getStatistics(TEST_IDS.TENANT_ID);

      expect(stats.totalDecisions).toBe(150);
      expect(stats.byType).toHaveLength(2);
      expect(stats.byRouting).toHaveLength(2);
      expect(stats.avgConfidence).toBe(88.5);
      expect(stats.avgProcessingTimeMs).toBe(1350);
    });

    it('should filter statistics by entity', async () => {
      mockPrisma.aIDecisionLog.count.mockResolvedValueOnce(50);
      mockPrisma.aIDecisionLog.groupBy.mockResolvedValue([]);
      mockPrisma.aIDecisionLog.aggregate.mockResolvedValue({ _avg: { confidence: null } });

      await service.getStatistics(TEST_IDS.TENANT_ID, TEST_IDS.ENTITY_ID);

      expect(mockPrisma.aIDecisionLog.count).toHaveBeenCalledWith({
        where: {
          tenantId: TEST_IDS.TENANT_ID,
          entityId: TEST_IDS.ENTITY_ID,
        },
      });
    });
  });
});
