'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  ArrowRight,
  Upload,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface ImportConfirmationProps {
  result: {
    id: string;
    sourceType: 'CSV' | 'PDF';
    sourceFileName: string;
    status: string;
    totalRows: number;
    processedRows: number;
    duplicateRows: number;
    errorRows: number;
    transactions?: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      isDuplicate?: boolean;
    }>;
  };
  currency?: string;
  onUploadAnother: () => void;
}

function formatAmount(cents: number, currency = 'CAD'): string {
  const dollars = Math.abs(cents) / 100;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
  }).format(dollars);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ImportConfirmation({ result, currency = 'CAD', onUploadAnother }: ImportConfirmationProps) {
  const isSuccess = result.status === 'PROCESSED' || result.processedRows > 0;
  const hasErrors = result.errorRows > 0;
  const transactions = result.transactions || [];
  const previewTransactions = transactions.slice(0, 10);

  // Calculate date range and total from transactions
  let dateRange = '';
  let totalAmount = 0;
  if (transactions.length > 0) {
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    dateRange = `${formatDate(minDate.toISOString())} – ${formatDate(maxDate.toISOString())}`;
    totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  return (
    <div className="space-y-6">
      {/* Success / Status Banner */}
      <Card className="glass rounded-[14px]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${isSuccess ? 'bg-ak-green/10' : 'bg-ak-red/10'}`}>
              {isSuccess ? (
                <CheckCircle2 className="h-6 w-6 text-ak-green" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-ak-red" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-semibold">
                {isSuccess ? 'Import Successful' : 'Import Completed with Issues'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {result.sourceFileName}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs rounded-lg border-ak-border-2"
            >
              {result.sourceType}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass rounded-[14px]">
          <CardContent className="pt-6 space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Transactions
            </p>
            <p className="text-2xl font-mono font-bold">{result.totalRows}</p>
          </CardContent>
        </Card>

        <Card className="glass rounded-[14px]">
          <CardContent className="pt-6 space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Imported
            </p>
            <p className="text-2xl font-mono font-bold text-ak-green">
              {result.processedRows}
            </p>
          </CardContent>
        </Card>

        <Card className="glass rounded-[14px]">
          <CardContent className="pt-6 space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Duplicates
            </p>
            <p className="text-2xl font-mono font-bold text-primary">
              {result.duplicateRows}
            </p>
          </CardContent>
        </Card>

        <Card className="glass rounded-[14px]">
          <CardContent className="pt-6 space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Errors
            </p>
            <p className={`text-2xl font-mono font-bold ${hasErrors ? 'text-ak-red' : 'text-muted-foreground'}`}>
              {result.errorRows}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date range & total */}
      {transactions.length > 0 && (
        <Card className="glass rounded-[14px]">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              {dateRange && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Date Range
                  </p>
                  <p className="text-sm font-medium">{dateRange}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Total Volume
                </p>
                <p className="text-sm font-mono font-medium">{formatAmount(totalAmount, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Preview */}
      {previewTransactions.length > 0 && (
        <Card className="glass rounded-[14px]">
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Transaction Preview
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (first {previewTransactions.length} of {transactions.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ak-border">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="border-b border-ak-border hover:bg-ak-bg-3 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm">{formatDate(txn.date)}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="max-w-xs truncate" title={txn.description}>
                          {txn.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span
                          className={`font-mono font-medium ${
                            txn.amount < 0 ? 'text-ak-red' : 'text-ak-green'
                          }`}
                        >
                          {formatAmount(txn.amount, currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {txn.isDuplicate ? (
                          <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                            Duplicate
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-ak-green/10 text-ak-green border-ak-green/20">
                            New
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length > 10 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                + {transactions.length - 10} more transactions
              </p>
            )}
          </CardContent>
        </Card>
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
          onClick={onUploadAnother}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Another
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
