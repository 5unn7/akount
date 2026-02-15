import { CardContent } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Badge } from '@/components/ui/badge';
import type { Account } from '@/lib/api/accounts';
import { formatCurrency } from '@/lib/utils/currency';
import {
    accountTypeIcons,
    accountTypeLabels,
    accountTypeColors,
} from '@/lib/utils/account-helpers';
import { ChevronRight } from 'lucide-react';

const accentBorderColors: Record<string, string> = {
    BANK: 'border-b-2 border-b-primary/40',
    CREDIT_CARD: 'border-b-2 border-b-ak-purple/40',
    INVESTMENT: 'border-b-2 border-b-ak-green/40',
    LOAN: 'border-b-2 border-b-ak-red/40',
    MORTGAGE: 'border-b-2 border-b-ak-blue/40',
    OTHER: '',
};

interface AccountRowProps {
    account: Account;
    onClick?: () => void;
}

export function AccountRow({ account, onClick }: AccountRowProps) {
    const Icon = accountTypeIcons[account.type];
    const colorClass = accountTypeColors[account.type];
    const accentBorder = accentBorderColors[account.type] || '';
    const isNegative = account.currentBalance < 0;

    return (
        <GlowCard
            variant="glass"
            className={`cursor-pointer group ${accentBorder}`}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
            <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                        className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${colorClass}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>

                    {/* Name + Institution */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                                {account.name}
                            </span>
                            <Badge className="text-[10px] bg-ak-bg-3 text-muted-foreground border-ak-border font-mono px-1.5 py-0">
                                {accountTypeLabels[account.type]}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {account.institution || account.entity.name}
                            {account.institution && (
                                <span className="text-ak-t4 mx-1.5">&bull;</span>
                            )}
                            {account.institution && account.entity.name}
                        </p>
                    </div>

                    {/* Status */}
                    <div className="hidden sm:flex items-center gap-1.5">
                        <div
                            className={`h-1.5 w-1.5 rounded-full ${
                                account.isActive ? 'bg-ak-green' : 'bg-zinc-500'
                            }`}
                        />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {/* Balance */}
                    <div className="text-right flex-shrink-0">
                        <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground mb-0.5">
                            Balance
                        </p>
                        <div className="flex items-baseline gap-1.5 justify-end">
                            <span
                                className={`text-lg font-mono font-semibold ${
                                    isNegative ? 'text-destructive' : ''
                                }`}
                            >
                                {formatCurrency(account.currentBalance, account.currency)}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                                {account.currency}
                            </span>
                        </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                </div>
            </CardContent>
        </GlowCard>
    );
}
