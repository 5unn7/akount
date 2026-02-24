import Link from 'next/link';
import { formatDate } from '@/lib/utils/date';
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
            <div className="glass rounded-xl p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
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
        <div className="glass rounded-xl p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-heading font-normal">Recent Activity</h3>
                <Link
                    href="/banking/transactions"
                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    View all
                    <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </div>

            {/* Scrollable feed with fade edges */}
            <div className="relative flex-1 min-h-0">
                <div className="overflow-y-auto h-full -mx-1 px-1 space-y-2 scrollbar-hide">
                    {Array.from(grouped.entries()).map(([date, txs]) => (
                        <div key={date}>
                            {/* Date label — no sticky/blur to avoid glass artifacts */}
                            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1">
                                {date}
                            </p>

                            {/* Single-line transaction rows */}
                            <div className="space-y-0">
                                {txs.map((tx) => {
                                    const { Icon, colorClass, barClass } = getStyle(tx.amount);
                                    const abs = Math.abs(tx.amount);

                                    return (
                                        <div
                                            key={tx.id}
                                            className="flex items-center gap-2 py-1.5 px-1 -mx-1 rounded hover:bg-ak-bg-3/50 transition-colors group cursor-pointer"
                                        >
                                            <div className={`w-0.5 h-4 rounded-full ${barClass} opacity-60 shrink-0`} />
                                            <Icon className={`h-3 w-3 ${colorClass} opacity-70 shrink-0`} />
                                            <span
                                                className="text-[11px] truncate flex-1 min-w-0 group-hover:text-foreground transition-colors"
                                                title={tx.description}
                                            >
                                                {tx.description}
                                            </span>
                                            {tx.category && (
                                                <span className="text-micro text-muted-foreground shrink-0 hidden sm:inline">
                                                    {tx.category.name}
                                                </span>
                                            )}
                                            <span className={`text-[11px] font-mono tabular-nums shrink-0 ${colorClass}`}>
                                                {tx.amount > 0 ? '+' : ''}{formatCurrency(abs, tx.currency)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Bottom fade — blends overflow into the glass card */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[var(--ak-bg-1)] to-transparent pointer-events-none rounded-b-xl" />
            </div>
        </div>
    );
}
