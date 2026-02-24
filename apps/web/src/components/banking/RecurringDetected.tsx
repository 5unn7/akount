import type { Transaction } from '@/lib/api/transactions.types';
import { formatCurrency } from '@/lib/utils/currency';
import { RefreshCw } from 'lucide-react';

interface RecurringDetectedProps {
    transactions: Transaction[];
    currency: string;
}

interface RecurringItem {
    name: string;
    frequency: 'monthly' | 'annual' | 'biweekly';
    avgAmount: number;
    count: number;
}

function normalizeName(desc: string): string {
    return desc
        .trim()
        .replace(/\s*[-#]\s*\d+.*$/, '')
        .replace(/\s+/g, ' ')
        .substring(0, 40);
}

function detectRecurring(transactions: Transaction[]): RecurringItem[] {
    // Group by normalized description
    const groups = new Map<
        string,
        { name: string; dates: Date[]; amounts: number[] }
    >();

    for (const txn of transactions) {
        if (txn.amount >= 0) continue;
        const key = normalizeName(txn.description).toLowerCase();
        const display = normalizeName(txn.description);
        const existing = groups.get(key);
        if (existing) {
            existing.dates.push(new Date(txn.date));
            existing.amounts.push(Math.abs(txn.amount));
        } else {
            groups.set(key, {
                name: display,
                dates: [new Date(txn.date)],
                amounts: [Math.abs(txn.amount)],
            });
        }
    }

    const recurring: RecurringItem[] = [];

    const groupValues = Array.from(groups.values());
    for (const group of groupValues) {
        if (group.dates.length < 2) continue;

        // Check if amounts are similar (within 20%)
        const avgAmt =
            group.amounts.reduce((s: number, a: number) => s + a, 0) / group.amounts.length;
        const allSimilar = group.amounts.every(
            (a: number) => Math.abs(a - avgAmt) / avgAmt < 0.2
        );
        if (!allSimilar) continue;

        // Determine frequency from average interval
        const sorted = group.dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
        const intervals: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
            intervals.push(
                (sorted[i].getTime() - sorted[i - 1].getTime()) /
                    (1000 * 60 * 60 * 24)
            );
        }
        const avgInterval =
            intervals.reduce((s: number, d: number) => s + d, 0) / intervals.length;

        let frequency: RecurringItem['frequency'];
        if (avgInterval >= 300) frequency = 'annual';
        else if (avgInterval >= 20) frequency = 'monthly';
        else if (avgInterval >= 10) frequency = 'biweekly';
        else continue; // too frequent, probably not recurring subscription

        recurring.push({
            name: group.name,
            frequency,
            avgAmount: Math.round(avgAmt),
            count: group.dates.length,
        });
    }

    return recurring.sort((a, b) => b.avgAmount - a.avgAmount).slice(0, 5);
}

const frequencyLabels: Record<RecurringItem['frequency'], string> = {
    monthly: 'Monthly',
    annual: 'Annual',
    biweekly: 'Biweekly',
};

export function RecurringDetected({
    transactions,
    currency,
}: RecurringDetectedProps) {
    const items = detectRecurring(transactions);

    if (items.length === 0) {
        return (
            <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="h-3.5 w-3.5 text-ak-teal" />
                    <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Recurring Detected
                    </h3>
                </div>
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                    <RefreshCw className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No recurring patterns found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="h-3.5 w-3.5 text-ak-teal" />
                <h3 className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Recurring Detected
                </h3>
            </div>
            <div className="space-y-2.5">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs truncate">
                                {item.name}
                            </span>
                            <span className="text-micro px-1.5 py-0.5 rounded bg-ak-teal/10 text-ak-teal shrink-0">
                                {frequencyLabels[item.frequency]}
                            </span>
                        </div>
                        <span className="text-xs font-mono text-ak-red shrink-0">
                            ~{formatCurrency(item.avgAmount, currency)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
