'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, ArrowDownUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatReportDate, downloadReport, type CashFlowReport } from '@/lib/api/reports-client';
import { formatCurrency } from '@/lib/utils/currency';

interface CFReportViewProps {
    initialData: CashFlowReport | null;
    initialParams: Record<string, string | undefined>;
    error: string | null;
}

export function CFReportView({ initialData, initialParams, error }: CFReportViewProps) {
    const router = useRouter();
    const [entityId, setEntityId] = useState(initialParams.entityId || '');
    const [startDate, setStartDate] = useState(initialParams.startDate || '');
    const [endDate, setEndDate] = useState(initialParams.endDate || '');

    const handleGenerate = () => {
        const params = new URLSearchParams();
        if (entityId) params.append('entityId', entityId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        router.push(`/accounting/reports/cash-flow?${params.toString()}`);
    };

    const isReconciled = initialData?.isReconciled ?? true;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-heading">Cash Flow Statement</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Cash inflows and outflows by operating, investing, and financing activities
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
                    <ArrowDownUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Select a date range and click &quot;Generate Report&quot; to view your cash flow statement
                    </p>
                </div>
            )}

            {initialData && (
                <div className="space-y-6">
                    {/* Reconciliation Warning */}
                    {!isReconciled && (
                        <div className="glass rounded-xl p-6 border-destructive bg-ak-red-dim">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-destructive">Cash Flow Does Not Reconcile</h4>
                                    <p className="text-sm text-destructive/80 mt-1">
                                        Opening cash ({formatCurrency(initialData.openingCash, initialData.currency)}) +
                                        Net change ({formatCurrency(initialData.netCashChange, initialData.currency)}) does not equal
                                        Closing cash ({formatCurrency(initialData.closingCash, initialData.currency)}).
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
                                    {formatReportDate(initialData.startDate)} to {formatReportDate(initialData.endDate)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => downloadReport('cash-flow', initialParams, 'pdf')}
                                >
                                    <Download className="h-4 w-4" />
                                    PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => downloadReport('cash-flow', initialParams, 'csv')}
                                >
                                    <Download className="h-4 w-4" />
                                    CSV
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Operating Activities */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-blue-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Operating Activities</h4>
                        </div>
                        <div className="p-6 space-y-1">
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-sm font-medium">Net Income</span>
                                <span className="font-mono text-sm">
                                    {formatCurrency(initialData.netIncome, initialData.currency)}
                                </span>
                            </div>

                            {initialData.operating.items.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-ak-border">
                                    {initialData.operating.items.map((item) => (
                                        <div key={item.accountId} className="flex justify-between items-center py-1 pl-4">
                                            <span className="text-sm">{item.name}</span>
                                            <span className="font-mono text-sm">
                                                {formatCurrency(item.balance, initialData.currency)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-ak-border mt-4 font-medium">
                                <span>Cash from Operations</span>
                                <span className="font-mono text-ak-blue">
                                    {formatCurrency(initialData.operating.total, initialData.currency)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Investing Activities */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-purple-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Investing Activities</h4>
                        </div>
                        <div className="p-6 space-y-1">
                            {initialData.investing.items.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">No investing activities in this period</p>
                            ) : (
                                initialData.investing.items.map((item) => (
                                    <div key={item.accountId} className="flex justify-between items-center py-1.5">
                                        <span className="text-sm">{item.name}</span>
                                        <span className="font-mono text-sm">
                                            {formatCurrency(item.balance, initialData.currency)}
                                        </span>
                                    </div>
                                ))
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-ak-border mt-4 font-medium">
                                <span>Cash from Investing</span>
                                <span className="font-mono text-ak-purple">
                                    {formatCurrency(initialData.investing.total, initialData.currency)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Financing Activities */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-green-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Financing Activities</h4>
                        </div>
                        <div className="p-6 space-y-1">
                            {initialData.financing.items.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">No financing activities in this period</p>
                            ) : (
                                initialData.financing.items.map((item) => (
                                    <div key={item.accountId} className="flex justify-between items-center py-1.5">
                                        <span className="text-sm">{item.name}</span>
                                        <span className="font-mono text-sm">
                                            {formatCurrency(item.balance, initialData.currency)}
                                        </span>
                                    </div>
                                ))
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-ak-border mt-4 font-medium">
                                <span>Cash from Financing</span>
                                <span className="font-mono text-ak-green">
                                    {formatCurrency(initialData.financing.total, initialData.currency)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Cash Summary */}
                    <div className="glass rounded-xl p-6 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Opening Cash Balance</span>
                            <span className="font-mono">{formatCurrency(initialData.openingCash, initialData.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Net Cash Change</span>
                            <span className={`font-mono ${initialData.netCashChange >= 0 ? 'text-finance-income' : 'text-finance-expense'}`}>
                                {formatCurrency(initialData.netCashChange, initialData.currency)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-ak-border font-medium">
                            <span className="text-lg font-heading">Closing Cash Balance</span>
                            <span className={`font-mono text-lg ${initialData.closingCash >= 0 ? 'text-finance-income' : 'text-finance-expense'}`}>
                                {formatCurrency(initialData.closingCash, initialData.currency)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
