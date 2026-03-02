'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { CreditNote } from '@/lib/api/credit-notes';
import { CreditNoteTable } from '@/components/business/CreditNoteTable';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X, Loader2, Plus, Info, Download } from 'lucide-react';
import { fetchMoreCreditNotes } from '../actions';
import { downloadCsvExport } from '@/lib/api/export-client';
import { toast } from 'sonner';

const CreditNoteForm = dynamic(
    () => import('@/components/business/CreditNoteForm').then(m => m.CreditNoteForm),
    { ssr: false }
);

type CreditNoteStatus = 'DRAFT' | 'APPROVED' | 'APPLIED' | 'VOIDED';

interface CreditNotesListClientProps {
    initialCreditNotes: CreditNote[];
    initialNextCursor: string | null;
    entityId?: string;
    currency?: string;
}

export function CreditNotesListClient({
    initialCreditNotes,
    initialNextCursor,
    entityId,
    currency,
}: CreditNotesListClientProps) {
    const [creditNotes, setCreditNotes] = useState(initialCreditNotes);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [isLoading, setIsLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingCreditNote, setEditingCreditNote] = useState<CreditNote | null>(null);

    const [isExporting, setIsExporting] = useState(false);

    // Filter state
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const hasFilters = statusFilter !== 'all' || dateFrom || dateTo;

    const fetchWithFilters = useCallback(async (cursor?: string) => {
        setIsLoading(true);
        try {
            const result = await fetchMoreCreditNotes({
                entityId,
                limit: 20,
                cursor,
                status: statusFilter !== 'all' ? (statusFilter as CreditNoteStatus) : undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            });
            if (cursor) {
                setCreditNotes(prev => [...prev, ...result.creditNotes]);
            } else {
                setCreditNotes(result.creditNotes);
            }
            setNextCursor(result.nextCursor);
        } finally {
            setIsLoading(false);
        }
    }, [entityId, statusFilter, dateFrom, dateTo]);

    function handleFilterChange(newStatus?: string, newDateFrom?: string, newDateTo?: string) {
        if (newStatus !== undefined) setStatusFilter(newStatus);
        if (newDateFrom !== undefined) setDateFrom(newDateFrom);
        if (newDateTo !== undefined) setDateTo(newDateTo);
    }

    async function handleApplyFilters() {
        await fetchWithFilters();
    }

    async function handleClearFilters() {
        setStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        setIsLoading(true);
        try {
            const result = await fetchMoreCreditNotes({ entityId, limit: 20 });
            setCreditNotes(result.creditNotes);
            setNextCursor(result.nextCursor);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleLoadMore() {
        if (!nextCursor || isLoading) return;
        await fetchWithFilters(nextCursor);
    }

    async function handleExportCsv() {
        setIsExporting(true);
        try {
            await downloadCsvExport(
                'credit-notes/export',
                {
                    entityId,
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                },
                'credit-notes.csv'
            );
            toast.success('Credit notes exported successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Export failed');
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <Card className="glass rounded-[14px]">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                                Filters
                            </h3>
                        </div>
                        {entityId ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportCsv}
                                    disabled={isExporting}
                                    className="gap-1.5 rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                                >
                                    {isExporting ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Download className="h-3.5 w-3.5" />
                                    )}
                                    Export CSV
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setEditingCreditNote(null);
                                        setFormOpen(true);
                                    }}
                                    className="gap-1.5"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Credit Note
                                </Button>
                            </div>
                        ) : (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Info className="h-3.5 w-3.5" />
                                Select an entity to manage credit notes
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="cn-status" className="text-xs text-muted-foreground">
                                Status
                            </Label>
                            <Select
                                value={statusFilter}
                                onValueChange={(v) => handleFilterChange(v)}
                            >
                                <SelectTrigger
                                    id="cn-status"
                                    className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                                >
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="APPLIED">Applied</SelectItem>
                                    <SelectItem value="VOIDED">Voided</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cn-date-from" className="text-xs text-muted-foreground">
                                From Date
                            </Label>
                            <Input
                                id="cn-date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => handleFilterChange(undefined, e.target.value)}
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cn-date-to" className="text-xs text-muted-foreground">
                                To Date
                            </Label>
                            <Input
                                id="cn-date-to"
                                type="date"
                                value={dateTo}
                                onChange={(e) => handleFilterChange(undefined, undefined, e.target.value)}
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <Button
                                onClick={handleApplyFilters}
                                disabled={isLoading}
                                className="flex-1 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                            </Button>
                            {hasFilters && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleClearFilters}
                                    disabled={isLoading}
                                    title="Clear filters"
                                    className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Credit Notes Table */}
            <CreditNoteTable
                creditNotes={creditNotes}
                currency={currency}
                onStatusChange={() => fetchWithFilters()}
            />

            {/* Load More */}
            {nextCursor && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Load More
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Showing {creditNotes.length} credit notes
                    </span>
                </div>
            )}

            {!nextCursor && creditNotes.length > 0 && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                    Showing all {creditNotes.length} credit notes
                </p>
            )}

            {entityId && (
                <CreditNoteForm
                    key={editingCreditNote?.id ?? 'create'}
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    entityId={entityId}
                    currency={currency ?? 'CAD'}
                    editCreditNote={editingCreditNote ?? undefined}
                    onSuccess={() => fetchWithFilters()}
                />
            )}
        </div>
    );
}
