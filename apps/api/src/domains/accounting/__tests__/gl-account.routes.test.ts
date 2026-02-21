import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { glAccountRoutes } from '../routes/gl-account';
import { AccountingError } from '../errors';

// Mock middleware
vi.mock('../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
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

vi.mock('../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

vi.mock('../../../middleware/withPermission', () => ({
  withPermission: vi.fn(() => ({
    preHandler: async (request: any) => {
      request.userId = 'test-user-id';
      request.tenantId = 'tenant-abc-123';
      request.tenantRole = 'OWNER';
    },
  })),
}));

// Mock GLAccountService
const mockListAccounts = vi.fn();
const mockGetAccount = vi.fn();
const mockCreateAccount = vi.fn();
const mockUpdateAccount = vi.fn();
const mockDeactivateAccount = vi.fn();
const mockGetAccountTree = vi.fn();
const mockGetAccountBalances = vi.fn();

vi.mock('../services/gl-account.service', () => ({
  GLAccountService: function (this: any) {
    this.listAccounts = mockListAccounts;
    this.getAccount = mockGetAccount;
    this.createAccount = mockCreateAccount;
    this.updateAccount = mockUpdateAccount;
    this.deactivateAccount = mockDeactivateAccount;
    this.getAccountTree = mockGetAccountTree;
    this.getAccountBalances = mockGetAccountBalances;
  },
}));

// Mock seedDefaultCOA
const mockSeedDefaultCOA = vi.fn();
vi.mock('../services/coa-template', () => ({
  seedDefaultCOA: (...args: any[]) => mockSeedDefaultCOA(...args),
}));

const MOCK_ACCOUNT = {
  id: 'gl-acct-1',
  code: '1000',
  name: 'Cash',
  type: 'ASSET',
  normalBalance: 'DEBIT',
  entityId: 'entity-1',
  isActive: true,
  _count: { childAccounts: 0, journalLines: 0 },
};

describe('GLAccount Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockListAccounts.mockResolvedValue([MOCK_ACCOUNT]);
    mockGetAccount.mockResolvedValue(MOCK_ACCOUNT);
    mockCreateAccount.mockResolvedValue(MOCK_ACCOUNT);
    mockUpdateAccount.mockResolvedValue(MOCK_ACCOUNT);
    mockDeactivateAccount.mockResolvedValue({ ...MOCK_ACCOUNT, isActive: false });
    mockGetAccountBalances.mockResolvedValue([]);
    mockSeedDefaultCOA.mockResolvedValue({ seeded: true, accountCount: 30 });

    app = Fastify({ logger: false });
    await app.register(glAccountRoutes, { prefix: '/chart-of-accounts' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ============================================================================
  // GET /chart-of-accounts
  // ============================================================================

  describe('GET /chart-of-accounts', () => {
    it('should return 200 with accounts list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/chart-of-accounts',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveLength(1);
      expect(body[0].code).toBe('1000');
    });
  });

  // ============================================================================
  // GET /chart-of-accounts/:id
  // ============================================================================

  describe('GET /chart-of-accounts/:id', () => {
    it('should return 200 with account detail', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/chart-of-accounts/gl-acct-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().name).toBe('Cash');
    });

    it('should return 404 when not found', async () => {
      mockGetAccount.mockRejectedValue(
        new AccountingError('GL account not found', 'GL_ACCOUNT_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/chart-of-accounts/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('GL_ACCOUNT_NOT_FOUND');
    });
  });

  // ============================================================================
  // POST /chart-of-accounts
  // ============================================================================

  describe('POST /chart-of-accounts', () => {
    it('should return 201 on successful creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/chart-of-accounts',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: 'entity-1',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().code).toBe('1000');
    });

    it('should return 409 on duplicate code', async () => {
      mockCreateAccount.mockRejectedValue(
        new AccountingError("GL account code '1000' already exists", 'DUPLICATE_ACCOUNT_CODE', 409)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/chart-of-accounts',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: 'entity-1',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
        },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().error).toBe('DUPLICATE_ACCOUNT_CODE');
    });

    it('should return 403 on cross-entity parent reference', async () => {
      mockCreateAccount.mockRejectedValue(
        new AccountingError('Parent account belongs to different entity', 'CROSS_ENTITY_REFERENCE', 403)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/chart-of-accounts',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: 'entity-1',
          code: '1010',
          name: 'Petty Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          parentAccountId: 'parent-other-entity',
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error).toBe('CROSS_ENTITY_REFERENCE');
    });
  });

  // ============================================================================
  // PATCH /chart-of-accounts/:id
  // ============================================================================

  describe('PATCH /chart-of-accounts/:id', () => {
    it('should return 200 on successful update', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/chart-of-accounts/gl-acct-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Updated Cash' },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  // ============================================================================
  // DELETE /chart-of-accounts/:id
  // ============================================================================

  describe('DELETE /chart-of-accounts/:id', () => {
    it('should return 200 on successful deactivation', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/chart-of-accounts/gl-acct-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().isActive).toBe(false);
    });

    it('should return 400 when account has draft journal lines', async () => {
      mockDeactivateAccount.mockRejectedValue(
        new AccountingError('Cannot deactivate account with unposted entries', 'GL_ACCOUNT_INACTIVE', 400)
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/chart-of-accounts/gl-acct-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================================================
  // POST /chart-of-accounts/seed
  // ============================================================================

  describe('POST /chart-of-accounts/seed', () => {
    it('should return 201 when COA seeded', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/chart-of-accounts/seed',
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: 'entity-1' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().seeded).toBe(true);
      expect(response.json().accountCount).toBe(30);
    });

    it('should return 200 when COA already exists (skipped)', async () => {
      mockSeedDefaultCOA.mockResolvedValue({ seeded: false, accountCount: 30 });

      const response = await app.inject({
        method: 'POST',
        url: '/chart-of-accounts/seed',
        headers: { authorization: 'Bearer test-token' },
        payload: { entityId: 'entity-1' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().seeded).toBe(false);
    });
  });

  // ============================================================================
  // GET /chart-of-accounts/balances
  // ============================================================================

  describe('GET /chart-of-accounts/balances', () => {
    it('should return 200 with account balances', async () => {
      mockGetAccountBalances.mockResolvedValue([
        { id: 'gl-1', code: '1000', name: 'Cash', balance: 1300 },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/chart-of-accounts/balances',
        headers: { authorization: 'Bearer test-token' },
        query: { entityId: 'entity-1' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveLength(1);
      expect(response.json()[0].balance).toBe(1300);
    });
  });
});
