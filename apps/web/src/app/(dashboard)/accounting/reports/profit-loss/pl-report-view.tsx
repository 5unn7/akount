'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, TrendingUp, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatReportDate, type ProfitLossReport, type ReportLineItem } from '@/lib/api/reports';

interface PLReportViewProps {
    initialData: ProfitLossReport | null;
    initialParams: Record<string, string | undefined>;
    error: string | null;
}

export function PLReportView({ initialData, initialParams, error }: PLReportViewProps) {
    const router = useRouter();
    const [entityId, setEntityId] = useState(initialParams.entityId || '');
    const [startDate, setStartDate] = useState(initialParams.startDate || '');
    const [endDate, setEndDate] = useState(initialParams.endDate || '');
    const [showComparison, setShowComparison] = useState(!!initialParams.comparison);

    const handleGenerate = () => {
        const params = new URLSearchParams();
        if (entityId) params.append('entityId', entityId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (showComparison) {
            // Calculate previous period (for now, simple logic - same duration before startDate)
            const start = new Date(startDate);
            const end = new Date(endDate);
            const duration = end.getTime() - start.getTime();
            const prevEnd = new Date(start.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - duration);
            params.append('comparison', prevStart.toISOString().split('T')[0]);
        }

        router.push(`/accounting/reports/profit-loss?${params.toString()}`);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Profit & Loss Statement</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Income statement showing revenue, expenses, and net income
                    </p>
                </div>
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
                                {/* TODO: Load entities from API */}
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

                <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                        id="comparison"
                        checked={showComparison}
                        onCheckedChange={(checked) => setShowComparison(!!checked)}
                    />
                    <Label htmlFor="comparison" className="cursor-pointer">
                        Show previous period comparison
                    </Label>
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
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Select a date range and click "Generate Report" to view your P&L statement
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
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    {/* Revenue Section */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-pri-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Revenue</h4>
                        </div>
                        <div className="p-6">
                            <PLSection items={initialData.revenue.sections} showComparison={showComparison} />
                            <div className="flex justify-between items-center pt-4 border-t border-ak-border mt-4 font-medium">
                                <span>Total Revenue</span>
                                <div className="flex gap-8 font-mono">
                                    <span className="text-finance-income">
                                        {formatCurrency(initialData.revenue.total, initialData.currency)}
                                    </span>
                                    {showComparison && initialData.revenue.previousTotal !== undefined && (
                                        <span className="text-muted-foreground">
                                            {formatCurrency(initialData.revenue.previousTotal, initialData.currency)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-red-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Expenses</h4>
                        </div>
                        <div className="p-6">
                            <PLSection items={initialData.expenses.sections} showComparison={showComparison} />
                            <div className="flex justify-between items-center pt-4 border-t border-ak-border mt-4 font-medium">
                                <span>Total Expenses</span>
                                <div className="flex gap-8 font-mono">
                                    <span className="text-finance-expense">
                                        {formatCurrency(initialData.expenses.total, initialData.currency)}
                                    </span>
                                    {showComparison && initialData.expenses.previousTotal !== undefined && (
                                        <span className="text-muted-foreground">
                                            {formatCurrency(initialData.expenses.previousTotal, initialData.currency)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Income */}
                    <div className="glass rounded-xl p-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-heading font-medium">Net Income</h4>
                            <div className="flex gap-8 font-mono text-lg font-medium">
                                <span className={initialData.netIncome >= 0 ? 'text-finance-income' : 'text-finance-expense'}>
                                    {formatCurrency(initialData.netIncome, initialData.currency)}
                                </span>
                                {showComparison && initialData.previousNetIncome !== undefined && (
                                    <span className="text-muted-foreground">
                                        {formatCurrency(initialData.previousNetIncome, initialData.currency)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PLSection({ items, showComparison }: { items: ReportLineItem[]; showComparison: boolean }) {
    return (
        <div className="space-y-1">
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className="flex justify-between items-center py-1.5"
                    style={{ paddingLeft: `${item.depth * 16}px` }}
                >
                    <span className={item.isSubtotal ? 'font-medium' : 'text-sm'}>
                        {item.code} - {item.name}
                    </span>
                    <div className="flex gap-8 font-mono text-sm">
                        <span>{formatCurrency(item.balance, 'CAD')}</span>
                        {showComparison && item.previousBalance !== undefined && (
                            <span className="text-muted-foreground">{formatCurrency(item.previousBalance, 'CAD')}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
