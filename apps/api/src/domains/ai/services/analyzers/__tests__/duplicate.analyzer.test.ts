import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DuplicateExpenseMetadata } from '../../../types/insight.types';

// Hoist mock for Prisma
const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock('@akount/db', () => ({
  prisma: {
    transaction: {
      findMany: mockFindMany,
    },
  },
}));

// Import after mocks
import { analyzeDuplicates } from '../duplicate.analyzer';

const ENTITY_ID = 'entity-123';
const TENANT_ID = 'tenant-abc-123';

function mockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    description: 'Office Supplies',
    amount: -5000, // -$50.00 in cents
    date: new Date('2026-02-25T10:00:00Z'),
    ...overrides,
  };
}

describe('analyzeDuplicates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty when fewer than 2 transactions', () => {
    mockFindMany.mockResolvedValue([mockTransaction()]);

    return analyzeDuplicates(ENTITY_ID, TENANT_ID).then((results) => {
      expect(results).toHaveLength(0);
    });
  });

  it('should detect duplicates with same description, amount, and within 48h', async () => {
    const txn1 = mockTransaction({
      id: 'txn-1',
      description: 'Office Supplies',
      amount: -5000,
      date: new Date('2026-02-25T10:00:00Z'),
    });
    const txn2 = mockTransaction({
      id: 'txn-2',
      description: 'Office Supplies',
      amount: -5000,
      date: new Date('2026-02-26T08:00:00Z'), // 22 hours later
    });

    mockFindMany.mockResolvedValue([txn1, txn2]);

    const results = await analyzeDuplicates(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('duplicate_expense');
    expect(results[0].priority).toBe('medium');
    expect(results[0].actionable).toBe(true);
  });

  it('should NOT flag transactions with different amounts', async () => {
    const txn1 = mockTransaction({ id: 'txn-1', amount: -5000 });
    const txn2 = mockTransaction({ id: 'txn-2', amount: -7500 });

    mockFindMany.mockResolvedValue([txn1, txn2]);

    const results = await analyzeDuplicates(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag transactions with different descriptions', async () => {
    const txn1 = mockTransaction({ id: 'txn-1', description: 'Office Supplies' });
    const txn2 = mockTransaction({ id: 'txn-2', description: 'Marketing Tools' });

    mockFindMany.mockResolvedValue([txn1, txn2]);

    const results = await analyzeDuplicates(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });

  it('should NOT flag transactions beyond 48 hours apart', async () => {
    const txn1 = mockTransaction({
      id: 'txn-1',
      date: new Date('2026-02-20T10:00:00Z'),
    });
    const txn2 = mockTransaction({
      id: 'txn-2',
      date: new Date('2026-02-23T10:00:00Z'), // 3 days later
    });

    mockFindMany.mockResolvedValue([txn1, txn2]);

    const results = await analyzeDuplicates(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });

  it('should match case-insensitively with trimming', async () => {
    const txn1 = mockTransaction({
      id: 'txn-1',
      description: '  Office Supplies  ',
    });
    const txn2 = mockTransaction({
      id: 'txn-2',
      description: 'office supplies',
      date: new Date('2026-02-25T12:00:00Z'),
    });

    mockFindMany.mockResolvedValue([txn1, txn2]);

    const results = await analyzeDuplicates(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(1);
  });

  it('should use sorted IDs for deterministic triggerId', async () => {
    const txn1 = mockTransaction({
      id: 'txn-b', // Alphabetically second
      date: new Date('2026-02-25T10:00:00Z'),
    });
    const txn2 = mockTransaction({
      id: 'txn-a', // Alphabetically first
      date: new Date('2026-02-25T12:00:00Z'),
    });

    mockFindMany.mockResolvedValue([txn1, txn2]);

    const results = await analyzeDuplicates(ENTITY_ID, TENANT_ID);
    // Should sort: txn-a comes before txn-b
    expect(results[0].triggerId).toBe(`duplicate_expense:${ENTITY_ID}:txn-a:txn-b`);
  });

  it('should not flag same pair twice', async () => {
    // Three identical transactions — should create 3 pairs, not duplicated
    const base = { description: 'Office Supplies', amount: -5000 };
    const txn1 = mockTransaction({ id: 'txn-1', ...base, date: new Date('2026-02-25T10:00:00Z') });
    const txn2 = mockTransaction({ id: 'txn-2', ...base, date: new Date('2026-02-25T11:00:00Z') });
    const txn3 = mockTransaction({ id: 'txn-3', ...base, date: new Date('2026-02-25T12:00:00Z') });

    mockFindMany.mockResolvedValue([txn1, txn2, txn3]);

    const results = await analyzeDuplicates(ENTITY_ID, TENANT_ID);
    // 3 transactions = 3 pairs (1-2, 1-3, 2-3)
    expect(results).toHaveLength(3);
    const triggerIds = results.map((r) => r.triggerId);
    // All unique
    expect(new Set(triggerIds).size).toBe(3);
  });

  it('should store metadata with integer cents amounts', async () => {
    const txn1 = mockTransaction({ id: 'txn-1', amount: -15050 }); // -$150.50
    const txn2 = mockTransaction({
      id: 'txn-2',
      amount: -15050,
      date: new Date('2026-02-25T12:00:00Z'),
    });

    mockFindMany.mockResolvedValue([txn1, txn2]);

    const results = await analyzeDuplicates(ENTITY_ID, TENANT_ID);
    const metadata = results[0].metadata as DuplicateExpenseMetadata;

    expect(metadata.transaction1.amount).toBe(-15050); // Integer cents preserved
    expect(metadata.transaction2.amount).toBe(-15050);
    expect(Number.isInteger(metadata.transaction1.amount)).toBe(true);
  });

  it('should query with tenant isolation', async () => {
    mockFindMany.mockResolvedValue([]);

    await analyzeDuplicates(ENTITY_ID, TENANT_ID);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          account: {
            entity: {
              id: ENTITY_ID,
              tenantId: TENANT_ID,
            },
          },
        }),
      })
    );
  });

  it('should skip transactions with empty descriptions', async () => {
    const txn1 = mockTransaction({ id: 'txn-1', description: '' });
    const txn2 = mockTransaction({
      id: 'txn-2',
      description: '',
      date: new Date('2026-02-25T12:00:00Z'),
    });

    mockFindMany.mockResolvedValue([txn1, txn2]);

    const results = await analyzeDuplicates(ENTITY_ID, TENANT_ID);
    expect(results).toHaveLength(0);
  });
});
