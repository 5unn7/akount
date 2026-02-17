'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatPercentage, formatReportDate, downloadReport, type SpendingReport } from '@/lib/api/reports-client';

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
                            <div className="h-64 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={initialData.categories.slice(0, 8).map(c => ({
                                                name: c.category,
                                                value: c.amount / 100,
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {initialData.categories.slice(0, 8).map((_, idx) => (
                                                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Amount']}
                                            contentStyle={{ background: 'var(--color-ak-bg-2, #15151F)', border: '1px solid var(--color-ak-border)', borderRadius: 8 }}
                                            labelStyle={{ color: 'var(--color-foreground)' }}
                                            itemStyle={{ color: 'var(--color-foreground)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center mt-2">
                                {initialData.categories.slice(0, 8).map((cat, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
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
                                initialData.categories.map((cat, idx) => (
                                    <div key={idx} className="space-y-2">
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
                                        <div className="w-full bg-ak-bg-3 rounded-full h-2">
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
