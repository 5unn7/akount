import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImportBatch } from '@/lib/api/imports';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CheckCircle2,
    AlertCircle,
    Clock,
    Loader2,
    FileSpreadsheet,
    FileText,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';

export const metadata: Metadata = {
    title: 'Import Details | Akount',
    description: 'View details of an import batch',
};

interface ImportDetailPageProps {
    params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<string, {
    icon: typeof CheckCircle2;
    style: string;
    label: string;
}> = {
    PROCESSED: {
        icon: CheckCircle2,
        style: 'bg-ak-green/10 text-ak-green border-ak-green/20',
        label: 'Complete',
    },
    PROCESSING: {
        icon: Loader2,
        style: 'bg-ak-blue/10 text-ak-blue border-ak-blue/20',
        label: 'Processing',
    },
    PENDING: {
        icon: Clock,
        style: 'bg-primary/10 text-primary border-primary/20',
        label: 'Pending',
    },
    FAILED: {
        icon: AlertCircle,
        style: 'bg-ak-red/10 text-ak-red border-ak-red/20',
        label: 'Failed',
    },
};

export default async function ImportDetailPage({ params }: ImportDetailPageProps) {
    const { id } = await params;

    let batch;
    try {
        batch = await getImportBatch(id);
    } catch {
        notFound();
    }

    if (!batch) notFound();

    const statusConfig = STATUS_CONFIG[batch.status] || STATUS_CONFIG.PENDING;
    const StatusIcon = statusConfig.icon;
    const SourceIcon = batch.sourceType === 'PDF' ? FileText : FileSpreadsheet;

    return (
        <div className="flex-1 space-y-5">
            <div className="fi fi1">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Imports', href: '/banking/imports' },
                        { label: batch.sourceFileName },
                    ]}
                    title={batch.sourceFileName}
                    subtitle={`Imported ${formatDateTime(batch.createdAt)}`}
                    actions={
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                            asChild
                        >
                            <Link href="/banking/imports">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Imports
                            </Link>
                        </Button>
                    }
                />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard
                    label="Status"
                    value={
                        <Badge className={`gap-1 text-xs ${statusConfig.style}`}>
                            <StatusIcon
                                className={`h-3 w-3 ${batch.status === 'PROCESSING' ? 'animate-spin' : ''}`}
                            />
                            {statusConfig.label}
                        </Badge>
                    }
                />
                <StatCard
                    label="Source"
                    value={
                        <div className="flex items-center gap-1.5">
                            <SourceIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{batch.sourceType}</span>
                        </div>
                    }
                />
                <StatCard
                    label="Total Rows"
                    value={<span className="font-mono">{batch.totalRows}</span>}
                />
                <StatCard
                    label="Imported"
                    value={<span className="font-mono text-ak-green">{batch.processedRows}</span>}
                />
                <StatCard
                    label="Duplicates / Errors"
                    value={
                        <div className="flex items-center gap-2">
                            {batch.duplicateRows > 0 && (
                                <span className="font-mono text-primary">{batch.duplicateRows} dup</span>
                            )}
                            {batch.errorRows > 0 && (
                                <span className="font-mono text-ak-red">{batch.errorRows} err</span>
                            )}
                            {batch.duplicateRows === 0 && batch.errorRows === 0 && (
                                <span className="text-muted-foreground">None</span>
                            )}
                        </div>
                    }
                />
            </div>

            {/* Error details */}
            {batch.errorDetails && (
                <Card className="border-ak-red/20 bg-ak-red/[0.04]">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-ak-red flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-ak-red">Import Error</p>
                                <p className="text-sm text-ak-red/80 mt-1">{batch.errorDetails}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Transactions table */}
            {batch.transactions && batch.transactions.length > 0 ? (
                <Card className="glass rounded-[14px]">
                    <CardHeader>
                        <CardTitle className="font-heading font-normal text-base">
                            Imported Transactions ({batch._count?.transactions ?? batch.transactions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-ak-border hover:bg-transparent">
                                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Date</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Description</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Category</TableHead>
                                    <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batch.transactions.map((txn) => (
                                    <TableRow
                                        key={txn.id}
                                        className="border-b border-ak-border hover:bg-ak-bg-3 transition-colors"
                                    >
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {formatDate(txn.date)}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/banking/transactions?accountId=${txn.id}`}
                                                className="text-sm font-medium hover:text-primary transition-colors"
                                            >
                                                {txn.description}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {txn.category ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-micro border-ak-border"
                                                >
                                                    {txn.category.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={`font-mono text-sm ${
                                                    txn.amount >= 0 ? 'text-ak-green' : 'text-ak-red'
                                                }`}
                                            >
                                                {formatCurrency(txn.amount, txn.currency)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <Card className="glass rounded-[14px]">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-muted-foreground">
                            No transactions in this import batch
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="glass rounded-lg px-4 py-3.5">
            <p className="text-micro uppercase tracking-wider text-muted-foreground mb-1">
                {label}
            </p>
            <div className="text-sm font-medium">{value}</div>
        </div>
    );
}
