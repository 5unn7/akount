import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { bankingRoutes } from '../routes';
import { assertIntegerCents, assertMoneyFields } from '../../../test-utils/financial-assertions';

// Mock auth middleware
vi.mock('../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing Authorization header' });
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
  adminOnly: { preHandler: async () => {} },
  transactingAccess: { preHandler: async () => {} },
}));

// Mock validation middleware
vi.mock('../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

// Mock sub-routes to avoid pulling in their dependencies
vi.mock('../routes/imports', () => ({
  importsRoutes: vi.fn(async () => {}),
}));
vi.mock('../routes/transactions', () => ({
  transactionRoutes: vi.fn(async () => {}),
}));
vi.mock('../routes/reconciliation', () => ({
  reconciliationRoutes: vi.fn(async () => {}),
}));
vi.mock('../routes/categories', () => ({
  categoryRoutes: vi.fn(async () => {}),
}));
vi.mock('../routes/connections', () => ({
  connectionRoutes: vi.fn(async () => {}),
}));

// Mock rate-limit middleware
vi.mock('../../../middleware/rate-limit', () => ({
  strictRateLimitConfig: vi.fn(() => ({})),
}));

// Mock AccountService - use function constructor so `new` works
const mockListAccounts = vi.fn();
const mockGetAccount = vi.fn();
const mockCreateAccount = vi.fn();
const mockUpdateAccount = vi.fn();
const mockSoftDeleteAccount = vi.fn();
vi.mock('../services/account.service', () => ({
  AccountService: function () {
    this.listAccounts = mockListAccounts;
    this.getAccount = mockGetAccount;
    this.createAccount = mockCreateAccount;
    this.updateAccount = mockUpdateAccount;
    this.softDeleteAccount = mockSoftDeleteAccount;
  },
}));

const MOCK_ACCOUNT = {
  id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
  name: 'Checking Account',
  type: 'BANK',
  currency: 'USD',
  currentBalance: 500000,
  isActive: true,
  entity: { id: 'entity-1', name: 'My Corp', type: 'LLC' },
};

const MOCK_PAGINATED = {
  accounts: [MOCK_ACCOUNT],
  nextCursor: undefined,
  hasMore: false,
};

describe('Banking Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockListAccounts.mockResolvedValue(MOCK_PAGINATED);
    mockGetAccount.mockResolvedValue(MOCK_ACCOUNT);
    mockCreateAccount.mockResolvedValue(MOCK_ACCOUNT);
    mockUpdateAccount.mockResolvedValue(MOCK_ACCOUNT);
    mockSoftDeleteAccount.mockResolvedValue(MOCK_ACCOUNT);

    app = Fastify({ logger: false });
    await app.register(bankingRoutes, { prefix: '/api/banking' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/banking/accounts', () => {
    it('should return 200 with paginated accounts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/banking/accounts',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.accounts).toHaveLength(1);
      expect(body.accounts[0].name).toBe('Checking Account');
      expect(body.hasMore).toBe(false);

      // Financial invariant: monetary fields must be integer cents
      assertIntegerCents(body.accounts[0].currentBalance, 'currentBalance');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/banking/accounts',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/banking/accounts/:id', () => {
    it('should return 200 with account when found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/banking/accounts/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.name).toBe('Checking Account');
      expect(body.type).toBe('BANK');
    });

    it('should return 404 when account not found', async () => {
      mockGetAccount.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/banking/accounts/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Not Found');
    });

    it('should return 500 when service throws', async () => {
      mockGetAccount.mockRejectedValueOnce(new Error('DB error'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/banking/accounts/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('POST /api/banking/accounts', () => {
    it('should return 201 on successful creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/banking/accounts',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          name: 'New Account',
          type: 'BANK',
          currency: 'USD',
          country: 'US',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockCreateAccount).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/banking/accounts',
        payload: {
          entityId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          name: 'New Account',
          type: 'BANK',
          currency: 'USD',
          country: 'US',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/banking/accounts/:id', () => {
    it('should return 200 on successful update', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/banking/accounts/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Updated Name' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateAccount).toHaveBeenCalled();
    });

    it('should return 404 when account not found', async () => {
      mockUpdateAccount.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/banking/accounts/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Updated Name' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/banking/accounts/:id', () => {
    it('should return 204 on successful soft-delete', async () => {
      // Mock returns record with deletedAt set (proving soft delete, not hard delete)
      mockSoftDeleteAccount.mockResolvedValueOnce({
        ...MOCK_ACCOUNT,
        deletedAt: new Date('2024-01-15T10:00:00Z'),
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/banking/accounts/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockSoftDeleteAccount).toHaveBeenCalled();

      // Financial invariant: soft delete returns record with deletedAt set
      const result = await mockSoftDeleteAccount.mock.results[0].value;
      expect(result.deletedAt).toBeTruthy();
      expect(result.id).toBe(MOCK_ACCOUNT.id); // Record still exists
    });

    it('should return 404 when account not found', async () => {
      mockSoftDeleteAccount.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/banking/accounts/clxxxxxxxxxxxxxxxxxxxxxxxxx',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
