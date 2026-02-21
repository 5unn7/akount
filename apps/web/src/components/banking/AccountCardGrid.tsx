'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlowCard } from '@/components/ui/glow-card';
import { CardContent } from '@/components/ui/card';
import type { Account, AccountType } from '@/lib/api/accounts';
import {
    accountTypeIcons,
    accountTypeLabels,
    accountTypeColors,
} from '@/lib/utils/account-helpers';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';

const typeFilterTabs: Array<{ value: AccountType | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'BANK', label: 'Bank' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'INVESTMENT', label: 'Investment' },
    { value: 'LOAN', label: 'Loan' },
    { value: 'MORTGAGE', label: 'Mortgage' },
    { value: 'OTHER', label: 'Other' },
];

interface AccountCardGridProps {
    accounts: Account[];
}

export function AccountCardGrid({ accounts }: AccountCardGridProps) {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<AccountType | 'ALL'>(
        'ALL'
    );

    const filtered =
        activeFilter === 'ALL'
            ? accounts
            : accounts.filter((a) => a.type === activeFilter);

    // Only show filter tabs that have at least 1 account
    const availableTypes = new Set(accounts.map((a) => a.type));
    const visibleTabs = typeFilterTabs.filter(
        (t) => t.value === 'ALL' || availableTypes.has(t.value as AccountType)
    );

    return (
        <div className="space-y-4">
            {/* Type filter tabs */}
            {visibleTabs.length > 2 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveFilter(tab.value)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                activeFilter === tab.value
                                    ? 'bg-primary text-black'
                                    : 'glass text-muted-foreground hover:text-foreground hover:border-ak-border-2'
                            )}
                        >
                            {tab.label}
                            {tab.value !== 'ALL' && (
                                <span className="ml-1.5 text-[10px] opacity-70">
                                    {accounts.filter(
                                        (a) => a.type === tab.value
                                    ).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Account cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((account) => {
                    const Icon = accountTypeIcons[account.type];
                    const isNegative = account.currentBalance < 0;

                    return (
                        <GlowCard
                            key={account.id}
                            variant="glass"
                            className="cursor-pointer group"
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                                router.push(
                                    `/banking/accounts/${account.id}`
                                )
                            }
                            onKeyDown={(e) => {
                                if (
                                    e.key === 'Enter' ||
                                    e.key === ' '
                                ) {
                                    e.preventDefault();
                                    router.push(
                                        `/banking/accounts/${account.id}`
                                    );
                                }
                            }}
                        >
                            <CardContent className="p-4 space-y-3">
                                {/* Type badge + Icon */}
                                <div className="flex items-center justify-between">
                                    <Badge
                                        className={cn(
                                            'text-[10px] border-0',
                                            accountTypeColors[account.type]
                                        )}
                                    >
                                        {accountTypeLabels[account.type]}
                                    </Badge>
                                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>

                                {/* Name + institution */}
                                <div>
                                    <p className="text-sm font-medium truncate">
                                        {account.name}
                                    </p>
                                    {account.institution && (
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {account.institution}
                                        </p>
                                    )}
                                </div>

                                {/* Balance */}
                                <p
                                    className={cn(
                                        'text-xl font-mono font-bold',
                                        isNegative
                                            ? 'text-destructive'
                                            : ''
                                    )}
                                >
                                    {formatCurrency(
                                        account.currentBalance,
                                        account.currency
                                    )}
                                </p>

                                {/* Footer */}
                                <div className="pt-2 border-t border-ak-border flex items-center justify-between">
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {account.entity.name}
                                    </p>
                                    <Badge className="text-[9px] glass text-muted-foreground border-ak-border font-mono px-1.5 py-0">
                                        {account.currency}
                                    </Badge>
                                </div>
                            </CardContent>
                        </GlowCard>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <Landmark className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No accounts match this filter</p>
                </div>
            )}
        </div>
    );
}
