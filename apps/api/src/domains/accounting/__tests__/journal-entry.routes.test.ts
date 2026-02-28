import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { journalEntryRoutes } from '../routes/journal-entry';
import { AccountingError } from '../errors';
import { mockJournalEntry, mockJournalEntryInput } from '../../../test-utils';

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
const mockBatchApproveEntries = vi.fn();

vi.mock('../services/journal-entry.service', () => ({
  JournalEntryService: function (this: any) {
    this.listEntries = mockListEntries;
    this.getEntry = mockGetEntry;
    this.createEntry = mockCreateEntry;
    this.approveEntry = mockApproveEntry;
    this.voidEntry = mockVoidEntry;
    this.deleteEntry = mockDeleteEntry;
    this.batchApproveEntries = mockBatchApproveEntries;
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

// ✅ MIGRATION: Replaced inline mock with type-safe factory
// Before: MOCK_ENTRY object literal (9 lines, manual journalLines, breaks on schema change)
// After: mockJournalEntry() from test-utils (type-safe, auto-updates with schema)

describe('JournalEntry Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    const entry = mockJournalEntry({ entryNumber: 'JE-001', memo: 'Test entry' });
    mockListEntries.mockResolvedValue({ items: [entry], nextCursor: null });
    mockGetEntry.mockResolvedValue(entry);
    mockCreateEntry.mockResolvedValue(entry);
    mockApproveEntry.mockResolvedValue({ ...entry, status: 'POSTED' });
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
      // ✅ Using validated input factory
      const input = mockJournalEntryInput({ memo: 'Test entry' });

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries',
        headers: { authorization: 'Bearer test-token' },
        payload: input,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().entryNumber).toBe('JE-001');
    });

    it('should return 400 on unbalanced entry', async () => {
      mockCreateEntry.mockRejectedValue(
        new AccountingError('not balanced', 'UNBALANCED_ENTRY', 400)
      );

      // Note: This test uses raw payload to bypass Zod validation, which itself catches unbalanced entries.
      // In production, the Zod schema.refine() would reject this before hitting the service.
      // We're testing the service-level error handling for backward compatibility.
      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          entityId: 'cltest00000000000000entity',
          date: '2026-01-15T00:00:00.000Z',
          memo: 'Bad entry',
          lines: [
            { glAccountId: 'cltest00000000000glacc001', debitAmount: 1000, creditAmount: 0 },
            { glAccountId: 'cltest00000000000glacc002', debitAmount: 0, creditAmount: 500 },
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

      // Note: Using valid CUIDs representing cross-entity GL accounts
      const input = mockJournalEntryInput({
        memo: 'Cross-entity',
        lines: [
          { glAccountId: 'cltest00000000otherentity1', debitAmount: 1000, creditAmount: 0 },
          { glAccountId: 'cltest00000000otherentity2', debitAmount: 0, creditAmount: 1000 },
        ],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries',
        headers: { authorization: 'Bearer test-token' },
        payload: input,
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

  // ==========================================================================
  // POST /journal-entries/batch/approve
  // ==========================================================================

  describe('POST /journal-entries/batch/approve', () => {
    it('should batch approve entries and return results', async () => {
      mockBatchApproveEntries.mockResolvedValue({
        succeeded: [
          { id: 'je-1', entryNumber: 'JE-001' },
          { id: 'je-2', entryNumber: 'JE-002' },
        ],
        failed: [],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/batch/approve',
        headers: { authorization: 'Bearer test-token' },
        payload: { entryIds: ['je-1', 'je-2'] },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.succeeded).toHaveLength(2);
      expect(body.failed).toHaveLength(0);
      expect(body.succeeded[0].entryNumber).toBe('JE-001');
    });

    it('should report partial failures', async () => {
      mockBatchApproveEntries.mockResolvedValue({
        succeeded: [{ id: 'je-1', entryNumber: 'JE-001' }],
        failed: [{ id: 'je-3', reason: 'Cannot approve entry in POSTED status' }],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/batch/approve',
        headers: { authorization: 'Bearer test-token' },
        payload: { entryIds: ['je-1', 'je-3'] },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.succeeded).toHaveLength(1);
      expect(body.failed).toHaveLength(1);
      expect(body.failed[0].reason).toContain('POSTED');
    });

    it('should call service with correct entryIds', async () => {
      mockBatchApproveEntries.mockResolvedValue({ succeeded: [], failed: [] });

      await app.inject({
        method: 'POST',
        url: '/journal-entries/batch/approve',
        headers: { authorization: 'Bearer test-token' },
        payload: { entryIds: ['je-1', 'je-2', 'je-3'] },
      });

      expect(mockBatchApproveEntries).toHaveBeenCalledWith(['je-1', 'je-2', 'je-3']);
    });

    it('should return error when service throws', async () => {
      mockBatchApproveEntries.mockRejectedValue(
        new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 403)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/journal-entries/batch/approve',
        headers: { authorization: 'Bearer test-token' },
        payload: { entryIds: ['je-1'] },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error).toBe('ENTITY_NOT_FOUND');
    });
  });
});
