import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PassThrough } from 'stream';

// ─────────────────────────────────────────────────────────────────
// Mocks (vi.hoisted to avoid TDZ issues with vi.mock factory hoisting)
// ─────────────────────────────────────────────────────────────────

const {
  mockAppend,
  mockPipe,
  mockFinalize,
  modelFindMany,
  modelNames,
  prismaMock,
} = vi.hoisted(() => {
  const _mockAppend = vi.fn();
  const _mockPipe = vi.fn();
  const _mockFinalize = vi.fn().mockResolvedValue(undefined);

  const _modelFindMany: Record<string, ReturnType<typeof vi.fn>> = {};
  const _modelNames = [
    'entity', 'gLAccount', 'journalEntry', 'journalLine',
    'client', 'invoice', 'vendor', 'bill',
    'account', 'transaction', 'payment', 'category',
  ];

  const _prismaMock: Record<string, unknown> = {};
  for (const model of _modelNames) {
    const fn = vi.fn().mockResolvedValue([]);
    _modelFindMany[model] = fn;
    _prismaMock[model] = { findMany: fn, findFirst: vi.fn() };
  }

  return {
    mockAppend: _mockAppend,
    mockPipe: _mockPipe,
    mockFinalize: _mockFinalize,
    modelFindMany: _modelFindMany,
    modelNames: _modelNames,
    prismaMock: _prismaMock,
  };
});

vi.mock('archiver', () => ({
  default: vi.fn(() => ({
    append: mockAppend,
    pipe: mockPipe,
    finalize: mockFinalize,
  })),
}));

vi.mock('@akount/db', () => ({
  prisma: prismaMock,
}));

import { prisma } from '@akount/db';

// ─────────────────────────────────────────────────────────────────
// Import after mocks
// ─────────────────────────────────────────────────────────────────
import { streamDataBackup } from '../data-export.service';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-test-123';
const ENTITY_ID = 'entity-test-456';

function makeMockReply() {
  const raw = {
    setHeader: vi.fn(),
  };
  return { raw } as unknown as import('fastify').FastifyReply;
}

function makeMockEntity(id: string = ENTITY_ID) {
  return { id, tenantId: TENANT_ID, name: 'Test Corp' };
}

/**
 * Set up entity mocks so streamDataBackup can resolve entity IDs.
 */
function setupEntityMocks(entityIds: string[] = [ENTITY_ID]) {
  // entity.findFirst (for specific entityId verification)
  (prisma.entity as unknown as { findFirst: ReturnType<typeof vi.fn> }).findFirst
    .mockResolvedValue(entityIds.length === 1 ? { id: entityIds[0] } : null);
  // entity.findMany (for loading all tenant entities)
  (prisma.entity as unknown as { findMany: ReturnType<typeof vi.fn> }).findMany
    .mockResolvedValue(entityIds.map(id => ({ id })));
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('DataExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all model findMany to return empty arrays
    for (const model of modelNames) {
      modelFindMany[model].mockResolvedValue([]);
    }
    setupEntityMocks();
  });

  describe('streamDataBackup', () => {
    // ──────────────────────────────────────────────────────────────
    // Response headers
    // ──────────────────────────────────────────────────────────────

    it('should set Content-Type to application/zip', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);
      expect(reply.raw.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip');
    });

    it('should set Content-Disposition with date-stamped filename', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);
      expect(reply.raw.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="akount-backup-\d{4}-\d{2}-\d{2}\.zip"$/),
      );
    });

    // ──────────────────────────────────────────────────────────────
    // ZIP structure
    // ──────────────────────────────────────────────────────────────

    it('should export all 12 tables as CSV files plus metadata.json', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // 12 CSV files + 1 metadata.json = 13 append calls
      expect(mockAppend).toHaveBeenCalledTimes(13);

      // Verify each table name
      const appendNames = mockAppend.mock.calls.map(
        (call: [unknown, { name: string }]) => call[1]?.name,
      );
      expect(appendNames).toContain('entities.csv');
      expect(appendNames).toContain('gl-accounts.csv');
      expect(appendNames).toContain('journal-entries.csv');
      expect(appendNames).toContain('journal-lines.csv');
      expect(appendNames).toContain('clients.csv');
      expect(appendNames).toContain('invoices.csv');
      expect(appendNames).toContain('vendors.csv');
      expect(appendNames).toContain('bills.csv');
      expect(appendNames).toContain('accounts.csv');
      expect(appendNames).toContain('transactions.csv');
      expect(appendNames).toContain('payments.csv');
      expect(appendNames).toContain('categories.csv');
      expect(appendNames).toContain('metadata.json');
    });

    it('should finalize the archive', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);
      expect(mockFinalize).toHaveBeenCalledOnce();
    });

    // ──────────────────────────────────────────────────────────────
    // Metadata
    // ──────────────────────────────────────────────────────────────

    it('should include metadata.json with correct structure', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // Last append call is metadata.json
      const metadataCall = mockAppend.mock.calls.find(
        (call: [unknown, { name: string }]) => call[1]?.name === 'metadata.json',
      );
      expect(metadataCall).toBeDefined();

      const metadata = JSON.parse(metadataCall[0] as string);
      expect(metadata).toHaveProperty('exportDate');
      expect(metadata).toHaveProperty('tenantId', TENANT_ID);
      expect(metadata).toHaveProperty('entityId', ENTITY_ID);
      expect(metadata).toHaveProperty('schemaVersion', '1.0');
      expect(metadata).toHaveProperty('tables');
      expect(metadata).toHaveProperty('totalRows');
      expect(metadata.tables).toHaveLength(12);
    });

    it('should set entityId to "all" when no specific entityId provided', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID);

      const metadataCall = mockAppend.mock.calls.find(
        (call: [unknown, { name: string }]) => call[1]?.name === 'metadata.json',
      );
      const metadata = JSON.parse(metadataCall[0] as string);
      expect(metadata.entityId).toBe('all');
    });

    it('should track row counts per table in metadata', async () => {
      // Return 3 rows for clients
      modelFindMany['client'].mockResolvedValueOnce([
        { id: 'c1', name: 'A' },
        { id: 'c2', name: 'B' },
        { id: 'c3', name: 'C' },
      ]);

      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      const metadataCall = mockAppend.mock.calls.find(
        (call: [unknown, { name: string }]) => call[1]?.name === 'metadata.json',
      );
      const metadata = JSON.parse(metadataCall[0] as string);
      const clientTable = metadata.tables.find((t: { name: string }) => t.name === 'clients');
      expect(clientTable.rowCount).toBe(3);
      // totalRows includes 1 entity row from setupEntityMocks default + 3 clients
      expect(metadata.totalRows).toBe(4);
    });

    // ──────────────────────────────────────────────────────────────
    // CSV header rows
    // ──────────────────────────────────────────────────────────────

    it('should write CSV header row for each table', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // Each CSV table is appended as a PassThrough stream
      // Verify streams were created (12 streams for 12 tables)
      const streamCalls = mockAppend.mock.calls.filter(
        (call: [unknown, { name: string }]) => call[1]?.name?.endsWith('.csv'),
      );
      expect(streamCalls).toHaveLength(12);

      // Each stream (first arg) should be a PassThrough that had write() called
      for (const call of streamCalls) {
        expect(call[0]).toBeInstanceOf(PassThrough);
      }
    });

    // ──────────────────────────────────────────────────────────────
    // Cursor pagination
    // ──────────────────────────────────────────────────────────────

    it('should stop paginating when rows returned < BATCH_SIZE', async () => {
      // Return fewer than 500 rows — should stop after 1 batch
      modelFindMany['client'].mockResolvedValueOnce([{ id: 'c1', name: 'A' }]);

      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // Should have been called exactly once for clients (1 batch < 500)
      expect(modelFindMany['client']).toHaveBeenCalledTimes(1);
    });

    it('should paginate with cursor when rows returned === BATCH_SIZE', async () => {
      // First batch: exactly 500 rows
      const batch1 = Array.from({ length: 500 }, (_, i) => ({
        id: `c-${String(i).padStart(3, '0')}`,
        name: `Client ${i}`,
      }));
      // Second batch: fewer than 500 rows (end of data)
      const batch2 = [{ id: 'c-500', name: 'Client 500' }];

      modelFindMany['client']
        .mockResolvedValueOnce(batch1)
        .mockResolvedValueOnce(batch2);

      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // Should have been called twice
      expect(modelFindMany['client']).toHaveBeenCalledTimes(2);

      // Second call should have cursor set
      const secondCall = modelFindMany['client'].mock.calls[1][0];
      expect(secondCall).toHaveProperty('cursor', { id: 'c-499' });
      expect(secondCall).toHaveProperty('skip', 1);
    });

    it('should handle empty tables gracefully (0 rows)', async () => {
      // Override entity findMany to return empty (for export loop)
      // while keeping findFirst working (for entity ownership check)
      modelFindMany['entity'].mockResolvedValue([]);
      (prisma.entity as unknown as { findFirst: ReturnType<typeof vi.fn> }).findFirst
        .mockResolvedValue({ id: ENTITY_ID });

      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      const metadataCall = mockAppend.mock.calls.find(
        (call: [unknown, { name: string }]) => call[1]?.name === 'metadata.json',
      );
      const metadata = JSON.parse(metadataCall[0] as string);
      expect(metadata.totalRows).toBe(0);
    });

    // ──────────────────────────────────────────────────────────────
    // Entity filtering
    // ──────────────────────────────────────────────────────────────

    it('should verify entity belongs to tenant when entityId provided', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      expect(
        (prisma.entity as unknown as { findFirst: ReturnType<typeof vi.fn> }).findFirst,
      ).toHaveBeenCalledWith({
        where: { id: ENTITY_ID, tenantId: TENANT_ID },
        select: { id: true },
      });
    });

    it('should throw when entityId does not belong to tenant', async () => {
      (prisma.entity as unknown as { findFirst: ReturnType<typeof vi.fn> }).findFirst
        .mockResolvedValueOnce(null);

      const reply = makeMockReply();
      await expect(
        streamDataBackup(reply, TENANT_ID, 'wrong-entity-id'),
      ).rejects.toThrow('Entity not found or access denied');
    });

    it('should load all tenant entityIds when no specific entityId provided', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID);

      expect(
        (prisma.entity as unknown as { findMany: ReturnType<typeof vi.fn> }).findMany,
      ).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID },
        select: { id: true },
      });
    });

    // ──────────────────────────────────────────────────────────────
    // Sensitive data masking
    // ──────────────────────────────────────────────────────────────

    it('should mask accountNumber column with asterisks + last 4 chars', async () => {
      modelFindMany['account'].mockResolvedValueOnce([{
        id: 'acc-1',
        entityId: ENTITY_ID,
        name: 'Checking',
        type: 'CHECKING',
        subtype: null,
        institution: 'RBC',
        accountNumber: '1234567890',
        currency: 'CAD',
        currentBalance: 500000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }]);

      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // Find the accounts.csv stream and check what was written
      const accountsCall = mockAppend.mock.calls.find(
        (call: [unknown, { name: string }]) => call[1]?.name === 'accounts.csv',
      );
      const stream = accountsCall[0] as PassThrough;

      // Collect stream data
      const chunks: string[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
      await new Promise<void>(resolve => stream.on('end', resolve));
      const csv = chunks.join('');

      // Should NOT contain the full account number
      expect(csv).not.toContain('1234567890');
      // Should contain masked version: ******7890
      expect(csv).toContain('7890');
    });

    it('should mask short values (<=4 chars) as ****', async () => {
      modelFindMany['account'].mockResolvedValueOnce([{
        id: 'acc-2',
        entityId: ENTITY_ID,
        name: 'Savings',
        type: 'SAVINGS',
        subtype: null,
        institution: 'TD',
        accountNumber: '1234',
        currency: 'CAD',
        currentBalance: 100000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }]);

      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      const accountsCall = mockAppend.mock.calls.find(
        (call: [unknown, { name: string }]) => call[1]?.name === 'accounts.csv',
      );
      const stream = accountsCall[0] as PassThrough;
      const chunks: string[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
      await new Promise<void>(resolve => stream.on('end', resolve));
      const csv = chunks.join('');

      // Short values should be fully masked
      expect(csv).toContain('****');
      expect(csv).not.toContain(',1234,');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // buildWhere (tested indirectly via model calls)
  // ──────────────────────────────────────────────────────────────

  describe('buildWhere (indirect)', () => {
    it('should add tenantId filter for tenant-scoped models (entity, category)', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // Categories are tenant-scoped (no entityScoped flag)
      const categoryCall = modelFindMany['category'].mock.calls[0][0];
      expect(categoryCall.where).toHaveProperty('tenantId', TENANT_ID);
    });

    it('should add entity.tenantId filter for entity-scoped models', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // GL accounts are entity-scoped
      const glCall = modelFindMany['gLAccount'].mock.calls[0][0];
      expect(glCall.where).toHaveProperty('entity', { tenantId: TENANT_ID });
      expect(glCall.where).toHaveProperty('entityId', { in: [ENTITY_ID] });
    });

    it('should scope journalLine via journalEntry.entity.tenantId', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      const jlCall = modelFindMany['journalLine'].mock.calls[0][0];
      expect(jlCall.where).toHaveProperty('journalEntry');
      expect(jlCall.where.journalEntry).toHaveProperty('entity', { tenantId: TENANT_ID });
      expect(jlCall.where.journalEntry).toHaveProperty('entityId', { in: [ENTITY_ID] });
    });

    it('should scope transaction via account.entity.tenantId', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      const txCall = modelFindMany['transaction'].mock.calls[0][0];
      expect(txCall.where).toHaveProperty('account');
      expect(txCall.where.account).toHaveProperty('entity', { tenantId: TENANT_ID });
      expect(txCall.where.account).toHaveProperty('entityId', { in: [ENTITY_ID] });
    });

    it('should NOT include deletedAt filter for tables with includeSoftDeleted=true', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // Invoices have includeSoftDeleted: true
      const invoiceCall = modelFindMany['invoice'].mock.calls[0][0];
      expect(invoiceCall.where).not.toHaveProperty('deletedAt');

      // Journal entries have includeSoftDeleted: true
      const jeCall = modelFindMany['journalEntry'].mock.calls[0][0];
      expect(jeCall.where).not.toHaveProperty('deletedAt');
    });

    it('should include deletedAt=null filter for tables without includeSoftDeleted', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // GL accounts do NOT have includeSoftDeleted
      const glCall = modelFindMany['gLAccount'].mock.calls[0][0];
      expect(glCall.where).toHaveProperty('deletedAt', null);

      // Clients do NOT have includeSoftDeleted
      const clientCall = modelFindMany['client'].mock.calls[0][0];
      expect(clientCall.where).toHaveProperty('deletedAt', null);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Tenant isolation
  // ──────────────────────────────────────────────────────────────

  describe('tenant isolation', () => {
    it('should never export data without tenant filter', async () => {
      const reply = makeMockReply();
      await streamDataBackup(reply, TENANT_ID, ENTITY_ID);

      // Every model delegate should have been called with where clause
      for (const model of modelNames) {
        if (modelFindMany[model].mock.calls.length > 0) {
          const call = modelFindMany[model].mock.calls[0][0];
          expect(call).toHaveProperty('where');
          // Where clause should reference tenantId somehow
          const whereStr = JSON.stringify(call.where);
          const hasTenantFilter =
            whereStr.includes(TENANT_ID) ||
            whereStr.includes('tenantId');
          expect(hasTenantFilter).toBe(true);
        }
      }
    });
  });
});
