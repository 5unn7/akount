'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlowCard } from '@/components/ui/glow-card';
import {
    CheckCircle2,
    XCircle,
    ArrowRight,
    Upload,
    FileText,
    RefreshCw,
    Tags,
    Lightbulb,
} from 'lucide-react';
import type { BatchImportResult, ImportAccount } from './types';

interface BatchImportResultsProps {
    batchResult: BatchImportResult;
    accounts: ImportAccount[];
    onAddMoreFiles: () => void;
    onRetryFailed: () => void;
}

export function BatchImportResults({
    batchResult,
    accounts,
    onAddMoreFiles,
    onRetryFailed,
}: BatchImportResultsProps) {
    const { aggregateStats, files } = batchResult;
    const allSuccess = aggregateStats.successFiles === aggregateStats.totalFiles;
    const hasErrors = aggregateStats.totalFiles - aggregateStats.successFiles > 0;
    const failedCount = aggregateStats.totalFiles - aggregateStats.successFiles;

    const getAccountName = (accountId: string) => {
        const account = accounts.find((a) => a.id === accountId);
        return account ? account.name : 'Unknown';
    };

    return (
        <div className="space-y-6">
            {/* Success / Status Banner */}
            <Card className="glass rounded-[14px]">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${allSuccess ? 'bg-ak-green/10' : 'bg-primary/10'}`}>
                            {allSuccess ? (
                                <CheckCircle2 className="h-6 w-6 text-ak-green" />
                            ) : (
                                <CheckCircle2 className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-heading text-lg font-semibold">
                                {allSuccess
                                    ? `${aggregateStats.totalFiles} File${aggregateStats.totalFiles !== 1 ? 's' : ''} Imported Successfully`
                                    : `${aggregateStats.successFiles} of ${aggregateStats.totalFiles} Files Imported`}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {aggregateStats.imported} transactions imported across {aggregateStats.successFiles} file{aggregateStats.successFiles !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Retry failed files (Task 3.1) */}
                    {hasErrors && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-ak-red-dim border border-ak-red/20 rounded-lg">
                            <XCircle className="h-5 w-5 text-ak-red flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-ak-red">
                                    {failedCount} file{failedCount !== 1 ? 's' : ''} failed to import
                                </p>
                                <p className="text-xs text-ak-red/80 mt-0.5">
                                    Network issues or unsupported format. You can retry these files.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                                onClick={onRetryFailed}
                            >
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                Retry Failed
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6 space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Transactions
                        </p>
                        <p className="text-2xl font-mono font-bold">
                            {aggregateStats.totalTransactions}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6 space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Imported
                        </p>
                        <p className="text-2xl font-mono font-bold text-ak-green">
                            {aggregateStats.imported}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6 space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Duplicates
                        </p>
                        <p className="text-2xl font-mono font-bold text-primary">
                            {aggregateStats.duplicates}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6 space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Errors
                        </p>
                        <p className={`text-2xl font-mono font-bold ${aggregateStats.errors > 0 ? 'text-ak-red' : 'text-muted-foreground'}`}>
                            {aggregateStats.errors}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Duplicate Explanation (Task 3.4) */}
            {aggregateStats.duplicates > 0 && (
                <div className="flex items-start gap-3 px-4 py-3 glass rounded-lg">
                    <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground font-mono">{aggregateStats.duplicates}</span>{' '}
                        duplicate{aggregateStats.duplicates !== 1 ? 's' : ''} skipped — these transactions were already in your account from a previous import.
                    </p>
                </div>
            )}

            {/* Per-file Breakdown */}
            <Card className="glass rounded-[14px]">
                <CardHeader>
                    <CardTitle className="font-heading text-base font-normal">
                        File Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-ak-border">
                                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                                        File
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                                        Account
                                    </th>
                                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                                        Imported
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                                        Dup
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-ak-border hover:bg-ak-bg-3 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {item.status === 'success' ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-ak-green flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="h-3.5 w-3.5 text-ak-red flex-shrink-0" />
                                                )}
                                                <span className="text-sm truncate max-w-[200px]">
                                                    {item.file.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {getAccountName(item.accountId)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {item.status === 'success' ? (
                                                <Badge className="text-xs bg-ak-green/10 text-ak-green border-ak-green/20">
                                                    Success
                                                </Badge>
                                            ) : (
                                                <Badge className="text-xs bg-ak-red/10 text-ak-red border-ak-red/20">
                                                    Failed
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-sm">
                                            {item.result?.processedRows ?? '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-sm text-primary">
                                            {item.result?.duplicateRows ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Error details */}
                    {hasErrors && (
                        <div className="mt-4 space-y-2">
                            {files
                                .filter((f) => f.status === 'error')
                                .map((f) => (
                                    <div
                                        key={f.id}
                                        className="flex items-start gap-2 p-3 bg-ak-red-dim border border-ak-red/20 rounded-lg"
                                    >
                                        <XCircle className="h-4 w-4 text-ak-red flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-ak-red">
                                                {f.file.name}
                                            </p>
                                            <p className="text-xs text-ak-red/80">
                                                {f.error || 'Upload failed'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* What's Next — contextual guidance (Task 3.4) */}
            {aggregateStats.imported > 0 && (
                <GlowCard variant="glass" className="rounded-[14px]">
                    <CardContent className="pt-6 space-y-3">
                        <h4 className="font-heading text-base">What&apos;s Next</h4>
                        <div className="space-y-2">
                            <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-ak-bg-3 transition-colors">
                                <Tags className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Categorize Transactions</p>
                                    <p className="text-xs text-muted-foreground">
                                        Assign categories so transactions appear in your reports and budget tracking.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-ak-bg-3 transition-colors">
                                <Upload className="h-4 w-4 text-ak-blue flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Import More Statements</p>
                                    <p className="text-xs text-muted-foreground">
                                        Upload statements from other accounts or earlier date ranges.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </GlowCard>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                <Button
                    className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                    asChild
                >
                    <Link href="/banking/transactions">
                        View Transactions
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                    onClick={onAddMoreFiles}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Import More Files
                </Button>
                <Button
                    variant="ghost"
                    className="rounded-lg"
                    asChild
                >
                    <Link href="/banking/imports">
                        <FileText className="h-4 w-4 mr-2" />
                        Import History
                    </Link>
                </Button>
            </div>
        </div>
    );
}
