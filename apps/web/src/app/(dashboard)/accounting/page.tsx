import { getAccountBalances, listJournalEntries } from '@/lib/api/accounting';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { formatCurrency } from '@/lib/utils/currency';
import { BalanceEquation } from './balance-equation';
import { IncomeSummary } from './income-summary';
import { COASnapshot } from './coa-snapshot';
import { RecentEntries } from './recent-entries';
import { AccountingSetupCards } from './accounting-empty';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, Percent } from 'lucide-react';

export default async function AccountingOverviewPage() {
    // Get entity selection
    const [{ entityId: rawEntityId }, allEntities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, allEntities) ?? undefined;

    // Need a valid entity to fetch accounting data
    if (!entityId) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <AccountingSetupCards />
            </div>
        );
    }

    // Fetch data in parallel
    const [balances, journalEntries] = await Promise.all([
        getAccountBalances(entityId),
        listJournalEntries({ entityId, limit: 5 }),
    ]);

    const isNewUser = balances.length === 0;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Setup cards for new users */}
            {isNewUser && <AccountingSetupCards />}

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="glass rounded-xl p-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Total Assets
                    </div>
                    <div className="text-2xl font-mono font-semibold">
                        {formatCurrency(balances
                            .filter((b) => b.type === 'ASSET')
                            .reduce((sum, b) => sum + b.balance, 0)
                        )}
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Total Liabilities
                    </div>
                    <div className="text-2xl font-mono font-semibold">
                        {formatCurrency(balances
                            .filter((b) => b.type === 'LIABILITY')
                            .reduce((sum, b) => sum + b.balance, 0)
                        )}
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Total Equity
                    </div>
                    <div className="text-2xl font-mono font-semibold">
                        {formatCurrency(balances
                            .filter((b) => b.type === 'EQUITY')
                            .reduce((sum, b) => sum + b.balance, 0)
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
                <Button
                    asChild
                    size="sm"
                    className="gap-2 bg-primary hover:bg-ak-pri-hover text-black font-medium"
                >
                    <Link href="/accounting/journal-entries/new">
                        <Plus className="h-4 w-4" />
                        New Journal Entry
                    </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href="/accounting/reports">
                        <FileText className="h-4 w-4" />
                        Run Reports
                    </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href="/accounting/fiscal-periods">
                        <Calendar className="h-4 w-4" />
                        Fiscal Periods
                    </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href="/accounting/tax-rates">
                        <Percent className="h-4 w-4" />
                        Tax Rates
                    </Link>
                </Button>
            </div>

            {/* Balance Equation: A = L + E */}
            <BalanceEquation balances={balances} />

            {/* Income Summary */}
            <IncomeSummary entityId={entityId} />

            {/* COA Snapshot */}
            <COASnapshot balances={balances} />

            {/* Recent Journal Entries */}
            <RecentEntries journalEntries={journalEntries} />
        </div>
    );
}
