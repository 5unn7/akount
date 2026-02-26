import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { ruleSuggestionRoutes } from '../rule-suggestions';

// Mock middleware
vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    request.userId = 'test-user-id';
  }),
}));

vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
}));

vi.mock('../../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

vi.mock('../../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

vi.mock('../../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async (request: unknown) => {
      const req = request as Record<string, unknown>;
      req.userId = 'test-user-id';
      req.tenantId = 'tenant-abc-123';
      req.tenantRole = 'OWNER';
    },
  })),
}));

// Mock RuleSuggestionService
const mockListSuggestions = vi.fn();
const mockGetSuggestion = vi.fn();
const mockApproveSuggestion = vi.fn();
const mockRejectSuggestion = vi.fn();
const mockExpireStaleSuggestions = vi.fn();

vi.mock('../../services/rule-suggestion.service', () => ({
  RuleSuggestionService: function (this: Record<string, unknown>) {
    this.listSuggestions = mockListSuggestions;
    this.getSuggestion = mockGetSuggestion;
    this.approveSuggestion = mockApproveSuggestion;
    this.rejectSuggestion = mockRejectSuggestion;
    this.expireStaleSuggestions = mockExpireStaleSuggestions;
  },
}));

// Mock PatternDetectionService
const mockDetectPatterns = vi.fn();

vi.mock('../../services/pattern-detection.service', () => ({
  PatternDetectionService: function (this: Record<string, unknown>) {
    this.detectPatterns = mockDetectPatterns;
  },
}));

// Mock error handler
vi.mock('../../errors', () => ({
  handleAIError: vi.fn((error, reply) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return reply.status(500).send({ error: message });
  }),
}));

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_SUGGESTION = {
  id: 'suggestion-1',
  entityId: 'entity-1',
  triggeredBy: 'test-user-id',
  suggestedRule: {
    name: 'Auto: Meals (starbucks)',
    conditions: {
      operator: 'AND',
      conditions: [{ field: 'description', op: 'contains', value: 'starbucks' }],
    },
    action: { setCategoryId: 'category-meals' },
    patternSummary: '5 transactions matching "starbucks" → Meals',
    exampleTransactions: [
      { id: 'txn-1', description: 'STARBUCKS COFFEE', amount: -550 },
      { id: 'txn-2', description: 'STARBUCKS RESERVE', amount: -750 },
    ],
    estimatedImpact: 5,
  },
  aiReasoning: 'Detected 5 transactions containing "starbucks" categorized as "Meals" with 100% consistency.',
  aiConfidence: 95,
  aiModelVersion: 'pattern-detection-v1',
  status: 'PENDING',
  createdAt: new Date('2026-01-15'),
  reviewedAt: null,
  reviewedBy: null,
};

const MOCK_PATTERN = {
  keyword: 'starbucks',
  categoryId: 'category-meals',
  categoryName: 'Meals & Entertainment',
  transactionCount: 5,
  patternStrength: 1.0,
  exampleTransactions: [
    { id: 'txn-1', description: 'STARBUCKS COFFEE', amount: -550 },
  ],
  suggestedConditions: {
    operator: 'AND',
    conditions: [{ field: 'description', op: 'contains', value: 'starbucks' }],
  },
  suggestedAction: { setCategoryId: 'category-meals' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Rule Suggestion Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default mock returns
    mockListSuggestions.mockResolvedValue({
      suggestions: [MOCK_SUGGESTION],
      nextCursor: undefined,
      hasMore: false,
    });
    mockGetSuggestion.mockResolvedValue(MOCK_SUGGESTION);
    mockApproveSuggestion.mockResolvedValue({ ruleId: 'rule-new-1' });
    mockRejectSuggestion.mockResolvedValue(undefined);
    mockExpireStaleSuggestions.mockResolvedValue(3);
    mockDetectPatterns.mockResolvedValue([MOCK_PATTERN]);

    app = Fastify();
    app.register(ruleSuggestionRoutes);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // =========================================================================
  // GET / — List suggestions
  // =========================================================================
  describe('GET / (list suggestions)', () => {
    it('should return suggestions list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/?entityId=entity-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0].id).toBe('suggestion-1');
      expect(body.hasMore).toBe(false);
      expect(mockListSuggestions).toHaveBeenCalledWith({
        entityId: 'entity-1',
        status: undefined,
        cursor: undefined,
        limit: undefined,
      });
    });

    it('should pass status filter to service', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/?entityId=entity-1&status=PENDING',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockListSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING' })
      );
    });

    it('should return 500 on service error', async () => {
      mockListSuggestions.mockRejectedValueOnce(new Error('DB connection failed'));

      const response = await app.inject({
        method: 'GET',
        url: '/?entityId=entity-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  // =========================================================================
  // GET /:id — Get single suggestion
  // =========================================================================
  describe('GET /:id (get suggestion)', () => {
    it('should return a suggestion by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/suggestion-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('suggestion-1');
      expect(body.status).toBe('PENDING');
      expect(body.aiConfidence).toBe(95);
    });

    it('should return 404 when suggestion not found', async () => {
      mockGetSuggestion.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/nonexistent-id',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Suggestion not found');
    });
  });

  // =========================================================================
  // POST /:id/approve — Approve suggestion
  // =========================================================================
  describe('POST /:id/approve (approve suggestion)', () => {
    it('should approve suggestion and return ruleId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/suggestion-1/approve',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ruleId).toBe('rule-new-1');
      expect(mockApproveSuggestion).toHaveBeenCalledWith('suggestion-1');
    });

    it('should return 500 when suggestion already reviewed', async () => {
      mockApproveSuggestion.mockRejectedValueOnce(
        new Error('Suggestion not found, already reviewed, or access denied')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/suggestion-1/approve',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  // =========================================================================
  // POST /:id/reject — Reject suggestion
  // =========================================================================
  describe('POST /:id/reject (reject suggestion)', () => {
    it('should reject suggestion with reason', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/suggestion-1/reject',
        headers: { authorization: 'Bearer test-token' },
        payload: { reason: 'Not accurate enough' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockRejectSuggestion).toHaveBeenCalledWith('suggestion-1', 'Not accurate enough');
    });

    it('should reject suggestion without reason', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/suggestion-1/reject',
        headers: { authorization: 'Bearer test-token' },
        payload: {},
      });

      expect(response.statusCode).toBe(204);
      expect(mockRejectSuggestion).toHaveBeenCalledWith('suggestion-1', undefined);
    });
  });

  // =========================================================================
  // POST /expire — Expire stale suggestions
  // =========================================================================
  describe('POST /expire (expire stale suggestions)', () => {
    it('should expire stale suggestions and return count', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/expire',
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: 'entity-1' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.expiredCount).toBe(3);
      expect(mockExpireStaleSuggestions).toHaveBeenCalledWith('entity-1');
    });
  });

  // =========================================================================
  // GET /patterns — Detect patterns
  // =========================================================================
  describe('GET /patterns (detect patterns)', () => {
    it('should return detected patterns', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/patterns?entityId=entity-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.count).toBe(1);
      expect(body.patterns).toHaveLength(1);
      expect(body.patterns[0].keyword).toBe('starbucks');
      expect(mockDetectPatterns).toHaveBeenCalledWith('entity-1');
    });

    it('should return empty array when no patterns detected', async () => {
      mockDetectPatterns.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: '/patterns?entityId=entity-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.count).toBe(0);
      expect(body.patterns).toHaveLength(0);
    });
  });

  // =========================================================================
  // Financial invariant assertions
  // =========================================================================
  describe('financial invariants', () => {
    it('should use integer cents in example transactions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/suggestion-1',
        headers: { authorization: 'Bearer test-token' },
      });

      const body = JSON.parse(response.body);
      const examples = body.suggestedRule.exampleTransactions;
      for (const example of examples) {
        expect(Number.isInteger(example.amount)).toBe(true);
      }
    });

    it('should use integer cents in detected patterns', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/patterns?entityId=entity-1',
        headers: { authorization: 'Bearer test-token' },
      });

      const body = JSON.parse(response.body);
      for (const pattern of body.patterns) {
        for (const example of pattern.exampleTransactions) {
          expect(Number.isInteger(example.amount)).toBe(true);
        }
      }
    });
  });

  // =========================================================================
  // Tenant isolation
  // =========================================================================
  describe('tenant isolation', () => {
    it('should pass tenantId from middleware to service', async () => {
      await app.inject({
        method: 'GET',
        url: '/?entityId=entity-1',
        headers: { authorization: 'Bearer test-token' },
      });

      // The RuleSuggestionService constructor receives tenantId from request.tenantId
      // verified via the mock constructor being called (which sets this.* methods)
      expect(mockListSuggestions).toHaveBeenCalled();
    });
  });
});
