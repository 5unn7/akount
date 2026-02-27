import { prisma } from '@akount/db';
import { logger } from '../../../lib/logger';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export interface ListBudgetsParams {
  entityId: string;
  cursor?: string;
  limit?: number;
  period?: string;
  categoryId?: string;
}

export interface PaginatedBudgets {
  budgets: Awaited<ReturnType<typeof prisma.budget.findMany>>;
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Budget Service
 *
 * Manages financial budgets with category and GL account linking.
 * Budgets define spending limits per period (monthly, quarterly, yearly).
 * All amounts are integer cents. Tenant-isolated.
 */
export class BudgetService {
  constructor(private readonly tenantId: string) {}

  async listBudgets(params: ListBudgetsParams): Promise<PaginatedBudgets> {
    const { entityId, cursor, period, categoryId } = params;
    const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const where = {
      entityId,
      entity: { tenantId: this.tenantId },
      deletedAt: null,
      ...(period && { period }),
      ...(categoryId && { categoryId }),
    };

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        glAccount: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = budgets.length > limit;
    const data = hasMore ? budgets.slice(0, limit) : budgets;

    return {
      budgets: data,
      nextCursor: hasMore ? data[data.length - 1].id : undefined,
      hasMore,
    };
  }

  async getBudget(id: string) {
    return prisma.budget.findFirst({
      where: {
        id,
        deletedAt: null,
        entity: { tenantId: this.tenantId },
      },
      include: {
        category: { select: { id: true, name: true } },
        glAccount: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async createBudget(data: {
    name: string;
    entityId: string;
    categoryId?: string;
    glAccountId?: string;
    amount: number;
    period: string;
    startDate: Date;
    endDate: Date;
  }) {
    // Verify entity belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: { id: data.entityId, tenantId: this.tenantId },
    });
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    // Validate FK ownership: categoryId
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!category) throw new Error('Category not found or access denied');
    }

    // Validate FK ownership: glAccountId
    if (data.glAccountId) {
      const gl = await prisma.gLAccount.findFirst({
        where: { id: data.glAccountId, entity: { tenantId: this.tenantId } },
        select: { id: true },
      });
      if (!gl) throw new Error('GL account not found or access denied');
    }

    const budget = await prisma.budget.create({
      data: {
        entityId: data.entityId,
        name: data.name,
        categoryId: data.categoryId,
        glAccountId: data.glAccountId,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: {
        category: { select: { id: true, name: true } },
        glAccount: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async updateBudget(id: string, data: {
    name?: string;
    categoryId?: string | null;
    glAccountId?: string | null;
    amount?: number;
    period?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    // Verify budget exists and belongs to tenant
    const existing = await prisma.budget.findFirst({
      where: { id, deletedAt: null, entity: { tenantId: this.tenantId } },
    });
    if (!existing) {
      throw new Error('Budget not found or access denied');
    }

    // Validate date range (considering partial updates)
    const effectiveStart = data.startDate ?? existing.startDate;
    const effectiveEnd = data.endDate ?? existing.endDate;
    if (effectiveEnd <= effectiveStart) {
      throw new Error('End date must be after start date');
    }

    // Validate FK ownership for updated references
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!category) throw new Error('Category not found or access denied');
    }

    if (data.glAccountId) {
      const gl = await prisma.gLAccount.findFirst({
        where: { id: data.glAccountId, entity: { tenantId: this.tenantId } },
        select: { id: true },
      });
      if (!gl) throw new Error('GL account not found or access denied');
    }

    return prisma.budget.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.glAccountId !== undefined && { glAccountId: data.glAccountId }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.period !== undefined && { period: data.period }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      },
      include: {
        category: { select: { id: true, name: true } },
        glAccount: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /**
   * Roll over an expired budget to the next period.
   * Creates a new budget carrying unused amount forward.
   */
  async rolloverBudget(id: string, carryUnusedAmount: boolean = true) {
    const existing = await prisma.budget.findFirst({
      where: { id, deletedAt: null, entity: { tenantId: this.tenantId } },
      include: {
        category: { select: { id: true, name: true } },
        glAccount: { select: { id: true, code: true, name: true } },
      },
    });
    if (!existing) {
      throw new Error('Budget not found or access denied');
    }

    // Calculate next period dates
    const start = new Date(existing.startDate);
    const end = new Date(existing.endDate);
    const durationMs = end.getTime() - start.getTime();

    const newStart = new Date(end);
    newStart.setDate(newStart.getDate() + 1);
    const newEnd = new Date(newStart.getTime() + durationMs);

    // Calculate unused amount if carrying forward
    let newAmount = existing.amount;
    if (carryUnusedAmount) {
      // Get actual spend from journal lines for this budget's period
      const whereClause: Record<string, unknown> = {
        journalEntry: {
          entityId: existing.entityId,
          entity: { tenantId: this.tenantId },
          status: 'POSTED',
          date: { gte: existing.startDate, lte: existing.endDate },
        },
        debitAmount: { gt: 0 },
      };

      if (existing.glAccountId) {
        // FIN-35: Validate GL account ownership before query
        whereClause.glAccountId = existing.glAccountId;
        whereClause.glAccount = { entity: { tenantId: this.tenantId } };
      }

      const result = await prisma.journalLine.aggregate({
        where: whereClause,
        _sum: { debitAmount: true },
      });

      const actualSpend = result._sum.debitAmount ?? 0;
      const unused = Math.max(0, existing.amount - actualSpend);
      newAmount = existing.amount + unused; // Original budget + unused carry-forward
    }

    return prisma.budget.create({
      data: {
        entityId: existing.entityId,
        name: `${existing.name} (Rollover)`,
        categoryId: existing.categoryId,
        glAccountId: existing.glAccountId,
        amount: newAmount,
        period: existing.period,
        startDate: newStart,
        endDate: newEnd,
      },
      include: {
        category: { select: { id: true, name: true } },
        glAccount: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async deleteBudget(id: string) {
    // Verify budget exists and belongs to tenant
    const existing = await prisma.budget.findFirst({
      where: { id, deletedAt: null, entity: { tenantId: this.tenantId } },
    });
    if (!existing) {
      throw new Error('Budget not found or access denied');
    }

    // Soft delete
    return prisma.budget.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
