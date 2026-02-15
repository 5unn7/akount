import { CardContent } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Badge } from '@/components/ui/badge';
import type { Account } from '@/lib/api/accounts';
import { groupAccountsByCurrency } from '@/lib/utils/account-helpers';
import { formatCurrency } from '@/lib/utils/currency';

interface AccountsBalanceHeroProps {
    accounts: Account[];
}

export function AccountsBalanceHero({ accounts }: AccountsBalanceHeroProps) {
    const currencyGroups = groupAccountsByCurrency(accounts);

    if (currencyGroups.length === 0) {
        return null;
    }

    const primaryGroup = currencyGroups[0];
    const secondaryGroups = currencyGroups.slice(1);
    const totalAccounts = accounts.length;
    const totalCurrencies = currencyGroups.length;

    return (
        <GlowCard variant="glass" className="overflow-hidden">
            <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    {/* Primary balance */}
                    <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                            Total Cash Balance
                        </p>
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl md:text-5xl font-mono font-bold tracking-tight">
                                {formatCurrency(primaryGroup.totalBalance, primaryGroup.currency)}
                            </span>
                            <Badge className="text-xs glass text-muted-foreground border-ak-border font-mono">
                                {primaryGroup.currency} Base
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-heading italic">
                            {totalAccounts} account{totalAccounts !== 1 ? 's' : ''} across{' '}
                            {totalCurrencies} currenc{totalCurrencies !== 1 ? 'ies' : 'y'}
                        </p>
                    </div>

                    {/* Currency breakdown */}
                    {currencyGroups.length > 1 && (
                        <div className="flex flex-wrap items-start gap-4 md:gap-6">
                            {currencyGroups.map((group) => (
                                <CurrencyPill
                                    key={group.currency}
                                    currency={group.currency}
                                    totalBalance={group.totalBalance}
                                    accountCount={group.accounts.length}
                                    isPrimary={group === primaryGroup}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </GlowCard>
    );
}

interface CurrencyPillProps {
    currency: string;
    totalBalance: number;
    accountCount: number;
    isPrimary: boolean;
}

function CurrencyPill({ currency, totalBalance, accountCount, isPrimary }: CurrencyPillProps) {
    return (
        <div className="flex items-start gap-2">
            <div
                className={`mt-1.5 h-2 w-2 rounded-full ${
                    isPrimary ? 'bg-ak-green' : 'bg-ak-blue'
                }`}
            />
            <div>
                <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">
                    {currency}
                </p>
                <p className="text-lg font-mono font-semibold">
                    {formatCurrency(totalBalance, currency)}
                </p>
                {accountCount > 1 && (
                    <p className="text-[10px] text-muted-foreground">
                        {accountCount} accounts
                    </p>
                )}
            </div>
        </div>
    );
}
