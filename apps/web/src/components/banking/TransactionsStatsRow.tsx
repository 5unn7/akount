import { StatsGrid } from '@/components/shared/StatsGrid';
import { formatCurrency } from '@/lib/utils/currency';
import type { TransactionStats } from '@/lib/utils/account-helpers';

interface TransactionsStatsRowProps {
    stats: TransactionStats;
    currency: string;
    totalTransactions: number;
    categorizedCount: number;
    postedCount: number;
}

export function TransactionsStatsRow({
    stats,
    currency,
    totalTransactions,
    categorizedCount,
    postedCount,
}: TransactionsStatsRowProps) {
    const categorizedPct =
        totalTransactions > 0
            ? Math.round((categorizedCount / totalTransactions) * 100)
            : 0;

    const postedPct =
        totalTransactions > 0
            ? Math.round((postedCount / totalTransactions) * 100)
            : 0;

    const netFlow = stats.incomeMTD - stats.expenseMTD; // both are positive

    return (
        <StatsGrid
            columns={5}
            stats={[
                {
                    label: 'Revenue MTD',
                    value: formatCurrency(stats.incomeMTD, currency),
                    color: 'green',
                },
                {
                    label: 'Expenses MTD',
                    value: formatCurrency(stats.expenseMTD, currency),
                    color: 'red',
                },
                {
                    label: 'Net Flow',
                    value: formatCurrency(Math.abs(netFlow), currency),
                    color: netFlow >= 0 ? 'green' : 'red',
                    trend: {
                        direction: netFlow >= 0 ? 'up' : 'down',
                        text: netFlow >= 0 ? 'Positive' : 'Negative',
                    },
                },
                {
                    label: 'Categorized',
                    value: `${categorizedPct}%`,
                    color: categorizedPct >= 80 ? 'green' : categorizedPct >= 50 ? 'primary' : 'red',
                    trend: {
                        direction: categorizedPct >= 80 ? 'up' : 'flat',
                        text: `${categorizedCount} of ${totalTransactions}`,
                    },
                },
                {
                    label: 'GL Posted',
                    value: `${postedPct}%`,
                    color: postedPct >= 80 ? 'green' : postedPct >= 50 ? 'primary' : 'red',
                    trend: {
                        direction: postedPct >= 80 ? 'up' : 'flat',
                        text: `${postedCount} of ${totalTransactions}`,
                    },
                },
            ]}
        />
    );
}
