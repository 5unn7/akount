import type { GLAccountBalance, GLAccountType } from '@/lib/api/accounting';
import Link from 'next/link';
import { ListTree, Package, Shield, TrendingUp, TrendingDown } from 'lucide-react';

interface COASnapshotProps {
    balances: GLAccountBalance[];
}

const typeIcons: Record<GLAccountType, typeof ListTree> = {
    ASSET: Package,
    LIABILITY: Shield,
    EQUITY: Shield,
    REVENUE: TrendingUp,
    EXPENSE: TrendingDown,
};

const typeColors: Record<GLAccountType, string> = {
    ASSET: 'text-ak-green',
    LIABILITY: 'text-ak-red',
    EQUITY: 'text-ak-blue',
    REVENUE: 'text-ak-green',
    EXPENSE: 'text-ak-red',
};

export function COASnapshot({ balances }: COASnapshotProps) {
    const formatAmount = (cents: number): string => {
        return (cents / 100).toLocaleString('en-CA', {
            style: 'currency',
            currency: 'CAD',
            minimumFractionDigits: 2,
        });
    };

    // Group balances by type
    const typeGroups: Array<{
        type: GLAccountType;
        label: string;
        total: number;
        count: number;
    }> = [
        'ASSET',
        'LIABILITY',
        'EQUITY',
        'REVENUE',
        'EXPENSE',
    ].map((type) => {
        const accountsOfType = balances.filter((b) => b.type === type);
        const total = accountsOfType.reduce((sum, b) => sum + b.balance, 0);
        return {
            type: type as GLAccountType,
            label: type.charAt(0) + type.slice(1).toLowerCase() + 's',
            total,
            count: accountsOfType.length,
        };
    });

    return (
        <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading">Chart of Accounts</h3>
                <Link
                    href="/accounting/chart-of-accounts"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    View full chart →
                </Link>
            </div>

            <div className="space-y-2">
                {typeGroups.map((group) => {
                    const Icon = typeIcons[group.type];
                    return (
                        <div
                            key={group.type}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-ak-bg-3 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Icon
                                    className={`h-4 w-4 ${typeColors[group.type]}`}
                                />
                                <div>
                                    <span className="text-sm font-medium">
                                        {group.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                        ({group.count})
                                    </span>
                                </div>
                            </div>
                            <span
                                className={`text-sm font-mono font-semibold ${typeColors[group.type]}`}
                            >
                                {formatAmount(group.total)}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="pt-2 border-t border-ak-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                    Total accounts configured
                </span>
                <span className="font-mono font-semibold">
                    {balances.length}
                </span>
            </div>
        </div>
    );
}
