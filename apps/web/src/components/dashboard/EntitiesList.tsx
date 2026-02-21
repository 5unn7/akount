import Link from 'next/link';
import { Building2, User, ArrowRight, Plus, MapPin, Wallet } from 'lucide-react';
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

const TYPE_COLORS: Record<EntityType, { icon: string; border: string }> = {
    PERSONAL: { icon: 'text-ak-green', border: 'border-l-[color:var(--ak-green)]' },
    CORPORATION: { icon: 'text-ak-blue', border: 'border-l-[color:var(--ak-blue)]' },
    SOLE_PROPRIETORSHIP: { icon: 'text-ak-purple', border: 'border-l-[color:var(--ak-purple)]' },
    PARTNERSHIP: { icon: 'text-ak-teal', border: 'border-l-[color:var(--ak-teal)]' },
    LLC: { icon: 'text-primary', border: 'border-l-primary' },
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

                return (
                    <GlowCard
                        key={entity.id}
                        variant="glass"
                        className={`p-4 border-l-2 ${colors.border}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="shrink-0">
                                <Icon className={`h-5 w-5 ${colors.icon}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-tight truncate">
                                    {entity.name}
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground mt-0.5">
                                    {TYPE_LABELS[entity.type] || entity.type}
                                </p>
                            </div>
                        </div>

                        {/* Entity metadata grid */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-[10px] text-muted-foreground truncate">
                                    {entity.country || 'Not set'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Wallet className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-[10px] font-mono text-muted-foreground">
                                    {entity.functionalCurrency}
                                </span>
                            </div>
                        </div>

                        {/* Account count placeholder */}
                        <div className="mt-3 pt-3 border-t border-ak-border flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                                Accounts: <span className="text-foreground font-medium">—</span>
                            </span>
                            <Link
                                href={`/banking/accounts?entityId=${entity.id}`}
                                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                                View
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </GlowCard>
                );
            })}

            {/* Add Entity card */}
            <div className="glass rounded-xl p-4 flex items-center justify-center min-h-[100px] border-dashed">
                <EntityFormSheet />
            </div>
        </div>
    );
}
