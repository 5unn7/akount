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
      getInvoiceStats({ tenantId: this.tenantId, userId: '', role: 'OWNER' }),
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

  /**
   * Get upcoming payments — bills due + expected invoice payments
   *
   * Returns the next 10 upcoming financial events (bill due dates and expected invoice payments)
   * sorted by date ascending.
   *
   * @param entityId Optional entity ID filter
   * @param limit Maximum number of items to return (default: 10)
   * @returns Array of upcoming payment events
   */
  async getUpcomingPayments(
    entityId?: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    type: 'BILL' | 'INVOICE';
    name: string;
    dueDate: Date;
    amount: number;
    currency: string;
    status: string;
  }>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch upcoming bills (AP - money going out)
    const upcomingBills = await prisma.bill.findMany({
      where: {
        entity: {
          tenantId: this.tenantId,
          ...(entityId && { id: entityId }),
        },
        dueDate: {
          gte: today,
        },
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        billNumber: true,
        dueDate: true,
        totalAmount: true,
        currency: true,
        status: true,
        vendor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: limit,
    });

    // Fetch upcoming invoice payments (AR - money coming in)
    const upcomingInvoices = await prisma.invoice.findMany({
      where: {
        entity: {
          tenantId: this.tenantId,
          ...(entityId && { id: entityId }),
        },
        dueDate: {
          gte: today,
        },
        status: {
          in: ['SENT', 'VIEWED'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        invoiceNumber: true,
        dueDate: true,
        totalAmount: true,
        currency: true,
        status: true,
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: limit,
    });

    // Combine and sort by due date
    const combined = [
      ...upcomingBills.map((bill) => ({
        id: bill.id,
        type: 'BILL' as const,
        name: bill.vendor.name,
        dueDate: bill.dueDate,
        amount: bill.totalAmount,
        currency: bill.currency,
        status: bill.status,
      })),
      ...upcomingInvoices.map((invoice) => ({
        id: invoice.id,
        type: 'INVOICE' as const,
        name: invoice.client.name,
        dueDate: invoice.dueDate,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        status: invoice.status,
      })),
    ];

    // Sort by due date and limit
    combined.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return combined.slice(0, limit);
  }

  /**
   * Get expense breakdown by category for charting
   *
   * Returns monthly expense totals grouped by category for the last N months.
   * Used by ExpenseChart component.
   *
   * @param entityId Optional entity ID filter
   * @param months Number of months to include (default: 6)
   * @param currency Target currency for amounts
   * @returns Array of monthly category breakdowns
   */
  async getExpenseBreakdown(
    entityId?: string,
    months: number = 6,
    targetCurrency: string = 'USD'
  ): Promise<Array<{
    label: string;
    categories: Array<{
      name: string;
      amount: number;
      color: string;
    }>;
  }>> {
    const baseCurrency = targetCurrency || 'USD';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Fetch expense transactions with categories
    const transactions = await prisma.transaction.findMany({
      where: {
        account: {
          entity: {
            tenantId: this.tenantId,
            ...(entityId && { id: entityId }),
          },
        },
        amount: {
          lt: 0, // Expenses are negative
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      select: {
        amount: true,
        date: true,
        categoryId: true,
        account: {
          select: {
            currency: true,
          },
        },
        category: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Convert to base currency
    const uniqueCurrencies = [...new Set(transactions.map((t) => t.account.currency))];
    const currencyPairs = uniqueCurrencies.map((curr) => ({
      from: curr,
      to: baseCurrency,
    }));

    const rates = await this.fxService.getRateBatch(currencyPairs);

    // Group by month and category
    const monthlyData = new Map<string, Map<string, { amount: number; color: string }>>();

    for (const txn of transactions) {
      const monthKey = new Date(txn.date).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });

      const rateKey = `${txn.account.currency}_${baseCurrency}`;
      const rate = rates.get(rateKey) ?? 1.0;

      // Convert to positive dollars for display
      const convertedAmount = Math.abs(Math.round(txn.amount * rate)) / 100;

      const categoryName = txn.category?.name || 'Uncategorized';
      const categoryColor = txn.category?.color || '#71717A'; // muted-foreground

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, new Map());
      }

      const categoryMap = monthlyData.get(monthKey)!;
      const existing = categoryMap.get(categoryName);

      categoryMap.set(categoryName, {
        amount: (existing?.amount || 0) + convertedAmount,
        color: existing?.color || categoryColor,
      });
    }

    // Convert to array format for chart
    const result = Array.from(monthlyData.entries()).map(([label, categoryMap]) => ({
      label,
      categories: Array.from(categoryMap.entries()).map(([name, { amount, color }]) => ({
        name,
        amount: Math.round(amount), // Round to whole dollars
        color,
      })),
    }));

    return result;
  }

  /**
   * Get action items — unreconciled transactions, overdue invoices, overdue bills
   *
   * Returns actionable items that need user attention, sorted by urgency.
   *
   * @param entityId Optional entity ID filter
   * @param limit Maximum number of items to return (default: 10)
   * @returns Array of action items
   */
  async getActionItems(
    entityId?: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    type: 'UNRECONCILED_TXN' | 'OVERDUE_INVOICE' | 'OVERDUE_BILL';
    title: string;
    meta: string;
    urgencyScore: number;
    href: string;
  }>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const actionItems: Array<{
      id: string;
      type: 'UNRECONCILED_TXN' | 'OVERDUE_INVOICE' | 'OVERDUE_BILL';
      title: string;
      meta: string;
      urgencyScore: number;
      href: string;
    }> = [];

    // 1. Unreconciled transactions (highest urgency)
    const unreconciledTxns = await prisma.transaction.findMany({
      where: {
        account: {
          entity: {
            tenantId: this.tenantId,
            ...(entityId && { id: entityId }),
          },
        },
        reconciliationId: null,
        deletedAt: null,
      },
      select: {
        id: true,
        date: true,
        description: true,
        account: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: Math.ceil(limit / 3),
    });

    for (const txn of unreconciledTxns) {
      const daysOld = Math.floor(
        (today.getTime() - new Date(txn.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      actionItems.push({
        id: txn.id,
        type: 'UNRECONCILED_TXN',
        title: `Reconcile: ${txn.description || 'Transaction'}`,
        meta: `${txn.account.name} • ${daysOld}d ago`,
        urgencyScore: daysOld,
        href: `/banking/reconciliation?accountId=${txn.account}`,
      });
    }

    // 2. Overdue invoices (AR)
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        entity: {
          tenantId: this.tenantId,
          ...(entityId && { id: entityId }),
        },
        dueDate: {
          lt: today,
        },
        status: {
          in: ['SENT', 'VIEWED'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        invoiceNumber: true,
        dueDate: true,
        totalAmount: true,
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: Math.ceil(limit / 3),
    });

    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const amountDollars = Math.round(invoice.totalAmount / 100);
      actionItems.push({
        id: invoice.id,
        type: 'OVERDUE_INVOICE',
        title: `Follow up: ${invoice.client.name}`,
        meta: `$${amountDollars} • ${daysOverdue}d overdue`,
        urgencyScore: daysOverdue + 100, // Higher base urgency
        href: `/business/invoices/${invoice.id}`,
      });
    }

    // 3. Overdue bills (AP)
    const overdueBills = await prisma.bill.findMany({
      where: {
        entity: {
          tenantId: this.tenantId,
          ...(entityId && { id: entityId }),
        },
        dueDate: {
          lt: today,
        },
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        billNumber: true,
        dueDate: true,
        totalAmount: true,
        vendor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: Math.ceil(limit / 3),
    });

    for (const bill of overdueBills) {
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const amountDollars = Math.round(bill.totalAmount / 100);
      actionItems.push({
        id: bill.id,
        type: 'OVERDUE_BILL',
        title: `Pay bill: ${bill.vendor.name}`,
        meta: `$${amountDollars} • ${daysOverdue}d overdue`,
        urgencyScore: daysOverdue + 50, // Medium urgency
        href: `/business/bills/${bill.id}`,
      });
    }

    // Sort by urgency score descending and limit
    actionItems.sort((a, b) => b.urgencyScore - a.urgencyScore);
    return actionItems.slice(0, limit);
  }
}
