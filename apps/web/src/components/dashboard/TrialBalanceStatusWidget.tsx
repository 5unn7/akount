'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { getTrialBalanceStatus } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import type { TrialBalanceReport } from '@akount/types/financial';
import { useWidgetData } from '@/hooks/useWidgetData';
import { WidgetLoadingSkeleton, WidgetErrorState, WidgetEmptyState } from './WidgetPrimitives';

interface TrialBalanceStatusWidgetProps {
    entityId?: string;
}

export function TrialBalanceStatusWidget({ entityId }: TrialBalanceStatusWidgetProps) {
    const { data, loading, error } = useWidgetData<TrialBalanceReport>(
        () => getTrialBalanceStatus(entityId),
        [entityId]
    );

    if (loading) return <WidgetLoadingSkeleton title="Trial Balance" items={4} />;
    if (error) return <WidgetErrorState icon={Scale} title="Trial Balance" message="Failed to load trial balance" />;
    if (!data || data.accounts.length === 0) {
        return <WidgetEmptyState icon={Scale} title="Trial Balance" message="No trial balance data" />;
    }

    const { isBalanced, severity, totalDebits, totalCredits, accounts, currency } = data;
    const StatusIcon = isBalanced ? CheckCircle2 : AlertTriangle;
    const statusColor = isBalanced ? 'text-ak-green' : 'text-ak-red';
    const statusBg = isBalanced ? 'bg-ak-green-dim' : 'bg-ak-red-dim';
    const statusLabel = isBalanced ? 'Balanced' : 'Out of Balance';

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Trial Balance
                </p>
                <Link
                    href="/accounting/reports"
                    className="inline-flex items-center gap-0.5 text-micro text-muted-foreground hover:text-foreground transition-colors"
                >
                    View details
                    <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-full ${statusBg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                </div>
                <div>
                    <p className={`text-sm font-medium ${statusColor}`}>{statusLabel}</p>
                    <p className="text-micro text-muted-foreground">
                        {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                        {severity === 'CRITICAL' && !isBalanced && (
                            <span className="ml-1.5 text-ak-red font-medium">Critical</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Debits vs Credits */}
            <div className="pt-2 border-t border-ak-border space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-micro text-muted-foreground">Total Debits</span>
                    <span className="text-xs font-mono tabular-nums">
                        {formatCurrency(totalDebits, currency)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-micro text-muted-foreground">Total Credits</span>
                    <span className="text-xs font-mono tabular-nums">
                        {formatCurrency(totalCredits, currency)}
                    </span>
                </div>
                {!isBalanced && (
                    <div className="flex items-center justify-between pt-1 border-t border-ak-border">
                        <span className="text-micro text-ak-red">Difference</span>
                        <span className="text-xs font-mono tabular-nums text-ak-red font-medium">
                            {formatCurrency(Math.abs(totalDebits - totalCredits), currency)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
