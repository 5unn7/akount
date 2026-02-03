import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Account } from "@/lib/api/accounts";
import { formatCurrency } from "@/lib/utils/currency";
import {
    Landmark,
    CreditCard,
    TrendingUp,
    Home,
    DollarSign,
} from "lucide-react";

const accountTypeIcons = {
    BANK: Landmark,
    CREDIT_CARD: CreditCard,
    INVESTMENT: TrendingUp,
    LOAN: DollarSign,
    MORTGAGE: Home,
    OTHER: DollarSign,
};

const accountTypeLabels = {
    BANK: "Bank Account",
    CREDIT_CARD: "Credit Card",
    INVESTMENT: "Investment",
    LOAN: "Loan",
    MORTGAGE: "Mortgage",
    OTHER: "Other",
};

/**
 * Account card component
 * Displays account summary information
 */
export function AccountCard({ account }: { account: Account }) {
    const Icon = accountTypeIcons[account.type];
    const isNegative = account.currentBalance < 0;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                    {account.name}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                        {accountTypeLabels[account.type]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {account.currency}
                    </Badge>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                    <p
                        className={`text-2xl font-bold font-mono ${
                            isNegative ? "text-destructive" : ""
                        }`}
                    >
                        {formatCurrency(account.currentBalance, account.currency)}
                    </p>
                </div>

                <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                        {account.entity.name} • {account.entity.type}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
