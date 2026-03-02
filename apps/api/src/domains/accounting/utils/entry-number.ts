import type { Prisma } from '@akount/db';

/**
 * Generate sequential JE entry number per entity (JE-001, JE-002, etc.).
 * MUST be called within a transaction to prevent race conditions.
 *
 * @param tx - Prisma transaction client
 * @param entityId - Entity ID to generate entry number for
 * @returns Sequential entry number (e.g., "JE-001")
 *
 * @example
 * await prisma.$transaction(async (tx) => {
 *   const entryNumber = await generateEntryNumber(tx, entityId);
 *   const entry = await tx.journalEntry.create({
 *     data: { entryNumber, entityId, ... }
 *   });
 * });
 */
export async function generateEntryNumber(
  tx: Prisma.TransactionClient,
  entityId: string
): Promise<string> {
  const lastEntry = await tx.journalEntry.findFirst({
    where: { entityId, entryNumber: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { entryNumber: true },
  });

  let nextNum = 1;
  if (lastEntry?.entryNumber) {
    const match = lastEntry.entryNumber.match(/JE-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `JE-${String(nextNum).padStart(3, '0')}`;
}
