import { prisma } from '@akount/db';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export interface ListGoalsParams {
  entityId: string;
  cursor?: string;
  limit?: number;
  status?: string;
  type?: string;
}

export interface PaginatedGoals {
  goals: Awaited<ReturnType<typeof prisma.goal.findMany>>;
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Goal Service
 *
 * Manages financial goals (revenue targets, savings, expense reduction).
 * Goals can be linked to accounts, categories, or GL accounts for auto-tracking.
 * All amounts are integer cents. Tenant-isolated.
 */
export class GoalService {
  constructor(private readonly tenantId: string) {}

  async listGoals(params: ListGoalsParams): Promise<PaginatedGoals> {
    const { entityId, cursor, status, type } = params;
    const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const where = {
      entityId,
      entity: { tenantId: this.tenantId },
      deletedAt: null,
      ...(status && { status }),
      ...(type && { type }),
    };

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = goals.length > limit;
    const data = hasMore ? goals.slice(0, limit) : goals;

    return {
      goals: data,
      nextCursor: hasMore ? data[data.length - 1].id : undefined,
      hasMore,
    };
  }

  async getGoal(id: string) {
    return prisma.goal.findFirst({
      where: {
        id,
        deletedAt: null,
        entity: { tenantId: this.tenantId },
      },
    });
  }

  async createGoal(data: {
    name: string;
    entityId: string;
    type: string;
    targetAmount: number;
    targetDate: Date;
    accountId?: string;
    categoryId?: string;
    glAccountId?: string;
  }) {
    // Verify entity belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: { id: data.entityId, tenantId: this.tenantId },
    });
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    // Validate FK ownership: accountId
    if (data.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: data.accountId, entity: { tenantId: this.tenantId }, deletedAt: null },
        select: { id: true },
      });
      if (!account) throw new Error('Account not found or access denied');
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

    return prisma.goal.create({
      data: {
        entityId: data.entityId,
        name: data.name,
        type: data.type,
        targetAmount: data.targetAmount,
        currentAmount: 0,
        targetDate: data.targetDate,
        accountId: data.accountId,
        categoryId: data.categoryId,
        glAccountId: data.glAccountId,
        status: 'ACTIVE',
      },
    });
  }

  async updateGoal(id: string, data: {
    name?: string;
    type?: string;
    targetAmount?: number;
    currentAmount?: number;
    targetDate?: Date;
    accountId?: string | null;
    categoryId?: string | null;
    glAccountId?: string | null;
    status?: string;
  }) {
    // Verify goal exists and belongs to tenant
    const existing = await prisma.goal.findFirst({
      where: { id, deletedAt: null, entity: { tenantId: this.tenantId } },
    });
    if (!existing) {
      throw new Error('Goal not found or access denied');
    }

    // Validate FK ownership for updated references
    if (data.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: data.accountId, entity: { tenantId: this.tenantId }, deletedAt: null },
        select: { id: true },
      });
      if (!account) throw new Error('Account not found or access denied');
    }

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

    return prisma.goal.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
        ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
        ...(data.accountId !== undefined && { accountId: data.accountId }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.glAccountId !== undefined && { glAccountId: data.glAccountId }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async deleteGoal(id: string) {
    // Verify goal exists and belongs to tenant
    const existing = await prisma.goal.findFirst({
      where: { id, deletedAt: null, entity: { tenantId: this.tenantId } },
    });
    if (!existing) {
      throw new Error('Goal not found or access denied');
    }

    // Soft delete
    return prisma.goal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
