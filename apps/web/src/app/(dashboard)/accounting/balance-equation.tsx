import type { GLAccountBalance } from '@/lib/api/accounting';
import { formatCurrency } from '@/lib/utils/currency';

interface BalanceEquationProps {
    balances: GLAccountBalance[];
}

export function BalanceEquation({ balances }: BalanceEquationProps) {
    // Calculate totals for A, L, E
    const assets = balances
        .filter((b) => b.type === 'ASSET')
        .reduce((sum, b) => sum + b.balance, 0);

    const liabilities = balances
        .filter((b) => b.type === 'LIABILITY')
        .reduce((sum, b) => sum + b.balance, 0);

    const equity = balances
        .filter((b) => b.type === 'EQUITY')
        .reduce((sum, b) => sum + b.balance, 0);

    return (
        <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading">Balance Equation</h3>
                <span className="text-xs text-muted-foreground font-mono">
                    A = L + E
                </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Assets */}
                <div className="glass-2 rounded-lg p-4 space-y-2 border-ak-green/10">
                    <div className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Assets
                    </div>
                    <div className="text-2xl font-mono font-bold text-ak-green">
                        {formatCurrency(assets)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {balances.filter((b) => b.type === 'ASSET').length} accounts
                    </div>
                </div>

                {/* Liabilities */}
                <div className="glass-2 rounded-lg p-4 space-y-2 border-ak-red/10">
                    <div className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Liabilities
                    </div>
                    <div className="text-2xl font-mono font-bold text-ak-red">
                        {formatCurrency(liabilities)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {balances.filter((b) => b.type === 'LIABILITY').length} accounts
                    </div>
                </div>

                {/* Equity */}
                <div className="glass-2 rounded-lg p-4 space-y-2 border-ak-blue/10">
                    <div className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Equity
                    </div>
                    <div className="text-2xl font-mono font-bold text-ak-blue">
                        {formatCurrency(equity)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {balances.filter((b) => b.type === 'EQUITY').length} accounts
                    </div>
                </div>
            </div>

            {/* Verification indicator */}
            <div className="flex items-center gap-2 pt-2 border-t border-ak-border">
                <span className="text-xs text-muted-foreground">
                    Balance check:
                </span>
                {assets === liabilities + equity ? (
                    <span className="text-xs text-ak-green font-mono">
                        ✓ Balanced
                    </span>
                ) : (
                    <span className="text-xs text-ak-red font-mono">
                        ⚠ Out of balance by {formatCurrency(assets - (liabilities + equity))}
                    </span>
                )}
            </div>
        </div>
    );
}
