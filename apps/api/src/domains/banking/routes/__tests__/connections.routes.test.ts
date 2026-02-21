import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { connectionRoutes } from '../connections';

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
  requirePermission: vi.fn(() => async () => {}),
  requireRole: vi.fn(() => async () => {}),
}));

// Mock validation middleware to pass through
vi.mock('../../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

// Mock rate limiting
vi.mock('../../../../middleware/rate-limit', () => ({
  strictRateLimitConfig: vi.fn(() => ({ max: 100, timeWindow: '1 minute' })),
}));

// Mock FlinksService
const mockProcessConnection = vi.fn();
const mockListConnections = vi.fn();
const mockRefreshConnection = vi.fn();
const mockDisconnectConnection = vi.fn();

vi.mock('../../services/flinks.service', () => ({
  FlinksService: function () {
    this.processConnection = mockProcessConnection;
    this.listConnections = mockListConnections;
    this.refreshConnection = mockRefreshConnection;
    this.disconnectConnection = mockDisconnectConnection;
  },
  FlinksError: class FlinksError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode: number) {
      super(message);
      this.name = 'FlinksError';
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

const TENANT_ID = 'tenant-abc-123';
const ENTITY_ID = 'clxxxxxxxxxxxxxxxxxxxxxx1';
const LOGIN_ID = '550e8400-e29b-41d4-a716-446655440000';

const MOCK_CONNECTION = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxx2',
  entityId: ENTITY_ID,
  provider: 'FLINKS',
  institutionId: 'Demo Bank',
  institutionName: 'Demo Bank',
  status: 'ACTIVE',
  lastSyncAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  accounts: [
    { id: 'acc-1', name: 'Chequing', currentBalance: 543210, currency: 'CAD' },
  ],
};

describe('Connection Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    await app.register(connectionRoutes);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ─── POST /connections ─────────────────────────────────────────────

  describe('POST / (create connection)', () => {
    it('should create a new connection and return 201', async () => {
      mockProcessConnection.mockResolvedValueOnce({
        connection: MOCK_CONNECTION,
        accountCount: 1,
        transactionCount: 5,
        isExisting: false,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: { loginId: LOGIN_ID, entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.accountCount).toBe(1);
      expect(body.transactionCount).toBe(5);
      expect(body.isExisting).toBe(false);
    });

    it('should return 200 for existing connection (idempotent)', async () => {
      mockProcessConnection.mockResolvedValueOnce({
        connection: MOCK_CONNECTION,
        accountCount: 1,
        transactionCount: 5,
        isExisting: true,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: { loginId: LOGIN_ID, entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.isExisting).toBe(true);
    });

    it('should NOT expose providerItemId in response', async () => {
      mockProcessConnection.mockResolvedValueOnce({
        connection: { ...MOCK_CONNECTION, providerItemId: LOGIN_ID },
        accountCount: 1,
        transactionCount: 5,
        isExisting: false,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: { loginId: LOGIN_ID, entityId: ENTITY_ID },
      });

      const body = JSON.parse(response.body);
      expect(body.providerItemId).toBeUndefined();
    });

    it('should return FlinksError status code on service error', async () => {
      const { FlinksError } = await import('../../services/flinks.service');
      mockProcessConnection.mockRejectedValueOnce(
        new FlinksError('Entity not found', 'ENTITY_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: { loginId: LOGIN_ID, entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('ENTITY_NOT_FOUND');
    });

    it('should return 500 on unexpected error', async () => {
      mockProcessConnection.mockRejectedValueOnce(new Error('Database down'));

      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: { loginId: LOGIN_ID, entityId: ENTITY_ID },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  // ─── GET /connections ──────────────────────────────────────────────

  describe('GET / (list connections)', () => {
    it('should list connections for entity', async () => {
      const connections = [
        { ...MOCK_CONNECTION },
        { ...MOCK_CONNECTION, id: 'conn-2', institutionName: 'TD Bank' },
      ];
      mockListConnections.mockResolvedValueOnce(connections);

      const response = await app.inject({
        method: 'GET',
        url: `/?entityId=${ENTITY_ID}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.length).toBe(2);
    });

    it('should strip providerItemId from listed connections', async () => {
      mockListConnections.mockResolvedValueOnce([
        { ...MOCK_CONNECTION, providerItemId: LOGIN_ID },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: `/?entityId=${ENTITY_ID}`,
      });

      const body = JSON.parse(response.body);
      expect(body[0].providerItemId).toBeUndefined();
    });
  });

  // ─── POST /connections/:id/refresh ─────────────────────────────────

  describe('POST /:id/refresh', () => {
    it('should refresh a connection', async () => {
      mockRefreshConnection.mockResolvedValueOnce({
        connection: MOCK_CONNECTION,
        accountCount: 1,
        newTransactions: 0,
      });

      const response = await app.inject({
        method: 'POST',
        url: `/${MOCK_CONNECTION.id}/refresh`,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return 404 for non-existent connection', async () => {
      mockRefreshConnection.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'POST',
        url: `/${MOCK_CONNECTION.id}/refresh`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 429 when rate limited', async () => {
      const { FlinksError } = await import('../../services/flinks.service');
      mockRefreshConnection.mockRejectedValueOnce(
        new FlinksError('Connection was refreshed less than an hour ago', 'RATE_LIMIT_EXCEEDED', 429)
      );

      const response = await app.inject({
        method: 'POST',
        url: `/${MOCK_CONNECTION.id}/refresh`,
      });

      expect(response.statusCode).toBe(429);
    });
  });

  // ─── DELETE /connections/:id ────────────────────────────────────────

  describe('DELETE /:id (disconnect)', () => {
    it('should disconnect and return 204', async () => {
      mockDisconnectConnection.mockResolvedValueOnce({
        ...MOCK_CONNECTION,
        status: 'DISCONNECTED',
        deletedAt: new Date().toISOString(),
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/${MOCK_CONNECTION.id}`,
      });

      expect(response.statusCode).toBe(204);
    });

    it('should return 404 for non-existent connection', async () => {
      mockDisconnectConnection.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'DELETE',
        url: `/${MOCK_CONNECTION.id}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
