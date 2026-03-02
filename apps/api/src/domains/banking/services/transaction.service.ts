import { prisma, Prisma, TransactionSourceType } from '@akount/db';
import { createAuditLog } from '../../../lib/audit';

// Constants for pagination
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Standard include pattern for transaction queries
const TRANSACTION_INCLUDE = {
  account: {
    select: {
      id: true,
      name: true,
      type: true,
      currency: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  matches: {
    select: {
      id: true,
      status: true,
    },
    take: 1,
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

const TRANSACTION_INCLUDE_WITH_ENTITY = {
  account: {
    select: {
      id: true,
      name: true,
      type: true,
      currency: true,
      entity: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
} as const;

// Explicit type definitions (replaces Awaited<ReturnType<>>)
type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: typeof TRANSACTION_INCLUDE;
}>;

type TransactionWithEntity = Prisma.TransactionGetPayload<{
  include: typeof TRANSACTION_INCLUDE_WITH_ENTITY;
}>;

// Types for pagination and filtering
export interface ListTransactionsParams {
  entityId?: string;
  accountId?: string;
  startDate?: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
  categoryId?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedTransactions {
  transactions: TransactionWithRelations[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CreateTransactionInput {
  accountId: string;
  date: string; // ISO 8601 date string
  description: string;
  amount: number; // Integer cents
  currency: string; // ISO 4217 (USD, CAD, EUR)
  categoryId?: string;
  notes?: string;
  sourceType: TransactionSourceType; // Use Prisma enum
  sourceId?: string;
}

export interface UpdateTransactionInput {
  description?: string;
  categoryId?: string | null;
  notes?: string | null;
}

/**
 * TransactionService - Manage posted Transaction records (CRUD)
 *
 * Single Responsibility: Handle transaction data operations only
 * - NO HTTP handling (that's in routes)
 * - NO validation (that's in schemas)
 * - NO parsing or import logic (that's in ImportService)
 */
export class TransactionService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  /**
   * List transactions with filters and cursor-based pagination
   */
  async listTransactions(params: ListTransactionsParams = {}): Promise<PaginatedTransactions> {
    const { entityId, accountId, startDate, endDate, categoryId, cursor } = params;

    // Ensure limit is within bounds
    const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    // Build where clause with tenant isolation (use Prisma type)
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null, // Soft delete filter
    };

    // Account filter with compound entity pattern (entity-scoped tenant check)
    if (accountId) {
      where.account = {
        id: accountId,
        entity: {
          tenantId: this.tenantId,
          ...(entityId && { id: entityId }),
        },
      };
    } else {
      where.account = {
        entity: {
          tenantId: this.tenantId,
          ...(entityId && { id: entityId }),
        },
      };
    }

    // Date range filters
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Cursor pagination
    if (cursor) {
      where.id = {
        lt: cursor, // Get records before this cursor
      };
    }

    // Fetch one extra to determine if there are more results
    const transactions = await prisma.transaction.findMany({
      where,
      include: TRANSACTION_INCLUDE, // Use extracted constant
      orderBy: { date: 'desc' }, // Newest first
      take: limit + 1,
    });

    // Check if there are more results
    const hasMore = transactions.length > limit;
    const results = hasMore ? transactions.slice(0, limit) : transactions;

    // Next cursor is the ID of the last item
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : undefined;

    return {
      transactions: results,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get single transaction by ID
   *
   * @returns Transaction if found and belongs to tenant, null otherwise
   */
  async getTransaction(id: string): Promise<TransactionWithEntity | null> {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        account: {
          entity: {
            tenantId: this.tenantId, // Tenant isolation
          },
        },
        deletedAt: null, // Soft delete filter
      },
      include: TRANSACTION_INCLUDE_WITH_ENTITY, // Use extracted constant
    });

    return transaction;
  }

  /**
   * Create new posted transaction
   *
   * @throws Error if account doesn't belong to tenant
   */
  async createTransaction(data: CreateTransactionInput): Promise<TransactionWithRelations> {
    // Verify account belongs to tenant (tenant isolation check)
    const account = await prisma.account.findFirst({
      where: {
        id: data.accountId,
        entity: {
          tenantId: this.tenantId,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        entityId: true, // Need for audit log
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Create transaction with defaults
    const transaction = await prisma.transaction.create({
      data: {
        accountId: data.accountId,
        date: new Date(data.date),
        description: data.description,
        amount: data.amount, // Integer cents
        currency: data.currency,
        categoryId: data.categoryId,
        notes: data.notes,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        isStaged: false, // Default
        isSplit: false, // Default
      },
      include: TRANSACTION_INCLUDE, // Use extracted constant
    });

    // Audit logging (P0 security requirement)
    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: account.entityId,
      model: 'Transaction',
      recordId: transaction.id,
      action: 'CREATE',
      after: {
        accountId: transaction.accountId,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        date: transaction.date,
      },
    });

    return transaction;
  }

  /**
   * Update existing transaction
   *
   * @throws Error if transaction doesn't belong to tenant or is deleted
   */
  async updateTransaction(
    id: string,
    data: UpdateTransactionInput
  ): Promise<TransactionWithRelations> {
    // Lightweight ownership check (optimized - only fetch ID and before state)
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        account: {
          entity: {
            tenantId: this.tenantId,
          },
        },
        deletedAt: null,
      },
      select: {
        id: true,
        description: true,
        categoryId: true,
        notes: true,
        account: {
          select: {
            entityId: true, // Need for audit log
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    // Update transaction (only allowed fields)
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description: data.description,
        categoryId: data.categoryId === null ? null : data.categoryId, // Allow unsetting
        notes: data.notes === null ? null : data.notes, // Allow unsetting
      },
      include: TRANSACTION_INCLUDE, // Use extracted constant
    });

    // Audit logging (P0 security requirement)
    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: existing.account.entityId,
      model: 'Transaction',
      recordId: transaction.id,
      action: 'UPDATE',
      before: {
        description: existing.description,
        categoryId: existing.categoryId,
        notes: existing.notes,
      },
      after: {
        description: transaction.description,
        categoryId: transaction.categoryId,
        notes: transaction.notes,
      },
    });

    return transaction;
  }

  /**
   * Soft delete transaction
   *
   * @throws Error if transaction doesn't belong to tenant or already deleted
   */
  async softDeleteTransaction(id: string): Promise<void> {
    // Lightweight ownership check (optimized)
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        account: {
          entity: {
            tenantId: this.tenantId,
          },
        },
        deletedAt: null,
      },
      select: {
        id: true,
        description: true,
        amount: true,
        account: {
          select: {
            entityId: true, // Need for audit log
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    // Soft delete by setting deletedAt timestamp
    await prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Audit logging (P0 security requirement)
    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: existing.account.entityId,
      model: 'Transaction',
      recordId: id,
      action: 'DELETE',
      before: {
        description: existing.description,
        amount: existing.amount,
      },
    });
  }

  /**
   * Bulk categorize transactions
   *
   * Updates categoryId for multiple transactions. All must belong to tenant.
   * @returns Number of transactions updated
   */
  async bulkCategorize(
    transactionIds: string[],
    categoryId: string | null
  ): Promise<{ updated: number }> {
    // Verify all transactions belong to tenant
    const owned = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        account: { entity: { tenantId: this.tenantId } },
        deletedAt: null,
      },
      select: { id: true, account: { select: { entityId: true } } },
    });

    if (owned.length !== transactionIds.length) {
      throw new Error(
        `Some transactions not found or not accessible. Requested: ${transactionIds.length}, Found: ${owned.length}`
      );
    }

    // Batch update
    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        account: { entity: { tenantId: this.tenantId } },
        deletedAt: null,
      },
      data: { categoryId },
    });

    // Audit log for bulk operation
    const entityId = owned[0]?.account.entityId;
    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId,
      model: 'Transaction',
      recordId: 'bulk',
      action: 'UPDATE',
      after: {
        operation: 'bulk_categorize',
        transactionIds,
        categoryId,
        count: result.count,
      },
    });

    // Fire-and-forget: learn from each correction to detect patterns
    if (categoryId && entityId) {
      this.triggerCorrectionLearning(owned, categoryId, entityId).catch(() => {
        // Silently swallow — learning is non-critical
      });
    }

    return { updated: result.count };
  }

  /**
   * Trigger correction learning for bulk categorize (fire-and-forget).
   * Loads descriptions and calls learnFromCorrection for each transaction.
   * @private
   */
  private async triggerCorrectionLearning(
    transactions: Array<{ id: string; account: { entityId: string } }>,
    categoryId: string,
    entityId: string,
  ): Promise<void> {
    const { learnFromCorrection } = await import('../../ai/services/categorization.service');

    // Load descriptions for the transactions
    const withDescriptions = await prisma.transaction.findMany({
      where: {
        id: { in: transactions.map((t) => t.id) },
        deletedAt: null,
      },
      select: { id: true, description: true },
    });

    // Analyze first 10 to avoid excessive DB queries
    const batch = withDescriptions.slice(0, 10);
    await Promise.allSettled(
      batch.map((txn) =>
        learnFromCorrection({
          transactionId: txn.id,
          description: txn.description,
          categoryId,
          entityId,
          tenantId: this.tenantId,
          userId: this.userId,
        })
      )
    );
  }

  /**
   * Get spending breakdown by category
   *
   * Groups expense transactions (negative amounts) by category,
   * returning totals, counts, and percentages.
   */
  async getSpendingByCategory(params: {
    entityId?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    categories: Array<{
      categoryId: string | null;
      categoryName: string;
      categoryColor: string | null;
      totalAmount: number;
      transactionCount: number;
      percentOfTotal: number;
    }>;
    totalExpenses: number;
    currency: string;
  }> {
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null,
      amount: { lt: 0 }, // Only expenses (negative amounts)
      account: {
        entity: { tenantId: this.tenantId },
        ...(params.entityId ? { entityId: params.entityId } : {}),
      },
      ...(params.accountId ? { accountId: params.accountId } : {}),
    };

    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = new Date(params.startDate);
      if (params.endDate) where.date.lte = new Date(params.endDate);
    }

    // Group by categoryId with aggregate sum and count
    const grouped = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'asc' } }, // Most negative (biggest expense) first
    });

    // Fetch category details for non-null categoryIds
    const categoryIds = grouped
      .map((g) => g.categoryId)
      .filter((id): id is string => id !== null);

    const categories = categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds }, tenantId: this.tenantId },
          select: { id: true, name: true, color: true },
        })
      : [];

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Compute total expenses (sum of all negative amounts → make positive for display)
    const totalExpenses = grouped.reduce(
      (sum, g) => sum + Math.abs(g._sum.amount ?? 0),
      0
    );

    // Determine currency from first account (fallback to USD)
    let currency = 'USD';
    if (params.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: params.accountId, entity: { tenantId: this.tenantId } },
        select: { currency: true },
      });
      if (account) currency = account.currency;
    } else {
      const firstAccount = await prisma.account.findFirst({
        where: { entity: { tenantId: this.tenantId } },
        select: { currency: true },
        orderBy: { createdAt: 'asc' },
      });
      if (firstAccount) currency = firstAccount.currency;
    }

    return {
      categories: grouped.map((g) => {
        const cat = g.categoryId ? categoryMap.get(g.categoryId) : null;
        const absAmount = Math.abs(g._sum.amount ?? 0);
        return {
          categoryId: g.categoryId,
          categoryName: cat?.name ?? 'Uncategorized',
          categoryColor: cat?.color ?? null,
          totalAmount: absAmount,
          transactionCount: g._count.id,
          percentOfTotal: totalExpenses > 0
            ? Math.round((absAmount / totalExpenses) * 10000) / 100
            : 0,
        };
      }),
      totalExpenses,
      currency,
    };
  }

  /**
   * Bulk soft delete transactions
   *
   * Soft-deletes multiple transactions. All must belong to tenant.
   * @returns Number of transactions deleted
   */
  async bulkSoftDelete(transactionIds: string[]): Promise<{ deleted: number }> {
    // Verify all transactions belong to tenant
    const owned = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        account: { entity: { tenantId: this.tenantId } },
        deletedAt: null,
      },
      select: { id: true, account: { select: { entityId: true } } },
    });

    if (owned.length !== transactionIds.length) {
      throw new Error(
        `Some transactions not found or not accessible. Requested: ${transactionIds.length}, Found: ${owned.length}`
      );
    }

    // Batch soft delete
    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        account: { entity: { tenantId: this.tenantId } },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    // Audit log for bulk operation
    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: owned[0]?.account.entityId,
      model: 'Transaction',
      recordId: 'bulk',
      action: 'DELETE',
      before: {
        operation: 'bulk_delete',
        transactionIds,
        count: result.count,
      },
    });

    return { deleted: result.count };
  }
}
