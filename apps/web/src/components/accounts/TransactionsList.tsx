import { listAccountTransactions, type Transaction } from '@/lib/api/accounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, Inbox } from 'lucide-react';
import { format } from 'date-fns';

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
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                        {startDate || endDate
                            ? 'No transactions found for the selected date range'
                            : 'No transactions yet'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                        Transactions will appear here once you add them
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Get currency from first transaction (all should be same currency for an account)
    const currency = result.transactions[0].currency;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                    {result.transactions.length} transaction{result.transactions.length !== 1 ? 's' : ''}
                    {result.hasMore && ' (showing most recent)'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>
                        {result.hasMore
                            ? 'Showing most recent transactions. Use filters to see more.'
                            : 'All transactions displayed'}
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right w-[140px]">Running Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {result.transactions.map((transaction) => (
                            <TransactionRow
                                key={transaction.id}
                                transaction={transaction}
                                currency={currency}
                            />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

interface TransactionRowProps {
    transaction: Transaction;
    currency: string;
}

function TransactionRow({ transaction, currency }: TransactionRowProps) {
    const isPositive = transaction.amount > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownLeft;

    return (
        <TableRow>
            <TableCell className="font-medium">
                {format(new Date(transaction.date), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
                <div className="flex items-start gap-2">
                    <Icon
                        className={`h-4 w-4 mt-0.5 ${isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                    />
                    <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.notes && (
                            <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                        )}
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <span
                    className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                >
                    {isPositive ? '+' : ''}
                    {formatMoney(transaction.amount, currency)}
                </span>
            </TableCell>
            <TableCell className="text-right">
                <div className="space-y-1">
                    <p className="font-medium">
                        {formatMoney(transaction.runningBalance, currency)}
                    </p>
                    {transaction.isStaged && (
                        <Badge variant="outline" className="text-xs">
                            Staged
                        </Badge>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}

/**
 * Format money amount (cents) as currency string
 */
function formatMoney(cents: number, currency: string): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}
