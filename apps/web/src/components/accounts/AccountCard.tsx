import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowCard } from "@/components/ui/glow-card";
import { Badge } from "@/components/ui/badge";
import { Account, type AccountType } from "@/lib/api/accounts";
import { formatCurrency } from "@/lib/utils/currency";
import {
    Landmark,
    CreditCard,
    TrendingUp,
    Home,
    DollarSign,
    type LucideIcon,
} from "lucide-react";

const accountTypeIcons: Record<AccountType, LucideIcon> = {
    BANK: Landmark,
    CREDIT_CARD: CreditCard,
    INVESTMENT: TrendingUp,
    LOAN: DollarSign,
    MORTGAGE: Home,
    OTHER: DollarSign,
};

const accountTypeLabels: Record<AccountType, string> = {
    BANK: "Bank Account",
    CREDIT_CARD: "Credit Card",
    INVESTMENT: "Investment",
    LOAN: "Loan",
    MORTGAGE: "Mortgage",
    OTHER: "Other",
};

interface AccountCardProps {
    account: Account;
    onClick?: () => void;
}

/**
 * Account card component
 * Displays account summary information
 */
export function AccountCard({ account, onClick }: AccountCardProps): React.ReactElement {
    const Icon = accountTypeIcons[account.type];
    const isNegative = account.currentBalance < 0;

    return (
        <GlowCard
            variant="glass"
            className="cursor-pointer"
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                    {account.name}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <Badge className="text-xs bg-[rgba(255,255,255,0.04)] text-muted-foreground border-[rgba(255,255,255,0.06)]">
                        {accountTypeLabels[account.type]}
                    </Badge>
                    <Badge className="text-xs bg-[rgba(255,255,255,0.04)] text-foreground border-[rgba(255,255,255,0.06)] font-mono">
                        {account.currency}
                    </Badge>
                </div>

                <div>
                    <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground mb-1">Current Balance</p>
                    <p
                        className={`text-2xl font-bold font-mono ${
                            isNegative ? "text-[#F87171]" : ""
                        }`}
                    >
                        {formatCurrency(account.currentBalance, account.currency)}
                    </p>
                </div>

                <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
                    <p className="text-xs text-muted-foreground">
                        {account.entity.name} &bull; {account.entity.type}
                    </p>
                </div>
            </CardContent>
        </GlowCard>
    );
}
