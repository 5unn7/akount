import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { aiRoutes } from '../routes';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock auth middleware
vi.mock('../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw { statusCode: 401, message: 'Unauthorized' };
    }
    request.userId = 'test-user-id';
  }),
}));

// Mock tenant middleware
vi.mock('../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
}));

// Mock withPermission to pass through
vi.mock('../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async () => {},
  })),
}));

// Mock validation middleware — let schemas pass through (we test validation separately)
vi.mock('../../../middleware/validation', () => ({
  validateBody: vi.fn(() => async () => {}),
}));

// Mock rate-limit middleware
vi.mock('../../../middleware/rate-limit', () => ({
  aiChatRateLimitConfig: vi.fn(() => ({})),
  aiRateLimitConfig: vi.fn(() => ({})),
}));

// Mock AI service
const mockChat = vi.fn();
vi.mock('../services/ai.service', () => ({
  aiService: {
    chat: (...args: unknown[]) => mockChat(...args),
  },
}));

// Mock CategorizationService
const mockCategorize = vi.fn();
const mockCategorizeBatch = vi.fn();
vi.mock('../services/categorization.service', () => ({
  CategorizationService: function (this: Record<string, unknown>) {
    this.categorize = mockCategorize;
    this.categorizeBatch = mockCategorizeBatch;
  },
}));

// Mock Prisma
const mockEntityFindFirst = vi.fn();
const mockTransactionFindMany = vi.fn();
vi.mock('@akount/db', () => ({
  prisma: {
    entity: { findFirst: (...args: unknown[]) => mockEntityFindFirst(...args) },
    transaction: { findMany: (...args: unknown[]) => mockTransactionFindMany(...args) },
  },
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const MOCK_SUGGESTION = {
  categoryId: 'clcat00000000000000001',
  categoryName: 'Meals & Entertainment',
  confidence: 85,
  confidenceTier: 'high' as const,
  matchReason: 'Keyword match: "restaurant"',
  resolvedGLAccountId: 'clgl000000000000000001',
  resolvedGLAccountCode: '5800',
};

const MOCK_TRANSACTIONS = [
  {
    id: 'cltx0000000000000000001',
    description: 'Starbucks Coffee',
    amount: -550,
    categoryId: null,
  },
  {
    id: 'cltx0000000000000000002',
    description: 'Client payment received',
    amount: 150000,
    categoryId: 'clcat00000000000000002',
  },
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let app: FastifyInstance;

beforeAll(async () => {
  app = Fastify({ logger: false });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AI Routes', () => {
  // -----------------------------------------------------------------------
  // POST /api/ai/categorize — single
  // -----------------------------------------------------------------------

  describe('POST /api/ai/categorize', () => {
    it('should categorize a single transaction', async () => {
      mockCategorize.mockResolvedValueOnce(MOCK_SUGGESTION);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/categorize',
        headers: { authorization: 'Bearer test-token' },
        payload: { description: 'Restaurant dinner', amount: -3500 },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.categoryId).toBe(MOCK_SUGGESTION.categoryId);
      expect(body.confidence).toBe(85);
      expect(body.confidenceTier).toBe('high');
      expect(body.resolvedGLAccountId).toBe(MOCK_SUGGESTION.resolvedGLAccountId);
      expect(body.resolvedGLAccountCode).toBe('5800');
    });

    it('should pass entityId for GL resolution when provided', async () => {
      mockCategorize.mockResolvedValueOnce(MOCK_SUGGESTION);
      mockEntityFindFirst.mockResolvedValueOnce({ id: 'clent00000000000000001' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/categorize',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          description: 'Restaurant dinner',
          amount: -3500,
          entityId: 'clent00000000000000001',
        },
      });

      expect(response.statusCode).toBe(200);
      // Entity lookup validates tenant isolation
      expect(mockEntityFindFirst).toHaveBeenCalledWith({
        where: { id: 'clent00000000000000001', tenantId: 'tenant-abc-123' },
        select: { id: true },
      });
    });

    it('should reject entityId that does not belong to tenant', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(null); // Not found = wrong tenant

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/categorize',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          description: 'Restaurant dinner',
          amount: -3500,
          entityId: 'clent_other_tenant_entity',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toContain('Entity not found');
    });

    it('should return 500 on categorization service error', async () => {
      mockCategorize.mockRejectedValueOnce(new Error('Service unavailable'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/categorize',
        headers: { authorization: 'Bearer test-token' },
        payload: { description: 'Test', amount: -100 },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error).toBe('Service unavailable');
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/ai/categorize/batch
  // -----------------------------------------------------------------------

  describe('POST /api/ai/categorize/batch', () => {
    const ENTITY_ID = 'clent00000000000000001';
    const BATCH_SUGGESTIONS = [
      { ...MOCK_SUGGESTION, categoryName: 'Meals & Entertainment' },
      {
        categoryId: 'clcat00000000000000003',
        categoryName: 'Sales Revenue',
        confidence: 85,
        confidenceTier: 'high' as const,
        matchReason: 'Keyword match: "client payment"',
        resolvedGLAccountId: 'clgl000000000000000002',
        resolvedGLAccountCode: '4000',
      },
    ];

    it('should batch categorize transactions by ID', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce(MOCK_TRANSACTIONS);
      mockCategorizeBatch.mockResolvedValueOnce(BATCH_SUGGESTIONS);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/categorize/batch',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: MOCK_TRANSACTIONS.map((t) => t.id),
          entityId: ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      // Results array with transaction-suggestion pairs
      expect(body.results).toHaveLength(2);
      expect(body.results[0].transactionId).toBe(MOCK_TRANSACTIONS[0].id);
      expect(body.results[0].existingCategoryId).toBeNull();
      expect(body.results[0].suggestion.confidenceTier).toBe('high');
      expect(body.results[1].transactionId).toBe(MOCK_TRANSACTIONS[1].id);
      expect(body.results[1].existingCategoryId).toBe('clcat00000000000000002');

      // Summary stats
      expect(body.summary.total).toBe(2);
      expect(body.summary.matched).toBe(2);
      expect(body.summary.missing).toBe(0);
      expect(body.summary.highConfidence).toBe(2);
    });

    it('should enforce tenant isolation on entity lookup', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(null); // Wrong tenant

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/categorize/batch',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx0000000000000000001'],
          entityId: 'clent_other_tenant',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toContain('Entity not found');
    });

    it('should enforce tenant isolation on transaction fetch', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      // Transactions filtered by tenant — returns empty
      mockTransactionFindMany.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/categorize/batch',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx_cross_tenant_id'],
          entityId: ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toContain('No matching transactions');
    });

    it('should report missing transaction IDs in summary', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      // Only 1 of 3 IDs found
      mockTransactionFindMany.mockResolvedValueOnce([MOCK_TRANSACTIONS[0]]);
      mockCategorizeBatch.mockResolvedValueOnce([BATCH_SUGGESTIONS[0]]);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/categorize/batch',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: [
            MOCK_TRANSACTIONS[0].id,
            'cltx_missing_1',
            'cltx_missing_2',
          ],
          entityId: ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.summary.total).toBe(3);
      expect(body.summary.matched).toBe(1);
      expect(body.summary.missing).toBe(2);
    });

    it('should include GL resolution data in batch results', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce([MOCK_TRANSACTIONS[0]]);
      mockCategorizeBatch.mockResolvedValueOnce([BATCH_SUGGESTIONS[0]]);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/categorize/batch',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: [MOCK_TRANSACTIONS[0].id],
          entityId: ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json().results[0];
      expect(result.suggestion.resolvedGLAccountId).toBe('clgl000000000000000001');
      expect(result.suggestion.resolvedGLAccountCode).toBe('5800');
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/ai/chat
  // -----------------------------------------------------------------------

  describe('POST /api/ai/chat', () => {
    it('should return AI chat response', async () => {
      mockChat.mockResolvedValueOnce({
        content: 'Here is some financial advice.',
        provider: 'perplexity',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          messages: [{ role: 'user', content: 'How do I categorize this?' }],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().content).toBe('Here is some financial advice.');
    });

    it('should return 500 on chat error', async () => {
      mockChat.mockRejectedValueOnce(new Error('Provider down'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          messages: [{ role: 'user', content: 'Test' }],
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error).toBe('Provider down');
    });
  });

  // -----------------------------------------------------------------------
  // Placeholder endpoints
  // -----------------------------------------------------------------------

  describe('Placeholder endpoints', () => {
    it('GET /api/ai/insights should return 501', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ai/insights',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(response.statusCode).toBe(501);
    });

    it('GET /api/ai/recommendations should return 501', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ai/recommendations',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(response.statusCode).toBe(501);
    });

    it('POST /api/ai/rules/suggest should return 501', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/rules/suggest',
        headers: { authorization: 'Bearer test-token' },
      });
      expect(response.statusCode).toBe(501);
    });
  });
});
