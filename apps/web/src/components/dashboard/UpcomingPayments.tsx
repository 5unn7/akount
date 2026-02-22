'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { getUpcomingPayments, type UpcomingPayment } from '@/lib/api/dashboard-client';

interface UpcomingPaymentsProps {
    entityId?: string;
    limit?: number;
}

const colorMap = {
    red: 'text-ak-red',
    green: 'text-ak-green',
    default: '',
} as const;

/**
 * Format cents to currency string
 * @param cents - Integer cents (e.g., 1050 = $10.50)
 */
function formatCurrency(cents: number): string {
    const dollars = cents / 100;
    return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date to { day, month } for display
 */
function formatDate(dateStr: string): { day: string; month: string } {
    const date = new Date(dateStr);
    return {
        day: date.getDate().toString(),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
}

export function UpcomingPayments({ entityId, limit = 10 }: UpcomingPaymentsProps) {
    const [payments, setPayments] = useState<UpcomingPayment[] | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUpcomingPayments(entityId, limit)
            .then((response) => {
                setPayments(response.data);
                setLoading(false);
            })
            .catch(() => {
                setPayments(undefined);
                setLoading(false);
            });
    }, [entityId, limit]);

    return (
        <div className="glass rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Upcoming Payments
            </p>
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted/30 animate-pulse" />
                            <div className="flex-1 space-y-1">
                                <div className="h-3 w-24 bg-muted/30 animate-pulse rounded" />
                                <div className="h-2 w-16 bg-muted/20 animate-pulse rounded" />
                            </div>
                            <div className="h-3 w-16 bg-muted/30 animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            ) : !payments || payments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Calendar className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No upcoming payments</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {payments.map((item) => {
                        const date = formatDate(item.dueDate);
                        const color = item.type === 'BILL' ? 'red' : item.type === 'INVOICE' ? 'green' : 'default';
                        const meta = item.type === 'BILL' ? 'Bill due' : 'Invoice payment';

                        return (
                            <div key={item.id} className="flex items-center gap-3">
                                <div className="shrink-0 h-9 w-9 rounded-lg glass-2 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-mono font-semibold leading-none">
                                        {date.day}
                                    </span>
                                    <span className="text-[8px] uppercase text-muted-foreground leading-none mt-0.5">
                                        {date.month}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{item.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{meta}</p>
                                </div>
                                <span className={`text-xs font-mono font-medium shrink-0 ${colorMap[color]}`}>
                                    {formatCurrency(item.amount)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
