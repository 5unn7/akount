import { prisma } from '@akount/db';

// Constants for pagination
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

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
    }
  ) {
    // Verify entity belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: {
        id: data.entityId,
        tenantId: this.tenantId,
      },
    });

    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    return prisma.account.create({
      data: {
        entityId: data.entityId,
        name: data.name,
        type: data.type as 'BANK' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'MORTGAGE' | 'OTHER',
        currency: data.currency,
        country: data.country,
        institution: data.institution,
        currentBalance: 0,
        isActive: true,
      },
      include: {
        entity: true,
      },
    });
  }

  async updateAccount(
    id: string,
    data: {
      name?: string;
      institution?: string | null;
      isActive?: boolean;
      type?: string;
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

      return tx.account.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.institution !== undefined && { institution: data.institution }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.type !== undefined && {
            type: data.type as 'BANK' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'MORTGAGE' | 'OTHER',
          }),
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
