'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, ArrowLeftRight, Plus, RefreshCw } from 'lucide-react';
import type { Account, AccountType } from '@/lib/api/accounts';
import type { Entity } from '@/lib/api/entities';
import { groupAccountsByCurrency } from '@/lib/utils/account-helpers';
import { formatCurrency } from '@/lib/utils/currency';
import { AddAccountModal } from '@/components/accounts/AddAccountModal';

const typeGroupOrder: AccountType[] = [
    'BANK',
    'CREDIT_CARD',
    'INVESTMENT',
    'LOAN',
    'MORTGAGE',
    'OTHER',
];

const typeGroupLabels: Record<AccountType, string> = {
    BANK: 'Checking & Savings',
    CREDIT_CARD: 'Credit Cards',
    INVESTMENT: 'Investments',
    LOAN: 'Loans',
    MORTGAGE: 'Mortgages',
    OTHER: 'Other',
};

interface BankingBalanceHeroProps {
    accounts: Account[];
    entities: Entity[];
    currencies: string[];
}

export function BankingBalanceHero({
    accounts,
    entities,
    currencies,
}: BankingBalanceHeroProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const currencyGroups = groupAccountsByCurrency(accounts);
    const primaryGroup = currencyGroups[0];
    const totalBalance = primaryGroup?.totalBalance ?? 0;
    const primaryCurrency = primaryGroup?.currency ?? 'CAD';

    // Group accounts by type (only show types that exist)
    const typeBreakdown = typeGroupOrder
        .map((type) => {
            const matching = accounts.filter((a) => a.type === type);
            if (matching.length === 0) return null;
            const balance = matching.reduce(
                (sum, a) => sum + a.currentBalance,
                0
            );
            return { type, label: typeGroupLabels[type], balance, count: matching.length };
        })
        .filter(Boolean) as Array<{
        type: AccountType;
        label: string;
        balance: number;
        count: number;
    }>;

    const subtitle = `${accounts.length} account${accounts.length !== 1 ? 's' : ''} across ${currencies.length} currenc${currencies.length !== 1 ? 'ies' : 'y'}`;

    return (
        <>
            <div className="glass rounded-xl bg-gradient-to-br from-ak-blue/[0.08] to-ak-teal/[0.05] border-ak-blue/15 overflow-hidden">
                <div className="p-6 md:p-8">
                    {/* Header row: Title + Action Pills */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-heading font-normal tracking-tight">
                                Banking
                            </h1>
                            <p className="text-sm text-muted-foreground font-heading italic mt-1">
                                {subtitle}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                                asChild
                            >
                                <Link href="/banking/imports">
                                    <Upload className="h-3.5 w-3.5" />
                                    Import Statements
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                                asChild
                            >
                                <Link href="/banking/reconciliation">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Reconcile
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                                asChild
                            >
                                <Link href="/banking/transfers">
                                    <ArrowLeftRight className="h-3.5 w-3.5" />
                                    Transfer
                                </Link>
                            </Button>
                            <Button
                                onClick={() => setCreateOpen(true)}
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Account
                            </Button>
                        </div>
                    </div>

                    {/* Balance display */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1">
                                Total Balance
                            </p>
                            <span
                                className={`text-[28px] md:text-[40px] font-mono font-bold tracking-tight leading-none ${totalBalance >= 0 ? 'text-ak-green' : 'text-ak-red'}`}
                            >
                                {formatCurrency(totalBalance, primaryCurrency)}
                            </span>
                        </div>

                        {/* Sub-items: account type breakdown */}
                        {typeBreakdown.length > 0 && (
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-ak-border">
                                {typeBreakdown.map((group) => (
                                    <div
                                        key={group.type}
                                        className="flex items-baseline gap-2"
                                    >
                                        <span className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">
                                            {group.label}
                                        </span>
                                        <span className="text-sm font-mono font-semibold">
                                            {formatCurrency(
                                                group.balance,
                                                primaryCurrency
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Multi-currency badges */}
                        {currencyGroups.length > 1 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {currencyGroups.map((g) => (
                                    <Badge
                                        key={g.currency}
                                        className="glass text-xs text-muted-foreground border-ak-border font-mono"
                                    >
                                        {g.currency}{' '}
                                        {formatCurrency(
                                            g.totalBalance,
                                            g.currency
                                        )}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddAccountModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                entities={entities}
            />
        </>
    );
}
