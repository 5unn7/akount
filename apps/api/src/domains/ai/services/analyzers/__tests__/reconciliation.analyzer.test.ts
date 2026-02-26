import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReconciliationGapMetadata } from '../../../types/insight.types';

// Hoist mocks for Prisma
const { mockAccountFindMany, mockBankFeedCount } = vi.hoisted(() => ({
  mockAccountFindMany: vi.fn(),
  mockBankFeedCount: vi.fn(),
}));

vi.mock('@akount/db', () => ({
  prisma: {
    account: {
      findMany: mockAccountFindMany,
    },
    bankFeedTransaction: {
      count: mockBankFeedCount,
    },
  },
  BankFeedStatus: {
    POSTED: 'POSTED',
    PENDING: 'PENDING',
    FAILED: 'FAILED',
  },
}));

// Import after mocks
import { analyzeReconciliation } from '../reconciliation.analyzer';

const ENTITY_ID = 'entity-123';
const TENANT_ID = 'tenant-abc-123';

describe('analyzeReconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty when no accounts', async () => {
    mockAccountFindMany.mockResolvedValue([]);

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });

  it('should return empty when account has no bank feed data', async () => {
    mockAccountFindMany.mockResolvedValue([{ id: 'acc-1', name: 'Checking' }]);
    mockBankFeedCount.mockResolvedValue(0); // No bank feed transactions

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });

  it('should return empty when reconciliation is above 80%', async () => {
    mockAccountFindMany.mockResolvedValue([{ id: 'acc-1', name: 'Checking' }]);
    // First call: total = 100, second call: matched = 85 (85%)
    mockBankFeedCount
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(85); // matched (85%)

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });

  it('should trigger reconciliation_gap below 80%', async () => {
    mockAccountFindMany.mockResolvedValue([{ id: 'acc-1', name: 'Checking' }]);
    mockBankFeedCount
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(70); // matched (70%)

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('reconciliation_gap');
    expect(results[0].actionable).toBe(true);
  });

  it('should set medium priority for 60-80% reconciliation', async () => {
    mockAccountFindMany.mockResolvedValue([{ id: 'acc-1', name: 'Checking' }]);
    mockBankFeedCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(65); // 65%

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results[0].priority).toBe('medium');
  });

  it('should set high priority for <60% reconciliation', async () => {
    mockAccountFindMany.mockResolvedValue([{ id: 'acc-1', name: 'Checking' }]);
    mockBankFeedCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(50); // 50%

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results[0].priority).toBe('high');
  });

  it('should set critical priority for <40% reconciliation', async () => {
    mockAccountFindMany.mockResolvedValue([{ id: 'acc-1', name: 'Checking' }]);
    mockBankFeedCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(30); // 30%

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results[0].priority).toBe('critical');
  });

  it('should detect multiple account gaps', async () => {
    mockAccountFindMany.mockResolvedValue([
      { id: 'acc-1', name: 'Checking' },
      { id: 'acc-2', name: 'Savings' },
    ]);
    // Account 1: 100 total, 60 matched (60% - high)
    // Account 2: 50 total, 20 matched (40% - critical, but boundary)
    mockBankFeedCount
      .mockResolvedValueOnce(100).mockResolvedValueOnce(60) // acc-1
      .mockResolvedValueOnce(50).mockResolvedValueOnce(20); // acc-2

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(2);
    expect(results.map(r => (r.metadata as ReconciliationGapMetadata).accountName).sort())
      .toEqual(['Checking', 'Savings']);
  });

  it('should store correct metadata', async () => {
    mockAccountFindMany.mockResolvedValue([{ id: 'acc-1', name: 'Business Checking' }]);
    mockBankFeedCount
      .mockResolvedValueOnce(200) // total
      .mockResolvedValueOnce(120); // matched (60%)

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    const metadata = results[0].metadata as ReconciliationGapMetadata;

    expect(metadata.accountId).toBe('acc-1');
    expect(metadata.accountName).toBe('Business Checking');
    expect(metadata.totalBankFeed).toBe(200);
    expect(metadata.matched).toBe(120);
    expect(metadata.unmatched).toBe(80);
    expect(metadata.reconciliationPercent).toBe(60);
  });

  it('should generate deterministic triggerId per account', async () => {
    mockAccountFindMany.mockResolvedValue([{ id: 'acc-1', name: 'Checking' }]);
    mockBankFeedCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(50);

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    const now = new Date();
    const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(results[0].triggerId).toBe(`reconciliation_gap:${ENTITY_ID}:acc-1:${expectedMonth}`);
  });

  it('should query with tenant isolation', async () => {
    mockAccountFindMany.mockResolvedValue([]);

    await analyzeReconciliation(ENTITY_ID, TENANT_ID);

    expect(mockAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entityId: ENTITY_ID,
          entity: { tenantId: TENANT_ID },
          deletedAt: null,
        }),
      })
    );
  });

  it('should skip well-reconciled accounts in multi-account scenario', async () => {
    mockAccountFindMany.mockResolvedValue([
      { id: 'acc-1', name: 'Good Account' },
      { id: 'acc-2', name: 'Bad Account' },
    ]);
    // Account 1: 100%, Account 2: 50%
    mockBankFeedCount
      .mockResolvedValueOnce(100).mockResolvedValueOnce(100) // acc-1 (100%)
      .mockResolvedValueOnce(100).mockResolvedValueOnce(50); // acc-2 (50%)

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(1);
    expect((results[0].metadata as ReconciliationGapMetadata).accountName).toBe('Bad Account');
  });

  it('should have confidence of 1.0 (based on actual counts)', async () => {
    mockAccountFindMany.mockResolvedValue([{ id: 'acc-1', name: 'Checking' }]);
    mockBankFeedCount
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(50);

    const results = await analyzeReconciliation(ENTITY_ID, TENANT_ID);
    expect(results[0].confidence).toBe(1.0);
  });
});
