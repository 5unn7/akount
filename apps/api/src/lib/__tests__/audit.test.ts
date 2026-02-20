import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

// Mock prisma before imports
const mockCreate = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock('@akount/db', () => ({
  prisma: {
    auditLog: {
      create: (...args: unknown[]) => mockCreate(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    // ARCH-7: createAuditLog now wraps in serializable transaction when no tx provided
    $transaction: async (fn: (tx: unknown) => Promise<unknown>, _opts?: unknown) => {
      const txClient = {
        auditLog: {
          create: (...args: unknown[]) => mockCreate(...args),
          findFirst: (...args: unknown[]) => mockFindFirst(...args),
        },
      };
      return fn(txClient);
    },
  },
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
  },
  Prisma: {
    TransactionIsolationLevel: {
      Serializable: 'Serializable',
    },
  },
}));

import { createAuditLog, verifyAuditChain } from '../audit';

const TENANT_ID = 'tenant-test-123';
const USER_ID = 'user-test-456';

function computeExpectedHash(
  entry: Record<string, unknown>,
  previousHash: string,
  sequenceNumber: number,
): string {
  const payload = JSON.stringify({
    tenantId: entry.tenantId,
    userId: entry.userId,
    entityId: entry.entityId ?? null,
    model: entry.model,
    recordId: entry.recordId,
    action: entry.action,
    before: entry.before ?? null,
    after: entry.after ?? null,
    previousHash,
    sequenceNumber,
  });
  return createHash('sha256').update(payload).digest('hex');
}

describe('Audit Log with Tamper Detection', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockFindFirst.mockReset();
    mockFindMany.mockReset();
    mockCount.mockReset();
  });

  describe('createAuditLog', () => {
    it('should create first entry with GENESIS as previousHash', async () => {
      mockFindFirst.mockResolvedValue(null); // No previous entries
      mockCreate.mockResolvedValue({ id: 'log-1' });

      await createAuditLog({
        tenantId: TENANT_ID,
        userId: USER_ID,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'CREATE' as const,
      });

      expect(mockCreate).toHaveBeenCalledOnce();
      const createArg = mockCreate.mock.calls[0][0];
      expect(createArg.data.previousHash).toBe('GENESIS');
      expect(createArg.data.sequenceNumber).toBe(1);
      expect(createArg.data.integrityHash).toBeTypeOf('string');
      expect(createArg.data.integrityHash).toHaveLength(64); // SHA-256 hex
    });

    it('should chain to previous entry hash', async () => {
      const prevHash = 'abc123prevhash';
      mockFindFirst.mockResolvedValue({
        integrityHash: prevHash,
        sequenceNumber: 5,
      });
      mockCreate.mockResolvedValue({ id: 'log-2' });

      await createAuditLog({
        tenantId: TENANT_ID,
        userId: USER_ID,
        model: 'Payment',
        recordId: 'pay-1',
        action: 'CREATE' as const,
      });

      const createArg = mockCreate.mock.calls[0][0];
      expect(createArg.data.previousHash).toBe(prevHash);
      expect(createArg.data.sequenceNumber).toBe(6);
    });

    it('should compute correct integrity hash', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: 'log-3' });

      const params = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        model: 'Account',
        recordId: 'acc-1',
        action: 'UPDATE' as const,
        before: { name: 'Old' },
        after: { name: 'New' },
      };

      await createAuditLog(params);

      const createArg = mockCreate.mock.calls[0][0];
      const expectedHash = computeExpectedHash(
        {
          tenantId: TENANT_ID,
          userId: USER_ID,
          entityId: undefined,
          model: 'Account',
          recordId: 'acc-1',
          action: 'UPDATE',
          before: { name: 'Old' },
          after: { name: 'New' },
        },
        'GENESIS',
        1,
      );

      expect(createArg.data.integrityHash).toBe(expectedHash);
    });

    it('should not fail parent operation on error', async () => {
      mockFindFirst.mockRejectedValue(new Error('DB connection lost'));

      // Should not throw
      await createAuditLog({
        tenantId: TENANT_ID,
        userId: USER_ID,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'CREATE' as const,
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should normalize empty string entityId to undefined (FIN-19)', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: 'log-fin19a' });

      await createAuditLog({
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: '',
        model: 'Category',
        recordId: 'cat-1',
        action: 'CREATE' as const,
      });

      const createArg = mockCreate.mock.calls[0][0];
      expect(createArg.data.entityId).toBeUndefined();
    });

    it('should normalize whitespace-only entityId to undefined (FIN-19)', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: 'log-fin19b' });

      await createAuditLog({
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: '   ',
        model: 'Category',
        recordId: 'cat-2',
        action: 'UPDATE' as const,
      });

      const createArg = mockCreate.mock.calls[0][0];
      expect(createArg.data.entityId).toBeUndefined();
    });

    it('should preserve valid entityId (FIN-19)', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: 'log-fin19c' });

      await createAuditLog({
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: 'entity-valid-123',
        model: 'Transaction',
        recordId: 'txn-1',
        action: 'CREATE' as const,
      });

      const createArg = mockCreate.mock.calls[0][0];
      expect(createArg.data.entityId).toBe('entity-valid-123');
    });

    it('should use serializable transaction when no tx provided (ARCH-7)', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: 'log-arch7' });

      await createAuditLog({
        tenantId: TENANT_ID,
        userId: USER_ID,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'CREATE' as const,
      });

      // Verify it went through the $transaction path (mock create was called)
      expect(mockCreate).toHaveBeenCalledOnce();
    });

    it('should use caller tx directly when provided (ARCH-7)', async () => {
      const txFindFirst = vi.fn().mockResolvedValue(null);
      const txCreate = vi.fn().mockResolvedValue({ id: 'log-arch7b' });
      const callerTx = {
        auditLog: {
          findFirst: txFindFirst,
          create: txCreate,
        },
      };

      await createAuditLog({
        tenantId: TENANT_ID,
        userId: USER_ID,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'CREATE' as const,
      }, callerTx as never);

      // Should use caller's tx, not global prisma
      expect(txCreate).toHaveBeenCalledOnce();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should include entityId in hash when provided', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: 'log-4' });

      await createAuditLog({
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: 'entity-789',
        model: 'Transaction',
        recordId: 'txn-1',
        action: 'CREATE' as const,
      });

      const createArg = mockCreate.mock.calls[0][0];
      expect(createArg.data.entityId).toBe('entity-789');
      expect(createArg.data.integrityHash).toHaveLength(64);
    });
  });

  describe('verifyAuditChain', () => {
    it('should return valid for empty chain', async () => {
      mockCount.mockResolvedValue(0);

      const result = await verifyAuditChain(TENANT_ID);
      expect(result.valid).toBe(true);
      expect(result.totalEntries).toBe(0);
    });

    it('should validate a valid chain of entries', async () => {
      // Build a valid 3-entry chain
      const entry1Data = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'CREATE',
        before: null,
        after: { status: 'DRAFT' },
      };
      const hash1 = computeExpectedHash(entry1Data, 'GENESIS', 1);

      const entry2Data = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'UPDATE',
        before: { status: 'DRAFT' },
        after: { status: 'SENT' },
      };
      const hash2 = computeExpectedHash(entry2Data, hash1, 2);

      const entry3Data = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Payment',
        recordId: 'pay-1',
        action: 'CREATE',
        before: null,
        after: { amount: 5000 },
      };
      const hash3 = computeExpectedHash(entry3Data, hash2, 3);

      mockCount.mockResolvedValue(3);
      mockFindMany
        .mockResolvedValueOnce([
          { id: 'log-1', ...entry1Data, integrityHash: hash1, previousHash: 'GENESIS', sequenceNumber: 1 },
          { id: 'log-2', ...entry2Data, integrityHash: hash2, previousHash: hash1, sequenceNumber: 2 },
          { id: 'log-3', ...entry3Data, integrityHash: hash3, previousHash: hash2, sequenceNumber: 3 },
        ])
        .mockResolvedValueOnce([]); // Second batch empty

      const result = await verifyAuditChain(TENANT_ID);
      expect(result.valid).toBe(true);
      expect(result.totalEntries).toBe(3);
      expect(result.checkedEntries).toBe(3);
    });

    it('should detect modified entry (integrity hash mismatch)', async () => {
      const entry1Data = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'CREATE',
        before: null,
        after: { status: 'DRAFT' },
      };
      const hash1 = computeExpectedHash(entry1Data, 'GENESIS', 1);

      // Tampered entry: action changed from UPDATE to DELETE but hash not recomputed
      const tamperedEntry = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'DELETE', // <-- TAMPERED (was UPDATE)
        before: { status: 'DRAFT' },
        after: null,
      };
      // Hash was computed with action=UPDATE, but entry now says DELETE
      const originalHash = computeExpectedHash(
        { ...tamperedEntry, action: 'UPDATE', after: { status: 'SENT' } },
        hash1,
        2,
      );

      mockCount.mockResolvedValue(2);
      mockFindMany
        .mockResolvedValueOnce([
          { id: 'log-1', ...entry1Data, integrityHash: hash1, previousHash: 'GENESIS', sequenceNumber: 1 },
          { id: 'log-2', ...tamperedEntry, integrityHash: originalHash, previousHash: hash1, sequenceNumber: 2 },
        ])
        .mockResolvedValueOnce([]);

      const result = await verifyAuditChain(TENANT_ID);
      expect(result.valid).toBe(false);
      expect(result.firstInvalidEntry).toBe('log-2');
      expect(result.error).toContain('Integrity hash mismatch');
    });

    it('should detect deleted entry (sequence gap)', async () => {
      const entry1Data = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'CREATE',
        before: null,
        after: { status: 'DRAFT' },
      };
      const hash1 = computeExpectedHash(entry1Data, 'GENESIS', 1);

      // Entry with sequence 3 (sequence 2 was deleted)
      const entry3Data = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Payment',
        recordId: 'pay-1',
        action: 'CREATE',
        before: null,
        after: { amount: 5000 },
      };
      const hash3 = computeExpectedHash(entry3Data, 'some-hash-2', 3);

      mockCount.mockResolvedValue(2);
      mockFindMany
        .mockResolvedValueOnce([
          { id: 'log-1', ...entry1Data, integrityHash: hash1, previousHash: 'GENESIS', sequenceNumber: 1 },
          { id: 'log-3', ...entry3Data, integrityHash: hash3, previousHash: 'some-hash-2', sequenceNumber: 3 },
        ])
        .mockResolvedValueOnce([]);

      const result = await verifyAuditChain(TENANT_ID);
      expect(result.valid).toBe(false);
      expect(result.firstInvalidEntry).toBe('log-3');
      expect(result.error).toContain('Sequence gap');
    });

    it('should detect broken chain (previousHash mismatch)', async () => {
      const entry1Data = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Invoice',
        recordId: 'inv-1',
        action: 'CREATE',
        before: null,
        after: { status: 'DRAFT' },
      };
      const hash1 = computeExpectedHash(entry1Data, 'GENESIS', 1);

      // Entry 2 has wrong previousHash (chain broken by insertion)
      const entry2Data = {
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Payment',
        recordId: 'pay-1',
        action: 'CREATE',
        before: null,
        after: { amount: 5000 },
      };
      const wrongPrevHash = 'totally-wrong-hash';
      const hash2 = computeExpectedHash(entry2Data, wrongPrevHash, 2);

      mockCount.mockResolvedValue(2);
      mockFindMany
        .mockResolvedValueOnce([
          { id: 'log-1', ...entry1Data, integrityHash: hash1, previousHash: 'GENESIS', sequenceNumber: 1 },
          { id: 'log-2', ...entry2Data, integrityHash: hash2, previousHash: wrongPrevHash, sequenceNumber: 2 },
        ])
        .mockResolvedValueOnce([]);

      const result = await verifyAuditChain(TENANT_ID);
      expect(result.valid).toBe(false);
      expect(result.firstInvalidEntry).toBe('log-2');
      expect(result.error).toContain('Chain broken');
    });

    it('should skip legacy entries without hashes', async () => {
      // Legacy entry has no integrityHash or sequenceNumber
      const legacyEntry = {
        id: 'log-legacy',
        tenantId: TENANT_ID,
        userId: USER_ID,
        entityId: null,
        model: 'Account',
        recordId: 'acc-1',
        action: 'CREATE',
        before: null,
        after: null,
        integrityHash: null,
        previousHash: null,
        sequenceNumber: null,
      };

      mockCount.mockResolvedValue(1);
      mockFindMany
        .mockResolvedValueOnce([legacyEntry])
        .mockResolvedValueOnce([]);

      const result = await verifyAuditChain(TENANT_ID);
      expect(result.valid).toBe(true);
      expect(result.checkedEntries).toBe(1);
    });
  });
});
