'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, Scale, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatReportDate, downloadReport, type TrialBalanceReport, type TrialBalanceAccount } from '@/lib/api/reports-client';

interface TBReportViewProps {
    initialData: TrialBalanceReport | null;
    initialParams: Record<string, string | undefined>;
    error: string | null;
}

export function TBReportView({ initialData, initialParams, error }: TBReportViewProps) {
    const router = useRouter();
    const [entityId, setEntityId] = useState(initialParams.entityId || '');
    const [asOfDate, setAsOfDate] = useState(initialParams.asOfDate || '');

    const handleGenerate = () => {
        const params = new URLSearchParams();
        if (entityId) params.append('entityId', entityId);
        if (asOfDate) params.append('asOfDate', asOfDate);

        router.push(`/accounting/reports/trial-balance?${params.toString()}`);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-heading">Trial Balance</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Verify that total debits equal total credits across all accounts
                </p>
            </div>

            {/* Controls */}
            <div className="glass rounded-xl p-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="entityId">Entity (required)</Label>
                        <Select value={entityId} onValueChange={setEntityId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Entity" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* TODO: Load entities from API */}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="asOfDate">As of Date (optional)</Label>
                        <Input
                            id="asOfDate"
                            type="date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Button onClick={handleGenerate} className="w-full" disabled={!entityId}>
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
                    <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        Select an entity and click &quot;Generate Report&quot; to view the trial balance
                    </p>
                </div>
            )}

            {initialData && (
                <div className="space-y-6">
                    {/* CRITICAL Alert */}
                    {initialData.severity === 'CRITICAL' && (
                        <div className="glass rounded-xl p-6 border-destructive bg-ak-red-dim">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="h-6 w-6 text-destructive mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-destructive text-lg">CRITICAL: Trial Balance Does Not Balance</h4>
                                    <p className="text-sm text-destructive/80 mt-1">
                                        Total Debits ({formatCurrency(initialData.totalDebits, initialData.currency)}) do not equal
                                        Total Credits ({formatCurrency(initialData.totalCredits, initialData.currency)}).
                                        Difference: {formatCurrency(Math.abs(initialData.totalDebits - initialData.totalCredits), initialData.currency)}.
                                        This indicates a system-level double-entry bookkeeping error that must be investigated immediately.
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
                            <div className="flex items-center gap-3">
                                {initialData.isBalanced && (
                                    <span className="text-xs font-medium text-ak-green bg-ak-green-dim px-3 py-1 rounded-full">
                                        Balanced
                                    </span>
                                )}
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => downloadReport('trial-balance', initialParams, 'csv')}
                                >
                                    <Download className="h-4 w-4" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Account Table */}
                    <div className="glass rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-ak-border bg-ak-bg-3">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Account Name
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Debit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Credit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ak-border">
                                {initialData.accounts.map((account: TrialBalanceAccount) => (
                                    <tr key={account.id} className="hover:bg-ak-bg-3 transition-colors">
                                        <td className="px-6 py-3 text-sm font-mono">{account.code}</td>
                                        <td className="px-6 py-3 text-sm">{account.name}</td>
                                        <td className="px-6 py-3 text-sm font-mono text-right">
                                            {account.debit > 0 ? formatCurrency(account.debit, initialData.currency) : ''}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-mono text-right">
                                            {account.credit > 0 ? formatCurrency(account.credit, initialData.currency) : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-ak-border-2 font-medium">
                                    <td className="px-6 py-4 text-sm" colSpan={2}>Totals</td>
                                    <td className="px-6 py-4 text-sm font-mono text-right text-ak-blue">
                                        {formatCurrency(initialData.totalDebits, initialData.currency)}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-right text-ak-blue">
                                        {formatCurrency(initialData.totalCredits, initialData.currency)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
