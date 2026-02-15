import { StatPill } from '@/components/shared/StatPill';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import type { TransactionStats } from '@/lib/utils/account-helpers';

interface AccountStatsPillsProps {
    stats: TransactionStats;
    currency: string;
}

export function AccountStatsPills({ stats, currency }: AccountStatsPillsProps) {
    return (
        <div className="flex items-stretch gap-3 flex-wrap">
            <StatPill
                label="Unreconciled"
                value={`${stats.unreconciledCount} item${stats.unreconciledCount !== 1 ? 's' : ''}`}
                color="warning"
                icon={AlertTriangle}
                badge={stats.unreconciledCount > 0 ? stats.unreconciledCount : undefined}
            />
            <StatPill
                label="Income (MTD)"
                value={stats.incomeMTD > 0 ? `+${formatCurrency(stats.incomeMTD, currency)}` : formatCurrency(0, currency)}
                color="income"
                icon={TrendingUp}
            />
            <StatPill
                label="Expenses (MTD)"
                value={stats.expenseMTD > 0 ? `-${formatCurrency(stats.expenseMTD, currency)}` : formatCurrency(0, currency)}
                color="expense"
                icon={TrendingDown}
            />
        </div>
    );
}
