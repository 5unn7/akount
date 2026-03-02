'use client';

import { useState } from 'react';
import type { CreditNote } from '@/lib/api/credit-notes';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/client-browser';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreditNoteFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityId: string;
    currency: string;
    editCreditNote?: CreditNote;
    onSuccess: () => void | Promise<void>;
}

export function CreditNoteForm({
    open,
    onOpenChange,
    entityId,
    currency,
    editCreditNote,
    onSuccess,
}: CreditNoteFormProps) {
    const isEditing = !!editCreditNote;

    const [date, setDate] = useState(
        editCreditNote?.date
            ? new Date(editCreditNote.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );
    const [amount, setAmount] = useState(
        editCreditNote ? String(editCreditNote.amount / 100) : ''
    );
    const [reason, setReason] = useState(editCreditNote?.reason ?? '');
    const [notes, setNotes] = useState(editCreditNote?.notes ?? '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const amountCents = Math.round(parseFloat(amount) * 100);
        if (isNaN(amountCents) || amountCents <= 0) {
            toast.error('Please enter a valid positive amount');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await apiFetch(`/api/business/credit-notes/${editCreditNote.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        date: new Date(date).toISOString(),
                        amount: amountCents,
                        currency,
                        reason,
                        notes: notes || undefined,
                    }),
                });
                toast.success('Credit note updated');
            } else {
                await apiFetch('/api/business/credit-notes', {
                    method: 'POST',
                    body: JSON.stringify({
                        entityId,
                        date: new Date(date).toISOString(),
                        amount: amountCents,
                        currency,
                        reason,
                        notes: notes || undefined,
                    }),
                });
                toast.success('Credit note created');
            }

            onOpenChange(false);
            await onSuccess();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save credit note');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="glass-2 border-ak-border sm:max-w-[480px]">
                <SheetHeader>
                    <SheetTitle className="font-heading">
                        {isEditing ? 'Edit Credit Note' : 'New Credit Note'}
                    </SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? 'Update credit note details (draft only)'
                            : 'Create a new credit note for an invoice or bill'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    <div className="space-y-2">
                        <Label htmlFor="cn-date">Date</Label>
                        <Input
                            id="cn-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="glass-2 rounded-lg border-ak-border"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cn-amount">Amount ({currency})</Label>
                        <Input
                            id="cn-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            className="glass-2 rounded-lg border-ak-border font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cn-reason">Reason</Label>
                        <Input
                            id="cn-reason"
                            placeholder="e.g. Returned goods, billing error..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            className="glass-2 rounded-lg border-ak-border"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cn-notes">Notes (optional)</Label>
                        <Textarea
                            id="cn-notes"
                            placeholder="Additional details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="glass-2 rounded-lg border-ak-border min-h-[80px]"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 rounded-lg border-ak-border-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
