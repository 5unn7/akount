'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Client } from '@/lib/api/clients';
import { ClientsTable } from '@/components/business/ClientsTable';
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
import { fetchMoreClients } from '../actions';
import { ClientForm } from '@/components/business/ClientForm';

interface ClientsListClientProps {
    initialClients: Client[];
    initialNextCursor: string | null;
    entityId?: string;
    currency?: string;
}

export function ClientsListClient({
    initialClients,
    initialNextCursor,
    entityId,
    currency,
}: ClientsListClientProps) {
    const [clients, setClients] = useState(initialClients);
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
            const result = await fetchMoreClients({
                entityId,
                limit: 20,
                cursor,
                search: (search ?? searchQuery) || undefined,
                status: (status ?? statusFilter) !== 'all' ? ((status ?? statusFilter) as 'active' | 'inactive') : undefined,
            });
            if (cursor) {
                setClients(prev => [...prev, ...result.clients]);
            } else {
                setClients(result.clients);
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
            const result = await fetchMoreClients({ entityId, limit: 20 });
            setClients(result.clients);
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
                                New Client
                            </Button>
                        ) : (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Info className="h-3.5 w-3.5" />
                                Select an entity to add clients
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="client-search" className="text-xs text-muted-foreground">
                                Search
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="client-search"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 glass-2 rounded-lg border-ak-border focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client-status" className="text-xs text-muted-foreground">
                                Status
                            </Label>
                            <Select
                                value={statusFilter}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger
                                    id="client-status"
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

            {/* Clients Table */}
            <ClientsTable clients={clients} currency={currency} />

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
                        Showing {clients.length} clients
                    </span>
                </div>
            )}

            {!nextCursor && clients.length > 0 && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                    Showing all {clients.length} clients
                </p>
            )}

            {entityId && (
                <ClientForm
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
