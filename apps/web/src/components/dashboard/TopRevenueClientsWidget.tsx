'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { getTopRevenueClients } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import type { RevenueReport } from '@akount/types/financial';

interface TopRevenueClientsWidgetProps {
    entityId?: string;
}

export function TopRevenueClientsWidget({ entityId }: TopRevenueClientsWidgetProps) {
    const [data, setData] = useState<RevenueReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        const endDate = now.toISOString();

        getTopRevenueClients(entityId, startDate, endDate, 5)
            .then((report) => {
                setData(report);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [entityId]);

    // Loading state
    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Top Revenue Clients
                    </p>
                </div>
                <div className="space-y-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 px-1">
                            <div className="w-0.5 h-4 rounded-full bg-muted/30 animate-pulse shrink-0" />
                            <div className="h-3 w-24 bg-muted/30 animate-pulse rounded" />
                            <div className="h-2.5 w-16 bg-muted/20 animate-pulse rounded ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div>
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-2">
                    Top Revenue Clients
                </p>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Users className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">Failed to load revenue data</p>
                </div>
            </div>
        );
    }

    // Empty state
    if (!data || data.clients.length === 0) {
        return (
            <div>
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-2">
                    Top Revenue Clients
                </p>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Users className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No revenue data for this period</p>
                </div>
            </div>
        );
    }

    const { clients, totalRevenue, currency } = data;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Top Revenue Clients
                </p>
                <Link
                    href="/business/clients"
                    className="inline-flex items-center gap-0.5 text-micro text-muted-foreground hover:text-foreground transition-colors"
                >
                    View all
                    <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </div>

            {/* Client rows */}
            <div className="space-y-0">
                {clients.map((client) => (
                    <div
                        key={client.clientId ?? client.clientName}
                        className="relative flex items-center gap-2 py-1.5 px-1 -mx-1 rounded hover:bg-ak-bg-3/50 transition-colors group overflow-hidden"
                    >
                        {/* Background bar */}
                        <div
                            className="absolute inset-y-0 left-0 bg-ak-green/[0.06] rounded transition-all"
                            style={{ width: `${client.percentage}%` }}
                        />
                        {/* Content */}
                        <div className="w-0.5 h-4 rounded-full bg-ak-green opacity-60 shrink-0 relative z-10" />
                        <span className="text-xs truncate flex-1 min-w-0 group-hover:text-foreground transition-colors relative z-10">
                            {client.clientName}
                        </span>
                        <span className="text-micro text-muted-foreground tabular-nums font-mono shrink-0 relative z-10">
                            {client.percentage.toFixed(1)}%
                        </span>
                        <span className="text-xs font-mono tabular-nums text-ak-green shrink-0 relative z-10">
                            {formatCurrency(client.amount, currency)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="pt-2 mt-2 border-t border-ak-border flex items-center justify-between">
                <span className="text-micro text-muted-foreground">
                    {clients.length} client{clients.length !== 1 ? 's' : ''}
                </span>
                <span className="text-micro font-mono tabular-nums text-muted-foreground">
                    Total: {formatCurrency(totalRevenue, currency)}
                </span>
            </div>
        </div>
    );
}
