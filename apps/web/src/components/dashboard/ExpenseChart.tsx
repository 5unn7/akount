'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ExpenseCategory {
    name: string;
    amount: number;
    color: string;
}

interface ExpenseMonth {
    label: string;
    categories: ExpenseCategory[];
}

interface ExpenseChartProps {
    data?: ExpenseMonth[];
    className?: string;
}

type Period = 'day' | 'week' | 'month';

const MOCK_COLORS = [
    'var(--ak-pri)',
    'var(--ak-blue)',
    'var(--ak-purple)',
    'var(--ak-teal)',
    'var(--ak-green)',
];

function generateMockData(): ExpenseMonth[] {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    return months.map((label) => ({
        label,
        categories: [
            { name: 'Software', amount: 2000 + Math.random() * 3000, color: MOCK_COLORS[0] },
            { name: 'Services', amount: 1500 + Math.random() * 2500, color: MOCK_COLORS[1] },
            { name: 'Office', amount: 500 + Math.random() * 1500, color: MOCK_COLORS[2] },
            { name: 'Travel', amount: 300 + Math.random() * 2000, color: MOCK_COLORS[3] },
            { name: 'Other', amount: 200 + Math.random() * 800, color: MOCK_COLORS[4] },
        ],
    }));
}

function formatCompact(value: number): string {
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${Math.round(value)}`;
}

export function ExpenseChart({ data, className }: ExpenseChartProps) {
    const [period, setPeriod] = useState<Period>('month');
    const chartData = data || generateMockData();

    const maxTotal = Math.max(
        ...chartData.map((m) => m.categories.reduce((s, c) => s + c.amount, 0))
    );

    const totalExpenses = chartData.reduce(
        (sum, m) => sum + m.categories.reduce((s, c) => s + c.amount, 0),
        0
    );

    // Aggregate categories for legend
    const categoryTotals = new Map<string, { amount: number; color: string }>();
    for (const month of chartData) {
        for (const cat of month.categories) {
            const existing = categoryTotals.get(cat.name);
            categoryTotals.set(cat.name, {
                amount: (existing?.amount || 0) + cat.amount,
                color: cat.color,
            });
        }
    }

    const topCategory = Array.from(categoryTotals.entries()).sort((a, b) => b[1].amount - a[1].amount)[0];

    return (
        <div className={cn('glass rounded-sm p-5', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-heading font-normal">Expense Breakdown</h3>
                    <p className="text-lg font-mono font-semibold mt-0.5">
                        {formatCompact(totalExpenses)}
                    </p>
                </div>
                <div className="flex gap-1 glass-2 rounded-sm p-0.5">
                    {(['day', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={cn(
                                'px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors',
                                period === p
                                    ? 'bg-ak-bg-4 text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stacked bars */}
            <div className="flex items-end gap-3 h-[120px] mb-3">
                {chartData.map((month) => {
                    const total = month.categories.reduce((s, c) => s + c.amount, 0);
                    const barHeight = (total / maxTotal) * 100;

                    return (
                        <div key={month.label} className="flex-1 flex flex-col items-center gap-1">
                            <div
                                className="w-full rounded-t-md overflow-hidden flex flex-col-reverse"
                                style={{ height: `${barHeight}%` }}
                            >
                                {month.categories.map((cat) => {
                                    const pct = (cat.amount / total) * 100;
                                    return (
                                        <div
                                            key={cat.name}
                                            style={{
                                                height: `${pct}%`,
                                                backgroundColor: cat.color,
                                                opacity: 0.7,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                            <span className="text-[9px] font-mono text-muted-foreground">
                                {month.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3 border-t border-ak-border">
                {Array.from(categoryTotals.entries()).map(([name, { color }]) => (
                    <div key={name} className="flex items-center gap-1.5">
                        <div
                            className="h-2 w-2 rounded-md"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-[10px] text-muted-foreground">{name}</span>
                    </div>
                ))}
            </div>

            {/* Bottom summary */}
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-ak-border">
                <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Top Category</p>
                    <p className="text-xs font-medium mt-0.5">{topCategory?.[0] || '—'}</p>
                </div>
                <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Avg Monthly</p>
                    <p className="text-xs font-mono font-medium mt-0.5">
                        {formatCompact(totalExpenses / (chartData.length || 1))}
                    </p>
                </div>
                <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Period Total</p>
                    <p className="text-xs font-mono font-medium mt-0.5">
                        {formatCompact(totalExpenses)}
                    </p>
                </div>
            </div>
        </div>
    );
}
