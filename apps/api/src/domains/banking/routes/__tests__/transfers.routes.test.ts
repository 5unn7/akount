import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { transferRoutes } from '../transfers';
import { AccountingError } from '../../../accounting/errors';

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

// Mock RBAC middleware
vi.mock('../../../../middleware/rbac', () => ({
  withRolePermission: vi.fn(() => async () => {}),
}));

// Mock validation middleware
vi.mock('../../../../middleware/validation', () => ({
  validateQuery: vi.fn(() => async () => {}),
  validateParams: vi.fn(() => async () => {}),
  validateBody: vi.fn(() => async () => {}),
}));

// Mock TransferService
const mockCreateTransfer = vi.fn();
const mockListTransfers = vi.fn();
const mockGetTransfer = vi.fn();

vi.mock('../../services/transfer.service', () => ({
  TransferService: function (this: any) {
    this.createTransfer = mockCreateTransfer;
    this.listTransfers = mockListTransfers;
    this.getTransfer = mockGetTransfer;
  },
}));

const MOCK_TRANSFER_RESULT = {
  entry1Id: 'je-1',
  entry2Id: 'je-2',
  fromAccount: { id: 'from-acc', name: 'Checking' },
  toAccount: { id: 'to-acc', name: 'Savings' },
  amount: 50000,
  currency: 'CAD',
};

const MOCK_TRANSFER = {
  id: 'je-1',
  date: '2024-01-15T10:00:00Z',
  memo: 'Monthly savings',
  sourceDocument: {
    fromAccountId: 'from-acc',
    toAccountId: 'to-acc',
  },
  linkedEntryId: 'je-2',
  amount: 50000,
  currency: 'CAD',
  createdAt: '2024-01-15T10:00:00Z',
};

describe('Transfer Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreateTransfer.mockResolvedValue(MOCK_TRANSFER_RESULT);
    mockListTransfers.mockResolvedValue({
      transfers: [MOCK_TRANSFER],
      hasMore: false,
      nextCursor: undefined,
    });
    mockGetTransfer.mockResolvedValue({
      id: 'je-1',
      entityId: 'entity-1',
      date: new Date('2024-01-15'),
      memo: 'Transfer',
      linkedEntryId: 'je-2',
      journalLines: [],
      linkedEntry: { id: 'je-2' },
    });

    app = Fastify({ logger: false });
    await app.register(transferRoutes, { prefix: '/transfers' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /transfers', () => {
    it('should create transfer and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transfers',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          fromAccountId: 'from-acc',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'CAD',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.entry1Id).toBe('je-1');
      expect(body.entry2Id).toBe('je-2');
      expect(mockCreateTransfer).toHaveBeenCalledWith({
        fromAccountId: 'from-acc',
        toAccountId: 'to-acc',
        amount: 50000,
        currency: 'CAD',
      });
    });

    it('should return 401 without auth token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transfers',
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when account not found', async () => {
      mockCreateTransfer.mockRejectedValueOnce(
        new AccountingError('From account not found', 'ACCOUNT_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/transfers',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          fromAccountId: 'invalid',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'CAD',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('ACCOUNT_NOT_FOUND');
    });

    it('should return 400 for insufficient balance', async () => {
      mockCreateTransfer.mockRejectedValueOnce(
        new AccountingError(
          'Insufficient balance: account has 100 cents, transfer requires 50000 cents',
          'INSUFFICIENT_BALANCE',
          400
        )
      );

      const response = await app.inject({
        method: 'POST',
        url: '/transfers',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          fromAccountId: 'from-acc',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'CAD',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('INSUFFICIENT_BALANCE');
    });

    it('should return 403 for cross-entity transfer', async () => {
      mockCreateTransfer.mockRejectedValueOnce(
        new AccountingError(
          'Cannot transfer between accounts from different entities',
          'CROSS_ENTITY_TRANSFER',
          403
        )
      );

      const response = await app.inject({
        method: 'POST',
        url: '/transfers',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          fromAccountId: 'acc-1',
          toAccountId: 'acc-2',
          amount: 50000,
          currency: 'CAD',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('CROSS_ENTITY_TRANSFER');
    });

    it('should return 400 when GL account not linked', async () => {
      mockCreateTransfer.mockRejectedValueOnce(
        new AccountingError(
          'Account "Checking" is not linked to a GL account — link it first',
          'GL_ACCOUNT_NOT_LINKED',
          400
        )
      );

      const response = await app.inject({
        method: 'POST',
        url: '/transfers',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          fromAccountId: 'from-acc',
          toAccountId: 'to-acc',
          amount: 50000,
          currency: 'CAD',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('GL_ACCOUNT_NOT_LINKED');
    });
  });

  describe('GET /transfers', () => {
    it('should list transfers and return 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transfers?entityId=entity-1&limit=50',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.transfers).toHaveLength(1);
      expect(body.transfers[0].id).toBe('je-1');
      expect(mockListTransfers).toHaveBeenCalledWith({
        entityId: 'entity-1',
        limit: '50', // Zod coerces query param to string
      });
    });

    it('should return 404 when entity not found', async () => {
      mockListTransfers.mockRejectedValueOnce(
        new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/transfers?entityId=invalid&limit=50',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('ENTITY_NOT_FOUND');
    });
  });

  describe('GET /transfers/:id', () => {
    it('should get single transfer and return 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transfers/je-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('je-1');
      expect(body.linkedEntry).toBeDefined();
      expect(mockGetTransfer).toHaveBeenCalledWith('je-1');
    });

    it('should return 404 when transfer not found', async () => {
      mockGetTransfer.mockRejectedValueOnce(
        new AccountingError('Transfer not found', 'TRANSFER_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/transfers/invalid',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('TRANSFER_NOT_FOUND');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transfers/je-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
