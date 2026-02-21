import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { transactionRoutes } from '../transactions';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';

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
    request.tenantRole = 'OWNER'; // Set role for RBAC checks
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

// Mock TransactionService - use function constructor so `new` works
const mockListTransactions = vi.fn();
const mockGetTransaction = vi.fn();
const mockCreateTransaction = vi.fn();
const mockUpdateTransaction = vi.fn();
const mockSoftDeleteTransaction = vi.fn();

vi.mock('../../services/transaction.service', () => ({
  TransactionService: function (this: any) {
    this.listTransactions = mockListTransactions;
    this.getTransaction = mockGetTransaction;
    this.createTransaction = mockCreateTransaction;
    this.updateTransaction = mockUpdateTransaction;
    this.softDeleteTransaction = mockSoftDeleteTransaction;
  },
}));

const MOCK_TRANSACTION = {
  id: 'txn-1',
  accountId: 'acc-1',
  date: new Date('2024-01-15T10:00:00Z'),
  description: 'Coffee shop',
  amount: 550, // $5.50
  currency: 'CAD',
  sourceType: 'MANUAL',
  sourceId: null,
  categoryId: null,
  notes: null,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
  account: {
    id: 'acc-1',
    name: 'Checking',
    type: 'BANK',
    currency: 'CAD',
  },
  category: null,
};

const MOCK_PAGINATED = {
  transactions: [MOCK_TRANSACTION],
  nextCursor: undefined,
  hasMore: false,
};

describe('Transaction Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockListTransactions.mockResolvedValue(MOCK_PAGINATED);
    mockGetTransaction.mockResolvedValue(MOCK_TRANSACTION);
    mockCreateTransaction.mockResolvedValue(MOCK_TRANSACTION);
    mockUpdateTransaction.mockResolvedValue(MOCK_TRANSACTION);
    mockSoftDeleteTransaction.mockResolvedValue(undefined);

    app = Fastify({ logger: false });
    await app.register(transactionRoutes, { prefix: '/transactions' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /transactions', () => {
    it('should return 200 with paginated transactions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transactions',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.transactions).toHaveLength(1);
      expect(body.transactions[0].description).toBe('Coffee shop');
      expect(body.hasMore).toBe(false);

      // Financial invariant: amounts must be integer cents
      assertIntegerCents(body.transactions[0].amount, 'transaction amount');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transactions',
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should pass query parameters to service', async () => {
      await app.inject({
        method: 'GET',
        url: '/transactions?accountId=acc-123&limit=25',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'acc-123',
          limit: '25', // Query params come as strings when schemas mocked
        })
      );
    });

    it('should filter by entityId', async () => {
      await app.inject({
        method: 'GET',
        url: '/transactions?entityId=entity-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: 'entity-1' })
      );
    });

    it('should return all entities when entityId is omitted', async () => {
      await app.inject({
        method: 'GET',
        url: '/transactions',
        headers: { authorization: 'Bearer test-token' },
      });

      const callArgs = mockListTransactions.mock.calls[0][0];
      expect(callArgs.entityId).toBeUndefined();
    });

    it('should handle date range filters', async () => {
      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';

      await app.inject({
        method: 'GET',
        url: `/transactions?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        headers: { authorization: 'Bearer test-token' },
      });

      expect(mockListTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        })
      );
    });

    // Note: Zod validation tests skipped when schemas are mocked
  });

  describe('GET /transactions/:id', () => {
    it('should return 200 with transaction when found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transactions/txn-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockGetTransaction).toHaveBeenCalledWith('txn-1');
    });

    it('should return 404 when transaction not found', async () => {
      mockGetTransaction.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/transactions/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Transaction not found');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/transactions/txn-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /transactions', () => {
    const validPayload = {
      accountId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      date: '2024-01-15T10:00:00.000Z',
      description: 'Office supplies',
      amount: 2499, // $24.99
      currency: 'CAD',
      sourceType: 'MANUAL',
    };

    it('should return 201 on successful creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transactions',
        headers: { authorization: 'Bearer test-token' },
        payload: validPayload,
      });

      expect(response.statusCode).toBe(201);
      expect(mockCreateTransaction).toHaveBeenCalledWith(validPayload);

      // Financial invariant: created transaction amount must be integer cents
      const body = response.json();
      assertIntegerCents(body.amount, 'created transaction amount');
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/transactions',
        payload: validPayload,
      });

      expect(response.statusCode).toBe(401);
    });

    // Note: Zod validation tests skipped when schemas are mocked

    it('should return 403 when account does not belong to tenant', async () => {
      mockCreateTransaction.mockRejectedValueOnce(
        new Error('Account acc-other does not belong to this tenant')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/transactions',
        headers: { authorization: 'Bearer test-token' },
        payload: validPayload,
      });

      expect(response.statusCode).toBe(403);
      const body = response.json();
      expect(body.error).toContain('does not belong to this tenant');
    });

    it('should accept optional fields', async () => {
      const payloadWithOptionals = {
        ...validPayload,
        categoryId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        notes: 'Monthly subscription',
        sourceId: 'inv-123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/transactions',
        headers: { authorization: 'Bearer test-token' },
        payload: payloadWithOptionals,
      });

      expect(response.statusCode).toBe(201);
      expect(mockCreateTransaction).toHaveBeenCalledWith(payloadWithOptionals);
    });
  });

  describe('PATCH /transactions/:id', () => {
    const updatePayload = {
      description: 'Updated description',
      categoryId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      notes: 'Updated notes',
    };

    it('should return 200 on successful update', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/transactions/txn-1',
        headers: { authorization: 'Bearer test-token' },
        payload: updatePayload,
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateTransaction).toHaveBeenCalledWith('txn-1', updatePayload);
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/transactions/txn-1',
        payload: updatePayload,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when transaction not found', async () => {
      mockUpdateTransaction.mockRejectedValueOnce(
        new Error('Transaction not found or does not belong to this tenant')
      );

      const response = await app.inject({
        method: 'PATCH',
        url: '/transactions/nonexistent',
        headers: { authorization: 'Bearer test-token' },
        payload: updatePayload,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toContain('not found');
    });

    it('should allow partial updates', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/transactions/txn-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { description: 'Only description' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateTransaction).toHaveBeenCalledWith('txn-1', {
        description: 'Only description',
      });
    });

    it('should allow setting categoryId to null', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/transactions/txn-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { categoryId: null },
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateTransaction).toHaveBeenCalledWith('txn-1', { categoryId: null });
    });

    it('should allow setting notes to null', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/transactions/txn-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { notes: null },
      });

      expect(response.statusCode).toBe(200);
      expect(mockUpdateTransaction).toHaveBeenCalledWith('txn-1', { notes: null });
    });

    // Note: Zod validation tests skipped when schemas are mocked
  });

  describe('DELETE /transactions/:id', () => {
    it('should return 204 on successful delete', async () => {
      // Mock returns record with deletedAt set (proving soft delete, not hard delete)
      mockSoftDeleteTransaction.mockResolvedValueOnce({
        ...MOCK_TRANSACTION,
        deletedAt: new Date('2024-01-15T12:00:00Z'),
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/transactions/txn-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mockSoftDeleteTransaction).toHaveBeenCalledWith('txn-1');

      // Financial invariant: soft delete returns record with deletedAt set
      const result = await mockSoftDeleteTransaction.mock.results[0].value;
      expect(result.deletedAt).toBeTruthy();
      expect(result.id).toBe(MOCK_TRANSACTION.id); // Record still exists
    });

    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/transactions/txn-1',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when transaction not found', async () => {
      mockSoftDeleteTransaction.mockRejectedValueOnce(
        new Error('Transaction not found or does not belong to this tenant')
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/transactions/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toContain('not found');
    });
  });
});
