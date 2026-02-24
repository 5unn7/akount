'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUpcomingPayments, type UpcomingPayment } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

interface UpcomingPaymentsProps {
    entityId?: string;
    limit?: number;
    pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 5;

export function UpcomingPayments({ entityId, limit = 20, pageSize = DEFAULT_PAGE_SIZE }: UpcomingPaymentsProps) {
    const [payments, setPayments] = useState<UpcomingPayment[] | undefined>();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);

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

    // Loading state
    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Upcoming Payments
                    </p>
                </div>
                <div className="space-y-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 px-1">
                            <div className="w-0.5 h-4 rounded-full bg-muted/30 animate-pulse shrink-0" />
                            <div className="h-3 w-20 bg-muted/30 animate-pulse rounded" />
                            <div className="h-2.5 w-14 bg-muted/20 animate-pulse rounded ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (!payments || payments.length === 0) {
        return (
            <div>
                <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-2">
                    Upcoming Payments
                </p>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No upcoming payments</p>
                </div>
            </div>
        );
    }

    // Pagination
    const totalPages = Math.ceil(payments.length / pageSize);
    const pagePayments = payments.slice(page * pageSize, (page + 1) * pageSize);

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Upcoming Payments
                </p>
                <Link
                    href="/business/payments"
                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    View all
                    <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </div>

            {/* Compact single-line rows */}
            <div className="space-y-0">
                {pagePayments.map((item) => {
                    const isBill = item.type === 'BILL';
                    const barClass = isBill ? 'bg-ak-red' : 'bg-ak-green';
                    const colorClass = isBill ? 'text-ak-red' : 'text-ak-green';
                    const Icon = isBill ? ArrowUpRight : ArrowDownRight;

                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-2 py-1.5 px-1 -mx-1 rounded hover:bg-ak-bg-3/50 transition-colors group"
                        >
                            <div className={`w-0.5 h-4 rounded-full ${barClass} opacity-60 shrink-0`} />
                            <Icon className={`h-3 w-3 ${colorClass} opacity-70 shrink-0`} />
                            <span className="text-[11px] truncate flex-1 min-w-0 group-hover:text-foreground transition-colors">
                                {item.name}
                            </span>
                            <span className="text-micro text-muted-foreground shrink-0">
                                {formatDate(item.dueDate)}
                            </span>
                            <span className={`text-[11px] font-mono tabular-nums shrink-0 ${colorClass}`}>
                                {formatCurrency(item.amount, item.currency)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Footer: pagination + count */}
            <div className="pt-2 mt-2 border-t border-ak-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                    {payments.length} total
                </span>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-0.5 rounded hover:bg-ak-bg-3 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <span className="text-[10px] text-muted-foreground tabular-nums font-mono">
                            {page + 1}/{totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="p-0.5 rounded hover:bg-ak-bg-3 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
