import { listAccountTransactions } from '@/lib/api/accounts';
import { Receipt } from 'lucide-react';
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
            <div className="glass rounded-xl p-5">
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <Receipt className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">
                        {startDate || endDate
                            ? 'No transactions in this date range'
                            : 'No transactions yet'}
                    </p>
                </div>
            </div>
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
