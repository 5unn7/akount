'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, FileText, Tag, AlertCircle, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client-browser';

// ---------------------------------------------------------------------------
// Types (mirrors API response)
// ---------------------------------------------------------------------------

interface AIActionStats {
    pending: number;
    pendingByType: Record<string, number>;
    approved: number;
    rejected: number;
    expired: number;
}

interface AIAction {
    id: string;
    type: string;
    title: string;
    status: string;
    confidence: number | null;
    priority: string;
    createdAt: string;
}

interface AIActionListResponse {
    actions: AIAction[];
    total: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, typeof FileText> = {
    JE_DRAFT: FileText,
    CATEGORIZATION: Tag,
    RULE_SUGGESTION: Lightbulb,
    ALERT: AlertCircle,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AIActionWidgetProps {
    entityId?: string;
}

export function AIActionWidget({ entityId }: AIActionWidgetProps) {
    const [stats, setStats] = useState<AIActionStats | null>(null);
    const [actions, setActions] = useState<AIAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);

    const fetchData = useCallback(async () => {
        if (!entityId) {
            setLoading(false);
            return;
        }

        try {
            const [statsResult, actionsResult] = await Promise.all([
                apiFetch<AIActionStats>(`/api/ai/actions/stats?entityId=${entityId}`),
                apiFetch<AIActionListResponse>(
                    `/api/ai/actions?entityId=${entityId}&status=PENDING&limit=3`
                ),
            ]);
            setStats(statsResult);
            setActions(actionsResult.actions);
        } catch {
            // Non-critical widget — fail silently
        } finally {
            setLoading(false);
        }
    }, [entityId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Batch approve high-confidence actions (>= 90)
    const handleApproveRecommended = async () => {
        if (!entityId || approving) return;

        const highConfidenceIds = actions
            .filter((a) => a.confidence !== null && a.confidence >= 90)
            .map((a) => a.id);

        if (highConfidenceIds.length === 0) return;

        setApproving(true);
        try {
            await apiFetch('/api/ai/actions/batch/approve', {
                method: 'POST',
                body: JSON.stringify({ entityId, actionIds: highConfidenceIds }),
            });
            // Refresh data
            await fetchData();
        } catch {
            // Fail silently
        } finally {
            setApproving(false);
        }
    };

    const highConfidenceCount = actions.filter(
        (a) => a.confidence !== null && a.confidence >= 90
    ).length;

    return (
        <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-ak-purple" />
                    <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        AI Actions
                    </p>
                    {stats && stats.pending > 0 && (
                        <Badge
                            variant="outline"
                            className="text-micro px-1.5 py-0 h-4 bg-ak-purple-dim text-ak-purple border-ak-purple/20"
                        >
                            {stats.pending}
                        </Badge>
                    )}
                </div>
                <Link
                    href="/insights/actions"
                    className="text-micro text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                    View All
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

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
            ) : !stats || stats.pending === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-ak-green/50" />
                    <p className="text-xs text-muted-foreground">No pending AI actions</p>
                </div>
            ) : (
                <>
                    <div className="space-y-1.5">
                        {actions.map((action) => {
                            const Icon = TYPE_ICONS[action.type] ?? AlertCircle;
                            return (
                                <Link
                                    key={action.id}
                                    href="/insights/actions"
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ak-bg-3/50 transition-colors group"
                                >
                                    <div className="shrink-0 h-7 w-7 rounded-md bg-ak-purple-dim flex items-center justify-center">
                                        <Icon className="h-3.5 w-3.5 text-ak-purple" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs truncate">{action.title}</p>
                                        {action.confidence !== null && (
                                            <p className="text-micro text-muted-foreground">
                                                {action.confidence}% confidence
                                            </p>
                                        )}
                                    </div>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </Link>
                            );
                        })}
                    </div>

                    {highConfidenceCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-xs text-ak-purple hover:text-ak-purple hover:bg-ak-purple-dim"
                            onClick={handleApproveRecommended}
                            disabled={approving}
                        >
                            {approving
                                ? 'Approving...'
                                : `Approve ${highConfidenceCount} Recommended`}
                        </Button>
                    )}
                </>
            )}
        </div>
    );
}
