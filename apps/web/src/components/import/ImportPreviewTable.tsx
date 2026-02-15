'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Tag, CheckCircle } from 'lucide-react';

/**
 * Import Preview Table
 * Financial Clarity: glass cards, font-mono amounts, dim badges, dark table
 */

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  balance?: string;
}

interface PreviewData {
  rows: unknown[];
  headers: string[];
}

interface Transaction {
  tempId: string;
  date: string;
  description: string;
  amount: number;
  balance?: number;
  isDuplicate: boolean;
  duplicateConfidence?: number;
  matchReason?: string;
  suggestedCategory?: {
    id: string;
    name: string;
    confidence: number;
    reason: string;
  };
}

interface ImportPreviewTableProps {
  transactions: Transaction[];
  summary: {
    total: number;
    duplicates: number;
    categorized: number;
    needsReview: number;
  };
  sourceType: 'CSV' | 'PDF' | 'OFX' | 'XLSX';
  columns?: string[];
  columnMappings?: ColumnMapping;
  preview?: PreviewData;
}

export function ImportPreviewTable({
  transactions,
  summary,
  sourceType,
  columns,
  columnMappings,
  preview,
}: ImportPreviewTableProps) {
  // Format amount to display (cents to dollars)
  const formatAmount = (cents: number): string => {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(dollars);
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Show only first 10 transactions in preview
  const previewTransactions = transactions.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="font-heading font-normal">Import Summary</CardTitle>
          <CardDescription>
            Review the transactions before importing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold font-mono">{summary.total}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground">Duplicates Found</p>
              <p className="text-2xl font-bold font-mono text-primary">{summary.duplicates}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground">Auto-Categorized</p>
              <p className="text-2xl font-bold font-mono text-ak-green">{summary.categorized}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground">Need Review</p>
              <p className="text-2xl font-bold font-mono text-ak-blue">{summary.needsReview}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Mapping Preview (CSV/XLSX only) */}
      {sourceType === 'CSV' && columns && columnMappings && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="font-heading font-normal">Column Mapping</CardTitle>
            <CardDescription>
              Detected column mappings (auto-detected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">Date Column</p>
                <p className="text-sm font-mono">{columnMappings.date}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">Description Column</p>
                <p className="text-sm font-mono">{columnMappings.description}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">Amount Column</p>
                <p className="text-sm font-mono">{columnMappings.amount}</p>
              </div>
              {columnMappings.balance && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">Balance Column</p>
                  <p className="text-sm font-mono">{columnMappings.balance}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Preview Table */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="font-heading font-normal">Transaction Preview</CardTitle>
          <CardDescription>
            Showing first {previewTransactions.length} of {summary.total} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ak-border">
                  <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewTransactions.map((transaction) => (
                  <tr
                    key={transaction.tempId}
                    className={`border-b border-ak-border hover:bg-ak-bg-3 transition-colors ${
                      transaction.isDuplicate ? 'bg-ak-pri-dim' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="py-3 px-4 text-sm font-mono">
                      {formatDate(transaction.date)}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-sm">
                      <div className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`font-mono font-medium ${transaction.amount < 0 ? 'text-ak-red' : 'text-ak-green'}`}>
                        {formatAmount(transaction.amount)}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-sm">
                      {transaction.suggestedCategory ? (
                        <div className="flex items-center space-x-2">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span
                            className="text-xs truncate max-w-[120px]"
                            title={transaction.suggestedCategory.reason}
                          >
                            {transaction.suggestedCategory.name}
                          </span>
                          {transaction.suggestedCategory.confidence >= 85 && (
                            <CheckCircle className="h-3 w-3 text-ak-green" />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Uncategorized</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-sm">
                      {transaction.isDuplicate ? (
                        <Badge variant="warning" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Duplicate
                        </Badge>
                      ) : transaction.suggestedCategory &&
                        transaction.suggestedCategory.confidence >= 70 ? (
                        <Badge variant="success" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Review
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                + {transactions.length - 10} more transactions (not shown in preview)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
