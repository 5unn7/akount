'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, Scale, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { EntitySelector } from '@akount/ui/business';
import { formatReportDate, downloadReport, type BalanceSheetReport, type ReportLineItem } from '@/lib/api/reports-client';
import { formatCurrency } from '@/lib/utils/currency';

interface BSReportViewProps {
    initialData: BalanceSheetReport | null;
    initialParams: Record<string, string | undefined>;
    error: string | null;
    entities?: Array<{ id: string; name: string }>;
}

export function BSReportView({ initialData, initialParams, error, entities = [] }: BSReportViewProps) {
    const router = useRouter();
    const [entityId, setEntityId] = useState(initialParams.entityId || '');
    const [asOfDate, setAsOfDate] = useState(initialParams.asOfDate || '');
    const [showComparison, setShowComparison] = useState(!!initialParams.comparison);

    const handleGenerate = () => {
        const params = new URLSearchParams();
        if (entityId) params.append('entityId', entityId);
        if (asOfDate) params.append('asOfDate', asOfDate);
        if (showComparison) {
            // Calculate previous year same date
            const asOf = new Date(asOfDate);
            const prevYear = new Date(asOf);
            prevYear.setFullYear(asOf.getFullYear() - 1);
            params.append('comparison', prevYear.toISOString().split('T')[0]);
        }

        router.push(`/accounting/reports/balance-sheet?${params.toString()}`);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Balance Sheet</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Financial position snapshot showing assets, liabilities, and equity
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="glass rounded-xl p-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="entityId">Entity (optional)</Label>
                        <EntitySelector
                            value={entityId}
                            onChange={setEntityId}
                            placeholder="All Entities"
                            entities={[{ id: '', name: 'All Entities' }, ...entities]}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="asOfDate">As of Date</Label>
                        <Input
                            id="asOfDate"
                            type="date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Button onClick={handleGenerate} className="w-full" disabled={!asOfDate}>
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
                        Show prior year comparison
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
                    <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Select a date and click "Generate Report" to view your balance sheet
                    </p>
                </div>
            )}

            {initialData && (
                <div className="space-y-6">
                    {/* Unbalanced Warning */}
                    {!initialData.isBalanced && (
                        <div className="glass rounded-xl p-6 border-destructive bg-ak-red-dim">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-destructive">Balance Sheet Does Not Balance</h4>
                                    <p className="text-sm text-destructive/80 mt-1">
                                        Assets ({formatCurrency(initialData.totalAssets, initialData.currency)}) do not equal
                                        Liabilities + Equity ({formatCurrency(initialData.totalLiabilitiesAndEquity, initialData.currency)}).
                                        This indicates a double-entry bookkeeping error.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Report Header */}
                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-heading font-medium">{initialData.entityName}</h3>
                                <p className="text-sm text-muted-foreground">
                                    As of {formatReportDate(initialData.asOfDate)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => downloadReport('balance-sheet', initialParams, 'pdf')}
                                >
                                    <Download className="h-4 w-4" />
                                    PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => downloadReport('balance-sheet', initialParams, 'csv')}
                                >
                                    <Download className="h-4 w-4" />
                                    CSV
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* BS Composition Chart */}
                    <div className="glass rounded-xl p-6">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                            Balance Sheet Composition
                        </h4>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { name: 'Assets', amount: initialData.assets.total / 100 },
                                        { name: 'Liabilities', amount: initialData.liabilities.total / 100 },
                                        { name: 'Equity', amount: initialData.equity.total / 100 },
                                    ]}
                                    margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                                >
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Amount']}
                                        contentStyle={{ background: 'var(--color-ak-bg-2, #15151F)', border: '1px solid var(--color-ak-border)', borderRadius: 8 }}
                                        labelStyle={{ color: 'var(--color-foreground)' }}
                                        itemStyle={{ color: 'var(--color-foreground)' }}
                                    />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                        <Cell fill="var(--color-ak-blue)" />
                                        <Cell fill="var(--color-ak-red)" />
                                        <Cell fill="var(--color-ak-green)" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Assets Section */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-blue-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Assets</h4>
                        </div>
                        <div className="p-6">
                            <BSSection currency={initialData.currency} items={initialData.assets.items} showComparison={showComparison} />
                            <div className="flex justify-between items-center pt-4 border-t border-ak-border mt-4 font-medium">
                                <span>Total Assets</span>
                                <div className="flex gap-8 font-mono">
                                    <span className="text-ak-blue">
                                        {formatCurrency(initialData.assets.total, initialData.currency)}
                                    </span>
                                    {showComparison && initialData.assets.previousTotal !== undefined && (
                                        <span className="text-muted-foreground">
                                            {formatCurrency(initialData.assets.previousTotal, initialData.currency)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Liabilities Section */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-red-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Liabilities</h4>
                        </div>
                        <div className="p-6">
                            <BSSection currency={initialData.currency} items={initialData.liabilities.items} showComparison={showComparison} />
                            <div className="flex justify-between items-center pt-4 border-t border-ak-border mt-4 font-medium">
                                <span>Total Liabilities</span>
                                <div className="flex gap-8 font-mono">
                                    <span className="text-finance-expense">
                                        {formatCurrency(initialData.liabilities.total, initialData.currency)}
                                    </span>
                                    {showComparison && initialData.liabilities.previousTotal !== undefined && (
                                        <span className="text-muted-foreground">
                                            {formatCurrency(initialData.liabilities.previousTotal, initialData.currency)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Equity Section */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-green-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Equity</h4>
                        </div>
                        <div className="p-6">
                            <BSSection currency={initialData.currency} items={initialData.equity.items} showComparison={showComparison} />

                            {/* Retained Earnings - Two synthetic line items */}
                            <div className="mt-4 pt-4 border-t border-ak-border">
                                <div className="flex justify-between items-center py-1.5 text-sm">
                                    <span>Retained Earnings (Prior Years)</span>
                                    <div className="flex gap-8 font-mono">
                                        <span>{formatCurrency(initialData.retainedEarnings.priorYears, initialData.currency)}</span>
                                        {showComparison && <span className="text-muted-foreground">—</span>}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-1.5 text-sm">
                                    <span>Net Income (Current Year)</span>
                                    <div className="flex gap-8 font-mono">
                                        <span>{formatCurrency(initialData.retainedEarnings.currentYear, initialData.currency)}</span>
                                        {showComparison && <span className="text-muted-foreground">—</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-ak-border mt-4 font-medium">
                                <span>Total Equity</span>
                                <div className="flex gap-8 font-mono">
                                    <span className="text-finance-income">
                                        {formatCurrency(initialData.equity.total, initialData.currency)}
                                    </span>
                                    {showComparison && initialData.equity.previousTotal !== undefined && (
                                        <span className="text-muted-foreground">
                                            {formatCurrency(initialData.equity.previousTotal, initialData.currency)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance Equation */}
                    <div className="glass rounded-xl p-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-heading font-medium">Total Liabilities & Equity</h4>
                            <div className="flex gap-8 font-mono text-lg font-medium">
                                <span className={initialData.isBalanced ? 'text-finance-income' : 'text-destructive'}>
                                    {formatCurrency(initialData.totalLiabilitiesAndEquity, initialData.currency)}
                                </span>
                                {showComparison && (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BSSection({ items, showComparison, currency }: { items: ReportLineItem[]; showComparison: boolean; currency: string }) {
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
                        <span>{formatCurrency(item.balance, currency)}</span>
                        {showComparison && item.previousBalance !== undefined && (
                            <span className="text-muted-foreground">{formatCurrency(item.previousBalance, currency)}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
