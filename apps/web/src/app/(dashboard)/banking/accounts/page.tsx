import type { Metadata } from 'next';
import { AccountsPageHeader } from '@/components/accounts/AccountsPageHeader';
import { AccountsBalanceHero } from '@/components/accounts/AccountsBalanceHero';
import { AccountsListClient } from '@/components/accounts/AccountsListClient';
import { StatsGrid } from '@/components/shared/StatsGrid';
import { listEntities } from '@/lib/api/entities';
import { listAccounts, type AccountType } from '@/lib/api/accounts';
import { formatCurrency } from '@/lib/utils/currency';

export const metadata: Metadata = {
    title: 'Accounts | Akount',
    description: 'Manage your bank accounts, credit cards, investments, and loans',
};

interface AccountsPageProps {
    searchParams: Promise<{ type?: string; currency?: string }>;
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
    const params = await searchParams;
    const typeFilter = params.type as AccountType | undefined;
    const currencyFilter = params.currency;

    const [entities, accountsResult] = await Promise.all([
        listEntities(),
        listAccounts({ isActive: true, type: typeFilter }),
    ]);

    const allAccounts = accountsResult.accounts;
    const uniqueCurrencies = Array.from(new Set(allAccounts.map((a) => a.currency)));

    // Client-side currency filtering (API doesn't support it)
    const filteredAccounts = currencyFilter
        ? allAccounts.filter((a) => a.currency === currencyFilter)
        : allAccounts;

    // Compute stats
    const totalBalance = allAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const primaryCurrency = uniqueCurrencies[0] || 'CAD';

    const stats = [
        {
            label: 'Total Accounts',
            value: `${allAccounts.length}`,
        },
        {
            label: 'Total Balance',
            value: formatCurrency(totalBalance, primaryCurrency),
            color: totalBalance >= 0 ? 'green' as const : 'red' as const,
        },
        {
            label: 'Currencies',
            value: uniqueCurrencies.join(', ') || '\u2014',
            color: 'blue' as const,
        },
        {
            label: 'Active',
            value: `${allAccounts.filter(a => a.isActive).length} of ${allAccounts.length}`,
            color: 'primary' as const,
        },
    ];

    return (
        <div className="flex-1 space-y-5">
            <AccountsPageHeader
                entities={entities}
                currencies={uniqueCurrencies}
                accountCount={allAccounts.length}
            />

            <div className="fi fi2">
                <StatsGrid stats={stats} columns={4} />
            </div>

            <div className="fi fi3">
                <AccountsBalanceHero accounts={allAccounts} />
            </div>

            {filteredAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center fi fi4">
                    <p className="text-muted-foreground mb-2">No accounts found</p>
                    <p className="text-sm text-muted-foreground">
                        {typeFilter || currencyFilter
                            ? 'No accounts match your filters. Try a different filter or add one.'
                            : 'Connect your bank accounts to get started'}
                    </p>
                </div>
            ) : (
                <div className="fi fi4">
                    <AccountsListClient
                        accounts={filteredAccounts}
                        hasMore={accountsResult.hasMore}
                        entities={entities}
                    />
                </div>
            )}
        </div>
    );
}
