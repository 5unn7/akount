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
        // Fetch transactions with filters
        const { transactions, hasMore } = await listTransactions(filters);

        // Fetch accounts for the filter dropdown
        const { accounts } = await listAccounts({ isActive: true });

        if (transactions.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-2">No transactions found</p>
                    <p className="text-sm text-muted-foreground">
                        {filters?.accountId || filters?.startDate || filters?.endDate
                            ? 'Try adjusting your filters or import bank statements to get started'
                            : 'Import bank statements to get started'}
                    </p>
                </div>
            );
        }

        return (
            <TransactionsListClient
                transactions={transactions}
                hasMore={hasMore}
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
