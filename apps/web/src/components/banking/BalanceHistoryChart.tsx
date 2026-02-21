'use client';

import { useState, useId, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

interface BalanceDataPoint {
    date: string;
    balance: number; // integer cents
}

interface BalanceHistoryChartProps {
    data: BalanceDataPoint[];
    currency: string;
}

type Period = '1M' | '3M' | '6M' | '1Y';

const PERIODS: { value: Period; label: string; days: number }[] = [
    { value: '1M', label: '1M', days: 30 },
    { value: '3M', label: '3M', days: 90 },
    { value: '6M', label: '6M', days: 180 },
    { value: '1Y', label: '1Y', days: 365 },
];

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PADDING_X = 50;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 30;

export function BalanceHistoryChart({
    data,
    currency,
}: BalanceHistoryChartProps) {
    const [period, setPeriod] = useState<Period>('6M');
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const gradientId = useId();

    const filteredData = useMemo(() => {
        const days = PERIODS.find((p) => p.value === period)?.days ?? 180;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        return data.filter((d) => d.date >= cutoffStr);
    }, [data, period]);

    if (filteredData.length < 2) {
        return (
            <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Balance History
                    </h3>
                </div>
                <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                    Not enough data for chart
                </div>
            </div>
        );
    }

    const balances = filteredData.map((d) => d.balance);
    const minBal = Math.min(...balances);
    const maxBal = Math.max(...balances);
    const range = maxBal - minBal || 1;

    const isPositiveTrend =
        filteredData[filteredData.length - 1].balance >=
        filteredData[0].balance;

    const chartW = CHART_WIDTH;
    const chartH = CHART_HEIGHT;
    const plotW = chartW - PADDING_X * 2;
    const plotH = chartH - PADDING_TOP - PADDING_BOTTOM;

    const points = filteredData.map((d, i) => {
        const x =
            PADDING_X + (i / (filteredData.length - 1)) * plotW;
        const y =
            PADDING_TOP +
            plotH -
            ((d.balance - minBal) / range) * plotH;
        return { x, y, date: d.date, balance: d.balance };
    });

    const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
    const fillPath = `M${PADDING_X},${PADDING_TOP + plotH} ${points.map((p) => `${p.x},${p.y}`).join(' ')} ${PADDING_X + plotW},${PADDING_TOP + plotH} Z`;

    // Y-axis labels (5 ticks)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
        const val = minBal + (range * i) / 4;
        const y = PADDING_TOP + plotH - (plotH * i) / 4;
        return { val, y };
    });

    // X-axis labels (max 6)
    const step = Math.max(1, Math.floor(filteredData.length / 5));
    const xTicks = filteredData
        .filter((_, i) => i % step === 0 || i === filteredData.length - 1)
        .map((d, idx, arr) => {
            const origIdx = filteredData.indexOf(d);
            const x =
                PADDING_X +
                (origIdx / (filteredData.length - 1)) * plotW;
            const label = new Date(d.date + 'T00:00:00').toLocaleDateString(
                'en-CA',
                { month: 'short', day: 'numeric' }
            );
            return { x, label };
        });

    return (
        <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Balance History
                </h3>
                <div className="flex items-center gap-1">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={cn(
                                'px-2 py-1 rounded text-[10px] font-medium transition-all',
                                period === p.value
                                    ? 'bg-primary text-black'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <svg
                    viewBox={`0 0 ${chartW} ${chartH}`}
                    className="w-full h-auto"
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor={
                                    isPositiveTrend
                                        ? 'var(--ak-green)'
                                        : 'var(--ak-red)'
                                }
                                stopOpacity={0.2}
                            />
                            <stop
                                offset="100%"
                                stopColor="transparent"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>

                    {/* Horizontal gridlines */}
                    {yTicks.map((tick, i) => (
                        <g key={i}>
                            <line
                                x1={PADDING_X}
                                y1={tick.y}
                                x2={PADDING_X + plotW}
                                y2={tick.y}
                                stroke="currentColor"
                                className="text-ak-border"
                                strokeOpacity={0.3}
                            />
                            <text
                                x={PADDING_X - 6}
                                y={tick.y + 3}
                                textAnchor="end"
                                className="fill-muted-foreground"
                                fontSize={9}
                                fontFamily="var(--font-mono)"
                            >
                                {(tick.val / 100).toLocaleString('en-CA', {
                                    notation: 'compact',
                                    style: 'currency',
                                    currency,
                                    maximumFractionDigits: 0,
                                } as Intl.NumberFormatOptions)}
                            </text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {xTicks.map((tick, i) => (
                        <text
                            key={i}
                            x={tick.x}
                            y={chartH - 5}
                            textAnchor="middle"
                            className="fill-muted-foreground"
                            fontSize={9}
                        >
                            {tick.label}
                        </text>
                    ))}

                    {/* Area fill */}
                    <path d={fillPath} fill={`url(#${gradientId})`} />

                    {/* Line */}
                    <polyline
                        points={polyline}
                        fill="none"
                        stroke={
                            isPositiveTrend
                                ? 'var(--ak-green)'
                                : 'var(--ak-red)'
                        }
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Hover dots - invisible hit areas */}
                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={8}
                            fill="transparent"
                            onMouseEnter={() => setHoverIndex(i)}
                        />
                    ))}

                    {/* Active dot */}
                    {hoverIndex !== null && points[hoverIndex] && (
                        <circle
                            cx={points[hoverIndex].x}
                            cy={points[hoverIndex].y}
                            r={4}
                            fill={
                                isPositiveTrend
                                    ? 'var(--ak-green)'
                                    : 'var(--ak-red)'
                            }
                            stroke="var(--background)"
                            strokeWidth={2}
                        />
                    )}
                </svg>

                {/* Tooltip */}
                {hoverIndex !== null && points[hoverIndex] && (
                    <div
                        className="absolute pointer-events-none glass rounded-lg px-3 py-2 text-xs -translate-x-1/2 -translate-y-full"
                        style={{
                            left: `${(points[hoverIndex].x / chartW) * 100}%`,
                            top: `${(points[hoverIndex].y / chartH) * 100}%`,
                        }}
                    >
                        <p className="font-mono font-semibold">
                            {formatCurrency(
                                points[hoverIndex].balance,
                                currency
                            )}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                            {new Date(
                                points[hoverIndex].date + 'T00:00:00'
                            ).toLocaleDateString('en-CA', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
