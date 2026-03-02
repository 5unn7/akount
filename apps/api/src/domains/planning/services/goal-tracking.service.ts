import { prisma } from '@akount/db';

/**
 * Goal Tracking Service
 *
 * Auto-tracks goal progress by reading cross-domain data:
 * - Account-linked goals: reads account.currentBalance
 * - Category-linked goals: sums transaction amounts for category
 * - GL-linked goals: sums journal line balances for GL account
 *
 * All amounts in integer cents. Tenant-isolated.
 */

export interface MilestoneEvent {
  goalId: string;
  goalName: string;
  threshold: number; // 25, 50, 75, 100
  currentPercent: number;
  currentAmount: number;
  targetAmount: number;
}

export interface TrackingResult {
  goalId: string;
  goalName: string;
  previousAmount: number;
  currentAmount: number;
  targetAmount: number;
  progressPercent: number;
  milestones: MilestoneEvent[];
  updated: boolean;
}

const MILESTONE_THRESHOLDS = [25, 50, 75, 100];

export class GoalTrackingService {
  constructor(private readonly tenantId: string) {}

  /**
   * Track all active goals for an entity.
   * Reads cross-domain data and updates currentAmount.
   */
  async trackGoals(entityId: string): Promise<TrackingResult[]> {
    const goals = await prisma.goal.findMany({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (goals.length === 0) return [];

    const results: TrackingResult[] = [];

    for (const goal of goals) {
      const currentAmount = await this.calculateCurrentAmount(goal);
      const previousAmount = goal.currentAmount;
      const progressPercent =
        goal.targetAmount > 0
          ? Math.round((currentAmount / goal.targetAmount) * 10000) / 100
          : 0;

      // Detect milestone crossings
      const milestones = this.detectMilestones(
        goal,
        previousAmount,
        currentAmount
      );

      // Update goal if amount changed
      const updated = currentAmount !== previousAmount;
      if (updated) {
        await prisma.goal.update({
          where: { id: goal.id },
          data: { currentAmount },
        });
      }

      results.push({
        goalId: goal.id,
        goalName: goal.name,
        previousAmount,
        currentAmount,
        targetAmount: goal.targetAmount,
        progressPercent,
        milestones,
        updated,
      });
    }

    return results;
  }

  /**
   * Track a single goal and return its current progress.
   */
  async trackGoal(goalId: string): Promise<TrackingResult | null> {
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        entity: { tenantId: this.tenantId },
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!goal) return null;

    const currentAmount = await this.calculateCurrentAmount(goal);
    const previousAmount = goal.currentAmount;
    const progressPercent =
      goal.targetAmount > 0
        ? Math.round((currentAmount / goal.targetAmount) * 10000) / 100
        : 0;

    const milestones = this.detectMilestones(goal, previousAmount, currentAmount);

    const updated = currentAmount !== previousAmount;
    if (updated) {
      await prisma.goal.update({
        where: { id: goal.id },
        data: { currentAmount },
      });
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      previousAmount,
      currentAmount,
      targetAmount: goal.targetAmount,
      progressPercent,
      milestones,
      updated,
    };
  }

  /**
   * Calculate current amount based on goal's linked data source.
   * Priority: accountId > categoryId > glAccountId > manual (no change)
   */
  private async calculateCurrentAmount(goal: {
    accountId: string | null;
    categoryId: string | null;
    glAccountId: string | null;
    entityId: string;
    currentAmount: number;
    createdAt: Date;
  }): Promise<number> {
    if (goal.accountId) {
      return this.getAccountBalance(goal.accountId);
    }

    if (goal.categoryId) {
      return this.getCategoryTotal(goal.entityId, goal.categoryId, goal.createdAt);
    }

    if (goal.glAccountId) {
      return this.getGLAccountBalance(goal.entityId, goal.glAccountId, goal.createdAt);
    }

    // Manual tracking — no auto-calculation
    return goal.currentAmount;
  }

  /**
   * Read current balance from a bank account.
   */
  private async getAccountBalance(accountId: string): Promise<number> {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        entity: { tenantId: this.tenantId },
        deletedAt: null,
      },
      select: { currentBalance: true },
    });

    return account?.currentBalance ?? 0;
  }

  /**
   * Sum transaction amounts for a category since the goal was created.
   * Uses absolute values (income and expenses both count as positive progress).
   */
  private async getCategoryTotal(
    entityId: string,
    categoryId: string,
    sinceDate: Date
  ): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        categoryId,
        deletedAt: null,
        date: { gte: sinceDate },
        account: {
          entityId,
          entity: { tenantId: this.tenantId },
        },
      },
      _sum: { amount: true },
    });

    // Return absolute value — both income and expense reduction goals track positive progress
    return Math.abs(result._sum.amount ?? 0);
  }

  /**
   * Calculate net balance from journal lines for a GL account since goal creation.
   * For revenue goals: credits - debits (revenue increases via credits)
   * For expense goals: debits - credits (expenses increase via debits)
   * Returns absolute value for universal progress tracking.
   */
  private async getGLAccountBalance(
    entityId: string,
    glAccountId: string,
    sinceDate: Date
  ): Promise<number> {
    const result = await prisma.journalLine.aggregate({
      where: {
        glAccountId,
        deletedAt: null,
        journalEntry: {
          entityId,
          entity: { tenantId: this.tenantId },
          date: { gte: sinceDate },
          deletedAt: null,
          status: 'POSTED',
        },
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    const debits = result._sum.debitAmount ?? 0;
    const credits = result._sum.creditAmount ?? 0;

    // Return net amount as absolute value for progress tracking
    return Math.abs(debits - credits);
  }

  /**
   * Detect milestone threshold crossings between previous and current amounts.
   */
  private detectMilestones(
    goal: { id: string; name: string; targetAmount: number },
    previousAmount: number,
    currentAmount: number
  ): MilestoneEvent[] {
    if (goal.targetAmount <= 0) return [];

    const previousPercent = (previousAmount / goal.targetAmount) * 100;
    const currentPercent = (currentAmount / goal.targetAmount) * 100;

    return MILESTONE_THRESHOLDS.filter(
      (threshold) => previousPercent < threshold && currentPercent >= threshold
    ).map((threshold) => ({
      goalId: goal.id,
      goalName: goal.name,
      threshold,
      currentPercent: Math.round(currentPercent * 100) / 100,
      currentAmount,
      targetAmount: goal.targetAmount,
    }));
  }
}
