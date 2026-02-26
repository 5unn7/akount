'use client';

import { useState } from 'react';
import type { Goal, GoalStatus, GoalType } from '@/lib/api/planning';
import { apiFetch } from '@/lib/api/client-browser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@akount/ui';
import { Target, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { GoalForm } from './goal-form';
import { GoalTrajectory } from './goal-trajectory';

const GOAL_STATUS_CONFIG: Record<GoalStatus, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'bg-ak-green-dim text-ak-green border-transparent' },
    PAUSED: { label: 'Paused', className: 'bg-ak-blue-dim text-ak-blue border-transparent' },
    COMPLETED: { label: 'Completed', className: 'bg-ak-pri-dim text-ak-pri-text border-transparent' },
    ABANDONED: { label: 'Abandoned', className: 'bg-ak-red-dim text-ak-red border-transparent' },
};

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
    REVENUE: 'Revenue',
    SAVINGS: 'Savings',
    EXPENSE_REDUCTION: 'Expense Reduction',
    CUSTOM: 'Custom',
};

interface GoalsListProps {
    initialGoals: Goal[];
    initialNextCursor: string | null;
    entityId: string;
}

export function GoalsList({ initialGoals, initialNextCursor, entityId }: GoalsListProps) {
    const [goals, setGoals] = useState(initialGoals);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleCreate() {
        setEditingGoal(null);
        setSheetOpen(true);
    }

    function handleEdit(goal: Goal) {
        setEditingGoal(goal);
        setSheetOpen(true);
    }

    async function handleDelete() {
        if (!deletingGoalId) return;
        setIsDeleting(true);
        try {
            await apiFetch(`/api/planning/goals/${deletingGoalId}`, { method: 'DELETE' });
            setGoals(prev => prev.filter(g => g.id !== deletingGoalId));
        } finally {
            setIsDeleting(false);
            setDeletingGoalId(null);
        }
    }

    function handleSaved(saved: Goal) {
        if (editingGoal) {
            setGoals(prev => prev.map(g => g.id === saved.id ? saved : g));
        } else {
            setGoals(prev => [saved, ...prev]);
        }
        setSheetOpen(false);
        setEditingGoal(null);
    }

    function getProgress(goal: Goal): number {
        if (goal.targetAmount === 0) return 0;
        return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-normal">Goals</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Set financial targets and track your progress
                    </p>
                </div>
                <Button onClick={handleCreate} className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium gap-2">
                    <Plus className="h-4 w-4" />
                    Set Goal
                </Button>
            </div>

            {/* Goals Table */}
            {goals.length === 0 ? (
                <EmptyState
                    icon={Target}
                    title="No goals yet"
                    description="Set your first financial goal to start tracking progress."
                >
                    <Button onClick={handleCreate} className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium gap-2">
                        <Plus className="h-4 w-4" />
                        Set Goal
                    </Button>
                </EmptyState>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-ak-border hover:bg-transparent">
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Type</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Target</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Current</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Progress</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Trajectory</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Target Date</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {goals.map(goal => {
                                const progress = getProgress(goal);
                                const statusConfig = GOAL_STATUS_CONFIG[goal.status];
                                return (
                                    <TableRow key={goal.id} className="border-ak-border hover:bg-ak-bg-3">
                                        <TableCell className="font-medium">{goal.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{GOAL_TYPE_LABELS[goal.type]}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatCurrency(goal.targetAmount)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatCurrency(goal.currentAmount)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 rounded-full bg-ak-bg-3 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            progress >= 100
                                                                ? 'bg-ak-green'
                                                                : progress >= 50
                                                                    ? 'bg-primary'
                                                                    : 'bg-ak-blue'
                                                        }`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground w-10 text-right">{progress}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <GoalTrajectory goal={goal} compact />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={statusConfig.className}>
                                                {statusConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(goal.targetDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-ak-bg-3" onClick={() => handleEdit(goal)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-ak-bg-3 text-destructive" onClick={() => setDeletingGoalId(goal.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Goal Form Sheet */}
            <GoalForm
                key={editingGoal?.id ?? 'create'}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                editingGoal={editingGoal}
                entityId={entityId}
                onSaved={handleSaved}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingGoalId} onOpenChange={(open) => !open && setDeletingGoalId(null)}>
                <AlertDialogContent className="glass-2 border-ak-border-2">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this goal? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg border-ak-border hover:bg-ak-bg-3">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
