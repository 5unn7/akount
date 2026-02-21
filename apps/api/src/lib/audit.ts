import { prisma, AuditAction, Prisma } from '@akount/db';
import { createHash } from 'crypto';
import { logger } from './logger';

/**
 * Audit Logging Service — SEC-13 Enhanced with Tamper Detection
 *
 * Creates audit trail for financial operations with hash chain integrity.
 * Required for compliance (SOC 2, GDPR) and forensic analysis.
 *
 * Tamper detection features:
 * - SHA-256 integrity hash per entry (detects modification)
 * - Hash chain linking (detects deletion/insertion)
 * - Monotonic sequence numbers per tenant (detects gaps)
 *
 * ARCH-6 Enhancement:
 * - Transaction-safe: accepts optional Prisma transaction client
 * - When called inside a transaction, audit logs roll back with the parent operation
 * - Prevents phantom audit trails for failed operations
 */
export interface AuditLogParams {
  tenantId: string;
  userId: string;
  entityId?: string;
  model: string;
  recordId: string;
  action: AuditAction;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/**
 * Compute SHA-256 hash of audit log entry data.
 *
 * Hash covers: tenantId, userId, model, recordId, action, before, after, previousHash, sequenceNumber.
 * This ensures any change to the entry's content invalidates the hash.
 */
function computeEntryHash(
  entry: {
    tenantId: string;
    userId: string;
    entityId?: string | null;
    model: string;
    recordId: string;
    action: string;
    before: unknown;
    after: unknown;
  },
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
    before: entry.before,
    after: entry.after,
    previousHash,
    sequenceNumber,
  });

  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Create an audit log entry with tamper-detection hash chain.
 *
 * 1. Fetches the latest audit log entry for this tenant (for chain linking)
 * 2. Computes integrity hash covering entry data + previous hash
 * 3. Stores entry with hash, previous hash, and sequence number
 *
 * ARCH-6: Transaction-safe logging
 * - If `tx` is provided, uses the transaction client (logs roll back with parent operation)
 * - If `tx` is omitted, uses global prisma client (fire-and-forget, backward compatible)
 *
 * Non-critical: errors are logged but do not fail the parent operation.
 *
 * @param params - Audit log parameters
 * @param tx - Optional Prisma transaction client (for transaction-safe logging)
 */
export async function createAuditLog(
  params: AuditLogParams,
  tx?: Prisma.TransactionClient
): Promise<void> {
  try {
    // FIN-19: Normalize empty string entityId to undefined to prevent FK violations
    const entityId = params.entityId && params.entityId.trim() !== '' ? params.entityId : undefined;

    const entryData = {
      tenantId: params.tenantId,
      userId: params.userId,
      entityId,
      model: params.model,
      recordId: params.recordId,
      action: params.action,
      before: params.before ? (JSON.parse(JSON.stringify(params.before)) as Prisma.InputJsonValue) : Prisma.JsonNull,
      after: params.after ? (JSON.parse(JSON.stringify(params.after)) as Prisma.InputJsonValue) : Prisma.JsonNull,
    };

    // ARCH-7: The read (findFirst) + write (create) must be atomic to prevent
    // concurrent requests from producing duplicate sequence numbers.
    // When a caller-provided tx exists, use it directly (caller owns the lock).
    // Otherwise, wrap in a serializable transaction for hash chain integrity.
    if (tx) {
      await writeAuditEntry(tx, params.tenantId, entryData);
    } else {
      await prisma.$transaction(
        async (txClient) => {
          await writeAuditEntry(txClient, params.tenantId, entryData);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    }
  } catch (error) {
    // Don't fail the operation if audit logging fails, but log the error
    logger.error({ err: error }, 'Failed to create audit log');
  }
}

/**
 * Internal: write audit entry with hash chain linking.
 * Must be called within a serializable transaction for correctness.
 */
async function writeAuditEntry(
  client: Prisma.TransactionClient,
  tenantId: string,
  entryData: {
    tenantId: string;
    userId: string;
    entityId?: string;
    model: string;
    recordId: string;
    action: AuditAction;
    before: unknown;
    after: unknown;
  },
): Promise<void> {
  const lastEntry = await client.auditLog.findFirst({
    where: { tenantId },
    orderBy: { sequenceNumber: 'desc' },
    select: { integrityHash: true, sequenceNumber: true },
  });

  const previousHash = lastEntry?.integrityHash ?? 'GENESIS';
  const sequenceNumber = (lastEntry?.sequenceNumber ?? 0) + 1;

  const integrityHash = computeEntryHash(entryData, previousHash, sequenceNumber);

  await client.auditLog.create({
    data: {
      ...entryData,
      before: entryData.before as Prisma.InputJsonValue ?? Prisma.JsonNull,
      after: entryData.after as Prisma.InputJsonValue ?? Prisma.JsonNull,
      integrityHash,
      previousHash,
      sequenceNumber,
    },
  });
}

export interface AuditChainVerification {
  valid: boolean;
  totalEntries: number;
  checkedEntries: number;
  firstInvalidEntry?: string;
  error?: string;
}

/**
 * Verify the integrity of the audit log chain for a tenant.
 *
 * Walks through all audit log entries in sequence order and verifies:
 * 1. Each entry's integrityHash matches recomputed hash (detects modification)
 * 2. Each entry's previousHash matches the prior entry's hash (detects deletion/insertion)
 * 3. Sequence numbers are monotonically increasing with no gaps (detects deletion)
 *
 * @param tenantId - Tenant whose audit chain to verify
 * @param batchSize - Number of entries to process per batch (for large chains)
 * @returns Verification result with chain status
 */
export async function verifyAuditChain(
  tenantId: string,
  batchSize = 500,
): Promise<AuditChainVerification> {
  try {
    const totalEntries = await prisma.auditLog.count({
      where: { tenantId },
    });

    if (totalEntries === 0) {
      return { valid: true, totalEntries: 0, checkedEntries: 0 };
    }

    let cursor: string | undefined;
    let expectedPreviousHash = 'GENESIS';
    let expectedSequence = 1;
    let checkedEntries = 0;

    while (true) {
      const entries = await prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { sequenceNumber: 'asc' },
        take: batchSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      if (entries.length === 0) break;

      for (const entry of entries) {
        checkedEntries++;

        // Skip legacy entries without hashes (pre-SEC-13)
        if (!entry.integrityHash || !entry.sequenceNumber) {
          expectedPreviousHash = entry.integrityHash ?? 'GENESIS';
          expectedSequence = (entry.sequenceNumber ?? 0) + 1;
          continue;
        }

        // Check 1: Sequence number continuity
        if (entry.sequenceNumber !== expectedSequence) {
          return {
            valid: false,
            totalEntries,
            checkedEntries,
            firstInvalidEntry: entry.id,
            error: `Sequence gap: expected ${expectedSequence}, got ${entry.sequenceNumber}`,
          };
        }

        // Check 2: Previous hash chain link
        if (entry.previousHash !== expectedPreviousHash) {
          return {
            valid: false,
            totalEntries,
            checkedEntries,
            firstInvalidEntry: entry.id,
            error: `Chain broken: previousHash mismatch at sequence ${entry.sequenceNumber}`,
          };
        }

        // Check 3: Entry integrity hash
        const recomputedHash = computeEntryHash(
          {
            tenantId: entry.tenantId,
            userId: entry.userId ?? '',
            entityId: entry.entityId,
            model: entry.model,
            recordId: entry.recordId,
            action: entry.action,
            before: entry.before,
            after: entry.after,
          },
          entry.previousHash ?? 'GENESIS',
          entry.sequenceNumber,
        );

        if (recomputedHash !== entry.integrityHash) {
          return {
            valid: false,
            totalEntries,
            checkedEntries,
            firstInvalidEntry: entry.id,
            error: `Integrity hash mismatch at sequence ${entry.sequenceNumber} (entry modified)`,
          };
        }

        expectedPreviousHash = entry.integrityHash;
        expectedSequence = entry.sequenceNumber + 1;
      }

      cursor = entries[entries.length - 1].id;
    }

    return { valid: true, totalEntries, checkedEntries };
  } catch (error) {
    logger.error({ err: error, tenantId }, 'Failed to verify audit chain');
    return {
      valid: false,
      totalEntries: 0,
      checkedEntries: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
