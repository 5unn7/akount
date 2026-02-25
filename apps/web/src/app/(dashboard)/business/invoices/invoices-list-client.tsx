'use client';

import { useState, useCallback } from 'react';
import type { Invoice } from '@/lib/api/invoices';
import { InvoiceTable } from '@/components/business/InvoiceTable';
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
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X, Loader2 } from 'lucide-react';
import { fetchMoreInvoices } from '../actions';

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID' | 'VOIDED';

interface InvoicesListClientProps {
    initialInvoices: Invoice[];
    initialNextCursor: string | null;
    entityId?: string;
}

export function InvoicesListClient({
    initialInvoices,
    initialNextCursor,
    entityId,
}: InvoicesListClientProps) {
    const [invoices, setInvoices] = useState(initialInvoices);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [isLoading, setIsLoading] = useState(false);

    // Filter state
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const hasFilters = statusFilter !== 'all' || dateFrom || dateTo;

    const fetchWithFilters = useCallback(async (cursor?: string) => {
        setIsLoading(true);
        try {
            const result = await fetchMoreInvoices({
                entityId,
                limit: 20,
                cursor,
                status: statusFilter !== 'all' ? (statusFilter as InvoiceStatus) : undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            });
            if (cursor) {
                setInvoices(prev => [...prev, ...result.invoices]);
            } else {
                setInvoices(result.invoices);
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
            const result = await fetchMoreInvoices({ entityId, limit: 20 });
            setInvoices(result.invoices);
            setNextCursor(result.nextCursor);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleLoadMore() {
        if (!nextCursor || isLoading) return;
        await fetchWithFilters(nextCursor);
    }

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <Card className="glass rounded-[14px]">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                            Filters
                        </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoice-status" className="text-xs text-muted-foreground">
                                Status
                            </Label>
                            <Select
                                value={statusFilter}
                                onValueChange={(v) => handleFilterChange(v)}
                            >
                                <SelectTrigger
                                    id="invoice-status"
                                    className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                                >
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="SENT">Sent</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                                    <SelectItem value="VOIDED">Voided</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice-date-from" className="text-xs text-muted-foreground">
                                From Date
                            </Label>
                            <Input
                                id="invoice-date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => handleFilterChange(undefined, e.target.value)}
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice-date-to" className="text-xs text-muted-foreground">
                                To Date
                            </Label>
                            <Input
                                id="invoice-date-to"
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

            {/* Invoice Table */}
            <InvoiceTable invoices={invoices} onCancelSuccess={() => fetchWithFilters()} />

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
                        Showing {invoices.length} invoices
                    </span>
                </div>
            )}

            {!nextCursor && invoices.length > 0 && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                    Showing all {invoices.length} invoices
                </p>
            )}
        </div>
    );
}
