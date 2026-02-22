'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { getActionItems, type ActionItem as APIActionItem } from '@/lib/api/dashboard-client';

interface ActionItemsProps {
    entityId?: string;
    limit?: number;
}

function getIconConfig(type: APIActionItem['type']) {
    switch (type) {
        case 'UNRECONCILED_TXN':
            return {
                icon: AlertCircle,
                iconColor: 'text-primary',
                iconBg: 'bg-ak-pri-dim',
            };
        case 'OVERDUE_INVOICE':
            return {
                icon: FileText,
                iconColor: 'text-ak-red',
                iconBg: 'bg-ak-red-dim',
            };
        case 'OVERDUE_BILL':
            return {
                icon: DollarSign,
                iconColor: 'text-ak-red',
                iconBg: 'bg-ak-red-dim',
            };
    }
}

export function ActionItems({ entityId, limit = 10 }: ActionItemsProps) {
    const [items, setItems] = useState<APIActionItem[] | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getActionItems(entityId, limit)
            .then((response) => {
                setItems(response.data);
                setLoading(false);
            })
            .catch(() => {
                setItems(undefined);
                setLoading(false);
            });
    }, [entityId, limit]);

    return (
        <div className="glass rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Action Items
            </p>
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                            <div className="h-8 w-8 rounded-lg bg-muted/30 animate-pulse" />
                            <div className="flex-1 space-y-1">
                                <div className="h-3 w-32 bg-muted/30 animate-pulse rounded" />
                                <div className="h-2 w-24 bg-muted/20 animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : !items || items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-ak-green/50" />
                    <p className="text-xs text-muted-foreground">You&apos;re all caught up</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item) => {
                        const { icon: Icon, iconColor, iconBg } = getIconConfig(item.type);
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ak-bg-3/50 transition-colors group"
                            >
                                <div className={`shrink-0 h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                                    <Icon className={`h-4 w-4 ${iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{item.title}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{item.meta}</p>
                                </div>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
