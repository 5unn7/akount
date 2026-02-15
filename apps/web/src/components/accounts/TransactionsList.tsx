import { listAccountTransactions, type Transaction } from '@/lib/api/accounts';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TransactionsTableClient } from './TransactionsTableClient';

interface TransactionsListProps {
    accountId: string;
    startDate?: string;
    endDate?: string;
}

export async function TransactionsList({
    accountId,
    startDate,
    endDate,
}: TransactionsListProps) {
    const result = await listAccountTransactions(accountId, {
        startDate,
        endDate,
        limit: 50,
    });

    if (result.transactions.length === 0) {
        return (
            <Card className="glass rounded-[14px]">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-primary/10 mb-4">
                        <Inbox className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-heading font-normal mb-2">
                        No transactions yet
                    </p>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        {startDate || endDate
                            ? 'No transactions found for the selected date range.'
                            : 'Upload a bank statement to start tracking transactions.'}
                    </p>
                    <Button
                        className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                        asChild
                    >
                        <Link href="/banking/import">
                            <Upload className="h-4 w-4 mr-2" />
                            Import Statement
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const currency = result.transactions[0].currency;

    return (
        <TransactionsTableClient
            transactions={result.transactions}
            currency={currency}
            hasMore={result.hasMore}
            totalCount={result.transactions.length}
        />
    );
}
