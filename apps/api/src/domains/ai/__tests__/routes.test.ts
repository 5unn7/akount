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
  validateParams: vi.fn(() => async () => {}),
  validateQuery: vi.fn(() => async () => {}),
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

// Mock JESuggestionService
const mockSuggestBatch = vi.fn();
const mockCreateDraftJEs = vi.fn();
vi.mock('../services/je-suggestion.service', () => ({
  JESuggestionService: function (this: Record<string, unknown>) {
    this.suggestBatch = mockSuggestBatch;
    this.createDraftJEs = mockCreateDraftJEs;
  },
}));

// Mock AIActionService (needed since routes.ts registers action sub-routes)
vi.mock('../services/ai-action.service', () => ({
  AIActionService: function (this: Record<string, unknown>) {
    this.listActions = vi.fn();
    this.getStats = vi.fn();
    this.approveAction = vi.fn();
    this.rejectAction = vi.fn();
    this.batchApprove = vi.fn();
    this.batchReject = vi.fn();
  },
}));

// Mock logger (required by ai-action.service)
vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock Prisma
const mockEntityFindFirst = vi.fn();
const mockTransactionFindMany = vi.fn();
vi.mock('@akount/db', () => ({
  prisma: {
    entity: { findFirst: (...args: unknown[]) => mockEntityFindFirst(...args) },
    transaction: { findMany: (...args: unknown[]) => mockTransactionFindMany(...args) },
    aIAction: { findFirst: vi.fn() },
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
  // POST /api/ai/je-suggest — Preview JE suggestions
  // -----------------------------------------------------------------------

  describe('POST /api/ai/je-suggest', () => {
    const ENTITY_ID = 'clent00000000000000001';

    const MOCK_TXN_ROWS = [
      {
        id: 'cltx0000000000000000001',
        description: 'Starbucks Coffee',
        amount: -550,
        currency: 'USD',
        date: new Date('2026-02-25'),
        sourceType: 'BANK_FEED',
        accountId: 'clacct000000000000001',
      },
    ];

    const MOCK_JE_RESULT = {
      suggestions: [
        {
          transactionId: 'cltx0000000000000000001',
          entryNumber: null,
          date: '2026-02-25T00:00:00.000Z',
          memo: 'AI-drafted: Starbucks Coffee — Meals & Entertainment',
          sourceType: 'AI_SUGGESTION',
          sourceId: 'cltx0000000000000000001',
          status: 'DRAFT',
          lines: [
            { glAccountId: 'gl-exp', glAccountCode: '5800', debitAmount: 550, creditAmount: 0, memo: 'Expense' },
            { glAccountId: 'gl-bank', glAccountCode: '1100', debitAmount: 0, creditAmount: 550, memo: 'Bank' },
          ],
          confidence: 92,
          categorization: { confidenceTier: 'high' },
        },
      ],
      skipped: [],
      summary: {
        total: 1,
        suggested: 1,
        skipped: 0,
        highConfidence: 1,
        mediumConfidence: 0,
        lowConfidence: 0,
      },
    };

    it('should return JE suggestions for eligible transactions', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce(MOCK_TXN_ROWS);
      mockSuggestBatch.mockResolvedValueOnce(MOCK_JE_RESULT);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx0000000000000000001'],
          entityId: ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0].sourceType).toBe('AI_SUGGESTION');
      expect(body.suggestions[0].status).toBe('DRAFT');
      expect(body.suggestions[0].lines).toHaveLength(2);
      expect(body.summary.suggested).toBe(1);
    });

    it('should enforce entity tenant isolation (IDOR)', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx0000000000000000001'],
          entityId: 'clent_other_tenant',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toContain('Entity not found');
    });

    it('should only fetch un-booked transactions (journalEntryId null)', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce(MOCK_TXN_ROWS);
      mockSuggestBatch.mockResolvedValueOnce(MOCK_JE_RESULT);

      await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx0000000000000000001'],
          entityId: ENTITY_ID,
        },
      });

      expect(mockTransactionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            journalEntryId: null,
            deletedAt: null,
            account: { entity: { tenantId: 'tenant-abc-123' } },
          }),
        })
      );
    });

    it('should return 404 when no eligible transactions found', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx_no_match'],
          entityId: ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toContain('No eligible transactions');
    });

    it('should return 500 on service error', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce(MOCK_TXN_ROWS);
      mockSuggestBatch.mockRejectedValueOnce(new Error('Categorization engine down'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx0000000000000000001'],
          entityId: ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error).toBe('Categorization engine down');
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/ai/je-suggest/create — Create draft JEs
  // -----------------------------------------------------------------------

  describe('POST /api/ai/je-suggest/create', () => {
    const ENTITY_ID = 'clent00000000000000001';

    const MOCK_TXN_ROWS = [
      {
        id: 'cltx0000000000000000001',
        description: 'Coffee',
        amount: -550,
        currency: 'USD',
        date: new Date('2026-02-25'),
        sourceType: 'BANK_FEED',
        accountId: 'clacct000000000000001',
      },
    ];

    const highConfSuggestion = {
      transactionId: 'cltx0000000000000000001',
      confidence: 92,
      categorization: { confidenceTier: 'high' },
    };

    const lowConfSuggestion = {
      transactionId: 'cltx0000000000000000002',
      confidence: 40,
      categorization: { confidenceTier: 'low' },
    };

    it('should create draft JEs and return results', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce(MOCK_TXN_ROWS);
      mockSuggestBatch.mockResolvedValueOnce({
        suggestions: [highConfSuggestion],
        skipped: [],
        summary: { total: 1, suggested: 1, skipped: 0, highConfidence: 1, mediumConfidence: 0, lowConfidence: 0 },
      });
      mockCreateDraftJEs.mockResolvedValueOnce([
        { transactionId: 'cltx0000000000000000001', journalEntryId: 'je-created-001' },
      ]);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest/create',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx0000000000000000001'],
          entityId: ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.created).toHaveLength(1);
      expect(body.created[0].journalEntryId).toBe('je-created-001');
      expect(body.suggestResult).toBeDefined();
    });

    it('should filter by minConfidence when provided', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce([
        ...MOCK_TXN_ROWS,
        { ...MOCK_TXN_ROWS[0], id: 'cltx0000000000000000002' },
      ]);
      mockSuggestBatch.mockResolvedValueOnce({
        suggestions: [highConfSuggestion, lowConfSuggestion],
        skipped: [],
        summary: { total: 2, suggested: 2, skipped: 0, highConfidence: 1, mediumConfidence: 0, lowConfidence: 1 },
      });
      mockCreateDraftJEs.mockResolvedValueOnce([
        { transactionId: 'cltx0000000000000000001', journalEntryId: 'je-high-conf' },
      ]);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest/create',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx0000000000000000001', 'cltx0000000000000000002'],
          entityId: ENTITY_ID,
          minConfidence: 80,
        },
      });

      expect(response.statusCode).toBe(200);
      // Only high-confidence suggestion passed to createDraftJEs
      expect(mockCreateDraftJEs).toHaveBeenCalledWith([highConfSuggestion]);
    });

    it('should return message when no suggestions meet minConfidence', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce(MOCK_TXN_ROWS);
      mockSuggestBatch.mockResolvedValueOnce({
        suggestions: [lowConfSuggestion],
        skipped: [],
        summary: { total: 1, suggested: 1, skipped: 0, highConfidence: 0, mediumConfidence: 0, lowConfidence: 1 },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest/create',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx0000000000000000001'],
          entityId: ENTITY_ID,
          minConfidence: 80,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.created).toHaveLength(0);
      expect(body.message).toContain('minimum confidence');
      expect(mockCreateDraftJEs).not.toHaveBeenCalled();
    });

    it('should enforce entity tenant isolation', async () => {
      mockEntityFindFirst.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest/create',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx0000000000000000001'],
          entityId: 'clent_wrong_tenant',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when no eligible transactions found', async () => {
      mockEntityFindFirst.mockResolvedValueOnce({ id: ENTITY_ID });
      mockTransactionFindMany.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/je-suggest/create',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionIds: ['cltx_no_match'],
          entityId: ENTITY_ID,
        },
      });

      expect(response.statusCode).toBe(404);
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
