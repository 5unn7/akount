'use client';

import { useState } from 'react';
import { PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface SpendingCategory {
    categoryId: string | null;
    categoryName: string;
    categoryColor: string | null;
    totalAmount: number; // integer cents (positive)
    transactionCount: number;
    percentOfTotal: number;
}

interface SpendingBreakdownProps {
    data: SpendingCategory[];
    totalExpenses: number;
    currency: string;
}

type Period = 'month' | '90d';

const BAR_COLORS = [
    'bg-ak-red',
    'bg-ak-purple',
    'bg-ak-blue',
    'bg-ak-teal',
    'bg-primary',
    'text-muted-foreground bg-muted-foreground',
];

export function SpendingBreakdown({
    data,
    totalExpenses,
    currency,
}: SpendingBreakdownProps) {
    const [period, setPeriod] = useState<Period>('month');

    const maxAmount = data.length > 0 ? Math.max(...data.map((d) => d.totalAmount)) : 0;

    return (
        <div className="glass rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Spending by Category
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPeriod('month')}
                        className={cn(
                            'px-2 py-1 rounded text-[10px] font-medium transition-all',
                            period === 'month'
                                ? 'bg-primary text-black'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => setPeriod('90d')}
                        className={cn(
                            'px-2 py-1 rounded text-[10px] font-medium transition-all',
                            period === '90d'
                                ? 'bg-primary text-black'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        Last 90d
                    </button>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <PieChart className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No expenses in this period</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {data.slice(0, 8).map((cat, i) => (
                        <div key={cat.categoryId ?? 'uncategorized'} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor: cat.categoryColor ?? undefined,
                                        }}
                                        {...(!cat.categoryColor && {
                                            className: cn('w-2 h-2 rounded-full bg-muted-foreground'),
                                        })}
                                    />
                                    <span className="text-xs truncate max-w-[100px] sm:max-w-[140px]">
                                        {cat.categoryName}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {cat.transactionCount} txn
                                    </span>
                                </div>
                                <span className="text-xs font-mono text-ak-red">
                                    {formatCurrency(cat.totalAmount, currency)}
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-ak-bg-3 overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        BAR_COLORS[i % BAR_COLORS.length]
                                    )}
                                    style={{
                                        width: maxAmount > 0
                                            ? `${(cat.totalAmount / maxAmount) * 100}%`
                                            : '0%',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Total footer */}
            {totalExpenses > 0 && (
                <div className="pt-3 border-t border-ak-border flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Total Expenses
                    </span>
                    <span className="text-sm font-mono font-semibold text-ak-red">
                        {formatCurrency(totalExpenses, currency)}
                    </span>
                </div>
            )}
        </div>
    );
}
