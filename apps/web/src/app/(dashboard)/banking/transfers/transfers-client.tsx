'use client';

import { useState } from 'react';
import type { Account } from '@/lib/api/accounts';
import type { Transfer } from '@/lib/api/transfers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, ArrowRightLeft, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/api/transactions.types';
import { TransferForm } from '@/components/banking/TransferForm';
import { listTransfersAction } from './actions';

interface TransfersClientProps {
  accounts: Account[];
  initialTransfers: Transfer[];
  entityId: string;
  hasMore: boolean;
  nextCursor?: string;
}

export function TransfersClient({
  accounts,
  initialTransfers,
  entityId,
  hasMore: initialHasMore,
  nextCursor: initialNextCursor,
}: TransfersClientProps) {
  const [transfers, setTransfers] = useState(initialTransfers);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function handleLoadMore() {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const result = await listTransfersAction({
        entityId,
        cursor: nextCursor,
        limit: 50,
      });
      setTransfers((prev) => [...prev, ...result.transfers]);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading">Transfers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Move money between your accounts
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Transfer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total Transfers
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono">{transfers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer List */}
      {transfers.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No transfers yet</p>
            <Button onClick={() => setSheetOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Transfer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-ak-border hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">From</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">To</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Memo</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => {
                  const doc = transfer.sourceDocument as {
                    fromAccountName?: string;
                    toAccountName?: string;
                  };
                  return (
                    <TableRow key={transfer.id} className="border-ak-border hover:bg-ak-bg-3/50">
                      <TableCell className="text-sm">{formatDate(transfer.date)}</TableCell>
                      <TableCell className="text-sm">{doc.fromAccountName || '—'}</TableCell>
                      <TableCell className="text-sm">{doc.toAccountName || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transfer.memo || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-ak-blue">
                        {formatCurrency(transfer.amount, transfer.currency)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              `Load More (${transfers.length} shown)`
            )}
          </Button>
        </div>
      )}

      {/* Create Transfer Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md bg-card border-ak-border">
          <SheetHeader>
            <SheetTitle>Create Transfer</SheetTitle>
            <SheetDescription>
              Move money between your accounts. GL entries will be created automatically.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <TransferForm
              accounts={accounts}
              entityId={entityId}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
