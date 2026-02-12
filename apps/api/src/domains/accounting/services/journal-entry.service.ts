import { prisma, Prisma } from '@akount/db';
import { AccountingError } from '../errors';
import { createAuditLog } from '../../../lib/audit';
import type { CreateJournalEntryInput, ListJournalEntriesQuery } from '../schemas/journal-entry.schema';

const JOURNAL_ENTRY_SELECT = {
  id: true,
  entityId: true,
  entryNumber: true,
  date: true,
  memo: true,
  sourceType: true,
  sourceId: true,
  sourceDocument: true,
  linkedEntryId: true,
  status: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  journalLines: {
    where: { deletedAt: null },
    select: {
      id: true,
      glAccountId: true,
      debitAmount: true,
      creditAmount: true,
      memo: true,
      glAccount: {
        select: { id: true, code: true, name: true, type: true },
      },
    },
  },
} as const;

const JOURNAL_ENTRY_LIST_SELECT = {
  id: true,
  entityId: true,
  entryNumber: true,
  date: true,
  memo: true,
  sourceType: true,
  status: true,
  createdBy: true,
  createdAt: true,
  _count: {
    select: { journalLines: { where: { deletedAt: null } } },
  },
  journalLines: {
    where: { deletedAt: null },
    select: { debitAmount: true },
  },
} as const;

export class JournalEntryService {
  constructor(
    private tenantId: string,
    private userId: string,
    private userRole?: string
  ) {}

  /**
   * List journal entries for an entity with optional filters and cursor pagination.
   */
  async listEntries(params: ListJournalEntriesQuery) {
    await this.validateEntityOwnership(params.entityId);

    const where: Prisma.JournalEntryWhereInput = {
      entityId: params.entityId,
      entity: { tenantId: this.tenantId },
      deletedAt: null,
    };

    if (params.status) where.status = params.status;
    if (params.sourceType) where.sourceType = params.sourceType;
    if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) where.date.gte = new Date(params.dateFrom);
      if (params.dateTo) where.date.lte = new Date(params.dateTo);
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      select: JOURNAL_ENTRY_LIST_SELECT,
      orderBy: { date: 'desc' },
      take: params.limit + 1, // Fetch one extra to detect next page
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = entries.length > params.limit;
    const items = hasMore ? entries.slice(0, params.limit) : entries;

    return {
      items: items.map(entry => ({
        id: entry.id,
        entityId: entry.entityId,
        entryNumber: entry.entryNumber,
        date: entry.date,
        memo: entry.memo,
        sourceType: entry.sourceType,
        status: entry.status,
        createdBy: entry.createdBy,
        createdAt: entry.createdAt,
        lineCount: entry._count.journalLines,
        totalAmount: entry.journalLines.reduce((sum, l) => sum + l.debitAmount, 0),
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  /**
   * Get a single journal entry with all lines and GL account details.
   */
  async getEntry(id: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
      select: JOURNAL_ENTRY_SELECT,
    });

    if (!entry) {
      throw new AccountingError(
        'Journal entry not found',
        'GL_ACCOUNT_NOT_FOUND', // Reusing generic not-found code
        404
      );
    }

    return entry;
  }

  /**
   * Create a new journal entry (DRAFT status).
   *
   * Validates:
   * - Entity ownership (tenant isolation)
   * - Fiscal period (not LOCKED/CLOSED)
   * - All GL accounts belong to same entity + tenant (cross-entity IDOR prevention)
   * - Double-entry balance (defense-in-depth — Zod already validated)
   */
  async createEntry(data: CreateJournalEntryInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate entity belongs to tenant
      await this.validateEntityOwnershipTx(tx, data.entityId);

      // 2. Fiscal period check
      await this.checkFiscalPeriod(tx, data.entityId, new Date(data.date));

      // 3. Validate ALL GL accounts belong to same entity + tenant
      const glAccountIds = [...new Set(data.lines.map(l => l.glAccountId))];
      const foundAccounts = await tx.gLAccount.findMany({
        where: {
          id: { in: glAccountIds },
          entityId: data.entityId,
          entity: { tenantId: this.tenantId },
          isActive: true,
        },
        select: { id: true },
      });

      if (foundAccounts.length !== glAccountIds.length) {
        throw new AccountingError(
          'One or more GL accounts not found, inactive, or belong to a different entity',
          'CROSS_ENTITY_REFERENCE',
          403
        );
      }

      // 4. Defense-in-depth: double-entry balance check
      const totalDebits = data.lines.reduce((s, l) => s + l.debitAmount, 0);
      const totalCredits = data.lines.reduce((s, l) => s + l.creditAmount, 0);
      if (totalDebits !== totalCredits) {
        throw new AccountingError(
          `Journal entry not balanced: debits ${totalDebits} ≠ credits ${totalCredits}`,
          'UNBALANCED_ENTRY',
          400
        );
      }

      // 5. Generate sequential entry number
      const entryNumber = await this.generateEntryNumber(tx, data.entityId);

      // 6. Create the journal entry as DRAFT
      const entry = await tx.journalEntry.create({
        data: {
          entityId: data.entityId,
          entryNumber,
          date: new Date(data.date),
          memo: data.memo,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          sourceDocument: data.sourceDocument as Prisma.InputJsonValue ?? undefined,
          status: 'DRAFT',
          createdBy: this.userId,
          journalLines: {
            create: data.lines.map(line => ({
              glAccountId: line.glAccountId,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              memo: line.memo,
            })),
          },
        },
        select: JOURNAL_ENTRY_SELECT,
      });

      // 7. Audit log
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId: data.entityId,
        model: 'JournalEntry',
        recordId: entry.id,
        action: 'CREATE',
        after: {
          entryNumber,
          memo: data.memo,
          status: 'DRAFT',
          lineCount: data.lines.length,
          totalAmount: totalDebits,
        },
      });

      return entry;
    });
  }

  /**
   * Approve a journal entry (DRAFT → POSTED).
   *
   * Enforces:
   * - Entry must be DRAFT
   * - Fiscal period check
   * - Separation of duties: creator cannot approve own entry (unless OWNER)
   */
  async approveEntry(id: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
      select: {
        id: true,
        entityId: true,
        date: true,
        status: true,
        createdBy: true,
      },
    });

    if (!entry) {
      throw new AccountingError('Journal entry not found', 'GL_ACCOUNT_NOT_FOUND', 404);
    }

    if (entry.status !== 'DRAFT') {
      throw new AccountingError(
        'Only DRAFT entries can be approved',
        'ALREADY_POSTED',
        409
      );
    }

    // Fiscal period check
    await this.checkFiscalPeriodDirect(entry.entityId, entry.date);

    // Separation of duties: creator cannot approve own entry (except OWNER)
    if (entry.createdBy === this.userId && this.userRole !== 'OWNER') {
      throw new AccountingError(
        'Creator cannot approve their own journal entry',
        'SEPARATION_OF_DUTIES',
        403
      );
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'POSTED',
        updatedBy: this.userId,
      },
      select: JOURNAL_ENTRY_SELECT,
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: entry.entityId,
      model: 'JournalEntry',
      recordId: id,
      action: 'UPDATE',
      before: { status: 'DRAFT' },
      after: { status: 'POSTED' },
    });

    return updated;
  }

  /**
   * Void a POSTED journal entry by creating a reversing entry.
   *
   * Uses Serializable isolation to prevent concurrent double-void.
   * Original entry: status → VOIDED, linkedEntryId → reversal entry
   * Reversal entry: swapped debit/credit, status POSTED, sourceType ADJUSTMENT
   */
  async voidEntry(id: string) {
    return await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.findFirst({
        where: {
          id,
          entity: { tenantId: this.tenantId },
          deletedAt: null,
        },
        select: {
          id: true,
          entityId: true,
          entryNumber: true,
          date: true,
          memo: true,
          status: true,
          linkedFrom: { select: { id: true } },
          journalLines: {
            where: { deletedAt: null },
            select: {
              glAccountId: true,
              debitAmount: true,
              creditAmount: true,
              memo: true,
            },
          },
        },
      });

      if (!entry) {
        throw new AccountingError('Journal entry not found', 'GL_ACCOUNT_NOT_FOUND', 404);
      }

      if (entry.status === 'VOIDED') {
        throw new AccountingError('Journal entry is already voided', 'ALREADY_VOIDED', 409);
      }

      if (entry.status !== 'POSTED') {
        throw new AccountingError(
          'Only POSTED entries can be voided',
          'IMMUTABLE_POSTED_ENTRY',
          400
        );
      }

      // Check for existing reversal (double-void prevention)
      if (entry.linkedFrom.length > 0) {
        throw new AccountingError('Journal entry already has a reversal', 'ALREADY_VOIDED', 409);
      }

      // Generate entry number for reversal
      const reversalNumber = await this.generateEntryNumber(tx, entry.entityId);

      // Create reversing entry (swap debit/credit)
      const reversal = await tx.journalEntry.create({
        data: {
          entityId: entry.entityId,
          entryNumber: reversalNumber,
          date: new Date(),
          memo: `REVERSAL: ${entry.memo}`,
          sourceType: 'ADJUSTMENT',
          sourceId: entry.id,
          linkedEntryId: entry.id,
          status: 'POSTED',
          createdBy: this.userId,
          journalLines: {
            create: entry.journalLines.map(line => ({
              glAccountId: line.glAccountId,
              debitAmount: line.creditAmount,   // Swap
              creditAmount: line.debitAmount,   // Swap
              memo: line.memo ? `REVERSAL: ${line.memo}` : null,
            })),
          },
        },
        select: { id: true },
      });

      // Update original: VOIDED
      await tx.journalEntry.update({
        where: { id },
        data: {
          status: 'VOIDED',
          updatedBy: this.userId,
        },
      });

      // Audit logs
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId: entry.entityId,
        model: 'JournalEntry',
        recordId: id,
        action: 'UPDATE',
        before: { status: 'POSTED' },
        after: { status: 'VOIDED', reversalId: reversal.id },
      });

      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId: entry.entityId,
        model: 'JournalEntry',
        recordId: reversal.id,
        action: 'CREATE',
        after: { memo: `REVERSAL: ${entry.memo}`, status: 'POSTED' },
      });

      return {
        voidedEntryId: id,
        reversalEntryId: reversal.id,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  /**
   * Soft-delete a journal entry. Only DRAFT entries can be deleted.
   * POSTED/VOIDED entries must be voided instead.
   */
  async deleteEntry(id: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
      select: {
        id: true,
        entityId: true,
        status: true,
      },
    });

    if (!entry) {
      throw new AccountingError('Journal entry not found', 'GL_ACCOUNT_NOT_FOUND', 404);
    }

    if (entry.status !== 'DRAFT') {
      throw new AccountingError(
        'Only DRAFT entries can be deleted — use void for POSTED entries',
        'IMMUTABLE_POSTED_ENTRY',
        400
      );
    }

    await prisma.journalEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: entry.entityId,
      model: 'JournalEntry',
      recordId: id,
      action: 'DELETE',
      before: { status: 'DRAFT' },
    });

    return { deleted: true };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private async validateEntityOwnership(entityId: string) {
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId: this.tenantId },
      select: { id: true },
    });

    if (!entity) {
      throw new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 403);
    }

    return entity;
  }

  private async validateEntityOwnershipTx(
    tx: Prisma.TransactionClient,
    entityId: string
  ) {
    const entity = await tx.entity.findFirst({
      where: { id: entityId, tenantId: this.tenantId },
      select: { id: true },
    });

    if (!entity) {
      throw new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 403);
    }

    return entity;
  }

  /**
   * Check if a fiscal period exists for the given date and is LOCKED/CLOSED.
   * If no fiscal period exists, allow (graceful degradation for MVP).
   */
  private async checkFiscalPeriod(
    tx: Prisma.TransactionClient,
    entityId: string,
    date: Date
  ) {
    const period = await tx.fiscalPeriod.findFirst({
      where: {
        fiscalCalendar: { entityId },
        startDate: { lte: date },
        endDate: { gte: date },
        status: { in: ['LOCKED', 'CLOSED'] },
      },
      select: { id: true, name: true, status: true },
    });

    if (period) {
      throw new AccountingError(
        `Cannot post to ${period.status.toLowerCase()} fiscal period: ${period.name}`,
        'FISCAL_PERIOD_CLOSED',
        400,
        { periodId: period.id, periodName: period.name, periodStatus: period.status }
      );
    }
  }

  /**
   * Direct (non-transaction) fiscal period check for approve workflow.
   */
  private async checkFiscalPeriodDirect(entityId: string, date: Date) {
    const period = await prisma.fiscalPeriod.findFirst({
      where: {
        fiscalCalendar: { entityId },
        startDate: { lte: date },
        endDate: { gte: date },
        status: { in: ['LOCKED', 'CLOSED'] },
      },
      select: { id: true, name: true, status: true },
    });

    if (period) {
      throw new AccountingError(
        `Cannot post to ${period.status.toLowerCase()} fiscal period: ${period.name}`,
        'FISCAL_PERIOD_CLOSED',
        400,
        { periodId: period.id, periodName: period.name, periodStatus: period.status }
      );
    }
  }

  /**
   * Generate sequential entry number per entity (JE-001, JE-002, etc.).
   */
  private async generateEntryNumber(
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
}
