'use client';

import Link from 'next/link';
import { ArrowRight, Target, Clock } from 'lucide-react';
import { getActiveGoals } from '@/lib/api/dashboard-client';
import { formatCurrency } from '@/lib/utils/currency';
import type { Goal } from '@/lib/api/planning';
import { useWidgetData } from '@/hooks/useWidgetData';
import { WidgetLoadingSkeleton, WidgetErrorState, WidgetEmptyState, ProgressBar } from './WidgetPrimitives';

interface GoalProgressWidgetProps {
    entityId?: string;
}

export function GoalProgressWidget({ entityId }: GoalProgressWidgetProps) {
    const { data, loading, error } = useWidgetData<{ goals: Goal[]; nextCursor: string | null }>(
        () => {
            if (!entityId) return Promise.resolve({ goals: [], nextCursor: null });
            return getActiveGoals(entityId, 5);
        },
        [entityId]
    );

    const goals = data?.goals || [];

    if (loading) return <WidgetLoadingSkeleton title="Goal Progress" />;
    if (error) return <WidgetErrorState icon={Target} title="Goal Progress" message="Failed to load goals" />;
    if (goals.length === 0) {
        return <WidgetEmptyState icon={Target} title="Goal Progress" message="No active goals" />;
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
                    const isPastDue = daysRemaining <= 0 && progress < 100;
                    const isOnTrack = progress >= timeProgress;
                    const isAtRisk = progress >= timeProgress - 20;

                    const variant = isPastDue || !isAtRisk ? 'danger' : !isOnTrack ? 'warning' : 'success';
                    const statusColor = isPastDue || !isAtRisk ? 'text-ak-red' : !isOnTrack ? 'text-primary' : 'text-ak-green';

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
                            <ProgressBar percent={progress} variant={variant} />
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
