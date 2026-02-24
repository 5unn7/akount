import { prisma } from '@akount/db';
import { AccountingError } from '../errors';

/**
 * Validates that an entity belongs to the given tenant.
 * Throws AccountingError with 403 if not found or access denied.
 *
 * Usage: await validateEntityOwnership(entityId, tenantId);
 */
export async function validateEntityOwnership(
    entityId: string,
    tenantId: string
): Promise<{ id: string }> {
    const entity = await prisma.entity.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
    });

    if (!entity) {
        throw new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 403);
    }

    return entity;
}

/**
 * Validates that a GL account belongs to an entity owned by the given tenant.
 * Throws AccountingError with 403 if not found or access denied.
 *
 * Usage: await validateGLAccountOwnership(glAccountId, tenantId);
 */
export async function validateGLAccountOwnership(
    glAccountId: string,
    tenantId: string
): Promise<{ id: string }> {
    const glAccount = await prisma.gLAccount.findFirst({
        where: { id: glAccountId, entity: { tenantId } },
        select: { id: true },
    });

    if (!glAccount) {
        throw new AccountingError('GL account not found', 'GL_ACCOUNT_NOT_FOUND', 403);
    }

    return glAccount;
}
