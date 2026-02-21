import { Sparkles } from 'lucide-react';
import type { Account } from '@/lib/api/accounts';
import type { TransactionStats } from '@/lib/utils/account-helpers';
import { formatCurrency } from '@/lib/utils/currency';

interface AccountInsightCardProps {
    account: Account;
    stats: TransactionStats;
}

function generateAccountInsight(
    account: Account,
    stats: TransactionStats
): string {
    const { type, currency, currentBalance } = account;
    const { incomeMTD, expenseMTD, unreconciledCount } = stats;

    switch (type) {
        case 'BANK': {
            if (incomeMTD > expenseMTD) {
                const growthPct =
                    expenseMTD > 0
                        ? (
                              ((incomeMTD - expenseMTD) / expenseMTD) *
                              100
                          ).toFixed(0)
                        : '100';
                return `Your account is growing — income exceeds expenses by ${growthPct}% this month. Net flow of ${formatCurrency(incomeMTD - expenseMTD, currency)}.`;
            }
            return `Expenses have exceeded income this month by ${formatCurrency(expenseMTD - incomeMTD, currency)}. Monitor spending to keep on track.`;
        }
        case 'CREDIT_CARD': {
            const balance = Math.abs(currentBalance);
            if (balance === 0) {
                return 'Credit card is fully paid off — excellent for your credit score.';
            }
            return `Outstanding balance of ${formatCurrency(balance, currency)}. ${unreconciledCount > 0 ? `${unreconciledCount} transactions pending reconciliation.` : 'All transactions reconciled.'}`;
        }
        case 'INVESTMENT':
            return `Investment portfolio at ${formatCurrency(currentBalance, currency)}. ${stats.totalCount} transactions recorded this month.`;
        case 'LOAN':
        case 'MORTGAGE':
            return `Outstanding balance: ${formatCurrency(Math.abs(currentBalance), currency)}. ${stats.totalCount > 0 ? `${stats.totalCount} payments recorded this month.` : 'No payments recorded this month.'}`;
        default:
            return `Account balance at ${formatCurrency(currentBalance, currency)} with ${stats.totalCount} transactions this month.`;
    }
}

export function AccountInsightCard({
    account,
    stats,
}: AccountInsightCardProps) {
    const insightText = generateAccountInsight(account, stats);

    return (
        <div className="glass rounded-xl p-5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ak-green to-ak-teal" />
            <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ak-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-ak-green" />
                </span>
                <Sparkles className="h-3.5 w-3.5 text-ak-green" />
                <span className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Account Insight
                </span>
            </div>
            <p className="text-sm font-heading italic text-muted-foreground leading-relaxed">
                {insightText}
            </p>
        </div>
    );
}
