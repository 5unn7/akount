'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Target, Clock } from 'lucide-react';
import { getActiveGoals } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import type { Goal } from '@/lib/api/planning';

interface GoalProgressWidgetProps {
    entityId?: string;
}

export function GoalProgressWidget({ entityId }: GoalProgressWidgetProps) {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!entityId) {
            setLoading(false);
            return;
        }

        getActiveGoals(entityId, 5)
            .then((result) => {
                setGoals(result.goals);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [entityId]);

    // Loading state - animated pulse placeholders
    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        Goal Progress
                    </p>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="h-3 w-24 bg-muted/30 animate-pulse rounded" />
                            <div className="h-2 w-full bg-muted/20 animate-pulse rounded-full" />
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
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Goal Progress
                </p>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Target className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">Failed to load goals</p>
                </div>
            </div>
        );
    }

    // Empty state
    if (goals.length === 0) {
        return (
            <div>
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                    Goal Progress
                </p>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Target className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">No active goals</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    Goal Progress
                </p>
                <Link
                    href="/planning/goals"
                    className="inline-flex items-center gap-0.5 text-micro text-muted-foreground hover:text-foreground transition-colors"
                >
                    View all
                    <ArrowRight className="h-2.5 w-2.5" />
                </Link>
            </div>

            <div className="space-y-3">
                {goals.map((goal) => {
                    const progress = goal.targetAmount > 0
                        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                        : 0;
                    const daysRemaining = Math.ceil(
                        (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    const totalDays = Math.ceil(
                        (new Date(goal.targetDate).getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const timeProgress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 100;

                    // Trajectory status: compare progress against time elapsed
                    let statusColor: string;
                    let barColor: string;
                    let barBg: string;
                    if (daysRemaining <= 0 && progress < 100) {
                        // Past deadline and incomplete
                        statusColor = 'text-ak-red';
                        barColor = 'bg-ak-red/60';
                        barBg = 'bg-ak-red-dim';
                    } else if (progress >= timeProgress) {
                        // On track or ahead
                        statusColor = 'text-ak-green';
                        barColor = 'bg-ak-green/60';
                        barBg = 'bg-ak-green-dim';
                    } else if (progress >= timeProgress - 20) {
                        // Slightly behind — at risk
                        statusColor = 'text-primary';
                        barColor = 'bg-primary/60';
                        barBg = 'bg-ak-pri-dim';
                    } else {
                        // Significantly behind
                        statusColor = 'text-ak-red';
                        barColor = 'bg-ak-red/60';
                        barBg = 'bg-ak-red-dim';
                    }

                    return (
                        <div key={goal.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs truncate max-w-[60%]">{goal.name}</span>
                                <div className="flex items-center gap-1.5">
                                    {daysRemaining > 0 && (
                                        <span className="text-micro text-muted-foreground flex items-center gap-0.5">
                                            <Clock className="h-2.5 w-2.5" />
                                            {daysRemaining}d
                                        </span>
                                    )}
                                    <span className={`text-micro font-mono ${statusColor}`}>
                                        {progress.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div className={`h-1.5 w-full rounded-full ${barBg} overflow-hidden`}>
                                <div
                                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-micro text-muted-foreground font-mono">
                                    {formatCurrency(goal.currentAmount)}
                                </span>
                                <span className="text-micro text-muted-foreground font-mono">
                                    {formatCurrency(goal.targetAmount)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
