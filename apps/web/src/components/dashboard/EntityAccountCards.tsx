import Link from 'next/link';
import {
    Landmark, CreditCard, TrendingUp,
    Building, Home, Wallet,
} from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';
import { listAccounts, type AccountType } from '@/lib/api/accounts';
import { formatCurrency } from '@/lib/utils/currency';

const ACCOUNT_TYPE_ICONS: Record<AccountType, typeof Landmark> = {
    BANK: Landmark,
    CREDIT_CARD: CreditCard,
    INVESTMENT: TrendingUp,
    LOAN: Building,
    MORTGAGE: Home,
    OTHER: Wallet,
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    BANK: 'Bank Account',
    CREDIT_CARD: 'Credit Card',
    INVESTMENT: 'Investment',
    LOAN: 'Loan',
    MORTGAGE: 'Mortgage',
    OTHER: 'Other',
};

interface EntityAccountCardsProps {
    entityId: string;
    currency: string;
}

/**
 * Server Component — Fetches and displays account cards for a specific entity.
 * Shown on the Overview page when a specific entity is selected.
 */
export async function EntityAccountCards({ entityId, currency }: EntityAccountCardsProps) {
    let accounts;
    try {
        const result = await listAccounts({ entityId, isActive: true });
        accounts = result.accounts;
    } catch {
        return (
            <div className="glass rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Failed to load accounts.
                </p>
            </div>
        );
    }

    if (accounts.length === 0) {
        return (
            <div className="glass rounded-xl p-8 text-center">
                <p className="text-sm font-medium mb-1">No accounts yet</p>
                <p className="text-xs text-muted-foreground">
                    Add a bank account or credit card to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((account) => {
                const Icon = ACCOUNT_TYPE_ICONS[account.type] || Wallet;
                const isNegative = account.currentBalance < 0;

                return (
                    <Link key={account.id} href={`/banking/accounts/${account.id}`}>
                        <GlowCard variant="glass" className="p-4 transition-all hover:-translate-y-px hover:border-ak-border-2">
                            <div className="flex items-center gap-3">
                                <div className="shrink-0 h-9 w-9 rounded-lg bg-ak-pri-dim flex items-center justify-center">
                                    <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {account.name}
                                    </p>
                                    <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground mt-0.5">
                                        {ACCOUNT_TYPE_LABELS[account.type]}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-ak-border flex items-baseline justify-between">
                                <span className={`text-lg font-mono font-semibold ${isNegative ? 'text-ak-red' : 'text-foreground'}`}>
                                    {formatCurrency(account.currentBalance, account.currency)}
                                </span>
                                <span className="text-micro font-mono text-muted-foreground">
                                    {account.currency}
                                </span>
                            </div>
                        </GlowCard>
                    </Link>
                );
            })}
        </div>
    );
}
