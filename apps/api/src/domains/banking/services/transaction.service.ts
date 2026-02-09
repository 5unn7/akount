import { prisma } from '@akount/db';

// Constants for pagination
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Types for pagination and filtering
export interface ListTransactionsParams {
  accountId?: string;
  startDate?: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
  categoryId?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedTransactions {
  transactions: Awaited<ReturnType<typeof prisma.transaction.findMany>>;
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
  sourceType: 'MANUAL' | 'BANK_FEED' | 'INVOICE' | 'BILL';
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
  constructor(private tenantId: string) {}

  /**
   * List transactions with filters and cursor-based pagination
   */
  async listTransactions(params: ListTransactionsParams = {}): Promise<PaginatedTransactions> {
    const { accountId, startDate, endDate, categoryId, cursor } = params;

    // Ensure limit is within bounds
    const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    // Build where clause with tenant isolation
    const where: any = {
      deletedAt: null, // Soft delete filter
    };

    // Account filter (entity-scoped tenant check)
    if (accountId) {
      where.account = {
        id: accountId,
        entity: {
          tenantId: this.tenantId,
        },
      };
    } else {
      // If no accountId, filter all transactions by tenant
      where.account = {
        entity: {
          tenantId: this.tenantId,
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
      include: {
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
      },
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
  async getTransaction(id: string): Promise<Awaited<ReturnType<typeof prisma.transaction.findFirst>> | null> {
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
      include: {
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
      },
    });

    return transaction;
  }

  /**
   * Create new posted transaction
   *
   * @throws Error if account doesn't belong to tenant
   */
  async createTransaction(data: CreateTransactionInput): Promise<Awaited<ReturnType<typeof prisma.transaction.create>>> {
    // Verify account belongs to tenant (tenant isolation check)
    const account = await prisma.account.findFirst({
      where: {
        id: data.accountId,
        entity: {
          tenantId: this.tenantId,
        },
        deletedAt: null,
      },
    });

    if (!account) {
      throw new Error('Account not found or does not belong to this tenant');
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
      include: {
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
  ): Promise<Awaited<ReturnType<typeof prisma.transaction.update>>> {
    // Verify transaction belongs to tenant
    const existing = await this.getTransaction(id);

    if (!existing) {
      throw new Error('Transaction not found or does not belong to this tenant');
    }

    // Update transaction (only allowed fields)
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description: data.description,
        categoryId: data.categoryId === null ? null : data.categoryId, // Allow unsetting
        notes: data.notes === null ? null : data.notes, // Allow unsetting
      },
      include: {
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
    // Verify transaction belongs to tenant
    const existing = await this.getTransaction(id);

    if (!existing) {
      throw new Error('Transaction not found or does not belong to this tenant');
    }

    // Soft delete by setting deletedAt timestamp
    await prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
