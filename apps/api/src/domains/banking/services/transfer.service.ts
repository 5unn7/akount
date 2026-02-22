import { prisma, Prisma } from '@akount/db';
import { AccountingError } from '../../accounting/errors';
import { createAuditLog } from '../../../lib/audit';
import type { CreateTransferInput, ListTransfersQuery } from '../schemas/transfer.schema';

/** Account types that allow negative balance (overdraft). These represent liabilities where spending increases the balance owed. */
const OVERDRAFT_ALLOWED_TYPES = ['CREDIT_CARD', 'LOAN', 'MORTGAGE'] as const;

/**
 * Transfer Service
 *
 * Creates inter-account transfers with paired journal entries.
 * Maintains double-entry bookkeeping by creating two linked JEs.
 */
export class TransferService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  /**
   * Create a transfer between two accounts.
   *
   * Creates 2 paired journal entries with linkedEntryId connecting them.
   * Both entries are posted immediately (status: POSTED).
   *
   * Validation:
   * - Accounts must exist, be active, and belong to same entity
   * - Accounts must have glAccountId set
   * - Sufficient balance check (skipped for CREDIT_CARD/LOAN accounts)
   * - Multi-currency requires exchangeRate
   */
  async createTransfer(data: CreateTransferInput) {
    return await prisma.$transaction(
      async (tx) => {
        // 1. Load both accounts with tenant filter
        const [fromAccount, toAccount] = await Promise.all([
          tx.account.findFirst({
            where: {
              id: data.fromAccountId,
              isActive: true,
              deletedAt: null,
              entity: { tenantId: this.tenantId },
            },
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
              currentBalance: true,
              glAccountId: true,
              entityId: true,
              entity: {
                select: {
                  id: true,
                  functionalCurrency: true,
                },
              },
            },
          }),
          tx.account.findFirst({
            where: {
              id: data.toAccountId,
              isActive: true,
              deletedAt: null,
              entity: { tenantId: this.tenantId },
            },
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
              glAccountId: true,
              entityId: true,
            },
          }),
        ]);

        // 2. Validate accounts exist
        if (!fromAccount) {
          throw new AccountingError(
            'From account not found or inactive',
            'ACCOUNT_NOT_FOUND',
            404
          );
        }

        if (!toAccount) {
          throw new AccountingError(
            'To account not found or inactive',
            'ACCOUNT_NOT_FOUND',
            404
          );
        }

        // 3. Validate GL account linkage
        if (!fromAccount.glAccountId) {
          throw new AccountingError(
            `Account "${fromAccount.name}" is not linked to a GL account — link it first`,
            'GL_ACCOUNT_NOT_LINKED',
            400
          );
        }

        if (!toAccount.glAccountId) {
          throw new AccountingError(
            `Account "${toAccount.name}" is not linked to a GL account — link it first`,
            'GL_ACCOUNT_NOT_LINKED',
            400
          );
        }

        // 4. Cross-entity check
        if (fromAccount.entityId !== toAccount.entityId) {
          throw new AccountingError(
            'Cannot transfer between accounts from different entities',
            'CROSS_ENTITY_TRANSFER',
            403
          );
        }

        const entityId = fromAccount.entityId;
        const entityCurrency = fromAccount.entity.functionalCurrency;

        // 5. Currency validation
        if (data.currency !== fromAccount.currency) {
          throw new AccountingError(
            `Transfer currency ${data.currency} must match from account currency ${fromAccount.currency}`,
            'CURRENCY_MISMATCH',
            400
          );
        }

        const isMultiCurrency = fromAccount.currency !== toAccount.currency;
        if (isMultiCurrency && !data.exchangeRate) {
          throw new AccountingError(
            `Multi-currency transfer requires exchange rate (${fromAccount.currency} → ${toAccount.currency})`,
            'MISSING_EXCHANGE_RATE',
            400
          );
        }

        // 6. Balance check (allow negative for credit cards and loans)
        const allowNegativeBalance = (OVERDRAFT_ALLOWED_TYPES as readonly string[]).includes(
          fromAccount.type
        );
        if (!allowNegativeBalance && fromAccount.currentBalance < data.amount) {
          throw new AccountingError(
            `Insufficient balance: ${fromAccount.name} has ${fromAccount.currentBalance} cents, transfer requires ${data.amount} cents`,
            'INSUFFICIENT_BALANCE',
            400
          );
        }

        // 7. Calculate amounts for multi-currency
        // @todo Multi-currency limitation: exchangeRate is used for both cross-account
        // conversion AND entity base currency conversion. This works when one account
        // matches the entity's functional currency, but may produce incorrect
        // baseCurrencyAmount when NEITHER account matches. A proper fix requires
        // separate exchange rates per currency pair or an exchange rate table.
        const fromAmount = data.amount;
        const toAmount = isMultiCurrency && data.exchangeRate
          ? Math.round(data.amount * data.exchangeRate)
          : data.amount;
        const baseCurrencyFromAmount = fromAccount.currency !== entityCurrency && data.exchangeRate
          ? Math.round(fromAmount * data.exchangeRate)
          : fromAmount;
        const baseCurrencyToAmount = toAccount.currency !== entityCurrency && data.exchangeRate
          ? Math.round(toAmount * data.exchangeRate)
          : toAmount;

        const transferDate = data.date ? new Date(data.date) : new Date();

        // 8. Create first journal entry (from perspective)
        const entry1 = await tx.journalEntry.create({
          data: {
            entityId,
            date: transferDate,
            memo: data.memo || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
            sourceType: 'TRANSFER',
            sourceId: null, // No source document for manual transfers
            sourceDocument: {
              fromAccountId: fromAccount.id,
              fromAccountName: fromAccount.name,
              toAccountId: toAccount.id,
              toAccountName: toAccount.name,
              amount: data.amount,
              currency: data.currency,
              exchangeRate: data.exchangeRate,
            },
            status: 'POSTED',
            createdBy: this.userId,
            journalLines: {
              create: [
                // DR to account (money arrives)
                {
                  glAccountId: toAccount.glAccountId,
                  debitAmount: toAmount,
                  creditAmount: 0,
                  currency: toAccount.currency,
                  exchangeRate: data.exchangeRate ?? 1,
                  baseCurrencyDebit: baseCurrencyToAmount,
                  baseCurrencyCredit: 0,
                  memo: `Transfer from ${fromAccount.name}`,
                },
                // CR from account (money leaves)
                {
                  glAccountId: fromAccount.glAccountId,
                  debitAmount: 0,
                  creditAmount: fromAmount,
                  currency: fromAccount.currency,
                  exchangeRate: data.exchangeRate ?? 1,
                  baseCurrencyDebit: 0,
                  baseCurrencyCredit: baseCurrencyFromAmount,
                  memo: `Transfer to ${toAccount.name}`,
                },
              ],
            },
          },
          select: { id: true, entityId: true },
        });

        // 9. Create second journal entry (to perspective, linked)
        const entry2 = await tx.journalEntry.create({
          data: {
            entityId,
            date: transferDate,
            memo: data.memo || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
            sourceType: 'TRANSFER',
            sourceId: null,
            sourceDocument: {
              fromAccountId: fromAccount.id,
              fromAccountName: fromAccount.name,
              toAccountId: toAccount.id,
              toAccountName: toAccount.name,
              amount: data.amount,
              currency: data.currency,
              exchangeRate: data.exchangeRate,
            },
            linkedEntryId: entry1.id, // Link back to first entry
            status: 'POSTED',
            createdBy: this.userId,
            journalLines: {
              create: [
                // DR to account
                {
                  glAccountId: toAccount.glAccountId,
                  debitAmount: toAmount,
                  creditAmount: 0,
                  currency: toAccount.currency,
                  exchangeRate: data.exchangeRate ?? 1,
                  baseCurrencyDebit: baseCurrencyToAmount,
                  baseCurrencyCredit: 0,
                  memo: `Transfer from ${fromAccount.name}`,
                },
                // CR from account
                {
                  glAccountId: fromAccount.glAccountId,
                  debitAmount: 0,
                  creditAmount: fromAmount,
                  currency: fromAccount.currency,
                  exchangeRate: data.exchangeRate ?? 1,
                  baseCurrencyDebit: 0,
                  baseCurrencyCredit: baseCurrencyFromAmount,
                  memo: `Transfer to ${toAccount.name}`,
                },
              ],
            },
          },
          select: { id: true },
        });

        // 10. Update entry1 with link to entry2
        await tx.journalEntry.update({
          where: { id: entry1.id },
          data: { linkedEntryId: entry2.id },
        });

        // 11. Update account balances
        await Promise.all([
          tx.account.update({
            where: { id: fromAccount.id },
            data: { currentBalance: { decrement: data.amount } },
          }),
          tx.account.update({
            where: { id: toAccount.id },
            data: { currentBalance: { increment: toAmount } },
          }),
        ]);

        // 12. Create audit logs for both entries
        await Promise.all([
          createAuditLog(
            {
              action: 'CREATE',
              category: 'TRANSACTION',
              entityId,
              tenantId: this.tenantId,
              userId: this.userId,
              resourceType: 'JournalEntry',
              resourceId: entry1.id,
              details: {
                type: 'transfer',
                from: fromAccount.name,
                to: toAccount.name,
                amount: data.amount,
                currency: data.currency,
              },
            },
            tx
          ),
          createAuditLog(
            {
              action: 'CREATE',
              category: 'TRANSACTION',
              entityId,
              tenantId: this.tenantId,
              userId: this.userId,
              resourceType: 'JournalEntry',
              resourceId: entry2.id,
              details: {
                type: 'transfer_linked',
                linkedTo: entry1.id,
              },
            },
            tx
          ),
        ]);

        // 13. Return both journal entry IDs
        return {
          entry1Id: entry1.id,
          entry2Id: entry2.id,
          fromAccount: { id: fromAccount.id, name: fromAccount.name },
          toAccount: { id: toAccount.id, name: toAccount.name },
          amount: data.amount,
          currency: data.currency,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  }

  /**
   * List transfers for an entity.
   * Returns journal entries with sourceType: TRANSFER and their linked pairs.
   */
  async listTransfers(query: ListTransfersQuery) {
    // Validate entity ownership
    const entity = await prisma.entity.findFirst({
      where: { id: query.entityId, tenantId: this.tenantId },
      select: { id: true },
    });

    if (!entity) {
      throw new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 404);
    }

    const where: Prisma.JournalEntryWhereInput = {
      entityId: query.entityId,
      entity: { tenantId: this.tenantId },
      sourceType: 'TRANSFER',
      deletedAt: null,
    };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      select: {
        id: true,
        date: true,
        memo: true,
        sourceDocument: true,
        linkedEntryId: true,
        createdAt: true,
        journalLines: {
          where: { deletedAt: null },
          select: {
            debitAmount: true,
            creditAmount: true,
            currency: true,
            glAccount: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = entries.length > query.limit;
    const items = hasMore ? entries.slice(0, query.limit) : entries;

    return {
      transfers: items.map((entry) => ({
        id: entry.id,
        date: entry.date.toISOString(),
        memo: entry.memo,
        sourceDocument: entry.sourceDocument as Record<string, unknown>,
        linkedEntryId: entry.linkedEntryId,
        amount:
          entry.journalLines.find((l) => l.debitAmount > 0)?.debitAmount ?? 0,
        currency:
          entry.journalLines[0]?.currency ?? 'CAD',
        createdAt: entry.createdAt.toISOString(),
      })),
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  }

  /**
   * Get a single transfer by journal entry ID.
   * Includes the linked journal entry.
   */
  async getTransfer(id: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        sourceType: 'TRANSFER',
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
      select: {
        id: true,
        entityId: true,
        entryNumber: true,
        date: true,
        memo: true,
        sourceDocument: true,
        linkedEntryId: true,
        status: true,
        createdAt: true,
        journalLines: {
          where: { deletedAt: null },
          select: {
            id: true,
            glAccountId: true,
            debitAmount: true,
            creditAmount: true,
            currency: true,
            exchangeRate: true,
            baseCurrencyDebit: true,
            baseCurrencyCredit: true,
            glAccount: {
              select: { id: true, code: true, name: true, type: true },
            },
          },
        },
        linkedEntry: {
          select: {
            id: true,
            entryNumber: true,
            date: true,
            memo: true,
          },
        },
      },
    });

    if (!entry) {
      throw new AccountingError('Transfer not found', 'TRANSFER_NOT_FOUND', 404);
    }

    return entry;
  }

  /**
   * Void a transfer by voiding both linked journal entries
   * and reversing account balance changes.
   */
  async voidTransfer(id: string) {
    return await prisma.$transaction(
      async (tx) => {
        // Load the transfer entry with sourceDocument for balance reversal
        const entry = await tx.journalEntry.findFirst({
          where: {
            id,
            sourceType: 'TRANSFER',
            entity: { tenantId: this.tenantId },
            deletedAt: null,
          },
          select: {
            id: true,
            linkedEntryId: true,
            status: true,
            entityId: true,
            sourceDocument: true,
            journalLines: {
              where: { deletedAt: null },
              select: {
                glAccountId: true,
                debitAmount: true,
                creditAmount: true,
              },
            },
          },
        });

        if (!entry) {
          throw new AccountingError('Transfer not found', 'TRANSFER_NOT_FOUND', 404);
        }

        if (entry.status === 'VOIDED') {
          throw new AccountingError(
            'Transfer is already voided',
            'ALREADY_VOIDED',
            409
          );
        }

        // Parse sourceDocument for balance reversal
        const source = entry.sourceDocument as Record<string, unknown> | null;
        if (
          !source ||
          typeof source.fromAccountId !== 'string' ||
          typeof source.toAccountId !== 'string' ||
          typeof source.amount !== 'number'
        ) {
          throw new AccountingError(
            'Transfer source document is missing or malformed — cannot reverse balances',
            'INVALID_SOURCE_DOCUMENT',
            500
          );
        }

        const fromAccountId = source.fromAccountId;
        const toAccountId = source.toAccountId;
        const originalAmount = source.amount;
        const exchangeRate = typeof source.exchangeRate === 'number' ? source.exchangeRate : undefined;

        // Calculate toAmount using same logic as createTransfer
        const toAmount = exchangeRate
          ? Math.round(originalAmount * exchangeRate)
          : originalAmount;

        // Void both entries
        const entryIds = [entry.id, entry.linkedEntryId].filter(Boolean) as string[];

        await tx.journalEntry.updateMany({
          where: { id: { in: entryIds } },
          data: {
            status: 'VOIDED',
            updatedBy: this.userId,
          },
        });

        // Reverse account balances (undo the transfer)
        await Promise.all([
          tx.account.update({
            where: { id: fromAccountId },
            data: { currentBalance: { increment: originalAmount } },
          }),
          tx.account.update({
            where: { id: toAccountId },
            data: { currentBalance: { decrement: toAmount } },
          }),
        ]);

        // Create audit logs
        await Promise.all(
          entryIds.map((entryId) =>
            createAuditLog(
              {
                action: 'UPDATE',
                category: 'TRANSACTION',
                entityId: entry.entityId,
                tenantId: this.tenantId,
                userId: this.userId,
                resourceType: 'JournalEntry',
                resourceId: entryId,
                details: {
                  status: 'VOIDED',
                  balanceReversed: true,
                  fromAccountId,
                  toAccountId,
                  amount: originalAmount,
                },
              },
              tx
            )
          )
        );

        return { voided: entryIds.length };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  }
}
