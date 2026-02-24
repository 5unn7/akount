'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw, Settings, ChevronRight } from 'lucide-react';
import type { Account, AccountType } from '@/lib/api/accounts';
import {
    accountTypeIcons,
    accountTypeLabels,
    accountTypeColors,
} from '@/lib/utils/account-helpers';
import { formatCurrency } from '@/lib/utils/currency';
import { MiniSparkline } from '@/components/dashboard/MiniSparkline';
import type { SparkColor } from '@/lib/dashboard/constants';

const typeGradients: Record<AccountType, string> = {
    BANK: 'from-ak-blue/[0.08] to-ak-teal/[0.05]',
    CREDIT_CARD: 'from-primary/[0.08] to-ak-red/[0.05]',
    INVESTMENT: 'from-ak-green/[0.08] to-ak-teal/[0.05]',
    LOAN: 'from-ak-red/[0.08] to-ak-purple/[0.05]',
    MORTGAGE: 'from-ak-purple/[0.08] to-ak-blue/[0.05]',
    OTHER: 'from-muted/[0.08] to-muted/[0.05]',
};

const typeBorderColors: Record<AccountType, string> = {
    BANK: 'border-ak-blue/15',
    CREDIT_CARD: 'border-primary/15',
    INVESTMENT: 'border-ak-green/15',
    LOAN: 'border-ak-red/15',
    MORTGAGE: 'border-ak-purple/15',
    OTHER: 'border-ak-border',
};

const typeSparkColors: Record<AccountType, SparkColor> = {
    BANK: 'blue',
    CREDIT_CARD: 'primary',
    INVESTMENT: 'green',
    LOAN: 'red',
    MORTGAGE: 'purple',
    OTHER: 'primary',
};

interface AccountDetailHeroProps {
    account: Account;
    monthlyChange: number;
    runningBalanceData: number[];
}

export function AccountDetailHero({
    account,
    monthlyChange,
    runningBalanceData,
}: AccountDetailHeroProps) {
    const Icon = accountTypeIcons[account.type];
    const isNegative = account.currentBalance < 0;
    const gradient = typeGradients[account.type];
    const borderColor = typeBorderColors[account.type];
    const sparkColor = typeSparkColors[account.type];

    return (
        <div
            className={`glass rounded-xl bg-gradient-to-br ${gradient} ${borderColor} overflow-hidden`}
        >
            <div className="p-6 md:p-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-5">
                    <Link
                        href="/banking/accounts"
                        className="hover:text-foreground transition-colors"
                    >
                        Banking
                    </Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link
                        href="/banking/accounts"
                        className="hover:text-foreground transition-colors"
                    >
                        Accounts
                    </Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground">{account.name}</span>
                </nav>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    {/* Left: Icon + Name + Badges */}
                    <div className="flex items-start gap-4">
                        <div
                            className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${accountTypeColors[account.type]}`}
                        >
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-heading font-normal tracking-tight">
                                {account.name}
                            </h1>
                            {account.institution && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {account.institution}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge className="text-micro border-0 px-2 py-0.5 bg-ak-green/15 text-ak-green">
                                    {account.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge
                                    className={`text-micro border-0 px-2 py-0.5 ${accountTypeColors[account.type]}`}
                                >
                                    {accountTypeLabels[account.type]}
                                </Badge>
                                <Badge className="text-micro glass text-muted-foreground border-ak-border font-mono px-2 py-0.5">
                                    {account.currency}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Right: Action Pills */}
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
                        >
                            <Settings className="h-3.5 w-3.5" />
                            Manage
                        </Button>
                    </div>
                </div>

                {/* Balance + Sparkline */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-end gap-4">
                    <div>
                        <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1">
                            Current Balance
                        </p>
                        <span
                            className={`text-[28px] md:text-[40px] font-mono font-bold tracking-tight leading-none ${isNegative ? 'text-destructive' : ''}`}
                        >
                            {formatCurrency(
                                account.currentBalance,
                                account.currency
                            )}
                        </span>
                        <p className="text-xs mt-1.5">
                            <span
                                className={
                                    monthlyChange >= 0
                                        ? 'text-ak-green'
                                        : 'text-ak-red'
                                }
                            >
                                {monthlyChange >= 0 ? '+' : ''}
                                {formatCurrency(monthlyChange, account.currency)}
                            </span>
                            <span className="text-muted-foreground ml-1">
                                this month
                            </span>
                        </p>
                    </div>
                    {runningBalanceData.length >= 2 && (
                        <MiniSparkline
                            data={runningBalanceData}
                            color={sparkColor}
                            width={80}
                            height={30}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
