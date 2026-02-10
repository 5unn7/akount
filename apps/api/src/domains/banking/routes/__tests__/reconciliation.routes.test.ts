import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { reconciliationRoutes } from '../reconciliation';

// Mock auth middleware
vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    request.userId = 'test-user-id';
  }),
}));

// Mock tenant middleware
vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
}));

// Mock RBAC middleware to always allow
vi.mock('../../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

// Mock validation middleware to always pass
vi.mock('../../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

// Mock ReconciliationService
const mockSuggestMatches = vi.fn();
const mockCreateMatch = vi.fn();
const mockUnmatch = vi.fn();
const mockGetReconciliationStatus = vi.fn();

vi.mock('../../services/reconciliation.service', () => ({
  ReconciliationService: function () {
    this.suggestMatches = mockSuggestMatches;
    this.createMatch = mockCreateMatch;
    this.unmatch = mockUnmatch;
    this.getReconciliationStatus = mockGetReconciliationStatus;
  },
}));

const MOCK_SUGGESTION = {
  transactionId: 'txn-1',
  confidence: 0.95,
  reasons: ['Exact amount match', 'Same date', 'Description near-identical'],
  transaction: {
    id: 'txn-1',
    date: new Date('2024-01-15T10:00:00Z'),
    description: 'Coffee shop',
    amount: 550,
    currency: 'CAD',
    account: { id: 'acc-1', name: 'Checking' },
  },
};

const MOCK_MATCH = {
  id: 'match-1',
  bankFeedTransactionId: 'bft-1',
  transactionId: 'txn-1',
  journalEntryId: null,
  status: 'MATCHED',
  confidence: 1.0,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  bankFeedTransaction: {
    id: 'bft-1',
    description: 'STARBUCKS #1234',
    amount: 550,
  },
  transaction: {
    id: 'txn-1',
    description: 'Coffee shop',
    amount: 550,
    account: { id: 'acc-1', name: 'Checking' },
  },
};

const MOCK_STATUS = {
  accountId: 'acc-1',
  totalBankFeed: 100,
  matched: 60,
  unmatched: 40,
  suggested: 10,
  reconciliationPercent: 60,
};

const AUTH_HEADER = { authorization: 'Bearer test-token' };

describe('Reconciliation Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSuggestMatches.mockResolvedValue([MOCK_SUGGESTION]);
    mockCreateMatch.mockResolvedValue(MOCK_MATCH);
    mockUnmatch.mockResolvedValue(undefined);
    mockGetReconciliationStatus.mockResolvedValue(MOCK_STATUS);

    app = Fastify({ logger: false });
    await app.register(reconciliationRoutes, { prefix: '/reconciliation' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ─── GET /:bankFeedTransactionId/suggestions ────────────────────────────

  describe('GET /:bankFeedTransactionId/suggestions', () => {
    it('should return 200 with suggestions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reconciliation/bft-1/suggestions',
        headers: AUTH_HEADER,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.suggestions).toHaveLength(1);
      expect(body.suggestions[0].transactionId).toBe('txn-1');
      expect(body.suggestions[0].confidence).toBe(0.95);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reconciliation/bft-1/suggestions',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when bank feed transaction not found', async () => {
      mockSuggestMatches.mockRejectedValueOnce(
        new Error('Bank feed transaction not found')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reconciliation/bft-nonexistent/suggestions',
        headers: AUTH_HEADER,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 409 when bank feed transaction is already matched', async () => {
      mockSuggestMatches.mockRejectedValueOnce(
        new Error('Bank feed transaction is already matched')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reconciliation/bft-1/suggestions',
        headers: AUTH_HEADER,
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return empty suggestions when no matches found', async () => {
      mockSuggestMatches.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: '/reconciliation/bft-1/suggestions',
        headers: AUTH_HEADER,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.suggestions).toEqual([]);
    });
  });

  // ─── POST /matches ──────────────────────────────────────────────────────

  describe('POST /matches', () => {
    it('should return 201 with created match', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/reconciliation/matches',
        headers: AUTH_HEADER,
        payload: {
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-1',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('match-1');
      expect(body.status).toBe('MATCHED');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/reconciliation/matches',
        payload: {
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-1',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when bank feed transaction not found', async () => {
      mockCreateMatch.mockRejectedValueOnce(
        new Error('Bank feed transaction not found')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/reconciliation/matches',
        headers: AUTH_HEADER,
        payload: {
          bankFeedTransactionId: 'bft-nonexistent',
          transactionId: 'txn-1',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when posted transaction not found', async () => {
      mockCreateMatch.mockRejectedValueOnce(new Error('Transaction not found'));

      const response = await app.inject({
        method: 'POST',
        url: '/reconciliation/matches',
        headers: AUTH_HEADER,
        payload: {
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-nonexistent',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 409 when already matched', async () => {
      mockCreateMatch.mockRejectedValueOnce(
        new Error('Bank feed transaction is already matched')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/reconciliation/matches',
        headers: AUTH_HEADER,
        payload: {
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-1',
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should call service with correct input', async () => {
      await app.inject({
        method: 'POST',
        url: '/reconciliation/matches',
        headers: AUTH_HEADER,
        payload: {
          bankFeedTransactionId: 'bft-1',
          transactionId: 'txn-1',
        },
      });

      expect(mockCreateMatch).toHaveBeenCalledWith({
        bankFeedTransactionId: 'bft-1',
        transactionId: 'txn-1',
      });
    });
  });

  // ─── DELETE /matches/:matchId ───────────────────────────────────────────

  describe('DELETE /matches/:matchId', () => {
    it('should return 204 on successful unmatch', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/reconciliation/matches/match-1',
        headers: AUTH_HEADER,
      });

      expect(response.statusCode).toBe(204);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/reconciliation/matches/match-1',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when match not found', async () => {
      mockUnmatch.mockRejectedValueOnce(new Error('Match not found'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/reconciliation/matches/match-nonexistent',
        headers: AUTH_HEADER,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should call service with correct matchId', async () => {
      await app.inject({
        method: 'DELETE',
        url: '/reconciliation/matches/match-1',
        headers: AUTH_HEADER,
      });

      expect(mockUnmatch).toHaveBeenCalledWith('match-1');
    });
  });

  // ─── GET /status/:accountId ─────────────────────────────────────────────

  describe('GET /status/:accountId', () => {
    it('should return 200 with reconciliation status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reconciliation/status/acc-1',
        headers: AUTH_HEADER,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.accountId).toBe('acc-1');
      expect(body.totalBankFeed).toBe(100);
      expect(body.matched).toBe(60);
      expect(body.unmatched).toBe(40);
      expect(body.reconciliationPercent).toBe(60);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/reconciliation/status/acc-1',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when account not found', async () => {
      mockGetReconciliationStatus.mockRejectedValueOnce(
        new Error('Account not found')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/reconciliation/status/acc-nonexistent',
        headers: AUTH_HEADER,
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
