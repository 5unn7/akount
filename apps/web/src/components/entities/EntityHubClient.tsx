'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import type { Entity, EntityStatus } from '@/lib/api/entities';
import { EntityCard } from './EntityCard';

const EntityFormSheet = dynamic(
    () => import('@/components/dashboard/EntityFormSheet').then(m => m.EntityFormSheet),
    { ssr: false }
);

type FilterStatus = 'ALL' | EntityStatus;

const FILTERS: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Archived', value: 'ARCHIVED' },
];

interface EntityHubClientProps {
    initialEntities: Entity[];
}

export function EntityHubClient({ initialEntities }: EntityHubClientProps) {
    const [filter, setFilter] = useState<FilterStatus>('ALL');

    const filteredEntities = filter === 'ALL'
        ? initialEntities
        : initialEntities.filter((e) => e.status === filter);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-heading font-normal tracking-tight">
                    Entities
                </h2>
                <EntityFormSheet
                    trigger={
                        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-ak-pri-hover transition-colors">
                            <Plus className="h-4 w-4" />
                            Add Entity
                        </button>
                    }
                />
            </div>

            {/* Filter pills */}
            <div className="flex gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                            filter === f.value
                                ? 'bg-ak-pri-dim text-ak-pri-text'
                                : 'bg-ak-bg-3 text-muted-foreground hover:bg-ak-bg-4'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Entity grid */}
            {filteredEntities.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEntities.map((entity) => (
                        <EntityCard key={entity.id} entity={entity} />
                    ))}
                </div>
            ) : (
                <div className="glass rounded-xl p-12 text-center">
                    <p className="text-muted-foreground text-sm">
                        {filter === 'ALL'
                            ? 'No entities yet.'
                            : `No ${filter.toLowerCase()} entities.`}
                    </p>
                    {filter === 'ALL' && (
                        <div className="mt-4">
                            <EntityFormSheet
                                trigger={
                                    <button className="text-sm text-primary hover:underline">
                                        Create your first entity
                                    </button>
                                }
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
