'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    TrendingDown,
    AlertTriangle,
    Copy,
    Clock,
    Calculator,
    TrendingUp,
    Scale,
    Eye,
    EyeOff,
    BellOff,
    ChevronDown,
    ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AIInsight, InsightType, InsightPriority } from '@/lib/api/ai';
import { formatCurrency } from '@/lib/utils/currency';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<InsightType, { label: string; icon: typeof TrendingDown }> = {
    cash_flow_warning: { label: 'Cash Flow', icon: TrendingDown },
    spending_anomaly: { label: 'Spending', icon: AlertTriangle },
    duplicate_expense: { label: 'Duplicate', icon: Copy },
    overdue_alert: { label: 'Overdue', icon: Clock },
    tax_estimate: { label: 'Tax', icon: Calculator },
    revenue_trend: { label: 'Revenue', icon: TrendingUp },
    reconciliation_gap: { label: 'Reconciliation', icon: Scale },
};

const PRIORITY_CONFIG: Record<InsightPriority, { label: string; className: string }> = {
    critical: { label: 'Critical', className: 'bg-ak-red-dim text-ak-red border-ak-red/20' },
    high: { label: 'High', className: 'bg-ak-pri-dim text-primary border-primary/20' },
    medium: { label: 'Medium', className: 'bg-ak-blue-dim text-ak-blue border-ak-blue/20' },
    low: { label: 'Low', className: 'glass-2 text-muted-foreground border-ak-border' },
};

const ACTION_LINKS: Partial<Record<InsightType, { label: string; href: string }>> = {
    overdue_alert: { label: 'View Invoices', href: '/business/invoices' },
    reconciliation_gap: { label: 'View Banking', href: '/banking/transactions' },
    spending_anomaly: { label: 'View Expenses', href: '/accounting/journal-entries' },
    cash_flow_warning: { label: 'View Cash Flow', href: '/banking/accounts' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InsightCardProps {
    insight: AIInsight;
    onDismiss: (id: string) => void;
    onSnooze: (id: string, until: string) => void;
}

export function InsightCard({ insight, onDismiss, onSnooze }: InsightCardProps) {
    const [expanded, setExpanded] = useState(false);
    const typeConfig = TYPE_CONFIG[insight.type];
    const priorityConfig = PRIORITY_CONFIG[insight.priority];
    const actionLink = insight.actionable ? ACTION_LINKS[insight.type] : undefined;
    const TypeIcon = typeConfig.icon;

    const snoozeOptions = [
        { label: '1 day', days: 1 },
        { label: '1 week', days: 7 },
        { label: '1 month', days: 30 },
    ];

    return (
        <Card className="glass transition-all hover:border-ak-border-2 hover:-translate-y-px">
            <CardContent className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg glass-2 flex items-center justify-center">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                {typeConfig.label}
                            </p>
                            <h3 className="font-heading text-sm font-medium leading-tight truncate">
                                {insight.title}
                            </h3>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={`flex-shrink-0 text-micro ${priorityConfig.className}`}
                    >
                        {priorityConfig.label}
                    </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                </p>

                {/* Impact + Confidence row */}
                {(insight.impact !== null || insight.confidence !== null) && (
                    <div className="flex items-center gap-4 text-xs">
                        {insight.impact !== null && (
                            <span className="font-mono text-muted-foreground">
                                Impact: <span className="text-foreground">{formatCurrency(insight.impact)}</span>
                            </span>
                        )}
                        {insight.confidence !== null && (
                            <span className="text-muted-foreground">
                                Confidence: <span className="text-foreground">{insight.confidence}%</span>
                            </span>
                        )}
                    </div>
                )}

                {/* Expanded metadata */}
                {expanded && insight.metadata && Object.keys(insight.metadata).length > 0 && (
                    <div className="glass-2 rounded-lg p-3 text-xs space-y-1">
                        {Object.entries(insight.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground capitalize">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="font-mono text-foreground">
                                    {typeof value === 'number' ? formatCurrency(value) : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer: actions + timestamp */}
                <div className="flex items-center justify-between pt-1 border-t border-ak-border">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => onDismiss(insight.id)}
                        >
                            <EyeOff className="h-3 w-3 mr-1" />
                            Dismiss
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <BellOff className="h-3 w-3 mr-1" />
                                    Snooze
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {snoozeOptions.map((opt) => (
                                    <DropdownMenuItem
                                        key={opt.days}
                                        onClick={() => {
                                            const until = new Date(Date.now() + opt.days * 86400000).toISOString();
                                            onSnooze(insight.id, until);
                                        }}
                                    >
                                        {opt.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {insight.metadata && Object.keys(insight.metadata).length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? (
                                    <><EyeOff className="h-3 w-3 mr-1" />Less</>
                                ) : (
                                    <><Eye className="h-3 w-3 mr-1" />Details</>
                                )}
                            </Button>
                        )}

                        {actionLink && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-ak-blue hover:text-ak-blue"
                                asChild
                            >
                                <a href={actionLink.href}>
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    {actionLink.label}
                                </a>
                            </Button>
                        )}
                    </div>

                    <span className="text-micro text-muted-foreground">
                        {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
