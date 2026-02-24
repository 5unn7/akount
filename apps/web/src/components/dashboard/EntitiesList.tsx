import Link from 'next/link';
import { Building2, User, ArrowRight, Plus } from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';
import type { Entity, EntityType } from '@/lib/api/entities';
import { EntityFormSheet } from './EntityFormSheet';

interface EntitiesListProps {
    entities: Entity[];
}

const TYPE_LABELS: Record<EntityType, string> = {
    PERSONAL: 'Personal',
    CORPORATION: 'Corporation',
    SOLE_PROPRIETORSHIP: 'Sole Prop.',
    PARTNERSHIP: 'Partnership',
    LLC: 'LLC',
};

const TYPE_COLORS: Record<EntityType, { icon: string; bg: string; glow: string }> = {
    PERSONAL: {
        icon: 'text-ak-green',
        bg: 'bg-ak-green-dim',
        glow: 'rgba(52,211,153,0.06)',
    },
    CORPORATION: {
        icon: 'text-ak-blue',
        bg: 'bg-ak-blue-dim',
        glow: 'rgba(96,165,250,0.06)',
    },
    SOLE_PROPRIETORSHIP: {
        icon: 'text-ak-purple',
        bg: 'bg-ak-purple-dim',
        glow: 'rgba(167,139,250,0.06)',
    },
    PARTNERSHIP: {
        icon: 'text-ak-teal',
        bg: 'bg-ak-teal-dim',
        glow: 'rgba(45,212,191,0.06)',
    },
    LLC: {
        icon: 'text-primary',
        bg: 'bg-ak-pri-dim',
        glow: 'rgba(245,158,11,0.06)',
    },
};

export function EntitiesList({ entities }: EntitiesListProps): React.ReactElement {
    if (entities.length === 0) {
        return (
            <div className="glass rounded-xl p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-ak-pri-dim flex items-center justify-center mb-4">
                    <Plus className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">No entities yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                    Create your first entity to start managing your finances.
                </p>
                <EntityFormSheet />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entities.map((entity) => {
                const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.CORPORATION;
                const Icon = entity.type === 'PERSONAL' ? User : Building2;
                const accountCount = entity._count?.accounts ?? 0;

                return (
                    <GlowCard
                        key={entity.id}
                        variant="glass"
                        glowColor={colors.glow}
                        className="p-3 group hover:border-ak-border-2 hover:-translate-y-px"
                    >
                        {/* Header: icon badge + name + type/meta */}
                        <div className="flex items-center gap-2.5">
                            <div className={`shrink-0 h-7 w-7 rounded-md ${colors.bg} flex items-center justify-center`}>
                                <Icon className={`h-3.5 w-3.5 ${colors.icon}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-tight truncate">
                                    {entity.name}
                                </p>
                                <p className="text-micro text-muted-foreground mt-0.5 truncate">
                                    <span className="uppercase tracking-[0.05em]">{TYPE_LABELS[entity.type] || entity.type}</span>
                                    <span className="mx-1.5 opacity-30">·</span>
                                    {entity.country || '—'}
                                    <span className="mx-1.5 opacity-30">·</span>
                                    <span className="font-mono">{entity.functionalCurrency}</span>
                                </p>
                            </div>
                        </div>

                        {/* Footer: account count + view link */}
                        <div className="mt-2 pt-2 border-t border-ak-border flex items-center justify-between">
                            <span className="text-micro text-muted-foreground">
                                Accounts{' '}
                                <span className="text-foreground font-mono font-medium">
                                    {accountCount}
                                </span>
                            </span>
                            <Link
                                href={`/banking/accounts?entityId=${entity.id}`}
                                className="inline-flex items-center gap-1 text-micro text-muted-foreground hover:text-foreground transition-colors group-hover:text-foreground"
                            >
                                View
                                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </GlowCard>
                );
            })}

            {/* Add Entity card */}
            <GlowCard
                variant="glass"
                className="p-3 flex items-center justify-center border-dashed hover:border-ak-border-2 hover:-translate-y-px"
            >
                <EntityFormSheet />
            </GlowCard>
        </div>
    );
}
