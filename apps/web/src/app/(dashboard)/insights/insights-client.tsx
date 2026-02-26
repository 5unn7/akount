'use client';

import { useState, useCallback } from 'react';
import type {
    AIInsight,
    InsightCounts,
    InsightType,
    InsightPriority,
    InsightStatus,
} from '@/lib/api/ai';
import { apiFetch } from '@/lib/api/client-browser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { InsightCard } from './insight-card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InsightsClientProps {
    initialInsights: AIInsight[];
    initialHasMore: boolean;
    initialNextCursor: string | undefined;
    initialCounts: InsightCounts;
    entityId: string;
}

type InsightListResponse = {
    insights: AIInsight[];
    nextCursor: string | undefined;
    hasMore: boolean;
};

type InsightGenerationSummary = {
    generated: number;
    skipped: number;
    errors: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_OPTIONS: Array<{ value: InsightType; label: string }> = [
    { value: 'cash_flow_warning', label: 'Cash Flow' },
    { value: 'spending_anomaly', label: 'Spending' },
    { value: 'duplicate_expense', label: 'Duplicate' },
    { value: 'overdue_alert', label: 'Overdue' },
    { value: 'tax_estimate', label: 'Tax' },
    { value: 'revenue_trend', label: 'Revenue' },
    { value: 'reconciliation_gap', label: 'Reconciliation' },
];

const PRIORITY_OPTIONS: Array<{ value: InsightPriority; label: string }> = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS: Array<{ value: InsightStatus; label: string }> = [
    { value: 'active', label: 'Active' },
    { value: 'dismissed', label: 'Dismissed' },
    { value: 'snoozed', label: 'Snoozed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'expired', label: 'Expired' },
];

const PRIORITY_BADGE_CONFIG: Record<InsightPriority, string> = {
    critical: 'bg-ak-red-dim text-ak-red border-ak-red/20',
    high: 'bg-ak-pri-dim text-primary border-primary/20',
    medium: 'bg-ak-blue-dim text-ak-blue border-ak-blue/20',
    low: 'glass-2 text-muted-foreground border-ak-border',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InsightsClient({
    initialInsights,
    initialHasMore,
    initialNextCursor,
    initialCounts,
    entityId,
}: InsightsClientProps) {
    const [insights, setInsights] = useState(initialInsights);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [counts, setCounts] = useState(initialCounts);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('active');

    // Fetch insights with current filters
    const fetchInsights = useCallback(async (cursor?: string) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ entityId, limit: '20' });
            if (typeFilter !== 'all') params.set('type', typeFilter);
            if (priorityFilter !== 'all') params.set('priority', priorityFilter);
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (cursor) params.set('cursor', cursor);

            const result = await apiFetch<InsightListResponse>(
                `/api/ai/insights?${params.toString()}`
            );

            if (cursor) {
                setInsights(prev => [...prev, ...result.insights]);
            } else {
                setInsights(result.insights);
            }
            setHasMore(result.hasMore);
            setNextCursor(result.nextCursor);
        } finally {
            setIsLoading(false);
        }
    }, [entityId, typeFilter, priorityFilter, statusFilter]);

    // Refresh counts
    const refreshCounts = useCallback(async () => {
        const result = await apiFetch<InsightCounts>(
            `/api/ai/insights/counts?entityId=${encodeURIComponent(entityId)}`
        );
        setCounts(result);
    }, [entityId]);

    // Dismiss insight
    async function handleDismiss(id: string) {
        await apiFetch<AIInsight>(`/api/ai/insights/${id}/dismiss`, {
            method: 'POST',
        });
        setInsights(prev => prev.filter(i => i.id !== id));
        setCounts(prev => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
        }));
    }

    // Snooze insight
    async function handleSnooze(id: string, until: string) {
        await apiFetch<AIInsight>(`/api/ai/insights/${id}/snooze`, {
            method: 'POST',
            body: JSON.stringify({ snoozedUntil: until }),
        });
        setInsights(prev => prev.filter(i => i.id !== id));
        setCounts(prev => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
        }));
    }

    // Generate insights
    async function handleGenerate() {
        setIsGenerating(true);
        try {
            await apiFetch<InsightGenerationSummary>(
                '/api/ai/insights/generate',
                {
                    method: 'POST',
                    body: JSON.stringify({ entityId }),
                }
            );
            // Refresh list and counts after generation
            await Promise.all([fetchInsights(), refreshCounts()]);
        } finally {
            setIsGenerating(false);
        }
    }

    // Apply filter change
    async function handleFilterApply() {
        await fetchInsights();
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        Insights
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        AI-powered financial insights for your business
                    </p>
                </div>
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="gap-2"
                >
                    {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    Generate Insights
                </Button>
            </div>

            {/* Counts Summary */}
            {counts.total > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground mr-1">
                        {counts.total} total
                    </span>
                    {(Object.entries(counts.byPriority) as Array<[InsightPriority, number]>)
                        .filter(([, count]) => count > 0)
                        .map(([priority, count]) => (
                            <Badge
                                key={priority}
                                variant="outline"
                                className={`text-micro ${PRIORITY_BADGE_CONFIG[priority]}`}
                            >
                                {count} {priority}
                            </Badge>
                        ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <Select
                    value={typeFilter}
                    onValueChange={(v) => { setTypeFilter(v); }}
                >
                    <SelectTrigger className="w-[160px] h-8 text-xs glass">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {TYPE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={priorityFilter}
                    onValueChange={(v) => { setPriorityFilter(v); }}
                >
                    <SelectTrigger className="w-[140px] h-8 text-xs glass">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        {PRIORITY_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={statusFilter}
                    onValueChange={(v) => { setStatusFilter(v); }}
                >
                    <SelectTrigger className="w-[130px] h-8 text-xs glass">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={handleFilterApply}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <RefreshCw className="h-3 w-3" />
                    )}
                    Apply
                </Button>
            </div>

            {/* Insight Cards */}
            {insights.length === 0 ? (
                <div className="glass rounded-[14px] p-12 text-center space-y-3">
                    <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                        No insights found. Generate new insights to get AI-powered recommendations.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {insights.map(insight => (
                        <InsightCard
                            key={insight.id}
                            insight={insight}
                            onDismiss={handleDismiss}
                            onSnooze={handleSnooze}
                        />
                    ))}
                </div>
            )}

            {/* Load More */}
            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => fetchInsights(nextCursor)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        Load More
                    </Button>
                </div>
            )}
        </div>
    );
}
