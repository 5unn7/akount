'use client';

import { useState, useCallback } from 'react';
import type {
    AIAction,
    AIActionStats,
    AIActionStatus,
    AIActionType,
} from '@/lib/api/ai';
import { apiFetch } from '@/lib/api/client-browser';
import { AIActionStatusBadge } from '@akount/ui/business';
import { EmptyState } from '@akount/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sparkles,
    Check,
    X,
    Loader2,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    BookOpen,
    Tag,
    Lightbulb,
    Bell,
    ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionsListClientProps {
    initialActions: AIAction[];
    initialTotal: number;
    initialStats: AIActionStats;
    entityId: string;
}

type AIActionListResponse = { actions: AIAction[]; total: number };
type AIActionBatchResult = { succeeded: string[]; failed: Array<{ id: string; reason: string }> };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_TYPE_CONFIG: Record<AIActionType, { label: string; icon: typeof Sparkles }> = {
    CATEGORIZATION: { label: 'Categorization', icon: Tag },
    JE_DRAFT: { label: 'Journal Entry', icon: BookOpen },
    RULE_SUGGESTION: { label: 'Rule', icon: Lightbulb },
    ALERT: { label: 'Alert', icon: Bell },
};

const CONFIDENCE_TIERS = {
    high: { label: 'High', minClass: 'text-ak-green' },
    medium: { label: 'Medium', minClass: 'text-ak-blue' },
    low: { label: 'Low', minClass: 'text-ak-red' },
} as const;

function getConfidenceTier(confidence: number) {
    if (confidence >= 80) return CONFIDENCE_TIERS.high;
    if (confidence >= 50) return CONFIDENCE_TIERS.medium;
    return CONFIDENCE_TIERS.low;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActionsListClient({
    initialActions,
    initialTotal,
    initialStats,
    entityId,
}: ActionsListClientProps) {
    const [actions, setActions] = useState(initialActions);
    const [total, setTotal] = useState(initialTotal);
    const [stats, setStats] = useState(initialStats);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [offset, setOffset] = useState(0);
    const limit = 20;

    // Fetch actions with current filters
    const fetchActions = useCallback(async (newOffset = 0) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ entityId, limit: String(limit), offset: String(newOffset) });
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (typeFilter !== 'all') params.set('type', typeFilter);

            const result = await apiFetch<AIActionListResponse>(
                `/api/ai/actions?${params.toString()}`
            );
            if (newOffset > 0) {
                setActions(prev => [...prev, ...result.actions]);
            } else {
                setActions(result.actions);
            }
            setTotal(result.total);
            setOffset(newOffset);
        } finally {
            setIsLoading(false);
        }
    }, [entityId, statusFilter, typeFilter]);

    // Refresh stats
    const refreshStats = useCallback(async () => {
        const result = await apiFetch<AIActionStats>(
            `/api/ai/actions/stats?entityId=${encodeURIComponent(entityId)}`
        );
        setStats(result);
    }, [entityId]);

    // Approve single action
    async function handleApprove(actionId: string) {
        const updated = await apiFetch<AIAction>(
            `/api/ai/actions/${actionId}/approve`,
            { method: 'POST', body: JSON.stringify({ entityId }) }
        );
        setActions(prev => prev.map(a => a.id === actionId ? updated : a));
        await refreshStats();
    }

    // Reject single action
    async function handleReject(actionId: string) {
        const updated = await apiFetch<AIAction>(
            `/api/ai/actions/${actionId}/reject`,
            { method: 'POST', body: JSON.stringify({ entityId }) }
        );
        setActions(prev => prev.map(a => a.id === actionId ? updated : a));
        await refreshStats();
    }

    // Batch approve
    async function handleBatchApprove() {
        if (selectedIds.size === 0) return;
        setIsLoading(true);
        try {
            const result = await apiFetch<AIActionBatchResult>(
                '/api/ai/actions/batch/approve',
                { method: 'POST', body: JSON.stringify({ entityId, actionIds: Array.from(selectedIds) }) }
            );
            // Update approved actions in local state
            const succeededSet = new Set(result.succeeded);
            setActions(prev => prev.map(a =>
                succeededSet.has(a.id) ? { ...a, status: 'APPROVED' as const } : a
            ));
            setSelectedIds(new Set());
            await refreshStats();
        } finally {
            setIsLoading(false);
        }
    }

    // Batch reject
    async function handleBatchReject() {
        if (selectedIds.size === 0) return;
        setIsLoading(true);
        try {
            const result = await apiFetch<AIActionBatchResult>(
                '/api/ai/actions/batch/reject',
                { method: 'POST', body: JSON.stringify({ entityId, actionIds: Array.from(selectedIds) }) }
            );
            const succeededSet = new Set(result.succeeded);
            setActions(prev => prev.map(a =>
                succeededSet.has(a.id) ? { ...a, status: 'REJECTED' as const } : a
            ));
            setSelectedIds(new Set());
            await refreshStats();
        } finally {
            setIsLoading(false);
        }
    }

    // Toggle selection
    function toggleSelect(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    // Select all pending
    function toggleSelectAll() {
        const pendingIds = actions.filter(a => a.status === 'PENDING').map(a => a.id);
        if (selectedIds.size === pendingIds.length && pendingIds.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pendingIds));
        }
    }

    // Apply filter
    async function handleFilterChange() {
        setSelectedIds(new Set());
        await fetchActions(0);
    }

    const hasMore = actions.length < total;
    const pendingActions = actions.filter(a => a.status === 'PENDING');

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-ak-purple" />
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
                        </div>
                        <p className="text-2xl font-mono font-semibold mt-1">{stats.pending}</p>
                    </CardContent>
                </Card>
                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-ak-green" />
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Approved</p>
                        </div>
                        <p className="text-2xl font-mono font-semibold mt-1">{stats.approved}</p>
                    </CardContent>
                </Card>
                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-ak-red" />
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Rejected</p>
                        </div>
                        <p className="text-2xl font-mono font-semibold mt-1">{stats.rejected}</p>
                    </CardContent>
                </Card>
                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Expired</p>
                        </div>
                        <p className="text-2xl font-mono font-semibold mt-1">{stats.expired}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters + Batch Actions */}
            <Card className="glass rounded-[14px]">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                <SelectItem value="EXPIRED">Expired</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); }}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="JE_DRAFT">Journal Entry</SelectItem>
                                <SelectItem value="CATEGORIZATION">Categorization</SelectItem>
                                <SelectItem value="RULE_SUGGESTION">Rule</SelectItem>
                                <SelectItem value="ALERT">Alert</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" onClick={handleFilterChange} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                        </Button>

                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-xs text-muted-foreground">
                                    {selectedIds.size} selected
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-ak-green border-ak-green/30 hover:bg-ak-green-dim"
                                    onClick={handleBatchApprove}
                                    disabled={isLoading}
                                >
                                    <Check className="h-3 w-3" />
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-ak-red border-ak-red/30 hover:bg-ak-red-dim"
                                    onClick={handleBatchReject}
                                    disabled={isLoading}
                                >
                                    <X className="h-3 w-3" />
                                    Reject
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Actions List */}
            {actions.length === 0 ? (
                <EmptyState
                    icon={Sparkles}
                    title="No AI actions found"
                    description="AI-generated suggestions will appear here as transactions are processed."
                />
            ) : (
                <div className="space-y-2">
                    {/* Select All */}
                    {pendingActions.length > 0 && (
                        <div className="flex items-center gap-2 px-2">
                            <Checkbox
                                checked={selectedIds.size === pendingActions.length && pendingActions.length > 0}
                                onCheckedChange={toggleSelectAll}
                            />
                            <span className="text-xs text-muted-foreground">
                                Select all pending ({pendingActions.length})
                            </span>
                        </div>
                    )}

                    {actions.map((action) => {
                        const typeConfig = ACTION_TYPE_CONFIG[action.type];
                        const TypeIcon = typeConfig.icon;
                        const tier = getConfidenceTier(action.confidence);

                        return (
                            <Card key={action.id} className="glass rounded-[14px] transition-all hover:border-ak-border-2 hover:-translate-y-px">
                                <CardContent className="py-4 px-5">
                                    <div className="flex items-start gap-3">
                                        {action.status === 'PENDING' && (
                                            <Checkbox
                                                checked={selectedIds.has(action.id)}
                                                onCheckedChange={() => toggleSelect(action.id)}
                                                className="mt-1"
                                            />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <TypeIcon className="h-4 w-4 text-ak-purple shrink-0" />
                                                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                                                    {typeConfig.label}
                                                </span>
                                                <AIActionStatusBadge status={action.status} />
                                                <span className={`text-xs font-mono font-semibold ${tier.minClass}`}>
                                                    {action.confidence}%
                                                </span>
                                            </div>

                                            <p className="text-sm font-medium mt-1 truncate">
                                                {action.title}
                                            </p>

                                            {action.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {action.description}
                                                </p>
                                            )}

                                            {/* Rich detail for RULE_SUGGESTION */}
                                            {action.type === 'RULE_SUGGESTION' && action.payload && (() => {
                                                const payload = action.payload as Record<string, unknown>;
                                                const summary = typeof payload.patternSummary === 'string' ? payload.patternSummary : null;
                                                const impact = typeof payload.estimatedImpact === 'number' ? payload.estimatedImpact : null;
                                                if (!summary && impact === null) return null;
                                                return (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {summary && (
                                                            <span className="text-xs text-ak-purple/80 truncate max-w-[300px]">
                                                                {summary}
                                                            </span>
                                                        )}
                                                        {impact !== null && (
                                                            <span className="text-xs font-mono text-ak-green">
                                                                ~{impact} txns
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>

                                        {action.status === 'PENDING' && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-ak-green hover:bg-ak-green-dim"
                                                    onClick={() => handleApprove(action.id)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-ak-red hover:bg-ak-red-dim"
                                                    onClick={() => handleReject(action.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {/* Load More */}
                    {hasMore && (
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchActions(offset + limit)}
                                disabled={isLoading}
                                className="gap-1"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                                Load More
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
