'use client';

import { useState } from 'react';
import type { Budget, BudgetPeriod } from '@/lib/api/planning';
import { apiFetch } from '@/lib/api/client-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface BudgetFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingBudget: Budget | null;
    entityId: string;
    onSaved: (budget: Budget) => void | Promise<void>;
}

const PERIODS: { value: BudgetPeriod; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

function toDateString(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
}

export function BudgetForm({ open, onOpenChange, editingBudget, entityId, onSaved }: BudgetFormProps) {
    const isEditing = !!editingBudget;

    const [name, setName] = useState(editingBudget?.name ?? '');
    const [period, setPeriod] = useState<BudgetPeriod>(editingBudget?.period ?? 'monthly');
    const [amount, setAmount] = useState(editingBudget ? String(editingBudget.amount / 100) : '');
    const [startDate, setStartDate] = useState(toDateString(editingBudget?.startDate));
    const [endDate, setEndDate] = useState(toDateString(editingBudget?.endDate));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const amountCents = Math.round(parseFloat(amount) * 100);
        if (isNaN(amountCents) || amountCents <= 0) {
            setError('Amount must be a positive number');
            return;
        }

        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            setError('End date must be after start date');
            return;
        }

        setIsSaving(true);
        try {
            let saved: Budget;

            if (isEditing) {
                saved = await apiFetch<Budget>(`/api/planning/budgets/${editingBudget.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ name, period, amount: amountCents, startDate, endDate }),
                });
            } else {
                saved = await apiFetch<Budget>('/api/planning/budgets', {
                    method: 'POST',
                    body: JSON.stringify({ name, entityId, period, amount: amountCents, startDate, endDate }),
                });
            }

            await onSaved(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save budget');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="glass-2 border-ak-border-2 sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="font-heading">{isEditing ? 'Edit Budget' : 'Create Budget'}</SheetTitle>
                    <SheetDescription>
                        {isEditing ? 'Update budget details.' : 'Set a spending target for a time period.'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    {error && (
                        <div className="rounded-lg bg-ak-red-dim border border-ak-red/20 p-3">
                            <p className="text-sm text-ak-red">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="budget-name" className="text-xs text-muted-foreground">Name</Label>
                        <Input
                            id="budget-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Marketing Q1"
                            required
                            className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="budget-period" className="text-xs text-muted-foreground">Period</Label>
                            <Select value={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)}>
                                <SelectTrigger id="budget-period" className="glass-2 rounded-lg border-ak-border focus:ring-primary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                    {PERIODS.map(p => (
                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="budget-amount" className="text-xs text-muted-foreground">Amount ($)</Label>
                            <Input
                                id="budget-amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="5,000"
                                required
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="budget-start" className="text-xs text-muted-foreground">Start Date</Label>
                            <Input
                                id="budget-start"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="budget-end" className="text-xs text-muted-foreground">End Date</Label>
                            <Input
                                id="budget-end"
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                required
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 rounded-lg border-ak-border hover:bg-ak-bg-3"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {isEditing ? 'Update Budget' : 'Create Budget'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
