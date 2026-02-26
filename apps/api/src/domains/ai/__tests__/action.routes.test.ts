import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { aiRoutes } from '../routes';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw { statusCode: 401, message: 'Unauthorized' };
    }
    request.userId = 'test-user-id';
  }),
}));

vi.mock('../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
}));

vi.mock('../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async () => {},
  })),
}));

vi.mock('../../../middleware/validation', () => ({
  validateBody: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateQuery: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/rate-limit', () => ({
  aiChatRateLimitConfig: vi.fn(() => ({})),
  aiRateLimitConfig: vi.fn(() => ({})),
}));

// Mock AI service (needed for parent route registration)
vi.mock('../services/ai.service', () => ({
  aiService: { chat: vi.fn() },
}));

// Mock CategorizationService (needed for parent route registration)
vi.mock('../services/categorization.service', () => ({
  CategorizationService: function (this: Record<string, unknown>) {
    this.categorize = vi.fn();
    this.categorizeBatch = vi.fn();
  },
}));

// Mock JESuggestionService (needed for parent route registration)
vi.mock('../services/je-suggestion.service', () => ({
  JESuggestionService: function (this: Record<string, unknown>) {
    this.suggestBatch = vi.fn();
    this.createDraftJEs = vi.fn();
  },
}));

// Mock AIActionService
const mockListActions = vi.fn();
const mockGetStats = vi.fn();
const mockApproveAction = vi.fn();
const mockRejectAction = vi.fn();
const mockBatchApprove = vi.fn();
const mockBatchReject = vi.fn();

vi.mock('../services/ai-action.service', () => ({
  AIActionService: function (this: Record<string, unknown>) {
    this.listActions = mockListActions;
    this.getStats = mockGetStats;
    this.approveAction = mockApproveAction;
    this.rejectAction = mockRejectAction;
    this.batchApprove = mockBatchApprove;
    this.batchReject = mockBatchReject;
  },
}));

// Mock Prisma
const mockEntityFindFirst = vi.fn();
const mockAIActionFindFirst = vi.fn();
vi.mock('@akount/db', () => ({
  prisma: {
    entity: { findFirst: (...args: unknown[]) => mockEntityFindFirst(...args) },
    transaction: { findMany: vi.fn().mockResolvedValue([]) },
    aIAction: { findFirst: (...args: unknown[]) => mockAIActionFindFirst(...args) },
  },
}));

vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-abc-123';
const ENTITY_ID = 'cltest00000000000000entity';
const ACTION_ID = 'cltest00000000000000action';

const MOCK_ENTITY = { id: ENTITY_ID };

const MOCK_ACTION = {
  id: ACTION_ID,
  entityId: ENTITY_ID,
  type: 'JE_DRAFT',
  title: 'AI-drafted JE: Coffee at Starbucks',
  description: null,
  status: 'PENDING',
  confidence: 92,
  priority: 'MEDIUM',
  payload: { journalEntryId: 'je-001' },
  aiProvider: 'claude',
  aiModel: null,
  metadata: null,
  reviewedAt: null,
  reviewedBy: null,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ---------------------------------------------------------------------------
// App setup
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
  mockEntityFindFirst.mockResolvedValue(MOCK_ENTITY);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AI Action Routes', () => {
  // -------------------------------------------------------------------------
  // GET /api/ai/actions — List Actions
  // -------------------------------------------------------------------------
  describe('GET /api/ai/actions', () => {
    it('should list actions with pagination', async () => {
      mockListActions.mockResolvedValue({
        actions: [MOCK_ACTION],
        total: 1,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/actions?entityId=${ENTITY_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.actions).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it('should enforce entity tenant isolation (IDOR)', async () => {
      mockEntityFindFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/actions?entityId=${ENTITY_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Entity not found or access denied');
    });

    it('should pass status and type filters to service', async () => {
      mockListActions.mockResolvedValue({ actions: [], total: 0 });

      await app.inject({
        method: 'GET',
        url: `/api/ai/actions?entityId=${ENTITY_ID}&status=PENDING&type=JE_DRAFT`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListActions).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: ENTITY_ID,
          tenantId: TENANT_ID,
          status: 'PENDING',
          type: 'JE_DRAFT',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/ai/actions/stats — Dashboard Stats
  // -------------------------------------------------------------------------
  describe('GET /api/ai/actions/stats', () => {
    it('should return aggregated stats', async () => {
      mockGetStats.mockResolvedValue({
        pending: 5,
        approved: 20,
        rejected: 3,
        expired: 1,
        pendingByType: { JE_DRAFT: 3, CATEGORIZATION: 2 },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/actions/stats?entityId=${ENTITY_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.pending).toBe(5);
      expect(body.pendingByType.JE_DRAFT).toBe(3);
    });

    it('should enforce entity IDOR on stats', async () => {
      mockEntityFindFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/actions/stats?entityId=${ENTITY_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/ai/actions/:actionId — Get Single Action
  // -------------------------------------------------------------------------
  describe('GET /api/ai/actions/:actionId', () => {
    it('should return a single action', async () => {
      mockAIActionFindFirst.mockResolvedValue(MOCK_ACTION);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/actions/${ACTION_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(ACTION_ID);
      expect(body.type).toBe('JE_DRAFT');
    });

    it('should return 404 for missing action', async () => {
      mockAIActionFindFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/ai/actions/${ACTION_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Action not found');
    });

    it('should enforce tenant isolation via entity relation', async () => {
      mockAIActionFindFirst.mockResolvedValue(null);

      await app.inject({
        method: 'GET',
        url: `/api/ai/actions/${ACTION_ID}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockAIActionFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: ACTION_ID,
            entity: { tenantId: TENANT_ID },
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/ai/actions/:actionId/approve — Approve Single
  // -------------------------------------------------------------------------
  describe('POST /api/ai/actions/:actionId/approve', () => {
    it('should approve a pending action', async () => {
      mockApproveAction.mockResolvedValue({ ...MOCK_ACTION, status: 'APPROVED' });

      const response = await app.inject({
        method: 'POST',
        url: `/api/ai/actions/${ACTION_ID}/approve`,
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().status).toBe('APPROVED');
      expect(mockApproveAction).toHaveBeenCalledWith(ACTION_ID, 'test-user-id');
    });

    it('should enforce entity IDOR on approve', async () => {
      mockEntityFindFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: `/api/ai/actions/${ACTION_ID}/approve`,
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Entity not found or access denied');
    });

    it('should return error for non-PENDING action', async () => {
      const { AIError } = await import('../errors');
      mockApproveAction.mockRejectedValue(
        new AIError('Cannot approve action in APPROVED status', 'ACTION_NOT_PENDING', 409)
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/ai/actions/${ACTION_ID}/approve`,
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().error).toBe('ACTION_NOT_PENDING');
    });

    it('should return 410 for expired action', async () => {
      const { AIError } = await import('../errors');
      mockApproveAction.mockRejectedValue(
        new AIError('Action has expired', 'ACTION_EXPIRED', 410)
      );

      const response = await app.inject({
        method: 'POST',
        url: `/api/ai/actions/${ACTION_ID}/approve`,
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(410);
      expect(response.json().error).toBe('ACTION_EXPIRED');
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/ai/actions/:actionId/reject — Reject Single
  // -------------------------------------------------------------------------
  describe('POST /api/ai/actions/:actionId/reject', () => {
    it('should reject a pending action', async () => {
      mockRejectAction.mockResolvedValue({ ...MOCK_ACTION, status: 'REJECTED' });

      const response = await app.inject({
        method: 'POST',
        url: `/api/ai/actions/${ACTION_ID}/reject`,
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().status).toBe('REJECTED');
    });

    it('should enforce entity IDOR on reject', async () => {
      mockEntityFindFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: `/api/ai/actions/${ACTION_ID}/reject`,
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/ai/actions/batch/approve — Batch Approve
  // -------------------------------------------------------------------------
  describe('POST /api/ai/actions/batch/approve', () => {
    it('should batch approve actions', async () => {
      mockBatchApprove.mockResolvedValue({
        succeeded: [ACTION_ID],
        failed: [],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/actions/batch/approve',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: ENTITY_ID,
          actionIds: [ACTION_ID],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.succeeded).toEqual([ACTION_ID]);
      expect(body.failed).toHaveLength(0);
    });

    it('should report partial failures', async () => {
      const failedId = 'cltest00000000000000fail01';
      mockBatchApprove.mockResolvedValue({
        succeeded: [ACTION_ID],
        failed: [{ id: failedId, reason: 'Not found or not pending' }],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/actions/batch/approve',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: ENTITY_ID,
          actionIds: [ACTION_ID, failedId],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.succeeded).toHaveLength(1);
      expect(body.failed).toHaveLength(1);
      expect(body.failed[0].id).toBe(failedId);
    });

    it('should enforce entity IDOR on batch approve', async () => {
      mockEntityFindFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/actions/batch/approve',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: ENTITY_ID,
          actionIds: [ACTION_ID],
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/ai/actions/batch/reject — Batch Reject
  // -------------------------------------------------------------------------
  describe('POST /api/ai/actions/batch/reject', () => {
    it('should batch reject actions', async () => {
      mockBatchReject.mockResolvedValue({
        succeeded: [ACTION_ID],
        failed: [],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/actions/batch/reject',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: ENTITY_ID,
          actionIds: [ACTION_ID],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.succeeded).toEqual([ACTION_ID]);
    });

    it('should enforce entity IDOR on batch reject', async () => {
      mockEntityFindFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/actions/batch/reject',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: ENTITY_ID,
          actionIds: [ACTION_ID],
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
