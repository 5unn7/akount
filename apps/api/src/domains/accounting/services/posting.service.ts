import { prisma, Prisma } from '@akount/db';
import { AccountingError } from '../errors';
import { createAuditLog } from '../../../lib/audit';

/**
 * Transaction Posting Service
 *
 * Transforms bank transactions into journal entries (double-entry bookkeeping).
 * All posting operations use Serializable isolation to prevent double-posting.
 */
export class PostingService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  /**
   * Post a single bank transaction to the general ledger.
   *
   * Creates a journal entry:
   * - Inflow (positive amount): DR bank GL account, CR target GL account
   * - Outflow (negative amount): DR target GL account, CR bank GL account
   */
  async postTransaction(transactionId: string, glAccountId: string, exchangeRateOverride?: number) {
    return await prisma.$transaction(async (tx) => {
      // 1. Load transaction with tenant filter
      const transaction = await tx.transaction.findFirst({
        where: {
          id: transactionId,
          deletedAt: null,
          account: {
            entity: { tenantId: this.tenantId },
          },
        },
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          currency: true,
          journalEntryId: true,
          accountId: true,
          account: {
            select: {
              id: true,
              name: true,
              entityId: true,
              glAccountId: true,
              entity: {
                select: { functionalCurrency: true },
              },
            },
          },
        },
      });

      if (!transaction) {
        throw new AccountingError(
          'Transaction not found',
          'GL_ACCOUNT_NOT_FOUND',
          404
        );
      }

      if (transaction.journalEntryId) {
        throw new AccountingError(
          'Transaction is already posted to the general ledger',
          'ALREADY_POSTED',
          409
        );
      }

      // 2. Validate bank account has GL mapping
      if (!transaction.account.glAccountId) {
        throw new AccountingError(
          'Bank account is not mapped to a GL account — map it first via account settings',
          'BANK_ACCOUNT_NOT_MAPPED',
          400
        );
      }

      // 3. Load target GL account with tenant filter
      const targetGLAccount = await tx.gLAccount.findFirst({
        where: {
          id: glAccountId,
          entity: { tenantId: this.tenantId },
        },
        select: {
          id: true,
          entityId: true,
          isActive: true,
          code: true,
          name: true,
        },
      });

      if (!targetGLAccount) {
        throw new AccountingError(
          'Target GL account not found',
          'GL_ACCOUNT_NOT_FOUND',
          404
        );
      }

      if (!targetGLAccount.isActive) {
        throw new AccountingError(
          'Target GL account is inactive',
          'GL_ACCOUNT_INACTIVE',
          400
        );
      }

      // 4. Cross-entity check
      if (transaction.account.entityId !== targetGLAccount.entityId) {
        throw new AccountingError(
          'Transaction and GL account belong to different entities',
          'CROSS_ENTITY_REFERENCE',
          403
        );
      }

      const entityId = transaction.account.entityId;
      const entityCurrency = transaction.account.entity.functionalCurrency;

      // 5. Fiscal period check
      await this.checkFiscalPeriod(tx, entityId, transaction.date);

      // 6. Determine FX rate for multi-currency posting
      const txnCurrency = transaction.currency;
      const isForeignCurrency = txnCurrency !== entityCurrency;
      let fxRate: number | null = null;

      if (isForeignCurrency) {
        if (exchangeRateOverride) {
          fxRate = exchangeRateOverride;
        } else {
          // Nearest-date fallback: find most recent rate on or before transaction date
          const rateRecord = await tx.fXRate.findFirst({
            where: {
              base: txnCurrency,
              quote: entityCurrency,
              date: { lte: transaction.date },
            },
            orderBy: { date: 'desc' },
            select: { rate: true },
          });

          if (!rateRecord) {
            throw new AccountingError(
              `No FX rate found for ${txnCurrency}/${entityCurrency} on or before ${transaction.date.toISOString().split('T')[0]}`,
              'MISSING_FX_RATE',
              400,
              { base: txnCurrency, quote: entityCurrency, date: transaction.date }
            );
          }
          fxRate = rateRecord.rate;
        }
      }

      // 7. Build journal lines
      const absAmount = Math.abs(transaction.amount);
      const bankGLAccountId = transaction.account.glAccountId;
      const isInflow = transaction.amount > 0;

      // Calculate base currency amounts if foreign currency
      const baseCurrencyAmount = isForeignCurrency && fxRate
        ? Math.round(absAmount * fxRate)
        : null;

      const lines = [
        {
          glAccountId: isInflow ? bankGLAccountId : glAccountId,
          debitAmount: absAmount,
          creditAmount: 0,
          memo: transaction.description,
          ...(isForeignCurrency ? {
            currency: txnCurrency,
            exchangeRate: fxRate,
            baseCurrencyDebit: baseCurrencyAmount,
            baseCurrencyCredit: 0,
          } : {}),
        },
        {
          glAccountId: isInflow ? glAccountId : bankGLAccountId,
          debitAmount: 0,
          creditAmount: absAmount,
          memo: transaction.description,
          ...(isForeignCurrency ? {
            currency: txnCurrency,
            exchangeRate: fxRate,
            baseCurrencyDebit: 0,
            baseCurrencyCredit: baseCurrencyAmount,
          } : {}),
        },
      ];

      // 8. Generate entry number
      const entryNumber = await this.generateEntryNumber(tx, entityId);

      // 9. Source document (allowlisted fields)
      const sourceDocument = {
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        accountId: transaction.accountId,
        accountName: transaction.account.name,
        capturedAt: new Date().toISOString(),
      };

      // 10. Create journal entry (POSTED immediately — auto-approved)
      const journalEntry = await tx.journalEntry.create({
        data: {
          entityId,
          entryNumber,
          date: transaction.date,
          memo: `${transaction.description}`,
          sourceType: 'BANK_FEED',
          sourceId: transaction.id,
          sourceDocument: sourceDocument as unknown as Prisma.InputJsonValue,
          status: 'POSTED',
          createdBy: this.userId,
          journalLines: {
            create: lines,
          },
        },
        select: {
          id: true,
          entryNumber: true,
          status: true,
          journalLines: {
            select: {
              id: true,
              glAccountId: true,
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
      });

      // 11. Link transaction to journal entry
      await tx.transaction.update({
        where: { id: transactionId },
        data: { journalEntryId: journalEntry.id },
      });

      // 12. Audit log
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId,
        model: 'JournalEntry',
        recordId: journalEntry.id,
        action: 'CREATE',
        after: {
          entryNumber: journalEntry.entryNumber,
          sourceType: 'BANK_FEED',
          sourceId: transaction.id,
          status: 'POSTED',
          amount: absAmount,
        },
      });

      return {
        journalEntryId: journalEntry.id,
        entryNumber: journalEntry.entryNumber,
        transactionId: transaction.id,
        amount: absAmount,
        lines: journalEntry.journalLines,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  /**
   * Bulk post multiple transactions. All-or-nothing batch.
   *
   * All transactions must:
   * - Belong to the same tenant
   * - Not be already posted
   * - Have their bank account mapped to a GL account
   * - Belong to the same entity as the target GL account
   */
  async postBulkTransactions(transactionIds: string[], glAccountId: string, exchangeRateOverride?: number) {
    return await prisma.$transaction(async (tx) => {
      // 1. Load ALL transactions
      const transactions = await tx.transaction.findMany({
        where: {
          id: { in: transactionIds },
          deletedAt: null,
          journalEntryId: null, // Not already posted
          account: {
            entity: { tenantId: this.tenantId },
          },
        },
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          currency: true,
          accountId: true,
          account: {
            select: {
              id: true,
              name: true,
              entityId: true,
              glAccountId: true,
              entity: {
                select: { functionalCurrency: true },
              },
            },
          },
        },
      });

      // 2. Count check — all requested IDs must be found
      if (transactions.length !== transactionIds.length) {
        const foundIds = new Set(transactions.map(t => t.id));
        const missing = transactionIds.filter(id => !foundIds.has(id));
        throw new AccountingError(
          `${missing.length} transaction(s) not found, already posted, or belong to different tenant`,
          'GL_ACCOUNT_NOT_FOUND',
          400,
          { missingIds: missing }
        );
      }

      // 3. Validate target GL account
      const targetGL = await tx.gLAccount.findFirst({
        where: {
          id: glAccountId,
          entity: { tenantId: this.tenantId },
          isActive: true,
        },
        select: { id: true, entityId: true },
      });

      if (!targetGL) {
        throw new AccountingError('Target GL account not found or inactive', 'GL_ACCOUNT_NOT_FOUND', 404);
      }

      // 4. Validate all transactions belong to same entity as GL account
      const mismatchedEntities = transactions.filter(t => t.account.entityId !== targetGL.entityId);
      if (mismatchedEntities.length > 0) {
        throw new AccountingError(
          'Some transactions belong to a different entity than the GL account',
          'CROSS_ENTITY_REFERENCE',
          403
        );
      }

      // 5. Validate all bank accounts have GL mapping
      const unmapped = transactions.filter(t => !t.account.glAccountId);
      if (unmapped.length > 0) {
        throw new AccountingError(
          `${unmapped.length} bank account(s) not mapped to GL accounts`,
          'BANK_ACCOUNT_NOT_MAPPED',
          400,
          { unmappedAccountIds: [...new Set(unmapped.map(t => t.account.id))] }
        );
      }

      const entityId = targetGL.entityId;

      // 6. Create one journal entry per transaction
      const results = [];
      for (const transaction of transactions) {
        await this.checkFiscalPeriod(tx, entityId, transaction.date);

        const absAmount = Math.abs(transaction.amount);
        const bankGLAccountId = transaction.account.glAccountId!;
        const isInflow = transaction.amount > 0;

        // Multi-currency handling per transaction
        const entityCurrency = transaction.account.entity.functionalCurrency;
        const txnCurrency = transaction.currency;
        const isForeignCurrency = txnCurrency !== entityCurrency;
        let fxRate: number | null = null;

        if (isForeignCurrency) {
          if (exchangeRateOverride) {
            fxRate = exchangeRateOverride;
          } else {
            const rateRecord = await tx.fXRate.findFirst({
              where: {
                base: txnCurrency,
                quote: entityCurrency,
                date: { lte: transaction.date },
              },
              orderBy: { date: 'desc' },
              select: { rate: true },
            });

            if (!rateRecord) {
              throw new AccountingError(
                `No FX rate found for ${txnCurrency}/${entityCurrency} on or before ${transaction.date.toISOString().split('T')[0]}`,
                'MISSING_FX_RATE',
                400,
                { base: txnCurrency, quote: entityCurrency, transactionId: transaction.id }
              );
            }
            fxRate = rateRecord.rate;
          }
        }

        const baseCurrencyAmount = isForeignCurrency && fxRate
          ? Math.round(absAmount * fxRate)
          : null;

        const entryNumber = await this.generateEntryNumber(tx, entityId);

        const sourceDocument = {
          id: transaction.id,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          currency: transaction.currency,
          accountId: transaction.accountId,
          accountName: transaction.account.name,
          capturedAt: new Date().toISOString(),
        };

        const journalEntry = await tx.journalEntry.create({
          data: {
            entityId,
            entryNumber,
            date: transaction.date,
            memo: transaction.description,
            sourceType: 'BANK_FEED',
            sourceId: transaction.id,
            sourceDocument: sourceDocument as unknown as Prisma.InputJsonValue,
            status: 'POSTED',
            createdBy: this.userId,
            journalLines: {
              create: [
                {
                  glAccountId: isInflow ? bankGLAccountId : glAccountId,
                  debitAmount: absAmount,
                  creditAmount: 0,
                  memo: transaction.description,
                  ...(isForeignCurrency ? {
                    currency: txnCurrency,
                    exchangeRate: fxRate,
                    baseCurrencyDebit: baseCurrencyAmount,
                    baseCurrencyCredit: 0,
                  } : {}),
                },
                {
                  glAccountId: isInflow ? glAccountId : bankGLAccountId,
                  debitAmount: 0,
                  creditAmount: absAmount,
                  memo: transaction.description,
                  ...(isForeignCurrency ? {
                    currency: txnCurrency,
                    exchangeRate: fxRate,
                    baseCurrencyDebit: 0,
                    baseCurrencyCredit: baseCurrencyAmount,
                  } : {}),
                },
              ],
            },
          },
          select: { id: true, entryNumber: true },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: { journalEntryId: journalEntry.id },
        });

        results.push({
          transactionId: transaction.id,
          journalEntryId: journalEntry.id,
          entryNumber: journalEntry.entryNumber,
          amount: absAmount,
        });
      }

      // Audit log for batch
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId,
        model: 'JournalEntry',
        recordId: 'batch',
        action: 'CREATE',
        after: {
          batchSize: results.length,
          journalEntryIds: results.map(r => r.journalEntryId),
        },
      });

      return {
        posted: results.length,
        entries: results,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  /**
   * Post a split transaction to the general ledger.
   *
   * Creates a journal entry with N+1 lines:
   * - N category/expense lines (one per split)
   * - 1 bank account line (balancing entry)
   *
   * Validates: SUM(splits) === ABS(transaction.amount)
   */
  async postSplitTransaction(
    transactionId: string,
    splits: Array<{ glAccountId: string; amount: number; memo?: string }>,
    exchangeRateOverride?: number
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Load transaction with tenant filter
      const transaction = await tx.transaction.findFirst({
        where: {
          id: transactionId,
          deletedAt: null,
          account: {
            entity: { tenantId: this.tenantId },
          },
        },
        select: {
          id: true,
          date: true,
          description: true,
          amount: true,
          currency: true,
          journalEntryId: true,
          accountId: true,
          account: {
            select: {
              id: true,
              name: true,
              entityId: true,
              glAccountId: true,
              entity: {
                select: { functionalCurrency: true },
              },
            },
          },
        },
      });

      if (!transaction) {
        throw new AccountingError('Transaction not found', 'GL_ACCOUNT_NOT_FOUND', 404);
      }

      if (transaction.journalEntryId) {
        throw new AccountingError(
          'Transaction is already posted to the general ledger',
          'ALREADY_POSTED',
          409
        );
      }

      if (!transaction.account.glAccountId) {
        throw new AccountingError(
          'Bank account is not mapped to a GL account',
          'BANK_ACCOUNT_NOT_MAPPED',
          400
        );
      }

      // 2. Validate split amounts sum to transaction total
      const absTransactionAmount = Math.abs(transaction.amount);
      const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);

      if (splitTotal !== absTransactionAmount) {
        throw new AccountingError(
          `Split amounts (${splitTotal}) do not equal transaction amount (${absTransactionAmount})`,
          'SPLIT_AMOUNT_MISMATCH',
          400,
          { splitTotal, transactionAmount: absTransactionAmount }
        );
      }

      // 3. Validate all GL accounts belong to same entity + tenant
      const glAccountIds = [...new Set(splits.map(s => s.glAccountId))];
      const entityId = transaction.account.entityId;

      const foundAccounts = await tx.gLAccount.findMany({
        where: {
          id: { in: glAccountIds },
          entityId,
          entity: { tenantId: this.tenantId },
          isActive: true,
        },
        select: { id: true, entityId: true },
      });

      if (foundAccounts.length !== glAccountIds.length) {
        throw new AccountingError(
          'One or more split GL accounts not found, inactive, or belong to a different entity',
          'CROSS_ENTITY_REFERENCE',
          403
        );
      }

      // 4. Fiscal period check
      await this.checkFiscalPeriod(tx, entityId, transaction.date);

      // 5. Multi-currency handling
      const entityCurrency = transaction.account.entity.functionalCurrency;
      const txnCurrency = transaction.currency;
      const isForeignCurrency = txnCurrency !== entityCurrency;
      let fxRate: number | null = null;

      if (isForeignCurrency) {
        if (exchangeRateOverride) {
          fxRate = exchangeRateOverride;
        } else {
          const rateRecord = await tx.fXRate.findFirst({
            where: {
              base: txnCurrency,
              quote: entityCurrency,
              date: { lte: transaction.date },
            },
            orderBy: { date: 'desc' },
            select: { rate: true },
          });

          if (!rateRecord) {
            throw new AccountingError(
              `No FX rate found for ${txnCurrency}/${entityCurrency}`,
              'MISSING_FX_RATE',
              400,
              { base: txnCurrency, quote: entityCurrency }
            );
          }
          fxRate = rateRecord.rate;
        }
      }

      // 6. Build journal lines: N split lines + 1 bank line
      const isInflow = transaction.amount > 0;
      const bankGLAccountId = transaction.account.glAccountId;

      // For multi-currency splits, use largest-remainder allocation
      const baseSplitAmounts = splits.map(s => {
        return isForeignCurrency && fxRate ? Math.round(s.amount * fxRate) : s.amount;
      });

      // Fix rounding remainder: ensure base split amounts sum to base transaction total
      if (isForeignCurrency && fxRate) {
        const baseTotal = Math.round(absTransactionAmount * fxRate);
        const baseSplitSum = baseSplitAmounts.reduce((a, b) => a + b, 0);
        const remainder = baseTotal - baseSplitSum;
        if (remainder !== 0) {
          // Add remainder to the largest split
          let largestIdx = 0;
          for (let i = 1; i < baseSplitAmounts.length; i++) {
            if (baseSplitAmounts[i] > baseSplitAmounts[largestIdx]) largestIdx = i;
          }
          baseSplitAmounts[largestIdx] += remainder;
        }
      }

      // Split category lines
      const splitLines = splits.map((split, idx) => {
        const baseAmount = baseSplitAmounts[idx];
        return {
          glAccountId: split.glAccountId,
          // Outflow: DR category, CR bank. Inflow: DR bank, CR category.
          debitAmount: isInflow ? 0 : split.amount,
          creditAmount: isInflow ? split.amount : 0,
          memo: split.memo ?? transaction.description,
          ...(isForeignCurrency ? {
            currency: txnCurrency,
            exchangeRate: fxRate,
            baseCurrencyDebit: isInflow ? 0 : baseAmount,
            baseCurrencyCredit: isInflow ? baseAmount : 0,
          } : {}),
        };
      });

      // Bank balancing line (total of all splits)
      const baseTotalAmount = isForeignCurrency && fxRate
        ? baseSplitAmounts.reduce((a, b) => a + b, 0)
        : null;

      const bankLine = {
        glAccountId: bankGLAccountId,
        // Outflow: CR bank (the total). Inflow: DR bank.
        debitAmount: isInflow ? absTransactionAmount : 0,
        creditAmount: isInflow ? 0 : absTransactionAmount,
        memo: transaction.description,
        ...(isForeignCurrency ? {
          currency: txnCurrency,
          exchangeRate: fxRate,
          baseCurrencyDebit: isInflow ? baseTotalAmount : 0,
          baseCurrencyCredit: isInflow ? 0 : baseTotalAmount,
        } : {}),
      };

      const allLines = [...splitLines, bankLine];

      // 7. Generate entry number
      const entryNumber = await this.generateEntryNumber(tx, entityId);

      // 8. Source document
      const sourceDocument = {
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        accountId: transaction.accountId,
        accountName: transaction.account.name,
        splits: splits.map(s => ({ glAccountId: s.glAccountId, amount: s.amount })),
        capturedAt: new Date().toISOString(),
      };

      // 9. Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          entityId,
          entryNumber,
          date: transaction.date,
          memo: transaction.description,
          sourceType: 'BANK_FEED',
          sourceId: transaction.id,
          sourceDocument: sourceDocument as unknown as Prisma.InputJsonValue,
          status: 'POSTED',
          createdBy: this.userId,
          journalLines: { create: allLines },
        },
        select: {
          id: true,
          entryNumber: true,
          status: true,
          journalLines: {
            select: {
              id: true,
              glAccountId: true,
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
      });

      // 10. Link transaction to journal entry
      await tx.transaction.update({
        where: { id: transactionId },
        data: { journalEntryId: journalEntry.id },
      });

      // 11. Persist glAccountId on each TransactionSplit record
      const txSplits = await tx.transactionSplit.findMany({
        where: { transactionId },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      // Update splits with glAccountId (match by order)
      for (let i = 0; i < Math.min(txSplits.length, splits.length); i++) {
        await tx.transactionSplit.update({
          where: { id: txSplits[i].id },
          data: { glAccountId: splits[i].glAccountId },
        });
      }

      // 12. Audit log
      await createAuditLog({
        tenantId: this.tenantId,
        userId: this.userId,
        entityId,
        model: 'JournalEntry',
        recordId: journalEntry.id,
        action: 'CREATE',
        after: {
          entryNumber: journalEntry.entryNumber,
          sourceType: 'BANK_FEED',
          sourceId: transaction.id,
          status: 'POSTED',
          splitCount: splits.length,
          amount: absTransactionAmount,
        },
      });

      return {
        journalEntryId: journalEntry.id,
        entryNumber: journalEntry.entryNumber,
        transactionId: transaction.id,
        amount: absTransactionAmount,
        splitCount: splits.length,
        lines: journalEntry.journalLines,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

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
