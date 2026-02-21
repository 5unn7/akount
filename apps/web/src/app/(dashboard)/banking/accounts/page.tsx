import type { Metadata } from 'next';
import { BankingBalanceHero } from '@/components/banking/BankingBalanceHero';
import { BankingInsightPanel } from '@/components/banking/BankingInsightPanel';
import { AccountCardGrid } from '@/components/banking/AccountCardGrid';
import { BankingStatsRow } from '@/components/banking/BankingStatsRow';
import { listEntities } from '@/lib/api/entities';
import { listAccounts } from '@/lib/api/accounts';
import { listTransactions } from '@/lib/api/transactions';
import { computeTransactionStats } from '@/lib/utils/account-helpers';

export const metadata: Metadata = {
    title: 'Banking | Akount',
    description: 'Manage your bank accounts, credit cards, investments, and loans',
};

export default async function AccountsPage() {
    // Parallel data fetching
    const [entities, accountsResult, txnResult] = await Promise.all([
        listEntities(),
        listAccounts({ isActive: true }),
        listTransactions({ limit: 200 }),
    ]);

    const allAccounts = accountsResult.accounts;
    const uniqueCurrencies = Array.from(
        new Set(allAccounts.map((a) => a.currency))
    );
    const primaryCurrency = uniqueCurrencies[0] || 'CAD';

    // Compute transaction stats for insight panel + stats row
    const txnStats = computeTransactionStats(txnResult.transactions);

    return (
        <div className="flex-1 space-y-5">
            {/* Row 1: Hero (3 cols) + Insight Panel (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="lg:col-span-3">
                    <BankingBalanceHero
                        accounts={allAccounts}
                        entities={entities}
                        currencies={uniqueCurrencies}
                    />
                </div>
                <div className="lg:col-span-1">
                    <BankingInsightPanel
                        stats={txnStats}
                        accounts={allAccounts}
                    />
                </div>
            </div>

            {/* Row 2: Stats Row (full width) */}
            <BankingStatsRow
                stats={txnStats}
                accountCount={allAccounts.length}
                currency={primaryCurrency}
            />

            {/* Row 3: Account Card Grid (full width) */}
            {allAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-2">
                        No accounts found
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Connect your bank accounts to get started.
                    </p>
                </div>
            ) : (
                <AccountCardGrid accounts={allAccounts} />
            )}
        </div>
    );
}
