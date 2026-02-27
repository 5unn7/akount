import { prisma } from '@akount/db';
import { logger } from '../../../lib/logger';

export interface CashRunwayResult {
  cashBalance: number; // Total cash from BANK accounts (cents)
  monthlyBurnRate: number; // Average monthly expenses (cents, positive)
  monthlyRevenue: number; // Average monthly revenue (cents, positive)
  netBurnRate: number; // monthlyBurnRate - monthlyRevenue (cents)
  runwayMonths: number; // cashBalance / netBurnRate (rounded to 1 decimal)
  runwayDate: string | null; // Projected date when cash runs out (ISO string)
  monthsAnalyzed: number; // How many months of data used for burn rate
}

export class CashRunwayService {
  constructor(private readonly tenantId: string) {}

  async calculateRunway(entityId: string): Promise<CashRunwayResult> {
    // 1. Get total cash balance from BANK accounts
    const cashBalance = await this.getTotalCashBalance(entityId);

    // 2. Calculate average monthly burn rate from last 6 months of journal entries
    const { monthlyExpenses, monthlyRevenue, monthsAnalyzed } =
      await this.getMonthlyAverages(entityId);

    // Net burn = expenses - revenue (if positive, company is burning cash)
    const netBurnRate = Math.max(0, monthlyExpenses - monthlyRevenue);

    // 3. Calculate runway
    const runwayMonths =
      netBurnRate > 0
        ? Math.round((cashBalance / netBurnRate) * 10) / 10
        : -1; // -1 means infinite runway (revenue exceeds expenses)

    let runwayDate: string | null = null;
    if (runwayMonths > 0 && runwayMonths !== -1) {
      const date = new Date();
      date.setMonth(date.getMonth() + Math.floor(runwayMonths));
      runwayDate = date.toISOString();
    }

    const result = {
      cashBalance,
      monthlyBurnRate: monthlyExpenses,
      monthlyRevenue,
      netBurnRate,
      runwayMonths,
      runwayDate,
      monthsAnalyzed,
    };

    logger.info({
      entityId,
      runwayMonths: result.runwayMonths,
      cashBalance: result.cashBalance,
      netBurnRate: result.netBurnRate
    }, 'Calculated cash runway');

    return result;
  }

  private async getTotalCashBalance(entityId: string): Promise<number> {
    const result = await prisma.account.aggregate({
      where: {
        entityId,
        entity: { tenantId: this.tenantId },
        type: 'BANK',
        isActive: true,
        deletedAt: null,
      },
      _sum: { currentBalance: true },
    });

    return result._sum.currentBalance ?? 0;
  }

  private async getMonthlyAverages(entityId: string): Promise<{
    monthlyExpenses: number;
    monthlyRevenue: number;
    monthsAnalyzed: number;
  }> {
    // Look back 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Start of month
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // FIN-34: Filter by GL account type for accurate burn rate
    // Only include EXPENSE accounts for burn, INCOME accounts for revenue
    const expenseResult = await prisma.journalLine.aggregate({
      where: {
        deletedAt: null,
        glAccount: {
          type: 'EXPENSE',
          entity: { tenantId: this.tenantId },
        },
        journalEntry: {
          entityId,
          entity: { tenantId: this.tenantId },
          date: { gte: sixMonthsAgo },
          deletedAt: null,
          status: 'POSTED',
        },
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    const revenueResult = await prisma.journalLine.aggregate({
      where: {
        deletedAt: null,
        glAccount: {
          type: 'INCOME',
          entity: { tenantId: this.tenantId },
        },
        journalEntry: {
          entityId,
          entity: { tenantId: this.tenantId },
          date: { gte: sixMonthsAgo },
          deletedAt: null,
          status: 'POSTED',
        },
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    // Calculate months elapsed (at least 1 to avoid division by zero)
    const now = new Date();
    const monthsDiff = Math.max(
      1,
      (now.getFullYear() - sixMonthsAgo.getFullYear()) * 12 +
        (now.getMonth() - sixMonthsAgo.getMonth())
    );

    // For EXPENSE accounts: debits increase expense, credits decrease
    const totalExpenses = (expenseResult._sum.debitAmount ?? 0) - (expenseResult._sum.creditAmount ?? 0);

    // For INCOME accounts: credits increase revenue, debits decrease
    const totalRevenue = (revenueResult._sum.creditAmount ?? 0) - (revenueResult._sum.debitAmount ?? 0);

    const monthlyExpenses = Math.round(totalExpenses / monthsDiff);
    const monthlyRevenue = Math.round(totalRevenue / monthsDiff);

    return {
      monthlyExpenses,
      monthlyRevenue,
      monthsAnalyzed: monthsDiff,
    };
  }
}
