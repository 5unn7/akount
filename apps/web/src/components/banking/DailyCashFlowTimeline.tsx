'use client';

import { useState, useId, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import type { Transaction } from '@/lib/api/transactions.types';
import { formatCurrency } from '@/lib/utils/currency';

interface DailyCashFlowTimelineProps {
    transactions: Transaction[];
    currency: string;
}

interface DayData {
    day: number;
    date: string;
    income: number; // positive cents
    expense: number; // positive cents (absolute value)
    isToday: boolean;
}

export function DailyCashFlowTimeline({
    transactions,
    currency,
}: DailyCashFlowTimelineProps) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = now.getDate();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const gradientId = useId();

    const [hoverDay, setHoverDay] = useState<number | null>(null);

    const days: DayData[] = useMemo(() => {
        // Bucket transactions by day
        const buckets = new Map<number, { income: number; expense: number }>();

        for (const txn of transactions) {
            const d = new Date(txn.date);
            if (
                d.getFullYear() !== currentYear ||
                d.getMonth() !== currentMonth
            )
                continue;

            const day = d.getDate();
            const bucket = buckets.get(day) ?? { income: 0, expense: 0 };

            if (txn.amount >= 0) {
                bucket.income += txn.amount;
            } else {
                bucket.expense += Math.abs(txn.amount);
            }
            buckets.set(day, bucket);
        }

        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const bucket = buckets.get(day) ?? { income: 0, expense: 0 };
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return {
                day,
                date: dateStr,
                income: bucket.income,
                expense: bucket.expense,
                isToday: day === today,
            };
        });
    }, [transactions, currentYear, currentMonth, today, daysInMonth]);

    const hasData = days.some((d) => d.income > 0 || d.expense > 0);

    if (!hasData) {
        return (
            <div className="glass rounded-xl p-5">
                <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Daily Cash Flow
                </h3>
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No cash flow data this month</p>
                </div>
            </div>
        );
    }

    const maxVal = Math.max(
        ...days.map((d) => Math.max(d.income, d.expense)),
        1
    );

    const CHART_W = 700;
    const CHART_H = 160;
    const BAR_GAP = 2;
    const barWidth = (CHART_W - BAR_GAP * (daysInMonth - 1)) / daysInMonth;
    const BASELINE_Y = CHART_H / 2;
    const halfH = BASELINE_Y - 10;

    const monthLabel = now.toLocaleDateString('en-CA', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="glass rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Daily Cash Flow
                </h3>
                <span className="text-micro text-muted-foreground">
                    {monthLabel}
                </span>
            </div>

            <div className="relative">
                <svg
                    viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                    className="w-full h-auto"
                    onMouseLeave={() => setHoverDay(null)}
                >
                    {/* Baseline */}
                    <line
                        x1={0}
                        y1={BASELINE_Y}
                        x2={CHART_W}
                        y2={BASELINE_Y}
                        stroke="currentColor"
                        className="text-ak-border"
                        strokeOpacity={0.5}
                    />

                    {days.map((d, i) => {
                        const x = i * (barWidth + BAR_GAP);
                        const incomeH =
                            maxVal > 0
                                ? (d.income / maxVal) * halfH
                                : 0;
                        const expenseH =
                            maxVal > 0
                                ? (d.expense / maxVal) * halfH
                                : 0;

                        return (
                            <g
                                key={d.day}
                                onMouseEnter={() => setHoverDay(d.day)}
                            >
                                {/* Income bar (above baseline) */}
                                {incomeH > 0 && (
                                    <rect
                                        x={x}
                                        y={BASELINE_Y - incomeH}
                                        width={barWidth}
                                        height={incomeH}
                                        rx={1}
                                        fill="var(--ak-green)"
                                        opacity={d.isToday ? 1 : 0.6}
                                        stroke={
                                            d.isToday
                                                ? 'var(--ak-green)'
                                                : 'none'
                                        }
                                        strokeWidth={d.isToday ? 1 : 0}
                                    />
                                )}

                                {/* Expense bar (below baseline) */}
                                {expenseH > 0 && (
                                    <rect
                                        x={x}
                                        y={BASELINE_Y}
                                        width={barWidth}
                                        height={expenseH}
                                        rx={1}
                                        fill="var(--ak-red)"
                                        opacity={d.isToday ? 1 : 0.6}
                                        stroke={
                                            d.isToday
                                                ? 'var(--ak-red)'
                                                : 'none'
                                        }
                                        strokeWidth={d.isToday ? 1 : 0}
                                    />
                                )}

                                {/* Hit area */}
                                <rect
                                    x={x}
                                    y={0}
                                    width={barWidth}
                                    height={CHART_H}
                                    fill="transparent"
                                />

                                {/* Day label (every 5th day + first + last) */}
                                {(d.day === 1 ||
                                    d.day === daysInMonth ||
                                    d.day % 5 === 0) && (
                                    <text
                                        x={x + barWidth / 2}
                                        y={CHART_H - 2}
                                        textAnchor="middle"
                                        className="fill-muted-foreground"
                                        fontSize={8}
                                    >
                                        {d.day}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {hoverDay !== null && (() => {
                    const d = days[hoverDay - 1];
                    if (!d) return null;
                    const i = hoverDay - 1;
                    const x = i * (barWidth + BAR_GAP) + barWidth / 2;
                    return (
                        <div
                            className="absolute pointer-events-none glass rounded-lg px-3 py-2 text-xs -translate-x-1/2"
                            style={{
                                left: `${(x / CHART_W) * 100}%`,
                                top: '4px',
                            }}
                        >
                            <p className="text-micro text-muted-foreground mb-1">
                                {new Date(d.date + 'T00:00:00').toLocaleDateString('en-CA', {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </p>
                            {d.income > 0 && (
                                <p className="font-mono text-ak-green">
                                    +{formatCurrency(d.income, currency)}
                                </p>
                            )}
                            {d.expense > 0 && (
                                <p className="font-mono text-ak-red">
                                    -{formatCurrency(d.expense, currency)}
                                </p>
                            )}
                            {d.income === 0 && d.expense === 0 && (
                                <p className="text-muted-foreground">No activity</p>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 justify-center">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-ak-green" />
                    <span className="text-micro text-muted-foreground">
                        Income
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-ak-red" />
                    <span className="text-micro text-muted-foreground">
                        Expenses
                    </span>
                </div>
            </div>
        </div>
    );
}
