'use client';

import type { Goal } from '@/lib/api/planning';
import { formatCurrency } from '@/lib/utils/currency';

type TrajectoryStatus = 'ahead' | 'on-pace' | 'behind' | 'far-behind';

interface TrajectoryInfo {
  status: TrajectoryStatus;
  label: string;
  expectedAmount: number;
  expectedPercent: number;
  actualPercent: number;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
}

function getTrajectory(goal: Goal): TrajectoryInfo {
    const now = new Date();
    const created = new Date(goal.createdAt);
    const target = new Date(goal.targetDate);

    const totalMs = target.getTime() - created.getTime();
    const elapsedMs = now.getTime() - created.getTime();

    const daysTotal = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, daysTotal - daysElapsed);

    // Linear interpolation: expected progress at this point
    const timeProgress = Math.min(1, daysElapsed / daysTotal);
    const expectedAmount = Math.round(goal.targetAmount * timeProgress);
    const expectedPercent = Math.round(timeProgress * 100);
    const actualPercent = goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0;

    // Determine trajectory status
    const diff = actualPercent - expectedPercent;
    let status: TrajectoryStatus;
    let label: string;

    if (diff >= 5) {
        status = 'ahead';
        label = 'Ahead';
    } else if (diff >= -5) {
        status = 'on-pace';
        label = 'On Pace';
    } else if (diff >= -20) {
        status = 'behind';
        label = 'Behind';
    } else {
        status = 'far-behind';
        label = 'Far Behind';
    }

    return {
        status,
        label,
        expectedAmount,
        expectedPercent,
        actualPercent,
        daysElapsed,
        daysTotal,
        daysRemaining,
    };
}

const STATUS_STYLES: Record<TrajectoryStatus, { text: string; bg: string; bar: string }> = {
    'ahead': { text: 'text-ak-green', bg: 'bg-ak-green-dim', bar: 'bg-ak-green' },
    'on-pace': { text: 'text-ak-blue', bg: 'bg-ak-blue-dim', bar: 'bg-ak-blue' },
    'behind': { text: 'text-primary', bg: 'bg-ak-pri-dim', bar: 'bg-primary' },
    'far-behind': { text: 'text-ak-red', bg: 'bg-ak-red-dim', bar: 'bg-ak-red' },
};

interface GoalTrajectoryProps {
    goal: Goal;
    compact?: boolean;
}

export function GoalTrajectory({ goal, compact = false }: GoalTrajectoryProps) {
    // Only show for active goals with a target date
    if (goal.status !== 'ACTIVE' || !goal.targetDate) return null;

    const trajectory = getTrajectory(goal);
    const styles = STATUS_STYLES[trajectory.status];
    const actualCapped = Math.min(100, trajectory.actualPercent);
    const expectedCapped = Math.min(100, trajectory.expectedPercent);

    if (compact) {
        return (
            <span className={`text-xs font-medium ${styles.text}`}>
                {trajectory.label}
            </span>
        );
    }

    return (
        <div className="space-y-2">
            {/* Status badge + days remaining */}
            <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
                    {trajectory.label}
                </span>
                <span className="text-xs text-muted-foreground">
                    {trajectory.daysRemaining}d remaining
                </span>
            </div>

            {/* Dual progress bar: expected (dim) vs actual (solid) */}
            <div className="relative h-3 rounded-full bg-ak-bg-3 overflow-hidden">
                {/* Expected marker line */}
                {expectedCapped > 0 && expectedCapped < 100 && (
                    <div
                        className="absolute top-0 h-full w-0.5 bg-muted-foreground/30 z-10"
                        style={{ left: `${expectedCapped}%` }}
                    />
                )}
                {/* Actual progress */}
                <div
                    className={`h-full rounded-full transition-all ${styles.bar}`}
                    style={{ width: `${actualCapped}%` }}
                />
            </div>

            {/* Labels */}
            <div className="flex items-center justify-between text-micro text-muted-foreground">
                <span>
                    Actual: <span className="font-mono">{formatCurrency(goal.currentAmount)}</span>
                    {' '}({trajectory.actualPercent}%)
                </span>
                <span>
                    Expected: <span className="font-mono">{formatCurrency(trajectory.expectedAmount)}</span>
                    {' '}({trajectory.expectedPercent}%)
                </span>
            </div>
        </div>
    );
}
