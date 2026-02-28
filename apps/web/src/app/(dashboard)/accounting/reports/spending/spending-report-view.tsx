'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, PieChart as PieChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPercentage, formatReportDate, downloadReport, type SpendingReport } from '@/lib/api/reports-client';
import { formatCurrency } from '@/lib/utils/currency';

const CHART_COLORS = [
    'var(--color-ak-red)',
    'var(--color-ak-blue)',
    'var(--color-ak-purple)',
    'var(--color-ak-green)',
    'var(--color-ak-teal)',
    'var(--color-primary)',
    'var(--color-muted-foreground)',
    'var(--color-ak-pri-text)',
];

interface SpendingReportViewProps {
    initialData: SpendingReport | null;
    initialParams: Record<string, string | undefined>;
    error: string | null;
}

/** Pure SVG donut chart — no recharts dependency */
function SpendingDonutChart({ categories, currency }: {
    categories: Array<{ category: string; amount: number; percentage: number }>;
    currency: string;
}) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = 90;
    const innerRadius = 60;
    const gapAngle = 2; // degrees between slices

    const total = categories.reduce((sum, c) => sum + c.amount, 0);
    if (total === 0) return null;

    // Build arc paths
    let currentAngle = -90; // start at top
    const slices = categories.map((cat, i) => {
        const sliceAngle = (cat.amount / total) * (360 - gapAngle * categories.length);
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        currentAngle = endAngle + gapAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        const largeArc = sliceAngle > 180 ? 1 : 0;

        const x1o = cx + outerRadius * Math.cos(startRad);
        const y1o = cy + outerRadius * Math.sin(startRad);
        const x2o = cx + outerRadius * Math.cos(endRad);
        const y2o = cy + outerRadius * Math.sin(endRad);
        const x1i = cx + innerRadius * Math.cos(endRad);
        const y1i = cy + innerRadius * Math.sin(endRad);
        const x2i = cx + innerRadius * Math.cos(startRad);
        const y2i = cy + innerRadius * Math.sin(startRad);

        const d = [
            `M ${x1o} ${y1o}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2o} ${y2o}`,
            `L ${x1i} ${y1i}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2i} ${y2i}`,
            'Z',
        ].join(' ');

        return { d, color: CHART_COLORS[i % CHART_COLORS.length], cat };
    });

    const hovered = hoveredIdx !== null ? categories[hoveredIdx] : null;

    return (
        <div className="h-64 flex items-center justify-center relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Expense breakdown donut chart">
                {slices.map((slice, i) => (
                    <path
                        key={slice.cat.category}
                        d={slice.d}
                        fill={slice.color}
                        opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.4}
                        className="transition-opacity duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                    />
                ))}
                {/* Center text on hover */}
                {hovered && (
                    <>
                        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground text-sm font-medium">
                            {hovered.category}
                        </text>
                        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground text-xs font-mono">
                            {formatCurrency(hovered.amount, currency)}
                        </text>
                    </>
                )}
            </svg>
        </div>
    );
}

export function SpendingReportView({ initialData, initialParams, error }: SpendingReportViewProps) {
    const router = useRouter();
    const [entityId, setEntityId] = useState(initialParams.entityId || '');
    const [startDate, setStartDate] = useState(initialParams.startDate || '');
    const [endDate, setEndDate] = useState(initialParams.endDate || '');

    const handleGenerate = () => {
        const params = new URLSearchParams();
        if (entityId) params.append('entityId', entityId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        router.push(`/accounting/reports/spending?${params.toString()}`);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-heading">Spending Report</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Breakdown of spending by GL account category
                </p>
            </div>

            {/* Controls */}
            <div className="glass rounded-xl p-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label htmlFor="entityId">Entity (optional)</Label>
                        <Select value={entityId} onValueChange={setEntityId}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Entities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Entities</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Button onClick={handleGenerate} className="w-full" disabled={!startDate || !endDate}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Generate Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* Report Display */}
            {error && (
                <div className="glass rounded-xl p-6 border-destructive">
                    <p className="text-destructive text-sm">{error}</p>
                </div>
            )}

            {!initialData && !error && (
                <div className="glass rounded-xl p-12 text-center">
                    <PieChartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Select a date range and click &quot;Generate Report&quot; to view spending breakdown
                    </p>
                </div>
            )}

            {initialData && (
                <div className="space-y-6">
                    {/* Report Header */}
                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-heading font-medium">{initialData.entityName}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {formatReportDate(initialData.startDate)} to {formatReportDate(initialData.endDate)}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Spend</p>
                                    <p className="font-mono text-lg font-medium text-finance-expense">
                                        {formatCurrency(initialData.totalSpend, initialData.currency)}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => downloadReport('spending', initialParams, 'csv')}
                                >
                                    <Download className="h-4 w-4" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Expense Breakdown Chart */}
                    {initialData.categories.length > 0 && (
                        <div className="glass rounded-xl p-6">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                Expense Breakdown
                            </h4>
                            <SpendingDonutChart
                                categories={initialData.categories.slice(0, 8)}
                                currency={initialData.currency}
                            />
                            <div className="flex flex-wrap gap-3 justify-center mt-2">
                                {initialData.categories.slice(0, 8).map((cat, catIdx) => (
                                    <div key={cat.category} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: CHART_COLORS[catIdx % CHART_COLORS.length] }}
                                        />
                                        {cat.category}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Spending Categories */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-red-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Spending by Category</h4>
                        </div>
                        <div className="p-6 space-y-4">
                            {initialData.categories.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                    No spending recorded in this period
                                </p>
                            ) : (
                                initialData.categories.map((cat) => (
                                    <div key={cat.category} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">{cat.category}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatPercentage(cat.percentage)}
                                                </span>
                                                <span className="font-mono text-sm min-w-[100px] text-right">
                                                    {formatCurrency(cat.amount, initialData.currency)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-ak-bg-3 rounded-full h-2" role="progressbar" aria-valuenow={Math.round(cat.percentage)} aria-valuemin={0} aria-valuemax={100} aria-label={`${cat.category} spending share`}>
                                            <div
                                                className="bg-ak-red h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
