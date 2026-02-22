import Link from 'next/link';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import type { Transaction } from '@/lib/api/transactions';

interface RecentTransactionsProps {
    transactions: Transaction[];
}

function getStyle(amount: number) {
    if (amount > 0) {
        return {
            Icon: ArrowDownRight,
            colorClass: 'text-ak-green',
            barClass: 'bg-ak-green',
        };
    }
    return {
        Icon: ArrowUpRight,
        colorClass: 'text-ak-red',
        barClass: 'bg-ak-red',
    };
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    if (transactions.length === 0) {
        return (
            <div className="glass rounded-xl p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-heading font-normal">Recent Activity</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                    <Receipt className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">
                        No transactions yet
                    </p>
                </div>
            </div>
        );
    }

    // Group transactions by date
    const grouped = new Map<string, Transaction[]>();
    for (const tx of transactions) {
        const key = formatDate(tx.date);
        const list = grouped.get(key) ?? [];
        list.push(tx);
        grouped.set(key, list);
    }

    return (
        <div className="glass rounded-xl p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-heading font-normal">Recent Activity</h3>
                <Link
                    href="/banking/transactions"
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    View all
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            {/* Timeline feed */}
            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4 scrollbar-hide">
                {Array.from(grouped.entries()).map(([date, txs]) => (
                    <div key={date}>
                        {/* Date label */}
                        <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-2 sticky top-0 bg-transparent backdrop-blur-sm z-10">
                            {date}
                        </p>

                        {/* Transaction rows */}
                        <div className="space-y-px">
                            {txs.map((tx) => {
                                const { Icon, colorClass, barClass } = getStyle(tx.amount);
                                const abs = Math.abs(tx.amount);

                                return (
                                    <div
                                        key={tx.id}
                                        className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-ak-bg-3/50 transition-colors group cursor-pointer"
                                    >
                                        {/* Colored side indicator */}
                                        <div className={`w-0.5 h-8 rounded-full ${barClass} opacity-60 shrink-0`} />

                                        {/* Icon */}
                                        <div className="shrink-0">
                                            <Icon className={`h-3.5 w-3.5 ${colorClass} opacity-70`} />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-xs font-medium truncate group-hover:text-foreground transition-colors"
                                                title={tx.description}
                                            >
                                                {tx.description}
                                            </p>
                                            {tx.category && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {tx.category.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Amount */}
                                        <span className={`text-xs font-mono font-semibold tabular-nums shrink-0 ${colorClass}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(abs, tx.currency)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer summary */}
            <div className="pt-3 mt-3 border-t border-ak-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                    {transactions.length} transactions
                </span>
                <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-ak-green font-mono">
                        +{formatCurrency(
                            transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
                            transactions[0]?.currency ?? 'CAD'
                        )}
                    </span>
                    <span className="text-ak-red font-mono">
                        -{formatCurrency(
                            transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
                            transactions[0]?.currency ?? 'CAD'
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
