import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { journalEntryRoutes } from '../routes/journal-entry';
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

// Mock JournalEntryService
const mockListEntries = vi.fn();
const mockGetEntry = vi.fn();
const mockCreateEntry = vi.fn();
const mockApproveEntry = vi.fn();
const mockVoidEntry = vi.fn();
const mockDeleteEntry = vi.fn();

vi.mock('../services/journal-entry.service', () => ({
  JournalEntryService: function (this: any) {
    this.listEntries = mockListEntries;
    this.getEntry = mockGetEntry;
    this.createEntry = mockCreateEntry;
    this.approveEntry = mockApproveEntry;
    this.voidEntry = mockVoidEntry;
    this.deleteEntry = mockDeleteEntry;
  },
}));

// Mock PostingService
const mockPostTransaction = vi.fn();
const mockPostBulkTransactions = vi.fn();
const mockPostSplitTransaction = vi.fn();

vi.mock('../services/posting.service', () => ({
  PostingService: function (this: any) {
    this.postTransaction = mockPostTransaction;
    this.postBulkTransactions = mockPostBulkTransactions;
    this.postSplitTransaction = mockPostSplitTransaction;
  },
}));

const MOCK_ENTRY = {
  id: 'je-1',
  entryNumber: 'JE-001',
  date: '2026-01-15',
  memo: 'Test entry',
  status: 'DRAFT',
  createdBy: 'test-user-id',
  journalLines: [
    { id: 'jl-1', glAccountId: 'gl-1', debitAmount: 1000, creditAmount: 0 },
    { id: 'jl-2', glAccountId: 'gl-2', debitAmount: 0, creditAmount: 1000 },
  ],
};

describe('JournalEntry Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockListEntries.mockResolvedValue({ items: [MOCK_ENTRY], nextCursor: null });
    mockGetEntry.mockResolvedValue(MOCK_ENTRY);
    mockCreateEntry.mockResolvedValue(MOCK_ENTRY);
    mockApproveEntry.mockResolvedValue({ ...MOCK_ENTRY, status: 'POSTED' });
    mockVoidEntry.mockResolvedValue({ voidedEntryId: 'je-1', reversalEntryId: 'je-2' });
    mockDeleteEntry.mockResolvedValue({ deleted: true });
    mockPostTransaction.mockResolvedValue({
      journalEntryId: 'je-3', entryNumber: 'JE-003', transactionId: 'txn-1', amount: 500,
    });
    mockPostBulkTransactions.mockResolvedValue({ posted: 2, entries: [] });
    mockPostSplitTransaction.mockResolvedValue({
      journalEntryId: 'je-split', entryNumber: 'JE-004', transactionId: 'txn-1',
      amount: 500, splitCount: 2, lines: [],
    });

    app = Fastify({ logger: false });
    await app.register(journalEntryRoutes, { prefix: '/journal-entries' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ==========================================================================
  // GET /journal-entries
  // ==========================================================================

  describe('GET /journal-entries', () => {
    it('should return 200 with paginated entries', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/journal-entries',
        headers: { authorization: 'Bearer test-token' },
        query: { entityId: 'entity-1' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.items).toHaveLength(1);
      expect(body.nextCursor).toBeNull();
    });
  });

  // ==========================================================================
  // GET /journal-entries/:id
  // ==========================================================================

  describe('GET /journal-entries/:id', () => {
    it('should return 200 with entry detail', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/journal-entries/je-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().entryNumber).toBe('JE-001');
    });

    it('should return 404 when not found', async () => {
      mockGetEntry.mockRejectedValue(
        new AccountingError('Journal entry not found', 'GL_ACCOUNT_NOT_FOUND', 404)
      );

      const response = await app.inject({
        method: 'GET',
        url: '/journal-entries/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ==========================================================================
  // POST /journal-entries
  // ==========================================================================

  describe('POST /journal-entries', () => {
    it('should return 201 on successful creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: 'entity-1',
          date: '2026-01-15T00:00:00.000Z',
          memo: 'Test entry',
          lines: [
            { glAccountId: 'gl-1', debitAmount: 1000, creditAmount: 0 },
            { glAccountId: 'gl-2', debitAmount: 0, creditAmount: 1000 },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().entryNumber).toBe('JE-001');
    });

    it('should return 400 on unbalanced entry', async () => {
      mockCreateEntry.mockRejectedValue(
        new AccountingError('not balanced', 'UNBALANCED_ENTRY', 400)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: 'entity-1',
          date: '2026-01-15T00:00:00.000Z',
          memo: 'Bad entry',
          lines: [
            { glAccountId: 'gl-1', debitAmount: 1000, creditAmount: 0 },
            { glAccountId: 'gl-2', debitAmount: 0, creditAmount: 500 },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('UNBALANCED_ENTRY');
    });

    it('should return 403 on cross-entity GL reference', async () => {
      mockCreateEntry.mockRejectedValue(
        new AccountingError('Cross-entity reference', 'CROSS_ENTITY_REFERENCE', 403)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: 'entity-1',
          date: '2026-01-15T00:00:00.000Z',
          memo: 'Cross-entity',
          lines: [
            { glAccountId: 'gl-other-entity', debitAmount: 1000, creditAmount: 0 },
            { glAccountId: 'gl-2', debitAmount: 0, creditAmount: 1000 },
          ],
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  // ==========================================================================
  // POST /journal-entries/:id/approve
  // ==========================================================================

  describe('POST /journal-entries/:id/approve', () => {
    it('should return 200 on approval', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/je-1/approve',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().status).toBe('POSTED');
    });

    it('should return 409 if already posted', async () => {
      mockApproveEntry.mockRejectedValue(
        new AccountingError('Already posted', 'ALREADY_POSTED', 409)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/je-1/approve',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 403 on separation of duties violation', async () => {
      mockApproveEntry.mockRejectedValue(
        new AccountingError('Creator cannot approve', 'SEPARATION_OF_DUTIES', 403)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/je-1/approve',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  // ==========================================================================
  // POST /journal-entries/:id/void
  // ==========================================================================

  describe('POST /journal-entries/:id/void', () => {
    it('should return 200 with void result', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/je-1/void',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().reversalEntryId).toBe('je-2');
    });

    it('should return 409 if already voided', async () => {
      mockVoidEntry.mockRejectedValue(
        new AccountingError('Already voided', 'ALREADY_VOIDED', 409)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/je-1/void',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(409);
    });
  });

  // ==========================================================================
  // DELETE /journal-entries/:id
  // ==========================================================================

  describe('DELETE /journal-entries/:id', () => {
    it('should return 200 on DRAFT deletion', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/journal-entries/je-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().deleted).toBe(true);
    });

    it('should return 400 when trying to delete POSTED entry', async () => {
      mockDeleteEntry.mockRejectedValue(
        new AccountingError('Must void instead', 'IMMUTABLE_POSTED_ENTRY', 400)
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/journal-entries/je-1',
        headers: { authorization: 'Bearer test-token' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ==========================================================================
  // POST /journal-entries/post-transaction
  // ==========================================================================

  describe('POST /journal-entries/post-transaction', () => {
    it('should return 201 on successful posting', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-transaction',
        headers: { authorization: 'Bearer test-token' },
        payload: { transactionId: 'txn-1', glAccountId: 'gl-1' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().journalEntryId).toBe('je-3');
    });

    it('should return 409 if already posted', async () => {
      mockPostTransaction.mockRejectedValue(
        new AccountingError('Already posted', 'ALREADY_POSTED', 409)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-transaction',
        headers: { authorization: 'Bearer test-token' },
        payload: { transactionId: 'txn-1', glAccountId: 'gl-1' },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 400 if bank account not mapped', async () => {
      mockPostTransaction.mockRejectedValue(
        new AccountingError('Not mapped', 'BANK_ACCOUNT_NOT_MAPPED', 400)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-transaction',
        headers: { authorization: 'Bearer test-token' },
        payload: { transactionId: 'txn-1', glAccountId: 'gl-1' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ==========================================================================
  // POST /journal-entries/post-transactions (bulk)
  // ==========================================================================

  describe('POST /journal-entries/post-transactions', () => {
    it('should return 201 on successful bulk posting', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-transactions',
        headers: { authorization: 'Bearer test-token' },
        payload: { transactionIds: ['txn-1', 'txn-2'], glAccountId: 'gl-1' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().posted).toBe(2);
    });

    it('should return 403 on cross-entity bulk posting', async () => {
      mockPostBulkTransactions.mockRejectedValue(
        new AccountingError('Cross-entity', 'CROSS_ENTITY_REFERENCE', 403)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-transactions',
        headers: { authorization: 'Bearer test-token' },
        payload: { transactionIds: ['txn-1'], glAccountId: 'gl-1' },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  // ==========================================================================
  // POST /journal-entries/post-split-transaction
  // ==========================================================================

  describe('POST /journal-entries/post-split-transaction', () => {
    it('should return 201 on successful split posting', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-split-transaction',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionId: 'txn-1',
          splits: [
            { glAccountId: 'gl-1', amount: 300 },
            { glAccountId: 'gl-2', amount: 200 },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().splitCount).toBe(2);
    });

    it('should return 400 on split amount mismatch', async () => {
      mockPostSplitTransaction.mockRejectedValue(
        new AccountingError('Split amounts mismatch', 'SPLIT_AMOUNT_MISMATCH', 400)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-split-transaction',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionId: 'txn-1',
          splits: [
            { glAccountId: 'gl-1', amount: 300 },
            { glAccountId: 'gl-2', amount: 100 },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('SPLIT_AMOUNT_MISMATCH');
    });

    it('should return 403 on cross-entity split GL accounts', async () => {
      mockPostSplitTransaction.mockRejectedValue(
        new AccountingError('Cross-entity', 'CROSS_ENTITY_REFERENCE', 403)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-split-transaction',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionId: 'txn-1',
          splits: [
            { glAccountId: 'gl-1', amount: 300 },
            { glAccountId: 'gl-other', amount: 200 },
          ],
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  // ==========================================================================
  // POST /journal-entries/post-transaction (with exchangeRate)
  // ==========================================================================

  describe('POST /journal-entries/post-transaction (multi-currency)', () => {
    it('should pass exchangeRate override to service', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-transaction',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          transactionId: 'txn-1',
          glAccountId: 'gl-1',
          exchangeRate: 1.35,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockPostTransaction).toHaveBeenCalledWith('txn-1', 'gl-1', 1.35);
    });

    it('should return 400 when FX rate not found', async () => {
      mockPostTransaction.mockRejectedValue(
        new AccountingError('No FX rate found', 'MISSING_FX_RATE', 400)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/post-transaction',
        headers: { authorization: 'Bearer test-token' },
        payload: { transactionId: 'txn-1', glAccountId: 'gl-1' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('MISSING_FX_RATE');
    });
  });
});
