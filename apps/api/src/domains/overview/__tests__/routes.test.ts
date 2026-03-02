import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { overviewRoutes } from '../routes';

// Mock auth middleware to pass through and set userId
vi.mock('../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing Authorization header' });
    }
    request.userId = 'test-user-id';
  }),
}));

// Mock tenant middleware to pass through and set tenantId/role
vi.mock('../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request) => {
    request.tenantId = 'tenant-abc-123';
    request.tenantRole = 'OWNER';
  }),
  requireTenantId: vi.fn((request) => request.tenantId || 'tenant-abc-123'),
}));

// Mock withPermission to be a no-op (pass through)
vi.mock('../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async () => {},
  })),
}));

// Mock validation middleware to pass through
vi.mock('../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async (request: { query: unknown }) => {
    // Pass through - query is already set
  }),
}));

// Mock DashboardService - use function constructor so `new` works
const mockGetMetrics = vi.fn();
vi.mock('../services/dashboard.service', () => ({
  DashboardService: function (this: any) {
    this.getMetrics = mockGetMetrics;
  },
}));

const MOCK_METRICS = {
  netWorth: { amount: 500000, currency: 'USD' },
  cashPosition: { cash: 300000, debt: 100000, net: 200000, currency: 'USD' },
  accounts: { total: 3, active: 3, byType: { BANK: 2, CREDIT_CARD: 1 } },
};

describe('Overview Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetMetrics.mockResolvedValue(MOCK_METRICS);

    app = Fastify({ logger: false });
    await app.register(overviewRoutes, { prefix: '/api/overview' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/overview/dashboard', () => {
    it('should return 401 without Authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/overview/dashboard',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 200 with valid auth and mocked metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/overview/dashboard',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.netWorth.amount).toBe(500000);
      expect(body.netWorth.currency).toBe('USD');
      expect(body.cashPosition.cash).toBe(300000);
      expect(body.accounts.total).toBe(3);
    });

    it('should forward entityId query param to service', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/overview/dashboard?entityId=clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      // DashboardService is called with the entityId from query
      expect(mockGetMetrics).toHaveBeenCalled();
    });

    it('should forward currency query param to service', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/overview/dashboard?currency=CAD',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockGetMetrics).toHaveBeenCalled();
    });

    it('should return 500 when service throws', async () => {
      mockGetMetrics.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/overview/dashboard',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.error).toBe('Internal Server Error');
    });
  });
});
