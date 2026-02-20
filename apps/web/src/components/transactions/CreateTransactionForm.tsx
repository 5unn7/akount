'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { createTransactionAction } from '@/app/(dashboard)/banking/transactions/actions';

interface Account {
    id: string;
    name: string;
    type: string;
    currency: string;
}

interface Category {
    id: string;
    name: string;
    type: string;
}

interface CreateTransactionFormProps {
    accounts: Account[];
    categories: Category[];
}

export function CreateTransactionDialog({
    accounts,
    categories,
}: CreateTransactionFormProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="h-8 gap-1.5 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Transaction
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-2 border-ak-border-2 sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="font-heading font-normal">
                        New Transaction
                    </DialogTitle>
                </DialogHeader>
                <CreateTransactionForm
                    accounts={accounts}
                    categories={categories}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

function CreateTransactionForm({
    accounts,
    categories,
    onSuccess,
}: CreateTransactionFormProps & { onSuccess: () => void }) {
    const router = useRouter();

    const [accountId, setAccountId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [amountStr, setAmountStr] = useState('');
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [categoryId, setCategoryId] = useState('');
    const [notes, setNotes] = useState('');

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const filteredCategories = categories.filter((c) => {
        if (type === 'income') return c.type === 'INCOME';
        if (type === 'expense') return c.type === 'EXPENSE';
        return true;
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        // Validation
        if (!accountId) {
            setError('Please select an account');
            return;
        }
        if (!description.trim()) {
            setError('Please enter a description');
            return;
        }

        const amountNum = parseFloat(amountStr);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        // Convert to integer cents, negative for expenses
        const amountCents = Math.round(amountNum * 100);
        const signedAmount = type === 'expense' ? -amountCents : amountCents;

        setSubmitting(true);
        try {
            await createTransactionAction({
                accountId,
                date: new Date(date).toISOString(),
                description: description.trim(),
                amount: signedAmount,
                categoryId: categoryId || undefined,
                notes: notes.trim() || undefined,
            });
            router.refresh();
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create transaction');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="flex items-start gap-2 p-3 bg-ak-red/[0.08] border border-ak-red/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-ak-red flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-ak-red">{error}</p>
                </div>
            )}

            {/* Account */}
            <div className="space-y-2">
                <Label htmlFor="account">Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger className="glass-2 rounded-lg border-ak-border focus:ring-primary">
                        <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                        {accounts.map((acct) => (
                            <SelectItem key={acct.id} value={acct.id}>
                                {acct.name} ({acct.currency})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                />
            </div>

            {/* Type toggle + Amount */}
            <div className="grid grid-cols-[auto_1fr] gap-3">
                <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="flex h-9 rounded-lg overflow-hidden border border-ak-border">
                        <button
                            type="button"
                            className={`px-3 text-xs font-medium transition-colors ${
                                type === 'expense'
                                    ? 'bg-ak-red/20 text-ak-red'
                                    : 'glass text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => setType('expense')}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            className={`px-3 text-xs font-medium transition-colors ${
                                type === 'income'
                                    ? 'bg-ak-green/20 text-ak-green'
                                    : 'glass text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => setType('income')}
                        >
                            Income
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        className="glass-2 rounded-lg border-ak-border focus:ring-primary font-mono"
                    />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Office supplies, Client payment"
                    className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                    maxLength={500}
                />
            </div>

            {/* Category */}
            <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="glass-2 rounded-lg border-ak-border focus:ring-primary">
                        <SelectValue placeholder="No category" />
                    </SelectTrigger>
                    <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                        {filteredCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    className="flex w-full glass-2 rounded-lg border border-ak-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
                    rows={2}
                    maxLength={1000}
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Transaction
                </Button>
            </div>
        </form>
    );
}
