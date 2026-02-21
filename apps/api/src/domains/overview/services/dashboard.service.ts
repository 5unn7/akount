import { prisma, type AccountType } from '@akount/db';
import { FxRateService } from '../../banking/services/fx-rate.service';
import { getBillStats } from '../../vendors/services/bill.service';
import { getInvoiceStats } from '../../invoicing/services/invoice.service';

interface DashboardMetrics {
  netWorth: {
    amount: number;
    currency: string;
  };
  cashPosition: {
    cash: number;
    debt: number;
    net: number;
    currency: string;
  };
  accounts: {
    total: number;
    active: number;
    byType: Partial<Record<AccountType, number>>;
  };
  receivables?: {
    outstanding: number;
    overdue: number;
  };
  payables?: {
    outstanding: number;
    overdue: number;
  };
}

export class DashboardService {
  private fxService: FxRateService;

  constructor(private tenantId: string) {
    this.fxService = new FxRateService();
  }

  async getMetrics(entityId?: string, targetCurrency: string = 'USD'): Promise<DashboardMetrics> {
    const baseCurrency = targetCurrency || 'USD';

    // Query all active accounts for the tenant
    const accounts = await prisma.account.findMany({
      where: {
        entity: {
          tenantId: this.tenantId,
          ...(entityId && { id: entityId }),
        },
        isActive: true,
      },
    });

    // Fetch receivables and payables in parallel
    const [invoiceStats, billStats] = await Promise.all([
      getInvoiceStats({ tenantId: this.tenantId, userId: '', role: 'OWNER' }, entityId),
      getBillStats({ tenantId: this.tenantId, userId: '', role: 'OWNER' }, entityId),
    ]);

    // Extract unique currencies and batch fetch FX rates (eliminates N+1 queries)
    const uniqueCurrencies = [...new Set(accounts.map((a) => a.currency))];
    const currencyPairs = uniqueCurrencies.map((curr) => ({
      from: curr,
      to: baseCurrency,
    }));

    // Single batch query for all FX rates
    const rates = await this.fxService.getRateBatch(currencyPairs);

    // Aggregate metrics with batch-fetched rates (no async in loop!)
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalCash = 0;
    let totalDebt = 0;

    for (const account of accounts) {
      const balance = account.currentBalance;
      const rateKey = `${account.currency}_${baseCurrency}`;
      const rate = rates.get(rateKey) ?? 1.0;

      // Convert balance using cached rate (no database query!)
      const convertedBalance = Math.round(Math.abs(balance) * rate);

      // Assets: BANK, INVESTMENT
      if (['BANK', 'INVESTMENT'].includes(account.type)) {
        totalAssets += convertedBalance;
        if (account.type === 'BANK' && balance > 0) {
          totalCash += convertedBalance;
        }
      }

      // Liabilities: CREDIT_CARD, LOAN, MORTGAGE
      if (['CREDIT_CARD', 'LOAN', 'MORTGAGE'].includes(account.type)) {
        totalLiabilities += convertedBalance;
        if (['CREDIT_CARD', 'LOAN'].includes(account.type)) {
          totalDebt += convertedBalance;
        }
      }
    }

    const netWorth = totalAssets - totalLiabilities;

    return {
      netWorth: {
        amount: netWorth,
        currency: baseCurrency,
      },
      cashPosition: {
        cash: totalCash,
        debt: totalDebt,
        net: totalCash - totalDebt,
        currency: baseCurrency,
      },
      accounts: {
        total: accounts.length,
        active: accounts.length,
        byType: accounts.reduce<Partial<Record<AccountType, number>>>(
          (acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
          },
          {}
        ),
      },
      receivables: {
        outstanding: invoiceStats.outstandingAR,
        overdue: invoiceStats.overdue,
      },
      payables: {
        outstanding: billStats.outstandingAP,
        overdue: billStats.overdue,
      },
    };
  }

  /**
   * Generate 60-day cash flow projection based on historical transaction patterns
   *
   * Algorithm:
   * 1. Start with current cash position
   * 2. Calculate 30-day average daily cash flow from historical transactions
   * 3. Project forward 60 days using historical average + known future payments/receipts
   *
   * @param entityId Optional entity ID filter
   * @param currency Target currency for projection
   * @returns Array of { date: string, value: number } data points (60 days)
   */
  async getCashFlowProjection(
    entityId?: string,
    targetCurrency: string = 'USD'
  ): Promise<Array<{ date: string; value: number }>> {
    const baseCurrency = targetCurrency || 'USD';

    // 1. Get current cash position
    const metrics = await this.getMetrics(entityId, baseCurrency);
    const currentCash = metrics.cashPosition.cash;

    // 2. Get historical transactions from last 30 days to calculate average daily flow
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await prisma.transaction.findMany({
      where: {
        account: {
          entity: {
            tenantId: this.tenantId,
            ...(entityId && { id: entityId }),
          },
          type: 'BANK', // Only bank accounts for cash flow
        },
        date: {
          gte: thirtyDaysAgo,
        },
        deletedAt: null,
      },
      select: {
        amount: true,
        date: true,
        account: {
          select: {
            currency: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 3. Convert all transactions to base currency and calculate daily net flow
    // Extract unique currencies and batch fetch FX rates
    const uniqueCurrencies = [...new Set(transactions.map((t) => t.account.currency))];
    const currencyPairs = uniqueCurrencies.map((curr) => ({
      from: curr,
      to: baseCurrency,
    }));

    const rates = await this.fxService.getRateBatch(currencyPairs);

    const dailyFlows = new Map<string, number>();

    for (const txn of transactions) {
      const dateKey = txn.date.toISOString().split('T')[0];
      const rateKey = `${txn.account.currency}_${baseCurrency}`;
      const rate = rates.get(rateKey) ?? 1.0;

      const convertedAmount = Math.round(txn.amount * rate);
      dailyFlows.set(dateKey, (dailyFlows.get(dateKey) || 0) + convertedAmount);
    }

    // Calculate average daily cash flow (in cents)
    const totalFlow = Array.from(dailyFlows.values()).reduce((sum, val) => sum + val, 0);
    const avgDailyFlow = transactions.length > 0 ? Math.round(totalFlow / 30) : 0;

    // Return empty when truly no data exists
    if (transactions.length === 0 && currentCash === 0) {
      return [];
    }

    const today = new Date();
    const result: Array<{ date: string; value: number }> = [];

    // 4. Build 30 days of historical actuals (reconstruct balance from transactions)
    let historicalBalance = currentCash - totalFlow; // estimated balance 30 days ago

    for (let i = 0; i < 30; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - (30 - i));
      const dateKey = pastDate.toISOString().split('T')[0];
      const dayFlow = dailyFlows.get(dateKey) ?? 0;

      historicalBalance += dayFlow;

      const dateStr = pastDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      result.push({
        date: dateStr,
        value: Math.round(historicalBalance / 100),
      });
    }

    // 5. Generate 30-day forward projection using average daily flow
    let projectedBalance = currentCash;

    for (let i = 0; i < 30; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);

      projectedBalance += avgDailyFlow;

      const dateStr = futureDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      result.push({
        date: dateStr,
        value: Math.round(projectedBalance / 100),
      });
    }

    return result;
  }
}
