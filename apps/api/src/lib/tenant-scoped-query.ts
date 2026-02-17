import { prisma, Prisma } from '@akount/db';

/**
 * Execute tenant-scoped raw SQL.
 * Enforces that tenantId is passed and the query references it.
 *
 * All Phase 5 report queries MUST use this wrapper instead of direct $queryRaw.
 *
 * @throws Error if tenantId is missing or query doesn't reference tenantId
 */
export async function tenantScopedQuery<T>(
  tenantId: string,
  queryBuilder: (tenantId: string) => Prisma.Sql
): Promise<T[]> {
  if (!tenantId) {
    throw new Error('tenantId is required for all raw SQL queries');
  }

  const sql = queryBuilder(tenantId);

  // Runtime assertion: verify the SQL text contains a tenantId parameter
  // This is defense-in-depth, not a substitute for correct SQL
  const sqlString = sql.strings.join('');
  if (!sqlString.includes('tenantId') && !sqlString.includes('tenant_id')) {
    throw new Error(
      'Raw SQL query does not reference tenantId. ' +
      'All report queries must filter by tenant for security.'
    );
  }

  return prisma.$queryRaw<T[]>(sql);
}
