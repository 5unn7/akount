'use client';

import { useState } from 'react';
import type { Goal, GoalType, GoalStatus } from '@/lib/api/planning';
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

interface GoalFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingGoal: Goal | null;
    entityId: string;
    onSaved: (goal: Goal) => void | Promise<void>;
}

const GOAL_TYPES: { value: GoalType; label: string }[] = [
    { value: 'REVENUE', label: 'Revenue Target' },
    { value: 'SAVINGS', label: 'Savings' },
    { value: 'EXPENSE_REDUCTION', label: 'Expense Reduction' },
    { value: 'CUSTOM', label: 'Custom' },
];

const GOAL_STATUSES: { value: GoalStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ABANDONED', label: 'Abandoned' },
];

export function GoalForm({ open, onOpenChange, editingGoal, entityId, onSaved }: GoalFormProps) {
    const isEditing = !!editingGoal;

    const [name, setName] = useState(editingGoal?.name ?? '');
    const [type, setType] = useState<GoalType>(editingGoal?.type ?? 'REVENUE');
    const [targetAmount, setTargetAmount] = useState(editingGoal ? String(editingGoal.targetAmount / 100) : '');
    const [currentAmount, setCurrentAmount] = useState(editingGoal ? String(editingGoal.currentAmount / 100) : '');
    const [targetDate, setTargetDate] = useState(
        editingGoal?.targetDate ? new Date(editingGoal.targetDate).toISOString().split('T')[0] : ''
    );
    const [status, setStatus] = useState<GoalStatus>(editingGoal?.status ?? 'ACTIVE');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSaving(true);

        try {
            const targetCents = Math.round(parseFloat(targetAmount) * 100);
            const currentCents = Math.round(parseFloat(currentAmount || '0') * 100);

            if (isNaN(targetCents) || targetCents <= 0) {
                setError('Target amount must be a positive number');
                setIsSaving(false);
                return;
            }

            let saved: Goal;

            if (isEditing) {
                saved = await apiFetch<Goal>(`/api/planning/goals/${editingGoal.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        name,
                        type,
                        targetAmount: targetCents,
                        currentAmount: currentCents,
                        targetDate,
                        status,
                    }),
                });
            } else {
                saved = await apiFetch<Goal>('/api/planning/goals', {
                    method: 'POST',
                    body: JSON.stringify({
                        name,
                        entityId,
                        type,
                        targetAmount: targetCents,
                        targetDate,
                    }),
                });
            }

            await onSaved(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save goal');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="glass-2 border-ak-border-2 sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="font-heading">{isEditing ? 'Edit Goal' : 'Set New Goal'}</SheetTitle>
                    <SheetDescription>
                        {isEditing ? 'Update goal details and progress.' : 'Define a financial target to work towards.'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    {error && (
                        <div className="rounded-lg bg-ak-red-dim border border-ak-red/20 p-3">
                            <p className="text-sm text-ak-red">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="goal-name" className="text-xs text-muted-foreground">Name</Label>
                        <Input
                            id="goal-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Q1 Revenue Target"
                            required
                            className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="goal-type" className="text-xs text-muted-foreground">Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                            <SelectTrigger id="goal-type" className="glass-2 rounded-lg border-ak-border focus:ring-primary">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                {GOAL_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="goal-target" className="text-xs text-muted-foreground">Target Amount ($)</Label>
                            <Input
                                id="goal-target"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={targetAmount}
                                onChange={e => setTargetAmount(e.target.value)}
                                placeholder="10,000"
                                required
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary font-mono"
                            />
                        </div>
                        {isEditing && (
                            <div className="space-y-2">
                                <Label htmlFor="goal-current" className="text-xs text-muted-foreground">Current Amount ($)</Label>
                                <Input
                                    id="goal-current"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={currentAmount}
                                    onChange={e => setCurrentAmount(e.target.value)}
                                    placeholder="0"
                                    className="glass-2 rounded-lg border-ak-border focus:ring-primary font-mono"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="goal-date" className="text-xs text-muted-foreground">Target Date</Label>
                        <Input
                            id="goal-date"
                            type="date"
                            value={targetDate}
                            onChange={e => setTargetDate(e.target.value)}
                            required
                            className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                        />
                    </div>

                    {isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="goal-status" className="text-xs text-muted-foreground">Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as GoalStatus)}>
                                <SelectTrigger id="goal-status" className="glass-2 rounded-lg border-ak-border focus:ring-primary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                    {GOAL_STATUSES.map(s => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

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
                            {isEditing ? 'Update Goal' : 'Create Goal'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
