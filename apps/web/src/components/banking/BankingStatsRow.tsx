import { StatsGrid } from '@/components/shared/StatsGrid';
import type { TransactionStats } from '@/lib/utils/account-helpers';
import { formatCurrency } from '@/lib/utils/currency';

interface BankingStatsRowProps {
    stats: TransactionStats;
    accountCount: number;
    currency: string;
}

export function BankingStatsRow({
    stats,
    accountCount,
    currency,
}: BankingStatsRowProps) {
    const netCashFlow = stats.incomeMTD - stats.expenseMTD;

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
            label: 'Net Cash Flow',
            value: formatCurrency(Math.abs(netCashFlow), currency),
            color: netCashFlow >= 0 ? ('green' as const) : ('red' as const),
            trend: {
                direction: netCashFlow >= 0 ? ('up' as const) : ('down' as const),
                text: netCashFlow >= 0 ? 'Positive' : 'Negative',
            },
        },
        {
            label: 'Accounts',
            value: `${accountCount}`,
            color: 'blue' as const,
        },
    ];

    return <StatsGrid stats={items} columns={4} />;
}
