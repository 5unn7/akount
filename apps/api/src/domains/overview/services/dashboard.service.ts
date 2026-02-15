import { prisma } from '@akount/db';
import { FxRateService } from '../../../services/fxRate.service';

export class DashboardService {
  private fxService: FxRateService;

  constructor(private tenantId: string) {
    this.fxService = new FxRateService();
  }

  async getMetrics(entityId?: string, targetCurrency: string = 'USD') {
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
        byType: accounts.reduce(
          (acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };
  }
}
