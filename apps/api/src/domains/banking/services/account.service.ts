import { prisma, type AccountType, type Prisma } from '@akount/db';

// Constants for pagination
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * Maps banking AccountType to default well-known GL account code from COA template.
 * Used by opening balance and Flinks sync to auto-assign GL accounts.
 *
 * See: apps/api/src/domains/accounting/services/coa-template.ts
 * See: apps/api/src/domains/accounting/services/document-posting.service.ts (WELL_KNOWN_CODES)
 */
const ACCOUNT_TYPE_TO_GL_CODE: Record<AccountType, string> = {
  BANK: '1100',         // Bank Account (Asset)
  CREDIT_CARD: '2100',  // Credit Card Payable (Liability)
  LOAN: '2500',         // Loans Payable (Liability)
  MORTGAGE: '2500',     // Loans Payable (Liability)
  INVESTMENT: '1100',   // Bank Account (Asset) — fallback until Investment GL added
  OTHER: '1100',        // Bank Account (Asset) — generic fallback
};

/**
 * Resolve the default GL account for a banking AccountType.
 *
 * Looks up the entity's COA for the well-known code matching the account type.
 * Returns null if the GL account doesn't exist (e.g., COA not seeded yet).
 *
 * @param tx - Prisma transaction client (for atomicity with account creation)
 * @param entityId - The entity whose COA to search
 * @param accountType - The banking account type (BANK, CREDIT_CARD, etc.)
 * @returns The GL account ID, or null if not found
 */
export async function getDefaultGLAccountForType(
  tx: Prisma.TransactionClient,
  entityId: string,
  accountType: AccountType
): Promise<string | null> {
  const glCode = ACCOUNT_TYPE_TO_GL_CODE[accountType];

  const glAccount = await tx.gLAccount.findFirst({
    where: {
      entityId,
      code: glCode,
      isActive: true,
    },
    select: { id: true },
  });

  return glAccount?.id ?? null;
}

// Types for pagination
export interface ListAccountsParams {
  entityId?: string;
  type?: string;
  isActive?: boolean;
  cursor?: string;
  limit?: number;
}

export interface PaginatedAccounts {
  accounts: Awaited<ReturnType<typeof prisma.account.findMany>>;
  nextCursor?: string;
  hasMore: boolean;
}

export class AccountService {
  constructor(private tenantId: string) {}

  async listAccounts(params: ListAccountsParams = {}): Promise<PaginatedAccounts> {
    const { entityId, type, isActive, cursor } = params;

    // Ensure limit is within bounds
    const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    // Build where clause with tenant isolation
    const where = {
      entity: {
        tenantId: this.tenantId,
        ...(entityId && { id: entityId }),
      },
      ...(type && {
        type: type as Parameters<typeof prisma.account.findMany>[0] extends {
          where?: { type?: infer T };
        }
          ? T
          : never,
      }),
      ...(isActive !== undefined && { isActive }),
      deletedAt: null, // Soft delete filter
    };

    // Fetch one extra to determine if there are more results
    const accounts = await prisma.account.findMany({
      where,
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor record itself
      }),
    });

    // Check if there are more results
    const hasMore = accounts.length > limit;

    // Return only the requested number of results
    const data = hasMore ? accounts.slice(0, limit) : accounts;

    return {
      accounts: data,
      nextCursor: hasMore ? data[data.length - 1].id : undefined,
      hasMore,
    };
  }

  async getAccount(id: string) {
    return prisma.account.findFirst({
      where: {
        id,
        deletedAt: null,
        entity: {
          tenantId: this.tenantId,
        },
      },
      include: {
        entity: true,
        glAccount: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  async createAccount(
    userId: string,
    data: {
      entityId: string;
      name: string;
      type: string;
      currency: string;
      country: string;
      institution?: string;
      openingBalance?: number; // Integer cents
      openingBalanceDate?: Date;
    }
  ) {
    const accountType = data.type as AccountType;
    const hasOpeningBalance = data.openingBalance != null && data.openingBalance !== 0;

    return prisma.$transaction(async (tx) => {
      // 1. Verify entity belongs to tenant
      const entity = await tx.entity.findFirst({
        where: {
          id: data.entityId,
          tenantId: this.tenantId,
        },
      });

      if (!entity) {
        throw new Error('Entity not found or access denied');
      }

      // 2. Auto-assign GL account based on type
      const glAccountId = await getDefaultGLAccountForType(tx, data.entityId, accountType);

      // 3. Create the account
      const account = await tx.account.create({
        data: {
          entityId: data.entityId,
          name: data.name,
          type: accountType,
          currency: data.currency,
          country: data.country,
          institution: data.institution,
          currentBalance: hasOpeningBalance ? data.openingBalance! : 0,
          glAccountId,
          isActive: true,
        },
        include: {
          entity: true,
        },
      });

      // 4. Create opening balance journal entry if balance provided + GL resolved
      let journalEntry = null;
      if (hasOpeningBalance && glAccountId) {
        // Import lazily to avoid circular dependency
        const { DocumentPostingService } = await import(
          '../../accounting/services/document-posting.service.js'
        );
        const postingService = new DocumentPostingService(this.tenantId, userId);
        journalEntry = await postingService.postOpeningBalance(tx, {
          accountId: account.id,
          entityId: data.entityId,
          glAccountId,
          openingBalance: data.openingBalance!,
          openingBalanceDate: data.openingBalanceDate ?? new Date(),
          accountName: data.name,
          accountType,
        });
      }

      return { ...account, journalEntry };
    });
  }

  async updateAccount(
    id: string,
    data: {
      name?: string;
      institution?: string | null;
      isActive?: boolean;
      type?: string;
      glAccountId?: string | null;
    }
  ) {
    // Atomic: verify tenant ownership + update in one transaction
    return prisma.$transaction(async (tx) => {
      const existing = await tx.account.findFirst({
        where: {
          id,
          deletedAt: null,
          entity: { tenantId: this.tenantId },
        },
      });

      if (!existing) {
        return null;
      }

      // Validate GL account belongs to same entity + tenant if provided
      if (data.glAccountId) {
        const glAccount = await tx.gLAccount.findFirst({
          where: {
            id: data.glAccountId,
            entityId: existing.entityId,
            entity: { tenantId: this.tenantId },
            isActive: true,
          },
          select: { id: true, type: true },
        });

        if (!glAccount) {
          throw new Error('GL account not found, inactive, or belongs to different entity');
        }
      }

      return tx.account.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.institution !== undefined && { institution: data.institution }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.type !== undefined && {
            type: data.type as 'BANK' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'MORTGAGE' | 'OTHER',
          }),
          ...(data.glAccountId !== undefined && { glAccountId: data.glAccountId }),
        },
        include: {
          entity: true,
        },
      });
    });
  }

  async softDeleteAccount(id: string) {
    // Atomic: verify tenant ownership + soft delete in one transaction
    return prisma.$transaction(async (tx) => {
      const existing = await tx.account.findFirst({
        where: {
          id,
          deletedAt: null,
          entity: { tenantId: this.tenantId },
        },
      });

      if (!existing) {
        return null;
      }

      return tx.account.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });
    });
  }

  /**
   * Get transactions for an account with running balance calculation
   *
   * @param accountId - The account ID to get transactions for
   * @param options - Pagination and filtering options
   * @returns Transactions with running balance for each transaction
   *
   * Running balance is calculated by:
   * 1. Starting with the account's opening balance (if available)
   * 2. Ordering transactions by date ascending (oldest first)
   * 3. For each transaction: runningBalance = previousBalance + transactionAmount
   */
  async getAccountTransactions(
    accountId: string,
    options: {
      cursor?: string;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    // Verify account belongs to tenant
    const account = await this.getAccount(accountId);
    if (!account) {
      return null;
    }

    const limit = Math.min(options.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    // Build where clause
    const where = {
      accountId,
      deletedAt: null,
      ...(options.startDate && { date: { gte: options.startDate } }),
      ...(options.endDate && {
        date: { ...((options.startDate && { gte: options.startDate }) || {}), lte: options.endDate },
      }),
    };

    // Fetch transactions ordered by date ascending (oldest first)
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      take: limit + 1,
      ...(options.cursor && {
        cursor: { id: options.cursor },
        skip: 1,
      }),
    });

    // Calculate running balance for each transaction
    let runningBalance = 0; // Start from 0 (could be enhanced to use opening balance)
    const transactionsWithBalance = transactions.slice(0, limit).map((txn) => {
      runningBalance += txn.amount;
      return {
        ...txn,
        runningBalance,
      };
    });

    const hasMore = transactions.length > limit;

    return {
      transactions: transactionsWithBalance,
      nextCursor: hasMore ? transactionsWithBalance[transactionsWithBalance.length - 1].id : undefined,
      hasMore,
    };
  }
}
