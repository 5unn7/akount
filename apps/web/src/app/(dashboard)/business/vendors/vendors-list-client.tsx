'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Vendor } from '@/lib/api/vendors';
import { VendorsTable } from '@/components/business/VendorsTable';
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
import { Search, Filter, X, Loader2, Plus, Info } from 'lucide-react';
import { fetchMoreVendors } from '../actions';
import { VendorForm } from '@/components/business/VendorForm';

interface VendorsListClientProps {
    initialVendors: Vendor[];
    initialNextCursor: string | null;
    entityId?: string;
    currency?: string;
}

export function VendorsListClient({
    initialVendors,
    initialNextCursor,
    entityId,
    currency,
}: VendorsListClientProps) {
    const [vendors, setVendors] = useState(initialVendors);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [isLoading, setIsLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Debounce search
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialMount = useRef(true);

    const hasFilters = searchQuery || statusFilter !== 'all';

    const fetchWithFilters = useCallback(async (cursor?: string, search?: string, status?: string) => {
        setIsLoading(true);
        try {
            const result = await fetchMoreVendors({
                entityId,
                limit: 20,
                cursor,
                search: (search ?? searchQuery) || undefined,
                status: (status ?? statusFilter) !== 'all' ? ((status ?? statusFilter) as 'active' | 'inactive') : undefined,
            });
            if (cursor) {
                setVendors(prev => [...prev, ...result.vendors]);
            } else {
                setVendors(result.vendors);
            }
            setNextCursor(result.nextCursor);
        } finally {
            setIsLoading(false);
        }
    }, [entityId, searchQuery, statusFilter]);

    // Debounced search effect
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchWithFilters(undefined, searchQuery, statusFilter);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleStatusChange(newStatus: string) {
        setStatusFilter(newStatus);
        await fetchWithFilters(undefined, searchQuery, newStatus);
    }

    async function handleClearFilters() {
        setSearchQuery('');
        setStatusFilter('all');
        setIsLoading(true);
        try {
            const result = await fetchMoreVendors({ entityId, limit: 20 });
            setVendors(result.vendors);
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
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                                Search &amp; Filter
                            </h3>
                        </div>
                        {entityId ? (
                            <Button
                                size="sm"
                                onClick={() => setFormOpen(true)}
                                className="gap-1.5"
                            >
                                <Plus className="h-4 w-4" />
                                New Vendor
                            </Button>
                        ) : (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Info className="h-3.5 w-3.5" />
                                Select an entity to add vendors
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="vendor-search" className="text-xs text-muted-foreground">
                                Search
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="vendor-search"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 glass-2 rounded-lg border-ak-border focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vendor-status" className="text-xs text-muted-foreground">
                                Status
                            </Label>
                            <Select
                                value={statusFilter}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger
                                    id="vendor-status"
                                    className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                                >
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            {hasFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    disabled={isLoading}
                                    className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3 gap-1"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vendors Table */}
            <VendorsTable vendors={vendors} currency={currency} />

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
                        Showing {vendors.length} vendors
                    </span>
                </div>
            )}

            {!nextCursor && vendors.length > 0 && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                    Showing all {vendors.length} vendors
                </p>
            )}

            {entityId && (
                <VendorForm
                    key="create"
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    entityId={entityId}
                    onSuccess={() => fetchWithFilters()}
                />
            )}
        </div>
    );
}
