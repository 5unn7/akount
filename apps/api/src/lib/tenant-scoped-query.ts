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

  // Runtime assertion: verify the SQL references tenantId in a WHERE clause context
  // Defense-in-depth — a comment or alias containing "tenantId" won't pass
  const sqlString = sql.strings.join('');
  const hasTenantFilter =
    /WHERE[\s\S]*?"tenantId"\s*=/.test(sqlString) ||
    /WHERE[\s\S]*?"tenant_id"\s*=/.test(sqlString) ||
    /WHERE[\s\S]*?\."tenantId"/.test(sqlString);

  if (!hasTenantFilter) {
    throw new Error(
      'Raw SQL query does not filter by tenantId in a WHERE clause. ' +
      'All report queries must filter by tenant for security.'
    );
  }

  return prisma.$queryRaw<T[]>(sql);
}
