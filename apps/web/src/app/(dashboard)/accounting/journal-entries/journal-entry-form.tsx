'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GLAccount, CreateJournalEntryInput } from '@/lib/api/accounting';
import { createJournalEntry, formatAmount } from '@/lib/api/accounting';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// ============================================================================
// Types
// ============================================================================

interface FormLine {
    id: string; // local key
    glAccountId: string;
    debitAmount: string; // string for controlled input
    creditAmount: string;
    description: string;
}

interface JournalEntryFormProps {
    glAccounts: GLAccount[];
    entityId: string;
}

// ============================================================================
// Helpers
// ============================================================================

let lineIdCounter = 0;
function newLine(): FormLine {
    return {
        id: `line-${++lineIdCounter}`,
        glAccountId: '',
        debitAmount: '',
        creditAmount: '',
        description: '',
    };
}

function parseCents(value: string): number {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
}

// ============================================================================
// Component
// ============================================================================

export function JournalEntryForm({
    glAccounts,
    entityId,
}: JournalEntryFormProps) {
    const router = useRouter();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [memo, setMemo] = useState('');
    const [lines, setLines] = useState<FormLine[]>([newLine(), newLine()]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate running totals
    const totalDebit = lines.reduce((sum, l) => sum + parseCents(l.debitAmount), 0);
    const totalCredit = lines.reduce((sum, l) => sum + parseCents(l.creditAmount), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;
    const difference = Math.abs(totalDebit - totalCredit);

    function addLine() {
        setLines((prev) => [...prev, newLine()]);
    }

    function removeLine(id: string) {
        if (lines.length <= 2) return; // minimum 2 lines
        setLines((prev) => prev.filter((l) => l.id !== id));
    }

    function updateLine(id: string, field: keyof FormLine, value: string) {
        setLines((prev) =>
            prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
        );
    }

    async function handleSubmit() {
        setError(null);

        if (!date || !memo.trim()) {
            setError('Date and memo are required.');
            return;
        }

        if (!isBalanced) {
            setError('Debits must equal credits.');
            return;
        }

        // Validate all lines have an account
        const invalidLines = lines.filter(
            (l) => !l.glAccountId || (parseCents(l.debitAmount) === 0 && parseCents(l.creditAmount) === 0)
        );
        if (invalidLines.length > 0) {
            setError('Every line must have an account and either a debit or credit amount.');
            return;
        }

        setIsSubmitting(true);
        try {
            const input: CreateJournalEntryInput = {
                entityId,
                date: new Date(date).toISOString(),
                memo: memo.trim(),
                lines: lines.map((l) => ({
                    glAccountId: l.glAccountId,
                    debitAmount: parseCents(l.debitAmount),
                    creditAmount: parseCents(l.creditAmount),
                    description: l.description || undefined,
                })),
            };

            await createJournalEntry(input);
            router.push('/accounting/journal-entries');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create entry');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-4 max-w-4xl">
            {/* Header fields */}
            <Card className="glass rounded-[14px]">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Date
                            </Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded-lg border-white/[0.09] bg-white/[0.025]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Memo
                            </Label>
                            <Input
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                placeholder="Description of this journal entry"
                                className="rounded-lg border-white/[0.09] bg-white/[0.025]"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lines */}
            <Card className="glass rounded-[14px] overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                            Journal Lines
                        </CardTitle>
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-white/[0.09] text-xs h-8"
                            onClick={addLine}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Line
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-white/[0.06]">
                                    <th className="text-left pb-2 font-medium">GL Account</th>
                                    <th className="text-right pb-2 font-medium w-32">Debit</th>
                                    <th className="text-right pb-2 font-medium w-32">Credit</th>
                                    <th className="text-left pb-2 pl-3 font-medium">Memo</th>
                                    <th className="pb-2 w-10" />
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line) => (
                                    <tr
                                        key={line.id}
                                        className="border-b border-white/[0.04]"
                                    >
                                        <td className="py-2 pr-2">
                                            <Select
                                                value={line.glAccountId}
                                                onValueChange={(v) =>
                                                    updateLine(line.id, 'glAccountId', v)
                                                }
                                            >
                                                <SelectTrigger className="rounded-lg border-white/[0.09] bg-white/[0.025] text-xs h-9">
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {glAccounts.map((a) => (
                                                        <SelectItem
                                                            key={a.id}
                                                            value={a.id}
                                                        >
                                                            <span className="font-mono mr-2">
                                                                {a.code}
                                                            </span>
                                                            {a.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="py-2 px-1">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.debitAmount}
                                                onChange={(e) =>
                                                    updateLine(
                                                        line.id,
                                                        'debitAmount',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="0.00"
                                                className="rounded-lg border-white/[0.09] bg-white/[0.025] text-right font-mono text-xs h-9 w-28"
                                            />
                                        </td>
                                        <td className="py-2 px-1">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.creditAmount}
                                                onChange={(e) =>
                                                    updateLine(
                                                        line.id,
                                                        'creditAmount',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="0.00"
                                                className="rounded-lg border-white/[0.09] bg-white/[0.025] text-right font-mono text-xs h-9 w-28"
                                            />
                                        </td>
                                        <td className="py-2 pl-3">
                                            <Input
                                                value={line.description}
                                                onChange={(e) =>
                                                    updateLine(
                                                        line.id,
                                                        'description',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Line memo"
                                                className="rounded-lg border-white/[0.09] bg-white/[0.025] text-xs h-9"
                                            />
                                        </td>
                                        <td className="py-2 pl-1">
                                            <button
                                                onClick={() => removeLine(line.id)}
                                                disabled={lines.length <= 2}
                                                className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* Totals row */}
                                <tr className="border-t border-white/[0.08] font-semibold">
                                    <td className="py-3 text-sm">Totals</td>
                                    <td className="py-3 text-right font-mono text-sm px-1">
                                        {formatAmount(totalDebit)}
                                    </td>
                                    <td className="py-3 text-right font-mono text-sm px-1">
                                        {formatAmount(totalCredit)}
                                    </td>
                                    <td colSpan={2} className="py-3 pl-3">
                                        {isBalanced ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Balanced
                                            </span>
                                        ) : totalDebit > 0 || totalCredit > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                Out of balance by {formatAmount(difference)}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">
                                                Enter amounts
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3">
                <Button
                    className="rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-medium"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isBalanced}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Create Draft Entry
                </Button>
                <Button
                    variant="outline"
                    className="rounded-lg border-white/[0.09]"
                    onClick={() => router.push('/accounting/journal-entries')}
                >
                    Cancel
                </Button>
                <span className="text-xs text-muted-foreground ml-auto">
                    Entry will be saved as DRAFT — requires approval before posting.
                </span>
            </div>
        </div>
    );
}
