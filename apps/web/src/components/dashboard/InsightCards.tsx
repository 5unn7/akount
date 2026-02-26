import Link from 'next/link';
import { AlertTriangle, TrendingDown, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { InsightCounts, InsightPriority } from '@/lib/api/ai';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InsightCardsProps {
    counts?: InsightCounts | null;
    topInsight?: { title: string; type: string; priority: InsightPriority } | null;
}

const PRIORITY_CONFIG: Record<InsightPriority, { label: string; className: string }> = {
    critical: { label: 'Critical', className: 'bg-ak-red-dim text-ak-red border-ak-red/20' },
    high: { label: 'High', className: 'bg-ak-pri-dim text-primary border-primary/20' },
    medium: { label: 'Medium', className: 'bg-ak-blue-dim text-ak-blue border-ak-blue/20' },
    low: { label: 'Low', className: 'glass-2 text-muted-foreground border-ak-border' },
};

const PRIORITY_ORDER: InsightPriority[] = ['critical', 'high', 'medium', 'low'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function InsightPlaceholder() {
    return (
        <div className="glass rounded-xl p-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <Sparkles className="h-8 w-8 text-ak-purple/40" />
                <p className="text-sm font-heading italic text-foreground/70 leading-relaxed">
                    Add transactions and invoices to unlock AI-powered insights about your finances.
                </p>
            </div>
        </div>
    );
}

export function InsightCards({ counts, topInsight }: InsightCardsProps) {
    if (!counts || counts.total === 0) {
        return <InsightPlaceholder />;
    }

    return (
        <Link href="/insights" className="block">
            <div className="glass rounded-xl overflow-hidden transition-all hover:border-ak-border-2 hover:-translate-y-px">
                <div className="h-0.5 bg-ak-purple" />
                <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-ak-purple" />
                            <span className="text-micro uppercase tracking-wider font-semibold text-muted-foreground">
                                AI Insights
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-micro text-muted-foreground">
                            View all
                            <ArrowRight className="h-3 w-3" />
                        </div>
                    </div>

                    {/* Count badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xl font-mono font-bold">{counts.total}</span>
                        <span className="text-sm text-muted-foreground">active</span>
                        <div className="flex items-center gap-1.5 ml-auto">
                            {PRIORITY_ORDER
                                .filter(p => counts.byPriority[p] > 0)
                                .map(priority => (
                                    <Badge
                                        key={priority}
                                        variant="outline"
                                        className={cn('text-micro', PRIORITY_CONFIG[priority].className)}
                                    >
                                        {counts.byPriority[priority]} {PRIORITY_CONFIG[priority].label}
                                    </Badge>
                                ))}
                        </div>
                    </div>

                    {/* Top insight preview */}
                    {topInsight && (
                        <div className="glass-2 rounded-lg p-3 flex items-start gap-2">
                            {topInsight.priority === 'critical' ? (
                                <AlertTriangle className="h-4 w-4 text-ak-red flex-shrink-0 mt-0.5" />
                            ) : topInsight.type === 'cash_flow_warning' ? (
                                <TrendingDown className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            ) : (
                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{topInsight.title}</p>
                                <Badge
                                    variant="outline"
                                    className={cn('text-micro mt-1', PRIORITY_CONFIG[topInsight.priority].className)}
                                >
                                    {PRIORITY_CONFIG[topInsight.priority].label}
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
