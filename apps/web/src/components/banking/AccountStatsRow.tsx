import { StatsGrid } from '@/components/shared/StatsGrid';
import type { TransactionStats } from '@/lib/utils/account-helpers';
import { formatCurrency } from '@/lib/utils/currency';

interface AccountStatsRowProps {
    stats: TransactionStats;
    currency: string;
    avgDailyFlow?: number;
}

export function AccountStatsRow({
    stats,
    currency,
    avgDailyFlow = 0,
}: AccountStatsRowProps) {
    const items = [
        {
            label: 'Income MTD',
            value: formatCurrency(stats.incomeMTD, currency),
            color: 'green' as const,
        },
        {
            label: 'Expenses MTD',
            value: formatCurrency(stats.expenseMTD, currency),
            color: 'red' as const,
        },
        {
            label: 'Unreconciled',
            value: `${stats.unreconciledCount}`,
            color:
                stats.unreconciledCount > 0
                    ? ('primary' as const)
                    : ('default' as const),
        },
        {
            label: 'Avg Daily Flow',
            value: formatCurrency(Math.abs(avgDailyFlow), currency),
            color: avgDailyFlow >= 0 ? ('green' as const) : ('red' as const),
            trend: {
                direction:
                    avgDailyFlow >= 0
                        ? ('up' as const)
                        : ('down' as const),
                text: avgDailyFlow >= 0 ? 'Positive' : 'Negative',
            },
        },
        {
            label: 'Transactions',
            value: `${stats.totalCount}`,
            color: 'blue' as const,
        },
    ];

    return <StatsGrid stats={items} columns={5} />;
}
