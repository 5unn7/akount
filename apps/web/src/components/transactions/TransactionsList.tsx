import { listTransactions, type ListTransactionsParams } from "@/lib/api/transactions";
import { listAccounts } from "@/lib/api/accounts";
import { TransactionsListClient } from "./TransactionsListClient";

interface TransactionsListProps {
    filters?: ListTransactionsParams;
}

/**
 * Transactions list - Server Component
 * Fetches and displays all transactions with pagination support
 */
export async function TransactionsList({ filters }: TransactionsListProps): Promise<React.ReactElement> {
    try {
        const result = await listTransactions(filters);
        const { accounts } = await listAccounts({ isActive: true });

        return (
            <TransactionsListClient
                transactions={result.transactions}
                hasMore={result.hasMore}
                nextCursor={result.nextCursor}
                accounts={accounts}
            />
        );
    } catch (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-destructive mb-2">Failed to load transactions</p>
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
            </div>
        );
    }
}
