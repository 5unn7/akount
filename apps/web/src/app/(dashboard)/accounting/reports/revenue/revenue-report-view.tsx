'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPercentage, formatReportDate, downloadReport, type RevenueReport } from '@/lib/api/reports-client';
import { formatCurrency } from '@/lib/utils/currency';

interface RevenueReportViewProps {
    initialData: RevenueReport | null;
    initialParams: Record<string, string | undefined>;
    error: string | null;
}

export function RevenueReportView({ initialData, initialParams, error }: RevenueReportViewProps) {
    const router = useRouter();
    const [entityId, setEntityId] = useState(initialParams.entityId || '');
    const [startDate, setStartDate] = useState(initialParams.startDate || '');
    const [endDate, setEndDate] = useState(initialParams.endDate || '');

    const handleGenerate = () => {
        const params = new URLSearchParams();
        if (entityId) params.append('entityId', entityId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        router.push(`/accounting/reports/revenue?${params.toString()}`);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-heading">Revenue Report</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Revenue breakdown by client with invoice counts
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
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Select a date range and click &quot;Generate Report&quot; to view revenue breakdown
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
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                                    <p className="font-mono text-lg font-medium text-finance-income">
                                        {formatCurrency(initialData.totalRevenue, initialData.currency)}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => downloadReport('revenue', initialParams, 'csv')}
                                >
                                    <Download className="h-4 w-4" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Revenue by Client */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="bg-ak-green-dim border-b border-ak-border px-6 py-3">
                            <h4 className="font-medium font-heading">Revenue by Client</h4>
                        </div>
                        <div className="p-6 space-y-4">
                            {initialData.clients.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                    No revenue recorded in this period
                                </p>
                            ) : (
                                initialData.clients.map((client, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium">{client.clientName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatPercentage(client.percentage)}
                                                </span>
                                                <span className="font-mono text-sm min-w-[100px] text-right">
                                                    {formatCurrency(client.amount, initialData.currency)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-ak-bg-3 rounded-full h-2">
                                            <div
                                                className="bg-ak-green h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min(client.percentage, 100)}%` }}
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
