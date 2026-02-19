import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import type { Transaction } from '@/lib/api/transactions';
import { SectionHeader } from '@/components/shared/SectionHeader';

interface RecentTransactionsProps {
    transactions: Transaction[];
}

/**
 * Display recent transactions on the dashboard
 * Server Component - receives transaction data as props
 */
export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    // Format date in a compact way
    const formatDate = (isoDate: string) => {
        return new Date(isoDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    // Determine transaction type icon and color
    const getTransactionStyle = (amount: number) => {
        if (amount > 0) {
            return {
                Icon: ArrowDownRight,
                colorClass: 'text-ak-green',
                bgClass: 'bg-ak-green-dim',
                label: 'Income',
            };
        }
        return {
            Icon: ArrowUpRight,
            colorClass: 'text-ak-red',
            bgClass: 'bg-ak-red-dim',
            label: 'Expense',
        };
    };

    if (transactions.length === 0) {
        return (
            <div className="glass rounded-xl p-6">
                <SectionHeader title="Recent Transactions" />
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Receipt className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">
                        No transactions yet. Import bank statements or add transactions manually.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <SectionHeader title="Recent Transactions" meta={`${transactions.length} shown`} />
                <Link
                    href="/banking/transactions"
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    View all
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="space-y-2">
                {transactions.map((transaction) => {
                    const { Icon, colorClass, bgClass } = getTransactionStyle(transaction.amount);
                    const absoluteAmount = Math.abs(transaction.amount);

                    return (
                        <div
                            key={transaction.id}
                            className="glass-2 rounded-lg p-3 hover:bg-ak-bg-3 hover:border-ak-border-2 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                {/* Icon */}
                                <div className={`shrink-0 h-8 w-8 rounded-md ${bgClass} flex items-center justify-center`}>
                                    <Icon className={`h-4 w-4 ${colorClass}`} />
                                </div>

                                {/* Transaction details */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                                        {transaction.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            {formatDate(transaction.date)}
                                        </span>
                                        {transaction.category && (
                                            <>
                                                <span className="text-[10px] text-muted-foreground">•</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {transaction.category.name}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="text-right shrink-0">
                                    <p className={`text-sm font-mono font-semibold ${colorClass}`}>
                                        {formatCurrency(absoluteAmount, transaction.currency)}
                                    </p>
                                    {transaction.account && (
                                        <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                            {transaction.account.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
