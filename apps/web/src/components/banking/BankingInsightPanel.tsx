import { Activity, AlertCircle, Tag, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Account } from '@/lib/api/accounts';
import type { TransactionStats } from '@/lib/utils/account-helpers';

interface BankingInsightPanelProps {
    stats: TransactionStats;
    accounts: Account[];
    lastImportDate?: string;
}

function generateInsightText(accounts: Account[], stats: TransactionStats): string {
    const bankAccounts = accounts.filter((a) => a.type === 'BANK');
    const creditCards = accounts.filter((a) => a.type === 'CREDIT_CARD');
    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

    const parts: string[] = [];

    if (bankAccounts.length > 0) {
        const bankBalance = bankAccounts.reduce(
            (sum, a) => sum + a.currentBalance,
            0
        );
        if (bankBalance > 0) {
            parts.push(
                `Your bank accounts hold a healthy ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(bankBalance / 100)} across ${bankAccounts.length} account${bankAccounts.length !== 1 ? 's' : ''}.`
            );
        }
    }

    if (creditCards.length > 0) {
        const creditBalance = creditCards.reduce(
            (sum, a) => sum + Math.abs(a.currentBalance),
            0
        );
        if (creditBalance === 0) {
            parts.push('Credit cards are paid off — excellent.');
        } else {
            const limit = totalBalance > 0 ? (creditBalance / totalBalance) * 100 : 0;
            if (limit < 10) {
                parts.push(
                    `Credit utilization at ${limit.toFixed(1)}% — excellent for credit score.`
                );
            } else {
                parts.push(
                    `Credit card balance at ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(creditBalance / 100)}.`
                );
            }
        }
    }

    if (stats.unreconciledCount > 0) {
        parts.push(
            `${stats.unreconciledCount} transactions need reconciliation.`
        );
    }

    return parts.join(' ') || 'All accounts are in good standing.';
}

export function BankingInsightPanel({
    stats,
    accounts,
    lastImportDate,
}: BankingInsightPanelProps) {
    const insightText = generateInsightText(accounts, stats);
    const uncategorizedCount = 0; // TODO: pass from page when category stats available

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Banking Insight Card */}
            <div className="glass rounded-xl p-5 flex-1 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ak-blue to-ak-teal" />
                <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ak-blue opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-ak-blue" />
                    </span>
                    <Activity className="h-3.5 w-3.5 text-ak-blue" />
                    <span className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Banking Insight
                    </span>
                </div>
                <p className="text-sm font-heading italic text-muted-foreground leading-relaxed">
                    {insightText}
                </p>
            </div>

            {/* Needs Attention */}
            <div className="glass rounded-xl p-5">
                <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Needs Attention
                </h3>
                <div className="space-y-3">
                    {stats.unreconciledCount > 0 && (
                        <Link
                            href="/banking/reconciliation"
                            className="flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                    Unreconciled
                                </span>
                            </div>
                            <span className="text-xs font-mono font-semibold text-primary">
                                {stats.unreconciledCount}
                            </span>
                        </Link>
                    )}

                    {uncategorizedCount > 0 && (
                        <Link
                            href="/banking/transactions?uncategorized=true"
                            className="flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                    Uncategorized
                                </span>
                            </div>
                            <span className="text-xs font-mono font-semibold text-primary">
                                {uncategorizedCount}
                            </span>
                        </Link>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                Last Import
                            </span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                            {lastImportDate ?? 'Never'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
