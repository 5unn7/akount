'use client';

import { useRouter } from 'next/navigation';
import type { Entity } from '@/lib/api/entities';

/** Map EntityType to display name */
const TYPE_LABELS: Record<string, string> = {
    PERSONAL: 'Personal',
    CORPORATION: 'Corporation',
    LLC: 'LLC',
    PARTNERSHIP: 'Partnership',
    SOLE_PROPRIETORSHIP: 'Sole Prop',
};

/** Map country code to flag emoji */
const COUNTRY_FLAGS: Record<string, string> = {
    US: '\u{1F1FA}\u{1F1F8}',
    CA: '\u{1F1E8}\u{1F1E6}',
    IN: '\u{1F1EE}\u{1F1F3}',
    GB: '\u{1F1EC}\u{1F1E7}',
    AU: '\u{1F1E6}\u{1F1FA}',
};

const COUNTRY_NAMES: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    IN: 'India',
    GB: 'United Kingdom',
    AU: 'Australia',
};

interface EntityCardProps {
    entity: Entity;
}

export function EntityCard({ entity }: EntityCardProps) {
    const router = useRouter();
    const flag = COUNTRY_FLAGS[entity.country] ?? '\u{1F30D}';
    const countryName = COUNTRY_NAMES[entity.country] ?? entity.country;

    return (
        <div
            className="glass rounded-xl p-5 transition-all cursor-pointer hover:border-ak-border-2 hover:-translate-y-px"
            onClick={() => router.push(`/system/entities/${entity.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/system/entities/${entity.id}`);
                }
            }}
        >
            {/* Name */}
            <h3 className="font-heading font-normal text-lg truncate">
                {entity.name}
            </h3>

            {/* Jurisdiction */}
            <p className="text-muted-foreground text-sm mt-1">
                {flag} {countryName}
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mt-3">
                {/* Type badge */}
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-ak-bg-3 text-muted-foreground">
                    {TYPE_LABELS[entity.type] ?? entity.type}
                </span>

                {/* Sub-type badge */}
                {entity.entitySubType && (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs text-muted-foreground bg-ak-bg-3">
                        {entity.entitySubType.replace(/_/g, ' ')}
                    </span>
                )}

                {/* Currency badge */}
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono bg-ak-bg-3 text-muted-foreground">
                    {entity.functionalCurrency}
                </span>

                {/* Status badge */}
                {entity.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-ak-green-dim text-ak-green">
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-ak-bg-3 text-muted-foreground">
                        Archived
                    </span>
                )}
            </div>

            {/* Mini metrics */}
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="font-mono">{entity._count.accounts} accounts</span>
                <span className="font-mono">{entity._count.clients} clients</span>
                <span className="font-mono">{entity._count.vendors} vendors</span>
            </div>
        </div>
    );
}
