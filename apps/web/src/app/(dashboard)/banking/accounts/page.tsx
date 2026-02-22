import type { Metadata } from 'next';
import Link from 'next/link';
import { Landmark, Upload, PenLine } from 'lucide-react';
import { BankingBalanceHero } from '@/components/banking/BankingBalanceHero';
import { BankingInsightPanel } from '@/components/banking/BankingInsightPanel';
import { AccountCardGrid } from '@/components/banking/AccountCardGrid';
import { BankingStatsRow } from '@/components/banking/BankingStatsRow';
import { GlowCard } from '@/components/ui/glow-card';
import { CardContent } from '@/components/ui/card';
import { listEntities } from '@/lib/api/entities';
import { listAccounts } from '@/lib/api/accounts';
import { listTransactions } from '@/lib/api/transactions';
import { computeTransactionStats } from '@/lib/utils/account-helpers';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';

export const metadata: Metadata = {
    title: 'Banking | Akount',
    description: 'Manage your bank accounts, credit cards, investments, and loans',
};

export default async function AccountsPage({
    searchParams,
}: {
    searchParams: Promise<{ showInactive?: string }>;
}) {
    const params = await searchParams;
    const showInactive = params.showInactive === 'true';

    // Read entity selection from cookie
    const [{ entityId: rawEntityId }, allEntities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, allEntities) ?? undefined;

    // Current month date range for MTD stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Parallel data fetching — filtered by entity
    const [entities, accountsResult, txnResult] = await Promise.all([
        Promise.resolve(allEntities),
        listAccounts({ isActive: showInactive ? undefined : true, entityId }),
        listTransactions({
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString(),
            limit: 100,
            entityId,
        }),
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
                <div className="flex flex-col items-center py-12">
                    <div className="p-4 rounded-full bg-primary/10 mb-4">
                        <Landmark className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-heading font-normal mb-1">
                        Add your first account to start tracking
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
                        Connect a bank, import a statement, or enter details manually.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
                        <Link href="/banking/accounts?addAccount=connect">
                            <GlowCard variant="glass" className="cursor-pointer transition-all hover:border-primary/40 hover:-translate-y-px h-full">
                                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
                                        <Landmark className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-medium">Connect Bank</p>
                                    <p className="text-[10px] text-muted-foreground">Automatic sync</p>
                                </CardContent>
                            </GlowCard>
                        </Link>
                        <Link href="/banking/imports">
                            <GlowCard variant="glass" className="cursor-pointer transition-all hover:border-primary/20 hover:-translate-y-px h-full">
                                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-ak-pri-dim text-ak-pri-text">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-medium">Import Statement</p>
                                    <p className="text-[10px] text-muted-foreground">CSV or PDF</p>
                                </CardContent>
                            </GlowCard>
                        </Link>
                        <Link href="/banking/accounts?addAccount=manual">
                            <GlowCard variant="glass" className="cursor-pointer transition-all hover:border-ak-border-2 hover:-translate-y-px h-full">
                                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center glass-2 text-muted-foreground">
                                        <PenLine className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-medium">Add Manually</p>
                                    <p className="text-[10px] text-muted-foreground">Enter by hand</p>
                                </CardContent>
                            </GlowCard>
                        </Link>
                    </div>
                </div>
            ) : (
                <AccountCardGrid accounts={allAccounts} showInactive={showInactive} />
            )}
        </div>
    );
}
