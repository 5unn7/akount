import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma, Prisma } from '@akount/db';
import { tenantScopedQuery } from '../tenant-scoped-query';

// Mock the prisma import
vi.mock('@akount/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings: Array.from(strings),
      values,
    }),
  },
}));

describe('tenantScopedQuery', () => {
  const mockPrisma = vi.mocked(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute query when tenantId is provided and referenced', async () => {
    const tenantId = 'tenant-123';
    const mockResult = [{ id: '1', name: 'Test' }];
    mockPrisma.$queryRaw.mockResolvedValueOnce(mockResult);

    const result = await tenantScopedQuery(tenantId, (tid) =>
      Prisma.sql`SELECT * FROM "Entity" WHERE "tenantId" = ${tid}`
    );

    expect(result).toEqual(mockResult);
    expect(mockPrisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it('should throw error when tenantId is missing', async () => {
    await expect(
      tenantScopedQuery('', () => Prisma.sql`SELECT 1`)
    ).rejects.toThrow('tenantId is required for all raw SQL queries');

    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('should throw error when query does not reference tenantId', async () => {
    const tenantId = 'tenant-123';

    await expect(
      tenantScopedQuery(tenantId, () =>
        Prisma.sql`SELECT * FROM "Entity"` // Missing WHERE tenantId
      )
    ).rejects.toThrow('Raw SQL query does not filter by tenantId in a WHERE clause');

    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('should accept queries with tenant_id snake_case', async () => {
    const tenantId = 'tenant-123';
    const mockResult = [{ count: 10 }];
    mockPrisma.$queryRaw.mockResolvedValueOnce(mockResult);

    const result = await tenantScopedQuery(tenantId, (tid) =>
      Prisma.sql`SELECT COUNT(*) FROM "Entity" WHERE "tenant_id" = ${tid}`
    );

    expect(result).toEqual(mockResult);
    expect(mockPrisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it('should accept queries with nested tenant filter', async () => {
    const tenantId = 'tenant-123';
    const mockResult = [{ total: 1000 }];
    mockPrisma.$queryRaw.mockResolvedValueOnce(mockResult);

    const result = await tenantScopedQuery(
      tenantId,
      (tid) => Prisma.sql`
        SELECT SUM(amount) as total
        FROM "Invoice"
        WHERE "entityId" IN (
          SELECT id FROM "Entity" WHERE "tenantId" = ${tid}
        )
      `
    );

    expect(result).toEqual(mockResult);
    expect(mockPrisma.$queryRaw).toHaveBeenCalledOnce();
  });
});
