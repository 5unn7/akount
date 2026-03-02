'use client';

import { useState } from 'react';
import type { Budget, BudgetPeriod, BudgetVariance } from '@/lib/api/planning';
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
import { PiggyBank, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { BudgetForm } from './budget-form';
import { ExportPlanningButton } from '../export-planning';

const PERIOD_CONFIG: Record<BudgetPeriod, { label: string; className: string }> = {
    monthly: { label: 'Monthly', className: 'bg-ak-blue-dim text-ak-blue border-transparent' },
    quarterly: { label: 'Quarterly', className: 'bg-ak-pri-dim text-ak-pri-text border-transparent' },
    yearly: { label: 'Yearly', className: 'bg-ak-green-dim text-ak-green border-transparent' },
};

const ALERT_CONFIG: Record<BudgetVariance['alertLevel'], { label: string; className: string }> = {
    ok: { label: '', className: '' },
    warning: { label: '80%+', className: 'bg-ak-pri-dim text-ak-pri-text border-transparent' },
    'over-budget': { label: 'Over Budget', className: 'bg-ak-red-dim text-ak-red border-transparent' },
};

interface BudgetsListProps {
    initialBudgets: Budget[];
    initialNextCursor: string | null;
    initialVariances: BudgetVariance[];
    entityId: string;
}

export function BudgetsList({ initialBudgets, initialNextCursor, initialVariances, entityId }: BudgetsListProps) {
    const [budgets, setBudgets] = useState(initialBudgets);
    const [variances] = useState(initialVariances);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleCreate() {
        setEditingBudget(null);
        setSheetOpen(true);
    }

    function handleEdit(budget: Budget) {
        setEditingBudget(budget);
        setSheetOpen(true);
    }

    async function handleDelete() {
        if (!deletingBudgetId) return;
        setIsDeleting(true);
        try {
            await apiFetch(`/api/planning/budgets/${deletingBudgetId}`, { method: 'DELETE' });
            setBudgets(prev => prev.filter(b => b.id !== deletingBudgetId));
        } finally {
            setIsDeleting(false);
            setDeletingBudgetId(null);
        }
    }

    function handleSaved(saved: Budget) {
        if (editingBudget) {
            setBudgets(prev => prev.map(b => b.id === saved.id ? saved : b));
        } else {
            setBudgets(prev => [saved, ...prev]);
        }
        setSheetOpen(false);
        setEditingBudget(null);
    }

    function getVariance(budgetId: string): BudgetVariance | undefined {
        return variances.find(v => v.budgetId === budgetId);
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-normal">Budgets</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create budgets and track spending against targets
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportPlanningButton type="budgets" data={budgets} />
                    <Button onClick={handleCreate} className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium gap-2">
                        <Plus className="h-4 w-4" />
                        Create Budget
                    </Button>
                </div>
            </div>

            {/* Budgets Table */}
            {budgets.length === 0 ? (
                <EmptyState
                    icon={PiggyBank}
                    title="No budgets yet"
                    description="Create your first budget to start tracking spending."
                >
                    <Button onClick={handleCreate} className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium gap-2">
                        <Plus className="h-4 w-4" />
                        Create Budget
                    </Button>
                </EmptyState>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-ak-border hover:bg-transparent">
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Category</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Period</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Budget</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Spent</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Utilization</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Date Range</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {budgets.map(budget => {
                                const periodConfig = PERIOD_CONFIG[budget.period];
                                const variance = getVariance(budget.id);
                                const utilization = variance?.utilizationPercent ?? 0;
                                const alertLevel = variance?.alertLevel ?? 'ok';
                                const alertConfig = ALERT_CONFIG[alertLevel];
                                return (
                                    <TableRow key={budget.id} className="border-ak-border hover:bg-ak-bg-3">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{budget.name}</span>
                                                {alertConfig.label && (
                                                    <Badge variant="outline" className={alertConfig.className}>
                                                        {alertConfig.label}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {budget.category?.name ?? budget.glAccount?.name ?? '\u2014'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={periodConfig.className}>
                                                {periodConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatCurrency(budget.amount)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {variance ? formatCurrency(variance.actualAmount) : '\u2014'}
                                        </TableCell>
                                        <TableCell>
                                            {variance ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 rounded-full bg-ak-bg-3 overflow-hidden max-w-[100px]">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                utilization >= 100
                                                                    ? 'bg-ak-red'
                                                                    : utilization >= 80
                                                                        ? 'bg-primary'
                                                                        : 'bg-ak-green'
                                                            }`}
                                                            style={{ width: `${Math.min(100, utilization)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                                                        {Math.round(utilization)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">\u2014</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(budget.startDate).toLocaleDateString()} \u2014 {new Date(budget.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-ak-bg-3" onClick={() => handleEdit(budget)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-ak-bg-3 text-destructive" onClick={() => setDeletingBudgetId(budget.id)}>
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

            {/* Budget Form Sheet */}
            <BudgetForm
                key={editingBudget?.id ?? 'create'}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                editingBudget={editingBudget}
                entityId={entityId}
                onSaved={handleSaved}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingBudgetId} onOpenChange={(open) => !open && setDeletingBudgetId(null)}>
                <AlertDialogContent className="glass-2 border-ak-border-2">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this budget? This action cannot be undone.
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
