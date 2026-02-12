import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, CreditCard, TrendingUp, Landmark, Home, Wallet } from 'lucide-react';
import Link from 'next/link';
import type { Account } from '@/lib/api/accounts';

interface AccountDetailHeaderProps {
    account: Account;
}

const accountTypeIcons = {
    BANK: Landmark,
    CREDIT_CARD: CreditCard,
    INVESTMENT: TrendingUp,
    LOAN: Building2,
    MORTGAGE: Home,
    OTHER: Wallet,
} as const;

const accountTypeLabels = {
    BANK: 'Bank Account',
    CREDIT_CARD: 'Credit Card',
    INVESTMENT: 'Investment',
    LOAN: 'Loan',
    MORTGAGE: 'Mortgage',
    OTHER: 'Other',
} as const;

export function AccountDetailHeader({ account }: AccountDetailHeaderProps) {
    const Icon = accountTypeIcons[account.type];
    const typeLabel = accountTypeLabels[account.type];

    return (
        <div className="space-y-4">
            {/* Back button */}
            <Link href="/banking/accounts">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Accounts
                </Button>
            </Link>

            {/* Account info card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Icon className="h-6 w-6" />
                                {account.name}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{typeLabel}</Badge>
                                <Badge variant="outline">{account.currency}</Badge>
                                {account.institution && (
                                    <Badge variant="secondary">{account.institution}</Badge>
                                )}
                                {!account.isActive && (
                                    <Badge variant="destructive">Inactive</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-3xl font-bold">
                            {formatMoney(account.currentBalance, account.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {account.entity.name} • {account.entity.type}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Format money amount (cents) as currency string
 */
function formatMoney(cents: number, currency: string): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}
