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
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TransactionsTableProps {
    transactions: Transaction[];
}

const SOURCE_BADGE_STYLES: Record<string, string> = {
    MANUAL: 'bg-white/[0.04] text-muted-foreground border-white/[0.06]',
    CSV: 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/20',
    PDF: 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20',
    BANK_FEED: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20',
    API: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
    return (
        <Card className="glass rounded-[14px]">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                                Date
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                                Description
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                                Account
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                                Category
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                                Source
                            </TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">
                                Amount
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => {
                            const isIncome = transaction.amount > 0;
                            const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
                            const sourceStyle = SOURCE_BADGE_STYLES[transaction.sourceType] || SOURCE_BADGE_STYLES.MANUAL;

                            return (
                                <TableRow
                                    key={transaction.id}
                                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                                >
                                    <TableCell className="text-sm">
                                        {formatDate(transaction.date)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
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
                                            <span className="text-sm text-muted-foreground">&mdash;</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.category ? (
                                            <Badge className="text-xs bg-white/[0.04] text-foreground border-white/[0.06]">
                                                {transaction.category.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                Uncategorized
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`text-xs ${sourceStyle}`}>
                                            {transaction.sourceType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Icon
                                                className={`h-4 w-4 ${
                                                    isIncome ? 'text-[#34D399]' : 'text-[#F87171]'
                                                }`}
                                            />
                                            <span
                                                className={`font-mono font-medium ${
                                                    isIncome ? 'text-[#34D399]' : 'text-[#F87171]'
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
            </CardContent>
        </Card>
    );
}
