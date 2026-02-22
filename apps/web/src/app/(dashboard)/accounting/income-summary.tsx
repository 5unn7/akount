import { getProfitLossReport } from '@/lib/api/reports';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface IncomeSummaryProps {
    entityId?: string;
}

export async function IncomeSummary({ entityId }: IncomeSummaryProps) {
    // Get current month P&L
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let report;
    try {
        report = await getProfitLossReport({
            entityId,
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString(),
        });
    } catch (error) {
        // If report fails (no data), show placeholder
        return (
            <div className="glass rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-heading">Income Summary</h3>
                    <span className="text-xs text-muted-foreground">MTD</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    No income data for this month yet
                </p>
            </div>
        );
    }

    const formatAmount = (cents: number): string => {
        return (cents / 100).toLocaleString('en-CA', {
            style: 'currency',
            currency: report.currency,
            minimumFractionDigits: 2,
        });
    };

    const revenue = report.revenue.total;
    const expenses = report.expenses.total;
    const netIncome = report.netIncome;

    return (
        <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading">Income Summary</h3>
                <Link
                    href="/accounting/reports/profit-loss"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    View full P&L →
                </Link>
            </div>

            <div className="space-y-3">
                {/* Revenue */}
                <div className="flex items-center justify-between py-2 border-b border-ak-border">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-ak-green" />
                        <span className="text-sm text-muted-foreground">
                            Revenue
                        </span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-ak-green">
                        {formatAmount(revenue)}
                    </span>
                </div>

                {/* Expenses */}
                <div className="flex items-center justify-between py-2 border-b border-ak-border">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-ak-red" />
                        <span className="text-sm text-muted-foreground">
                            Expenses
                        </span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-ak-red">
                        -{formatAmount(Math.abs(expenses))}
                    </span>
                </div>

                {/* Net Income */}
                <div className="flex items-center justify-between py-3 bg-ak-bg-3 rounded-lg px-3 border border-ak-border-2">
                    <span className="text-sm font-medium">
                        Net Income (MTD)
                    </span>
                    <span
                        className={`text-lg font-mono font-bold ${netIncome >= 0 ? 'text-ak-green' : 'text-ak-red'}`}
                    >
                        {formatAmount(netIncome)}
                    </span>
                </div>
            </div>

            {/* Profit margin indicator */}
            {revenue > 0 && (
                <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        Profit Margin
                    </span>
                    <span
                        className={`font-mono font-semibold ${netIncome >= 0 ? 'text-ak-green' : 'text-ak-red'}`}
                    >
                        {((netIncome / revenue) * 100).toFixed(1)}%
                    </span>
                </div>
            )}
        </div>
    );
}
