import { Store } from 'lucide-react';
import type { Transaction } from '@/lib/api/transactions.types';
import { formatCurrency } from '@/lib/utils/currency';

interface TopMerchantsProps {
    transactions: Transaction[];
    currency: string;
}

function normalizeMerchant(desc: string): string {
    return desc
        .trim()
        .replace(/\s*[-#]\s*\d+.*$/, '') // strip suffixes like "- Monthly", "#123"
        .replace(/\s+/g, ' ')
        .substring(0, 40);
}

export function TopMerchants({ transactions, currency }: TopMerchantsProps) {
    // Group expenses by normalized description
    const merchantMap = new Map<string, { name: string; total: number; count: number }>();

    for (const txn of transactions) {
        if (txn.amount >= 0) continue; // only expenses
        const key = normalizeMerchant(txn.description).toLowerCase();
        const display = normalizeMerchant(txn.description);
        const existing = merchantMap.get(key);
        if (existing) {
            existing.total += Math.abs(txn.amount);
            existing.count += 1;
        } else {
            merchantMap.set(key, {
                name: display,
                total: Math.abs(txn.amount),
                count: 1,
            });
        }
    }

    const top = Array.from(merchantMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 4);

    if (top.length === 0) {
        return (
            <div className="glass rounded-xl p-5">
                <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Top Merchants
                </h3>
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                    <Store className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No expense data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-5">
            <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Top Merchants
            </h3>
            <div className="space-y-2.5">
                {top.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-micro text-muted-foreground w-4 shrink-0">
                                {i + 1}.
                            </span>
                            <span className="text-xs truncate">{m.name}</span>
                            <span className="text-micro text-muted-foreground shrink-0">
                                {m.count}x
                            </span>
                        </div>
                        <span className="text-xs font-mono text-ak-red shrink-0">
                            {formatCurrency(m.total, currency)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
