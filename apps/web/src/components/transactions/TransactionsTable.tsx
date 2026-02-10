'use client';

import { type Transaction, formatAmount, formatDate } from '@/lib/api/transactions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TransactionsTableProps {
    transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((transaction) => {
                        const isIncome = transaction.amount > 0;
                        const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

                        return (
                            <TableRow key={transaction.id}>
                                <TableCell className="font-medium">
                                    {formatDate(transaction.date)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {transaction.description}
                                        </span>
                                        {transaction.notes && (
                                            <span className="text-xs text-muted-foreground">
                                                {transaction.notes}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {transaction.account ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm">
                                                {transaction.account.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {transaction.account.type}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {transaction.category ? (
                                        <Badge variant="secondary" className="text-xs">
                                            {transaction.category.name}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-xs">
                                            Uncategorized
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Icon
                                            className={`h-4 w-4 ${
                                                isIncome
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                            }`}
                                        />
                                        <span
                                            className={`font-mono font-medium ${
                                                isIncome
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                            }`}
                                        >
                                            {formatAmount(
                                                Math.abs(transaction.amount),
                                                transaction.currency
                                            )}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
