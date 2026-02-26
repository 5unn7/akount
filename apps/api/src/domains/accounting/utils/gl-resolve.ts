import type { Prisma } from '@akount/db';
import { AccountingError } from '../errors';

/**
 * Resolve a GL account by well-known code within an entity.
 * Throws AccountingError if not found (COA must be seeded first).
 *
 * MUST be called within a Prisma transaction for consistency.
 *
 * @param tx - Prisma transaction client
 * @param entityId - Entity ID to search within
 * @param code - Well-known GL account code (e.g., '1200' for AR)
 * @returns GL account { id, code, name }
 *
 * @example
 * ```typescript
 * import { resolveGLAccountByCode } from '../utils/gl-resolve';
 *
 * const arAccount = await resolveGLAccountByCode(tx, entityId, '1200');
 * ```
 */
export async function resolveGLAccountByCode(
  tx: Prisma.TransactionClient,
  entityId: string,
  code: string
) {
  const account = await tx.gLAccount.findFirst({
    where: {
      entityId,
      code,
      isActive: true,
    },
    select: { id: true, code: true, name: true },
  });

  if (!account) {
    throw new AccountingError(
      `Required GL account ${code} not found — seed the Chart of Accounts first`,
      'GL_ACCOUNT_NOT_FOUND',
      400,
      { code, entityId }
    );
  }

  return account;
}
