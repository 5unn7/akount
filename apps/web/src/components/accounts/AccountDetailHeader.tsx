import { CardContent } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import type { Account } from '@/lib/api/accounts';
import { formatCurrency } from '@/lib/utils/currency';
import { PageHeader } from '@/components/shared/PageHeader';
import {
    accountTypeIcons,
    accountTypeLabels,
    accountTypeColors,
} from '@/lib/utils/account-helpers';

interface AccountDetailHeaderProps {
    account: Account;
}

export function AccountDetailHeader({ account }: AccountDetailHeaderProps) {
    const Icon = accountTypeIcons[account.type];
    const typeLabel = accountTypeLabels[account.type];
    const colorClass = accountTypeColors[account.type];
    const isNegative = account.currentBalance < 0;

    return (
        <div className="space-y-4">
            {/* Breadcrumbs + actions */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Money', href: '/banking/accounts' },
                    { label: 'Accounts', href: '/banking/accounts' },
                    { label: account.name },
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                            disabled
                            title="Coming soon"
                        >
                            <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                            asChild
                        >
                            <Link href="/banking/import">
                                <Upload className="h-3.5 w-3.5" />
                                Import
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
                }
            />

            {/* Account info card */}
            <GlowCard variant="glass">
                <CardContent className="p-5 md:p-6">
                    <div className="flex items-center gap-4 md:gap-5">
                        {/* Icon */}
                        <div
                            className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${colorClass}`}
                        >
                            <Icon className="h-6 w-6" />
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl md:text-2xl font-heading font-normal tracking-tight truncate">
                                {account.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {account.institution && (
                                    <span className="text-sm text-muted-foreground">
                                        {account.institution}
                                    </span>
                                )}
                                {account.institution && (
                                    <span className="text-muted-foreground/40">&bull;</span>
                                )}
                                <div className="flex items-center gap-1">
                                    <div
                                        className={`h-1.5 w-1.5 rounded-full ${
                                            account.isActive ? 'bg-ak-green' : 'bg-zinc-500'
                                        }`}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        {account.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="text-right flex-shrink-0">
                            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground mb-1">
                                Current Balance
                            </p>
                            <p
                                className={`text-2xl md:text-3xl font-mono font-bold ${
                                    isNegative ? 'text-destructive' : ''
                                }`}
                            >
                                {formatCurrency(account.currentBalance, account.currency)}
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-1">
                                <Badge className="text-[10px] glass text-muted-foreground border-ak-border font-mono px-1.5 py-0">
                                    {account.currency}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                    {account.entity.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </GlowCard>
        </div>
    );
}
