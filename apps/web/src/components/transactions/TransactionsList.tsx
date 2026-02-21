import { Receipt } from "lucide-react";
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
        const [result, { accounts }] = await Promise.all([
            listTransactions(filters),
            listAccounts({ isActive: true }),
        ]);

        return (
            <TransactionsListClient
                transactions={result.transactions}
                hasMore={result.hasMore}
                nextCursor={result.nextCursor}
                accounts={accounts}
            />
        );
    } catch {
        return (
            <div className="glass rounded-xl p-5">
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <Receipt className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No transactions yet</p>
                </div>
            </div>
        );
    }
}
