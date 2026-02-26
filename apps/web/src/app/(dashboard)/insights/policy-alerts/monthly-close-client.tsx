'use client';

import { useState } from 'react';
import type {
    CloseReadinessReport,
    ChecklistItem,
    CloseHistoryItem,
} from '@/lib/api/ai';
import { apiFetch } from '@/lib/api/client-browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    ClipboardCheck,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Loader2,
    Lock,
    ChevronDown,
    ChevronUp,
    History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonthlyCloseClientProps {
    initialReadiness: CloseReadinessReport | null;
    initialHistory: CloseHistoryItem[];
    initialHistoryHasMore: boolean;
    entityId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-ak-green';
    if (score >= 50) return 'text-primary';
    return 'text-ak-red';
}

function getScoreRingColor(score: number): string {
    if (score >= 80) return 'stroke-ak-green';
    if (score >= 50) return 'stroke-primary';
    return 'stroke-ak-red';
}

const STATUS_ICONS = {
    pass: { icon: CheckCircle, className: 'text-ak-green' },
    warn: { icon: AlertTriangle, className: 'text-primary' },
    fail: { icon: XCircle, className: 'text-ak-red' },
} as const;

// ---------------------------------------------------------------------------
// Score Circle
// ---------------------------------------------------------------------------

function ScoreCircle({ score }: { score: number }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-36 h-36 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    className="stroke-ak-border"
                />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn('transition-all duration-700', getScoreRingColor(score))}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-3xl font-mono font-bold', getScoreColor(score))}>
                    {score}%
                </span>
                <span className="text-micro text-muted-foreground uppercase tracking-wider">
                    Ready
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Checklist Item
// ---------------------------------------------------------------------------

function ChecklistCard({ item }: { item: ChecklistItem }) {
    const [expanded, setExpanded] = useState(false);
    const statusConfig = STATUS_ICONS[item.status];
    const StatusIcon = statusConfig.icon;

    return (
        <div className="glass rounded-xl p-4 transition-all hover:border-ak-border-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <StatusIcon className={cn('h-5 w-5 flex-shrink-0', statusConfig.className)} />
                    <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.count > 0 && (
                            <span className="text-micro text-muted-foreground">
                                {item.count} item{item.count !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-micro',
                            item.status === 'pass' && 'bg-ak-green-dim text-ak-green border-ak-green/20',
                            item.status === 'warn' && 'bg-ak-pri-dim text-primary border-primary/20',
                            item.status === 'fail' && 'bg-ak-red-dim text-ak-red border-ak-red/20',
                        )}
                    >
                        {item.status === 'pass' ? 'Pass' : item.status === 'warn' ? 'Warning' : 'Fail'}
                    </Badge>
                    {item.details && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? (
                                <ChevronUp className="h-3 w-3" />
                            ) : (
                                <ChevronDown className="h-3 w-3" />
                            )}
                        </Button>
                    )}
                </div>
            </div>
            {expanded && item.details && (
                <div className="mt-3 pl-8">
                    <p className="text-xs text-muted-foreground">{item.details}</p>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MonthlyCloseClient({
    initialReadiness,
    initialHistory,
    initialHistoryHasMore,
    entityId,
}: MonthlyCloseClientProps) {
    const [readiness, setReadiness] = useState(initialReadiness);
    const [history, setHistory] = useState(initialHistory);
    const [isClosing, setIsClosing] = useState(false);
    const [isLoadingReadiness, setIsLoadingReadiness] = useState(false);
    const [closeError, setCloseError] = useState<string | null>(null);

    // Fetch readiness for a period
    async function handleCheckReadiness(periodId?: string) {
        setIsLoadingReadiness(true);
        setCloseError(null);
        try {
            const params = new URLSearchParams({ entityId });
            if (periodId) params.set('periodId', periodId);

            const result = await apiFetch<CloseReadinessReport>(
                `/api/ai/monthly-close/readiness?${params.toString()}`
            );
            setReadiness(result);
        } catch (err) {
            setCloseError(err instanceof Error ? err.message : 'Failed to check readiness');
        } finally {
            setIsLoadingReadiness(false);
        }
    }

    // Execute monthly close
    async function handleExecuteClose() {
        if (!readiness) return;
        setIsClosing(true);
        setCloseError(null);
        try {
            await apiFetch<{ success: true; periodId: string; periodName: string }>(
                '/api/ai/monthly-close/execute',
                {
                    method: 'POST',
                    body: JSON.stringify({ entityId, periodId: readiness.periodId }),
                }
            );
            // Refresh readiness and history after close
            await handleCheckReadiness(readiness.periodId);
            const historyResult = await apiFetch<{ items: CloseHistoryItem[]; hasMore: boolean }>(
                `/api/ai/monthly-close/history?entityId=${encodeURIComponent(entityId)}&take=10`
            );
            setHistory(historyResult.items);
        } catch (err) {
            setCloseError(err instanceof Error ? err.message : 'Failed to execute close');
        } finally {
            setIsClosing(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        Monthly Close
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        AI-assisted month-end checklist and close execution
                    </p>
                </div>
                <Button
                    onClick={() => handleCheckReadiness()}
                    disabled={isLoadingReadiness}
                    variant="outline"
                    className="gap-2"
                >
                    {isLoadingReadiness ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ClipboardCheck className="h-4 w-4" />
                    )}
                    Check Readiness
                </Button>
            </div>

            {/* Error */}
            {closeError && (
                <div className="glass rounded-xl p-4 border-ak-red/20">
                    <p className="text-sm text-ak-red">{closeError}</p>
                </div>
            )}

            {/* Readiness Report */}
            {readiness ? (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Score Card */}
                    <Card className="glass md:col-span-1">
                        <CardContent className="p-6 space-y-4">
                            <ScoreCircle score={readiness.score} />
                            <div className="text-center space-y-2">
                                <h3 className="font-heading text-lg">{readiness.periodName}</h3>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-xs',
                                        readiness.canClose
                                            ? 'bg-ak-green-dim text-ak-green border-ak-green/20'
                                            : 'bg-ak-red-dim text-ak-red border-ak-red/20',
                                    )}
                                >
                                    {readiness.canClose ? 'Ready to Close' : 'Not Ready'}
                                </Badge>
                            </div>

                            {/* Close Button */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        className="w-full gap-2"
                                        disabled={!readiness.canClose || isClosing}
                                    >
                                        {isClosing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Lock className="h-4 w-4" />
                                        )}
                                        Close Month
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Close {readiness.periodName}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will lock the period and prevent further modifications
                                            to journal entries within this period. This action cannot be
                                            easily undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleExecuteClose}>
                                            Confirm Close
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>

                    {/* Checklist */}
                    <div className="md:col-span-2 space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Checklist Items
                        </h3>
                        {readiness.items.map((item, i) => (
                            <ChecklistCard key={`${item.label}-${i}`} item={item} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="glass rounded-[14px] p-12 text-center space-y-3">
                    <ClipboardCheck className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                        Click &quot;Check Readiness&quot; to evaluate your current period for month-end close.
                    </p>
                </div>
            )}

            {/* Close History */}
            {history.length > 0 && (
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <History className="h-4 w-4" />
                            Close History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between py-2 border-b border-ak-border last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-4 w-4 text-ak-green flex-shrink-0" />
                                        <div>
                                            <p className="text-sm">
                                                {typeof item.after === 'object' && item.after !== null && 'action' in item.after
                                                    ? String(item.after.action).replace(/_/g, ' ')
                                                    : item.action}
                                            </p>
                                            <p className="text-micro text-muted-foreground">
                                                Record: {item.recordId.slice(0, 12)}...
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-micro text-muted-foreground">
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
