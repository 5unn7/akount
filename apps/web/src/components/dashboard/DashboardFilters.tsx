'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Entity } from '@/lib/api/entities';

interface DashboardFiltersProps {
    entities: Entity[];
}

/**
 * Dashboard filter controls - Client Component
 * Manages entity and currency filter state via URL params
 */
export function DashboardFilters({ entities }: DashboardFiltersProps): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentEntityId = searchParams.get('entityId') || 'all';
    const currentCurrency = searchParams.get('currency') || 'CAD';

    const updateParams = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value === 'all' || value === '') {
            params.delete(key);
        } else {
            params.set(key, value);
        }

        const queryString = params.toString();
        router.push(queryString ? `?${queryString}` : '/dashboard', { scroll: false });
    }, [router, searchParams]);

    const handleEntityChange = (value: string) => {
        updateParams('entityId', value);
    };

    const handleCurrencyChange = (value: string) => {
        updateParams('currency', value);
    };

    return (
        <div className="flex items-center gap-4">
            {/* Entity Filter */}
            <div className="flex items-center gap-2">
                <label htmlFor="entity-filter" className="text-sm font-medium text-muted-foreground">
                    Entity:
                </label>
                <Select value={currentEntityId} onValueChange={handleEntityChange}>
                    <SelectTrigger id="entity-filter" className="w-[180px]">
                        <SelectValue placeholder="All Entities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        {entities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                                {entity.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-2">
                <label htmlFor="currency-filter" className="text-sm font-medium text-muted-foreground">
                    Currency:
                </label>
                <Select value={currentCurrency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger id="currency-filter" className="w-[100px]">
                        <SelectValue placeholder="CAD" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
